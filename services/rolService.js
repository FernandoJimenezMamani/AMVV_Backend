const { Rol } = require('../models');

exports.getAllRoles = async () => {
  return await Rol.findAll();
};

exports.createRol = async (nombre) => {
  return await Rol.create({ nombre });
};
