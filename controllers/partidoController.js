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
  const { categoriaId ,campeonatoId } = req.params;

  try {
    const partidos = await partidoService.getPartidosByCategoriaId(categoriaId,campeonatoId);
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

exports.submitResultados = async (req, res) => {
  let { partido_id, resultadoLocal, resultadoVisitante, walkover, tarjetas } = req.body;
  const imagenPlanilla = req.file;

  // Validar los campos requeridos
  if (!partido_id || !resultadoLocal || !resultadoVisitante) {
    return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
  }

  try {
    // Parsear los datos si llegan como strings
    resultadoLocal = JSON.parse(resultadoLocal);
    resultadoVisitante = JSON.parse(resultadoVisitante);
    tarjetas = JSON.parse(tarjetas);

    // Llamar al servicio para registrar los resultados
    const resultados = await partidoService.submitResultados({
      partido_id,
      resultadoLocal,
      resultadoVisitante,
      walkover,
      tarjetas,
      imagenPlanilla
    });

    res.status(201).json({
      message: 'Resultados, tarjetas e imagen de la planilla registrados exitosamente',
      resultados
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar los resultados', error: error.message });
  }
};
exports.getPartidoCompletoById = async (req, res) => {
  const { partidoId } = req.params;

  try {
    const partido = await partidoService.getPartidoCompletoById(partidoId);
    if (!partido) {
      return res.status(404).json({ message: 'Partido no encontrado' });
    }
    res.status(200).json(partido);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la información del partido', error: error.message });
  }
};

// Obtener los jugadores de un equipo por su ID
exports.getJugadoresByEquipoId = async (req, res) => {
  const { equipoId } = req.params;

  try {
    const jugadores = await partidoService.getJugadoresByEquipoId(equipoId);
    res.status(200).json(jugadores);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los jugadores del equipo', error: error.message });
  }
};

// Obtener los árbitros asignados a un partido por su ID
exports.getArbitrosByPartidoId = async (req, res) => {
  const { partidoId } = req.params;

  try {
    const arbitros = await partidoService.getArbitrosByPartidoId(partidoId);
    res.status(200).json(arbitros);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los árbitros del partido', error: error.message });
  }
};
exports.getPartidosByLugarYFecha = async (req, res) => {
  const { lugarId, fecha } = req.query;

  if (!lugarId || !fecha) {
    return res.status(400).json({ message: 'El lugar y la fecha son obligatorios' });
  }

  try {
    const partidos = await partidoService.getPartidosByLugarYFecha(lugarId, fecha);
    res.status(200).json(partidos);
  } catch (err) {
    console.error('Error en el controlador getPartidosByLugarYFecha:', err.message);
    res.status(500).json({ message: 'Error al obtener los partidos', error: err.message });
  }
};

