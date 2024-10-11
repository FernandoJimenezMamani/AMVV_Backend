const campeonatoService = require('../services/campeonatoService');

exports.createCampeonato = async (req, res) => {
  const { nombre, fecha_inicio, fecha_fin } = req.body;

  if (!nombre || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  try {
    const campeonato = await campeonatoService.createCampeonato(nombre, fecha_inicio, fecha_fin);
    res.status(201).json({ message: 'Campeonato creado exitosamente', campeonatoId: campeonato.id });
  } catch (err) {
    res.status(400).json({ message: err.message });
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
  const { nombre, fecha_inicio, fecha_fin } = req.body;

  if (!nombre || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  try {
    await campeonatoService.updateCampeonato(id, nombre, fecha_inicio, fecha_fin);
    res.status(200).json({ message: 'Campeonato editado exitosamente' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
