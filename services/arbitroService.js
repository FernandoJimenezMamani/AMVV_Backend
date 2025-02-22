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
