const { Jugador, Persona, Equipo, Categoria, PersonaRol, JugadorEquipo } = require('../models');
const { sequelize } = require('../models');

// Método para obtener todos los jugadores junto con el club al que pertenecen
exports.getAllJugadores = async () => {
  try {
    const jugadores = await sequelize.query(
      `SELECT 
        j.id AS jugador_id,
        j.jugador_id AS persona_id ,
        p.nombre AS nombre_persona,
        p.apellido AS apellido_persona,
        p.ci AS ci_persona,
        p.fecha_nacimiento AS fecha_nacimiento_persona,
        c.id AS club_id,
        c.nombre AS nombre_club,
        c.descripcion AS descripcion_club,
        im.persona_imagen AS imagen_persona,
		    p.eliminado 
      FROM 
        Jugador j
      JOIN 
        Persona p ON j.jugador_id = p.id
      LEFT JOIN 
        Club c ON j.club_id = c.id
      LEFT JOIN 
        ImagenPersona im ON p.id = im.persona_id
        WHERE j.activo = 1
      `,
      {
        type: sequelize.QueryTypes.SELECT
      }
    );

    return jugadores;
  } catch (error) {
    console.error('Error al obtener los jugadores con sus clubes:', error);
    throw new Error('Error al obtener los jugadores con sus clubes');
  }
};

exports.getJugadorById = async (id) => {
  try {
    const jugadores = await sequelize.query(`
       SELECT
        Persona.id,
        Persona.nombre,
        Persona.apellido,
        Persona.fecha_nacimiento,
        Persona.ci,
        Persona.genero,
        Persona.direccion,
        Persona.fecha_registro,
        Persona.fecha_actualizacion,
        Persona.eliminado,
        ImagenPersona.persona_imagen,
        Usuario.correo,
        Jugador.club_id as 'club_jugador',
        STRING_AGG(Rol.nombre, ', ') AS roles,
		    PresidenteClub.club_id as 'club_presidente'
      FROM
        Persona
      LEFT JOIN
        ImagenPersona
      ON
        Persona.id = ImagenPersona.persona_id
      LEFT JOIN
        Usuario
      ON
        Persona.id = Usuario.id
	 iNNER JOIN PersonaRol ON Persona.id = PersonaRol.persona_id
	 INNER JOIN Rol ON Rol.id= PersonaRol.rol_id AND PersonaRol.eliminado = 0
	 LEFT JOIN Jugador ON Persona.id =Jugador.jugador_id AND Jugador.activo = 1
   LEFT JOIN PresidenteClub ON Persona.id = PresidenteClub.presidente_id AND PresidenteClub.activo = 1
      WHERE
        Persona.id = :id AND Persona.eliminado = 'N'
		GROUP BY Persona.id,
            Persona.nombre,
            Persona.apellido,
            Persona.fecha_nacimiento,
            Persona.ci,
			Persona.genero,
            Persona.direccion,
            Persona.fecha_registro,
            Persona.fecha_actualizacion,
            Persona.eliminado,
            ImagenPersona.persona_imagen,
            Usuario.correo,
			Jugador.club_id,
			PresidenteClub.club_id;
    `, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });

    const jugador = jugadores[0];

    return jugador;
  } catch (error) {
    console.error('Error al obtener persona:', error);
    throw new Error('Error al obtener persona');
  }
};

exports.createNewJugador = async (data, imagen, hashedPassword, club_jugador_id) => {
  const { nombre, apellido, fecha_nacimiento, ci, direccion, genero, correo } = data;

  const transaction = await Persona.sequelize.transaction();

  try {
    // Crear la nueva persona
    const nuevaPersona = await Persona.create(
      {
        nombre,
        apellido,
        fecha_nacimiento,
        ci,
        direccion,
        genero,
        fecha_registro: Sequelize.fn('GETDATE'),
        fecha_actualizacion: Sequelize.fn('GETDATE'),
        eliminado: 'N',
      },
      { transaction }
    );

    // Crear usuario vinculado a la persona
    const nuevoUsuario = await Usuario.create(
      {
        id: nuevaPersona.id,
        contraseña: hashedPassword,
        correo,
      },
      { transaction }
    );

    // Asignar el user_id a la persona recién creada
    nuevaPersona.user_id = nuevoUsuario.id;
    await nuevaPersona.save({ transaction });

    // Asignar rol de Jugador
    const jugadorRolId = await getRolId(roleNames.Jugador);
    await PersonaRol.create(
      {
        persona_id: nuevaPersona.id,
        rol_id: jugadorRolId,
        eliminado: 0,
      },
      { transaction }
    );

    // Crear relación del jugador con el club
    await Jugador.create(
      {
        jugador_id: nuevaPersona.id,
        club_id: club_jugador_id,
        activo: 1,
      },
      { transaction }
    );

    // Subir y guardar imagen de la persona (si existe)
    if (imagen) {
      await ImagenPersona.create(
        {
          persona_id: nuevaPersona.id,
          persona_imagen: imagen,
        },
        { transaction }
      );
    }

    // Confirmar la transacción
    await transaction.commit();
    return nuevaPersona;
  } catch (error) {
    // Si ocurre algún error, revertir todos los cambios
    await transaction.rollback();
    console.error('Error durante la creación de jugador:', error);
    throw error;
  }
};

