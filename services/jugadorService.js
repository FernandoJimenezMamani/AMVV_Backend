const { Jugador, Persona, Club, PersonaRol, ImagenPersona } = require('../models');
const { sequelize } = require('../models');

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
