const { Persona, PersonaRol, Rol, Arbitro } = require('../models');
const sequelize = require('../config/sequelize');

exports.getArbitros = async () => {
  try {
    const arbitros = await sequelize.query(`
     SELECT
        Persona.id,
        Persona.nombre,
        Persona.apellido,
        Persona.fecha_nacimiento,
        Persona.ci,
        Persona.genero AS genero_persona,
        Persona.direccion,
        Persona.fecha_registro,
        Persona.fecha_actualizacion,
        Persona.eliminado,
        ImagenPersona.persona_imagen,
        Usuario.correo,
		    Arbitro.activo
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
      INNER JOIN Rol ON Rol.id= PersonaRol.rol_id AND PersonaRol.eliminado = 0 AND Rol.nombre = 'Arbitro'
      LEFT JOIN Arbitro ON Arbitro.id = Persona.id
	  WHERE 
       Arbitro.activo = 1
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    return arbitros;
  } catch (error) {
    console.error('Error al obtener los árbitros:', error);
    throw new Error('Error al obtener los árbitros');
  }
};

exports.getArbitroById = async (id) => {
  try {
    const arbitros = await sequelize.query(`
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

    const arbitro = arbitros[0];

    return arbitro;
  } catch (error) {
    console.error('Error al obtener persona:', error);
    throw new Error('Error al obtener persona');
  }
};

exports.createArbitro = async (persona_id, activo) => {
  const transaction = await Arbitro.sequelize.transaction();

  try {
    // Asignar el rol de árbitro a la persona
    await PersonaRol.create({
      persona_id: persona_id,
      rol_id: 7 // ID del rol de Árbitro
    }, { transaction });

    // Crear el registro en la tabla de Arbitros
    await Arbitro.create({
      id: persona_id, // Reutilizamos el ID de persona como el ID en la tabla de árbitro
      activo: activo // Asignar el valor de "activo" para la temporada
    }, { transaction });

    await transaction.commit();
    return { message: 'Árbitro asignado correctamente' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.getMatchesArbitro = async (arbitroId) => {
  try {
    const perfilArbitro = await sequelize.query(
      `SELECT 
          a.id AS arbitro_id,
          COUNT(DISTINCT ap.partido_id) AS total_partidos_arbitrados
      FROM Arbitro a
      JOIN Persona p ON a.id = p.id
      JOIN Arbitro_Partido ap ON a.id = ap.arbitro_id
      JOIN Partido pa ON ap.partido_id = pa.id
      JOIN Campeonato c ON pa.campeonato_id = c.id
      WHERE pa.estado = 'J'
      AND a.id = :arbitroId
      GROUP BY a.id, p.nombre, p.apellido;`,
      {
        replacements: { arbitroId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return perfilArbitro.length > 0 ? perfilArbitro[0] : null;
  } catch (error) {
    console.error('Error al obtener perfil del árbitro:', error);
    throw error;
  }
};

exports.getCampeonatosPorArbitro = async (arbitroId) => {
  try {
    const campeonatos = await sequelize.query(
      `SELECT DISTINCT 
          c.id AS campeonato_id,
          c.nombre AS campeonato_nombre
      FROM Campeonato c
      JOIN Partido pa ON c.id = pa.campeonato_id
      JOIN Arbitro_Partido ap ON pa.id = ap.partido_id
      WHERE ap.arbitro_id = :arbitroId
      AND pa.estado = 'J'
      ORDER BY c.id;`,
      {
        replacements: { arbitroId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return campeonatos;
  } catch (error) {
    console.error('Error al obtener campeonatos del árbitro:', error);
    throw error;
  }
};

exports.getPartidosByArbitro = async (arbitroId, campeonatoId) => {
  try {
    const partidos = await sequelize.query(`
      SELECT 
        P.id, 
        P.fecha, 
        P.estado,
        EL.nombre AS equipo_local_nombre,
        EV.nombre AS equipo_visitante_nombre,
        L.nombre AS lugar_nombre,
        ICL.club_imagen AS equipo_local_imagen,
        ICV.club_imagen AS equipo_visitante_imagen
      FROM Arbitro_Partido AP
      INNER JOIN Partido P ON P.id = AP.partido_id
      INNER JOIN Equipo EL ON EL.id = P.equipo_local_id
      INNER JOIN Equipo EV ON EV.id = P.equipo_visitante_id
      INNER JOIN Club CL ON EL.club_id = CL.id
      INNER JOIN Club CV ON EV.club_id = CV.id
      LEFT JOIN ImagenClub ICL ON ICL.club_id = CL.id
      LEFT JOIN ImagenClub ICV ON ICV.club_id = CV.id
      INNER JOIN Lugar L ON L.id = P.lugar_id
      WHERE AP.arbitro_id = :arbitroId
        AND P.campeonato_id = :campeonatoId
      ORDER BY P.fecha ASC;
    `, {
      replacements: { arbitroId, campeonatoId },
      type: sequelize.QueryTypes.SELECT
    });

    return partidos;
  } catch (error) {
    console.error('Error al obtener partidos del árbitro:', error);
    throw error;
  }
};
