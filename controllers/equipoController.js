const equipoService = require('../services/equipoService');

exports.getEquiposByCategoriaId = async (req, res) => {
  const { categoria_id } = req.params;

  try {
    const equipos = await equipoService.getEquiposByCategoriaId(categoria_id);
    res.status(200).json(equipos);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener equipos', error: err.message });
  }
};

exports.getEquipoById = async (req, res) => {
  const { id } = req.params;

  try {
    const equipo = await equipoService.getEquipoById(id);
    if (equipo) {
      res.status(200).json(equipo);
    } else {
      res.status(404).json({ message: 'Equipo no encontrado' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener equipo', error: err.message });
  }
};

exports.createEquipo = async (req, res) => {
  const { nombre, club_id, categoria_id, user_id } = req.body;

  if (!nombre || !club_id || !categoria_id || !user_id) {
    return res.status(400).json({ message: 'Todos los campos (nombre, club_id, categoria_id, user_id) deben ser proporcionados' });
  }

  try {
    const equipo = await equipoService.createEquipo({ nombre, club_id, categoria_id, user_id });
    res.status(201).json({ message: 'Equipo creado', equipoId: equipo.id });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al crear equipo', error: err.message });
  }
};

exports.updateEquipo = async (req, res) => {
  const { id } = req.params;
  const { nombre, club_id, categoria_id, user_id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'El ID del equipo debe ser proporcionado' });
  }

  try {
    const result = await equipoService.updateEquipo(id, { nombre, club_id, categoria_id, user_id });
    if (result[0] > 0) {
      res.status(200).json({ message: 'Equipo actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Equipo no encontrado' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al actualizar equipo', error: err.message });
  }
};

exports.deleteEquipo = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!id || !user_id) {
    return res.status(400).json({ message: 'El ID y el user_id deben ser proporcionados' });
  }

  try {
    const result = await equipoService.deleteEquipo(id, user_id);
    if (result[0] > 0) {
      res.status(200).json({ message: 'Equipo eliminado lógicamente correctamente' });
    } else {
      res.status(404).json({ message: 'Equipo no encontrado' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al eliminar lógicamente el equipo', error: err.message });
  }
};

exports.getEquiposPorPartido = async (req, res) => {
  const { partido_id } = req.params;

  try {
    const equipos = await equipoService.getEquiposByPartidoId(partido_id);
    return res.status(200).json(equipos);
  } catch (error) {
    console.error('Error en el controlador getEquiposPorPartido:', error);
    return res.status(500).json({ error: 'Error al obtener los equipos por partido' });
  }
};
