const { Jugador, Persona, Club, PersonaRol, ImagenPersona } = require('../models');

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
  return await Jugador.findAll({
    where: { club_id },
    include: [
      {
        model: Persona,
        as: 'persona',
        attributes: ['nombre', 'apellido', 'ci', 'fecha_nacimiento'],
        include: [
          {
            model: ImagenPersona,
            as: 'imagenes',
            attributes: ['persona_imagen']
          }
        ]
      }
    ]
  });
};
