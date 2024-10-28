const sequelize = require('../config/sequelize');

exports.createPago = async (data) => {
  const {
    monto,
    fecha,
    referencia,
    tipo_pago,
    traspaso_id,
    EquipoId,
    estado,
    fecha_registro,
    userId
  } = data;

  try {
    // Realizar la inserción directamente en la tabla Pago
    const result = await sequelize.query(`
      INSERT INTO Pago (
        monto,
        fecha,
        referencia,
        tipo_pago,
        traspaso_id,
        EquipoId,
        estado,
        fecha_registro,
        userId
      ) VALUES (
        :monto,
        :fecha,
        :referencia,
        :tipo_pago,
        :traspaso_id,
        :EquipoId,
        :estado,
        :fecha_registro,
        :userId
      )
    `, {
      replacements: {
        monto,
        fecha: new Date(fecha).toISOString().slice(0, 10), // Formatea la fecha a 'YYYY-MM-DD'
        referencia,
        tipo_pago,
        traspaso_id,
        EquipoId,
        estado,
        fecha_registro: new Date(fecha_registro).toISOString().slice(0, 19).replace('T', ' '),
        userId
      },
      type: sequelize.QueryTypes.INSERT
    });

    console.log('Pago creado exitosamente:', result);
    return result;

  } catch (error) {
    console.error('Error al crear el pago:', error);
    throw error;
  }
};
