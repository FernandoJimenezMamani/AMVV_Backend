const { Persona, PersonaRol, Rol } = require('../models');
const sequelize = require('../config/sequelize');

exports.getArbitros = async () => {
  try {
    const arbitros = await sequelize.query(`
      SELECT 
        p.id,
        p.nombre,
        p.apellido,
        p.ci,
        p.direccion,
        p.fecha_nacimiento,
        ip.persona_imagen,
        r.nombre AS rol_nombre
      FROM Persona p
      INNER JOIN PersonaRol pr ON p.id = pr.persona_id
      INNER JOIN Rol r ON pr.rol_id = r.id
      LEFT JOIN ImagenPersona ip ON p.id = ip.persona_id
      WHERE pr.rol_id = 7
      AND p.eliminado = 'N'
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    return arbitros;
  } catch (error) {
    console.error('Error al obtener los árbitros:', error);
    throw new Error('Error al obtener los árbitros');
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
