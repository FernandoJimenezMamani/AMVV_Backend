const lugarService = require('../services/lugarService');

exports.createLugar = async (req, res) => {
  const { nombre, longitud, latitud } = req.body;

  if (!nombre || !longitud || !latitud) {
    console.log('Error: Todos los campos deben ser proporcionados');
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  try {
    await lugarService.createLugar(nombre, longitud, latitud);
    res.status(201).json({ message: 'Lugar creado exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear el Lugar', error: err.message });
  }
};

exports.getAllLugares = async (req, res) => {
  try {
    const lugares = await lugarService.getAllLugares();
    res.status(200).json(lugares);
  } catch (err) {
    res.status(500).json({ message: 'Error al seleccionar los Lugares', error: err.message });
  }
};

exports.getLugarById = async (req, res) => {
  const { id } = req.params;

  try {
    const lugar = await lugarService.getLugarById(id);
    if (!lugar) {
      return res.status(404).json({ message: 'Lugar no encontrado' });
    }
    res.status(200).json(lugar);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el lugar', error: err.message });
  }
};

exports.updateLugar = async (req, res) => {
  const { id } = req.params;
  const { nombre, longitud, latitud } = req.body;

  if (!nombre || !longitud || !latitud) {
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  try {
    await lugarService.updateLugar(id, nombre, longitud, latitud);
    res.status(200).json({ message: 'Lugar editado exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al editar el Lugar', error: err.message });
  }
};

exports.deleteLugar = async (req, res) => {
  const { id } = req.params;

  try {
    await lugarService.deleteLugar(id);
    res.status(200).json({ message: 'Lugar eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar el Lugar', error: err.message });
  }
};
