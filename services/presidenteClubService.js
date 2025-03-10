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
INNER JOIN 
    PersonaRol 
ON 
    Persona.id = PersonaRol.persona_id
INNER JOIN 
    Rol 
ON 
    Rol.id = PersonaRol.rol_id AND PersonaRol.eliminado = 0 AND Rol.nombre = 'PresidenteClub'
LEFT JOIN 
    PresidenteClub 
ON 
    PresidenteClub.presidente_id = Persona.id
    AND PresidenteClub.activo = 1 
LEFT JOIN 
    Club 
ON 
    PresidenteClub.club_id = Club.id
WHERE 
    (PresidenteClub.id IS NULL OR PresidenteClub.activo = 1) 
GROUP BY
    Persona.id, Persona.nombre, Persona.apellido, Persona.fecha_nacimiento,
    Persona.ci, Persona.direccion, Persona.fecha_registro, Persona.fecha_actualizacion,
    Persona.eliminado, ImagenPersona.persona_imagen, Usuario.correo, Club.nombre,
    PresidenteClub.activo;

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
        PresidenteClub.club_id as 'club_presidente',
		    PresidenteClub.id AS 'id_presidente'
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
      PresidenteClub.club_id,
      PresidenteClub.id;;
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
exports.deletePresidenteClub = async (id, user_id) => {
  const transaction = await sequelize.transaction();

  try {
    console.log(`Iniciando la eliminación lógica de la persona con ID: ${id}`);

    // Actualizar el estado de la persona
    await Persona.update(
      { eliminado: 'S', fecha_actualizacion: sequelize.fn('GETDATE'), user_id },
      { where: { id }, transaction }
    );
    console.log(`Persona con ID: ${id} marcada como eliminada por el usuario: ${user_id}`);

    // Buscar todas las relaciones de la tabla PresidenteClub para este usuario
    const presidenteClubs = await PresidenteClub.findAll({
      where: { presidente_id: id },
      transaction,
    });

    if (!presidenteClubs || presidenteClubs.length === 0) {
      console.error(`No se encontraron relaciones para el presidente con ID: ${id}`);
      throw new Error('No se encontraron relaciones en la tabla PresidenteClub');
    }
    console.log(`Relaciones encontradas en PresidenteClub para ID: ${id}`, presidenteClubs);

    // Identificar la relación activa (activo = 1)
    const relacionActiva = presidenteClubs.find((rel) => rel.activo === 1);

    if (relacionActiva) {
      console.log(`Relación activa encontrada para el presidente con ID: ${id}`, relacionActiva.dataValues);

      // Actualizar el estado del club asociado con la relación activa
      await Club.update(
        { presidente_asignado: 'N' },
        { where: { id: relacionActiva.club_id }, transaction }
      );
      console.log(`Estado del club con ID: ${relacionActiva.club_id} actualizado para reflejar que no tiene presidente`);
    } else {
      console.log(`No se encontró una relación activa para el presidente con ID: ${id}`);
    }

    // Desactivar todas las relaciones en la tabla PresidenteClub
    await PresidenteClub.update(
      { activo: 0, delegado: 'N' },
      { where: { presidente_id: id }, transaction }
    );
    console.log(`Todas las relaciones en PresidenteClub para el presidente con ID: ${id} han sido desactivadas`);

    // Confirmar la transacción
    await transaction.commit();
    console.log(`Transacción completada exitosamente para la eliminación del presidente con ID: ${id}`);
    return { success: true };
  } catch (error) {
    // Revertir cambios en caso de error
    console.error(`Error en la transacción: ${error.message}`);
    await transaction.rollback();
    throw error;
  }
};


exports.getClubActualPresidente = async (presidenteId) => {
  try {
    const clubActual = await sequelize.query(
      `SELECT 
          c.id AS club_id,
          c.nombre AS club_nombre,
          c.descripcion AS club_descripcion,
          c.presidente_asignado,
          c.fecha_registro,
          c.fecha_actualizacion,
		  ic.club_imagen
      FROM PresidenteClub pc
      JOIN Club c ON pc.club_id = c.id
      LEFT JOIN ImagenClub ic ON ic.club_id = c.id 
      WHERE pc.presidente_id = :presidenteId
      AND pc.activo = 1
      AND pc.delegado = 'N';`,
      {
        replacements: { presidenteId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return clubActual.length > 0 ? clubActual[0] : null;
  } catch (error) {
    console.error('Error al obtener el club actual del presidente:', error);
    throw error;
  }
};

exports.getClubesAnterioresPresidente = async (presidenteId) => {
  try {
    const clubesAnteriores = await sequelize.query(
      `SELECT 
          c.id AS club_id,
          c.nombre AS club_nombre,
          c.descripcion AS club_descripcion,
          c.presidente_asignado,
          c.fecha_registro,
          c.fecha_actualizacion,
		  ic.club_imagen
      FROM PresidenteClub pc
      JOIN Club c ON pc.club_id = c.id
      LEFT JOIN ImagenClub ic ON ic.club_id = c.id 
      WHERE pc.presidente_id = :presidenteId
      AND pc.activo = 0
      AND pc.delegado = 'N';`,
      {
        replacements: { presidenteId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return clubesAnteriores;
  } catch (error) {
    console.error('Error al obtener clubes anteriores del presidente:', error);
    throw error;
  }
};

exports.getClubActualDelegado = async (delegadoId) => {
  try {
    const clubActual = await sequelize.query(
      `SELECT 
          c.id AS club_id,
          c.nombre AS club_nombre,
          c.descripcion AS club_descripcion,
          c.presidente_asignado,
          c.fecha_registro,
          c.fecha_actualizacion,
		  ic.club_imagen
      FROM PresidenteClub pc
      JOIN Club c ON pc.club_id = c.id
      LEFT JOIN ImagenClub ic ON ic.club_id = c.id 
      WHERE pc.presidente_id = :delegadoId
      AND pc.activo = 1
      AND pc.delegado = 'S';`,
      {
        replacements: { delegadoId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return clubActual.length > 0 ? clubActual[0] : null;
  } catch (error) {
    console.error('Error al obtener el club actual del delegado:', error);
    throw error;
  }
};

exports.getClubesAnterioresDelegado = async (delegadoId) => {
  try {
    const clubesAnteriores = await sequelize.query(
      `SELECT 
          c.id AS club_id,
          c.nombre AS club_nombre,
          c.descripcion AS club_descripcion,
          c.presidente_asignado,
          c.fecha_registro,
          c.fecha_actualizacion,
		  ic.club_imagen
      FROM PresidenteClub pc
      JOIN Club c ON pc.club_id = c.id
      LEFT JOIN ImagenClub ic ON ic.club_id = c.id 
      WHERE pc.presidente_id = :delegadoId
      AND pc.activo = 0
      AND pc.delegado = 'S';`,
      {
        replacements: { delegadoId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return clubesAnteriores;
  } catch (error) {
    console.error('Error al obtener clubes anteriores del delegado:', error);
    throw error;
  }
};
