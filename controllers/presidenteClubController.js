const presidenteClubService = require('../services/presidenteClubService');

exports.createPresidenteClub = async (req, res) => {
  const { persona_id, club_id } = req.body;

  if (!persona_id || !club_id) {
    return res.status(400).json({ message: 'Los campos persona_id y club_id deben ser proporcionados' });
  }

  try {
    const response = await presidenteClubService.createPresidenteClub(persona_id, club_id);
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ message: 'Error al asignar el presidente del club y actualizar el club', error: err.message });
  }
};
