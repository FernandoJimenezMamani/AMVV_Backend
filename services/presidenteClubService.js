const { PresidenteClub, Persona, Club, PersonaRol } = require('../models');
const sequelize = require('../config/sequelize');

exports.getAllPresidentes = async () => {
  const PresidenteClub = await sequelize.query(`
    SELECT
        Persona.id,
        Persona.nombre,
        Persona.apellido,
        Persona.fecha_nacimiento,
        Persona.ci,
        Persona.direccion,
        Persona.fecha_registro,
        Persona.fecha_actualizacion,
        Persona.eliminado,
        ImagenPersona.persona_imagen,
        Usuario.correo,
		Club.nombre AS nombre_club,
		PresidenteClub.activo
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
      INNER JOIN Rol ON Rol.id= PersonaRol.rol_id AND PersonaRol.eliminado = 0 AND Rol.nombre = 'PresidenteClub'
      LEFT JOIN PresidenteClub ON PresidenteClub.presidente_id = Persona.id
	  LEFT JOIN Club ON PresidenteClub.club_id = Club.id
	  WHERE 
       PresidenteClub.activo = 1 
  `, { type: sequelize.QueryTypes.SELECT });
  return PresidenteClub;
};

exports.getAllDelegados = async () => {
  const PresidenteClub = await sequelize.query(`
    SELECT
        Persona.id,
        Persona.nombre,
        Persona.apellido,
        Persona.fecha_nacimiento,
        Persona.ci,
        Persona.direccion,
        Persona.fecha_registro,
        Persona.fecha_actualizacion,
        Persona.eliminado,
        ImagenPersona.persona_imagen,
        Usuario.correo,
		Club.nombre AS nombre_club,
		PresidenteClub.activo
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
      INNER JOIN Rol ON Rol.id= PersonaRol.rol_id AND PersonaRol.eliminado = 0 AND Rol.nombre = 'DelegadoClub'
      LEFT JOIN PresidenteClub ON PresidenteClub.presidente_id = Persona.id
	  LEFT JOIN Club ON PresidenteClub.club_id = Club.id
	  WHERE 
       PresidenteClub.activo = 1 
    
  `, { type: sequelize.QueryTypes.SELECT });
  return PresidenteClub;
};

exports.getPresidenteById = async (id) => {
  try {
    const presidentes = await sequelize.query(`
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

    const presidente = presidentes[0];

    return presidente;
  } catch (error) {
    console.error('Error al obtener persona:', error);
    throw new Error('Error al obtener persona');
  }
};

exports.getDelegadoById = async (id) => {
  try {
    const delegados = await sequelize.query(`
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

    const delegado = delegados[0];

    return delegado;
  } catch (error) {
    console.error('Error al obtener persona:', error);
    throw new Error('Error al obtener persona');
  }
};

exports.createPresidenteClub = async (persona_id, club_id) => {
  const transaction = await PresidenteClub.sequelize.transaction();
  
  try {
    await PersonaRol.create({
      persona_id: persona_id,
      rol_id: 3 
    }, { transaction });

    await PresidenteClub.create({
      id: persona_id,
      club_id: club_id
    }, { transaction });

    await Club.update(
      { presidente_asignado: 'S' },
      { where: { id: club_id }, transaction }
    );

    await transaction.commit();

    return { message: 'Presidente del club asignado correctamente y club actualizado' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
