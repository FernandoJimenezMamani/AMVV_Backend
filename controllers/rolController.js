const rolService = require('../services/rolService');

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await rolService.getAllRoles();
    res.status(200).json(roles);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener roles', error: err.message });
  }
};

exports.createRol = async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ message: 'El campo nombre debe ser proporcionado' });
  }

  try {
    const nuevoRol = await rolService.createRol(nombre);
    res.status(201).json({ message: 'Rol creado', rolId: nuevoRol.id });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear Rol', error: err.message });
  }
};