exports.createJugador = async (persona_id, club_id) => {
  const transaction = await Jugador.sequelize.transaction();
  
  try {
    await PersonaRol.create({
      persona_id: persona_id,
      rol_id: 5 
    }, { transaction });

    await Jugador.create({
      id: persona_id,
      club_id: club_id
    }, { transaction });

    await transaction.commit();

    return { message: 'Jugador asignado correctamente' };
    
  } catch (err) {
    await transaction.rollback();
    throw new Error('Error al asignar el jugador: ' + err.message);
  }
};

exports.getJugadoresByClubId = async (club_id) => {
  const jugadores = await sequelize.query(
    `SELECT 
      j.id AS jugador_id,
      p.nombre AS nombre_persona,
      p.apellido AS apellido_persona,
      p.ci AS ci_persona,
      p.fecha_nacimiento AS fecha_nacimiento_persona,
      ip.persona_imagen AS imagen_persona
    FROM 
      Jugador j
    JOIN 
      Persona p ON j.id = p.id
    LEFT JOIN 
      ImagenPersona ip ON p.id = ip.persona_id
    WHERE 
      j.club_id =:club_id`, 
    {
      replacements: { club_id },
      type: sequelize.QueryTypes.SELECT
    }
  );

  return jugadores;
};

exports.asignarJugadorAEquipo = async (persona_id, equipo_id) => {
  const transaction = await Jugador.sequelize.transaction();

  try {
    // Obtener la fecha de nacimiento del jugador
    const persona = await Persona.findByPk(persona_id);
    if (!persona) {
      throw new Error('Persona no encontrada');
    }

    const currentYear = new Date().getFullYear();
    const birthYear = new Date(persona.fecha_nacimiento).getFullYear();
    const age = currentYear - birthYear;

    // Obtener la categoría del equipo
    const equipo = await Equipo.findByPk(equipo_id, {
      include: [{
        model: Categoria,
        as: 'categoria'
      }]
    });

    if (!equipo) {
      throw new Error('Equipo no encontrado');
    }

    const { edad_minima, edad_maxima } = equipo.categoria;

    // Verificar que la edad del jugador esté dentro del rango permitido
    if (edad_minima !== null && age < edad_minima) {
      throw new Error(`El jugador no cumple con la edad mínima requerida para la categoría. Debe tener al menos ${edad_minima} años.`);
    }

    if (edad_maxima !== null && age > edad_maxima) {
      throw new Error(`El jugador no cumple con la edad máxima requerida para la categoría. No debe tener más de ${edad_maxima} años.`);
    }

    // Si pasa las validaciones de edad, o si no hay restricciones de edad (null)
    // Asignar el rol de jugador si no lo tiene
    await PersonaRol.create({
      persona_id: persona_id,
      rol_id: 5 // ID del rol de jugador
    }, { transaction });

    // Asignar el jugador al equipo
    await JugadorEquipo.create({
      jugador_id: persona_id,
      equipo_id: equipo_id
    }, { transaction });

    await transaction.commit();

    return { message: 'Jugador asignado correctamente al equipo' };

  } catch (err) {
    await transaction.rollback();
    throw new Error('Error al asignar el jugador al equipo: ' + err.message);
  }
};

exports.searchJugadoresByClubId = async (club_id, searchTerm, genero) => {
  try {
    let generoFilter = '';

    // Determinar el filtro de género
    if (genero === 'V') {
      // Solo varones
      generoFilter = "AND p.genero = 'V'";
    } else if (genero === 'D') {
      // Solo damas
      generoFilter = "AND p.genero = 'D'";
    }
    // Si es mixto, no se añade filtro para género

    const jugadores = await sequelize.query(`
      SELECT 
        j.id AS jugador_id,
        p.nombre AS nombre_persona,
        p.apellido AS apellido_persona,
        p.ci AS ci_persona,
        p.fecha_nacimiento AS fecha_nacimiento_persona,
        p.genero AS genero_persona,
        ip.persona_imagen AS imagen_persona
      FROM 
        Jugador j
      JOIN 
        Persona p ON j.id = p.id
      LEFT JOIN 
        ImagenPersona ip ON p.id = ip.persona_id
      WHERE 
        j.club_id = :club_id
        AND (p.nombre LIKE :searchTerm OR p.apellido LIKE :searchTerm)
        AND p.eliminado = 'N'
        ${generoFilter}
    `, {
      replacements: { 
        club_id, 
        searchTerm: `%${searchTerm}%` 
      },
      type: sequelize.QueryTypes.SELECT
    });

    return jugadores; 
  } catch (error) {
    console.error('Error al buscar jugadores:', error);
    throw new Error('Error al buscar jugadores');
  }
};

exports.getJugadoresByEquipoId = async (equipo_id) => {
  try {
    const jugadores = await sequelize.query(
      `SELECT 
        j.id AS jugador_id,
        p.nombre AS nombre_persona,
        p.apellido AS apellido_persona,
        p.ci AS ci_persona,
        p.fecha_nacimiento AS fecha_nacimiento_persona,
        ip.persona_imagen AS imagen_persona
      FROM 
        JugadorEquipo je
      JOIN 
        Jugador j ON je.jugador_id = j.id
      JOIN 
        Persona p ON j.id = p.id
      LEFT JOIN 
        ImagenPersona ip ON p.id = ip.persona_id
      WHERE 
        je.equipo_id = :equipo_id AND p.eliminado = 'N'`, // Filtramos por equipo y jugadores no eliminados
      {
        replacements: { equipo_id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    return jugadores;
  } catch (err) {
    throw new Error('Error al obtener los jugadores del equipo: ' + err.message);
  }
};
