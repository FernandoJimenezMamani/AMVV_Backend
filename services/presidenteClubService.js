const { PresidenteClub, Persona, Club, PersonaRol } = require('../models');

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
