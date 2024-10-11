const partidoService = require('../services/partidoService');

exports.createPartido = async (req, res) => {
  const { campeonato_id, equipo_local_id, equipo_visitante_id, fecha, lugar_id, resultado } = req.body;

  if (!campeonato_id || !equipo_local_id || !equipo_visitante_id || !fecha || !lugar_id) {
    return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
  }

  try {
    await partidoService.createPartido({ campeonato_id, equipo_local_id, equipo_visitante_id, fecha, lugar_id, resultado });
    res.status(201).json({ message: 'Partido creado exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear el Partido', error: err.message });
  }
};

exports.getPartidosByCategoriaId = async (req, res) => {
  const { categoriaId } = req.params;

  try {
    const partidos = await partidoService.getPartidosByCategoriaId(categoriaId);
    res.status(200).json(partidos);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los partidos', error: err.message });
  }
};

exports.getUpcomingMatchesByCategoria = async (req, res) => {
  const { categoria } = req.params;

  try {
    const partidos = await partidoService.getUpcomingMatchesByCategoria(categoria);
    res.status(200).json(partidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllMatchesExceptUpcoming = async (req, res) => {
  const { categoria } = req.params;

  try {
    const partidos = await partidoService.getAllMatchesExceptUpcoming(categoria);
    res.status(200).json(partidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPartidoById = async (req, res) => {
  const { id } = req.params;

  try {
    const partido = await partidoService.getPartidoById(id);
    if (!partido) {
      return res.status(404).json({ message: 'Partido no encontrado' });
    }
    res.status(200).json(partido);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el Partido', error: err.message });
  }
};

exports.updatePartido = async (req, res) => {
  const { id } = req.params;
  const { campeonato_id, equipo_local_id, equipo_visitante_id, fecha, lugar_id, resultado } = req.body;

  if (!campeonato_id || !equipo_local_id || !equipo_visitante_id || !fecha || !lugar_id) {
    return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
  }

  try {
    await partidoService.updatePartido(id, { campeonato_id, equipo_local_id, equipo_visitante_id, fecha, lugar_id, resultado });
    res.status(200).json({ message: 'Partido editado exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al editar el Partido', error: err.message });
  }
};

exports.deletePartido = async (req, res) => {
  const { id } = req.params;

  try {
    await partidoService.deletePartido(id);
    res.status(200).json({ message: 'Partido eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar el Partido', error: err.message });
  }
};
