const { Lugar, Sequelize } = require('../models');
const sequelize = require('../config/sequelize');


exports.createLugar = async (nombre, longitud, latitud, direccion) => {
  let transaction;

  try {
    // Verificar si ya existe un lugar con el mismo nombre
    const existingLugar = await Lugar.findOne({
      where: {
        nombre
      }
    });

    if (existingLugar) {
      throw new Error('Ya existe un lugar con el mismo nombre');
    }

    // Iniciar una transacción
    transaction = await sequelize.transaction();

    // Crear el nuevo lugar
    const nuevoLugar = await Lugar.create({
      nombre,
      longitud,
      latitud,
      eliminado: '0',
      direccion
    }, { transaction });

    // Confirmar la transacción
    await transaction.commit();

    return nuevoLugar;

  } catch (error) {
    console.error("Error al crear el lugar:", error);

    // Si algo sale mal, revertir la transacción
    if (transaction) await transaction.rollback();

    // Propagar el error para que el controlador lo maneje
    throw error;
  }
};


exports.getAllLugares = async () => {
  return await Lugar.findAll({
    attributes: ['id', 'nombre', 'longitud', 'latitud', 'eliminado','direccion']
  });
};

exports.getLugarById = async (id) => {
  const lugar = await Lugar.findOne({
    where: {
      id: id,
      eliminado: '0'
    },
    attributes: ['id', 'nombre', 'longitud', 'latitud', 'eliminado', 'direccion']
  });

  return lugar;
};

exports.updateLugar = async (id, nombre, longitud, latitud, direccion) => {
  return await Lugar.update(
    { nombre, longitud, latitud , direccion},
    { where: { id, eliminado: '0' } }
  );
};

exports.deleteLugar = async (id) => {
  return await Lugar.update(
    { eliminado: '1' },
    { where: { id } }
  );
};

exports.activateLugar = async (id) => {
  return await Lugar.update(
    { eliminado: '0' },
    { where: { id } }
  );
};
