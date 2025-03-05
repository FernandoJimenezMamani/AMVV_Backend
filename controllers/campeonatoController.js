const campeonatoService = require('../services/campeonatoService');

exports.createCampeonato = async (req, res) => {
  const { nombre, fecha_inicio_transaccion, fecha_fin_transaccion ,fecha_inicio_campeonato, fecha_fin_campeonato} = req.body;
  console.log(req.body);

  // Validar que todos los campos requeridos estén presentes
  if (!nombre || !fecha_inicio_campeonato || !fecha_fin_campeonato || !fecha_inicio_transaccion || !fecha_fin_transaccion) {
    console.log('Todos los campos deben ser proporcionados');
    return res.status(400).json({ 
      message: 'Todos los campos deben ser proporcionados', 
      errors: ['nombre', 'fecha_inicio', 'fecha_fin', 'fecha_inicio_transaccion', 'fecha_fin_transaccion'] 
    });
  }

  try {
    // Intentar crear el campeonato
    const campeonato = await campeonatoService.createCampeonato(
      nombre, 
      fecha_inicio_campeonato, 
      fecha_fin_campeonato, 
      fecha_inicio_transaccion, 
      fecha_fin_transaccion
    );

    // Responder con éxito si el campeonato se crea correctamente
    res.status(201).json({ 
      message: 'Campeonato creado exitosamente', 
      campeonatoId: campeonato.id 
    });
  } catch (err) {
    console.log(err);
    // Capturar y devolver el mensaje de error del servicio
    res.status(400).json({ 
      message: 'Error al crear el campeonato', 
      error: err.message 
    });
    
  }
};


exports.getCampeonatoCategoria = async (req, res) => {
  const { campeonato_id, categoria_id } = req.params;

  try {
    const data = await campeonatoService.getCampeonatoCategoria(campeonato_id, categoria_id);
    res.status(200).json(data);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.getCampeonatoPosiciones = async (req, res) => {
  const { campeonato_id, categoria_id } = req.params;

  try {
    const data = await campeonatoService.getChampionshipPositions(campeonato_id, categoria_id);
    res.status(200).json(data);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.getAllCampeonatos = async (req, res) => {
  try {
    const campeonatos = await campeonatoService.getAllCampeonatos();
    res.status(200).json(campeonatos);
  } catch (err) {
    res.status(500).json({ message: 'Error al seleccionar los Campeonatos', error: err.message });
  }
};

exports.getCampeonatoById = async (req, res) => {
  const { id } = req.params;

  try {
    const campeonato = await campeonatoService.getCampeonatoById(id);
    res.status(200).json(campeonato);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.updateCampeonato = async (req, res) => {
  const { id } = req.params;
  const { nombre, fecha_inicio_transaccion, fecha_fin_transaccion ,fecha_inicio_campeonato, fecha_fin_campeonato } = req.body;
  console.log(req.body);

  if (!nombre || !fecha_inicio_transaccion || !fecha_fin_transaccion|| !fecha_inicio_campeonato || !fecha_fin_campeonato) {
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  try {
    await campeonatoService.updateCampeonato(id, nombre, fecha_inicio_transaccion, fecha_fin_transaccion ,fecha_inicio_campeonato, fecha_fin_campeonato);
    res.status(200).json({ message: 'Campeonato editado exitosamente' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getFechasPartidos = async (req, res) => {
  const { campeonatoId } = req.params;

  if (!campeonatoId) {
      return res.status(400).json({ message: 'El ID del campeonato es obligatorio' });
  }

  try {
      const fechas = await campeonatoService.obtenerFechasDePartidos(campeonatoId);
      res.status(200).json({ campeonatoId, fechas });
  } catch (error) {
      console.error('Error en getFechasPartidos:', error.message);
      res.status(500).json({ message: 'Error al obtener las fechas de partidos', error: error.message });
  }
};

exports.getCampeonatoEnCurso = async (req, res) => {
  try {
    const campeonato = await campeonatoService.getCampeonatoEnCurso();
    return res.json(campeonato);
  } catch (error) {
    console.error("Error al obtener el campeonato en curso:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.getCampeonatoEnTransaccion = async (req, res) => {
  try {
    const campeonato = await campeonatoService.getCampeonatoEnTransaccion();
    return res.json(campeonato);
  } catch (error) {
    console.error("Error al obtener el campeonato en transaccion:", error);
    return res.status(500).json({ error: "Error interno del transaccion" });
  }
};

exports.getTeamPosition = async (req, res) => {
  try {
    const { categoriaId, campeonatoId, equipoId } = req.body;

    if (!categoriaId || !campeonatoId || !equipoId) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const teamPosition = await campeonatoService.getTeamPosition(categoriaId, campeonatoId, equipoId);
    res.json(teamPosition);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
