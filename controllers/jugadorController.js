const jugadorService = require('../services/jugadorService');

exports.createJugador = async (req, res) => {
  const { persona_id, club_id } = req.body;

  if (!persona_id || !club_id) {
    return res.status(400).json({ message: 'Los campos persona_id y club_id deben ser proporcionados' });
  }

  try {
    const response = await jugadorService.createJugador(persona_id, club_id);
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getJugadoresByClubId = async (req, res) => {
  const { club_id } = req.params;

  if (!club_id) {
    return res.status(400).json({ message: 'El club_id debe ser proporcionado' });
  }

  try {
    const jugadores = await jugadorService.getJugadoresByClubId(club_id);
    res.status(200).json(jugadores);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los jugadores del club', error: err.message });
  }
};
