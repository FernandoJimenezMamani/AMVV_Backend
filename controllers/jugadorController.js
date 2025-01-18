const jugadorService = require('../services/jugadorService');

exports.getAllJugadores = async (req, res) => {
  try {
    const jugadores = await jugadorService.getAllJugadores();
    res.status(200).json(jugadores);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener jugadores con clubes', error: error.message });
  }
};

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

exports.asignarJugadorAEquipo = async (req, res) => {
  const { persona_id, equipo_id } = req.body;
  console.log(persona_id, equipo_id);
  if (!persona_id || !equipo_id) {
    return res.status(400).json({ message: 'Los campos persona_id y equipo_id deben ser proporcionados' });
  }

  try {
    const response = await jugadorService.asignarJugadorAEquipo(persona_id, equipo_id);
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ message: 'Error al asignar el jugador al equipo: ' + err.message });
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

exports.getJugadoresByEquipo = async (req, res) => {
  const { equipo_id } = req.params;

  try {
    const jugadores = await jugadorService.getJugadoresByEquipoId(equipo_id);
    return res.status(200).json(jugadores);
  } catch (error) {
    console.error('Error en getJugadoresByEquipo:', error);
    return res.status(500).json({ error: 'Error al obtener los jugadores por equipo' });
  }
};
exports.searchJugadoresByClubId = async (req, res) => {
  const { club_id } = req.params;
  const { searchTerm, genero } = req.query;

  if (!club_id) {
    return res.status(400).json({ message: 'El club_id debe ser proporcionado' });
  }

  try {
    const jugadores = await jugadorService.searchJugadoresByClubId(club_id, searchTerm, genero);
    res.status(200).json(jugadores);
  } catch (err) {
    res.status(500).json({ message: 'Error al buscar jugadores', error: err.message });
  }
};

exports.getJugadoresByEquipoId = async (req, res) => {
  const { equipo_id } = req.params;

  if (!equipo_id) {
    return res.status(400).json({ message: 'El equipo_id debe ser proporcionado' });
  }

  try {
    const jugadores = await jugadorService.getJugadoresByEquipoId(equipo_id);
    res.status(200).json(jugadores);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los jugadores del equipo', error: err.message });
  }
};
