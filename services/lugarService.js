const { Lugar } = require('../models');

exports.createLugar = async (nombre, longitud, latitud) => {
  return await Lugar.create({
    nombre,
    longitud,
    latitud,
    eliminado: '0'
  });
};

exports.getAllLugares = async () => {
  return await Lugar.findAll({
    where: { eliminado: '0' },
    attributes: ['id', 'nombre', 'longitud', 'latitud', 'eliminado']
  });
};

exports.getLugarById = async (id) => {
  const lugar = await Lugar.findOne({
    where: {
      id: id,
      eliminado: '0'
    },
    attributes: ['id', 'nombre', 'longitud', 'latitud', 'eliminado']
  });

  return lugar;
};

exports.updateLugar = async (id, nombre, longitud, latitud) => {
  return await Lugar.update(
    { nombre, longitud, latitud },
    { where: { id, eliminado: '0' } }
  );
};

exports.deleteLugar = async (id) => {
  return await Lugar.update(
    { eliminado: '1' },
    { where: { id } }
  );
};
