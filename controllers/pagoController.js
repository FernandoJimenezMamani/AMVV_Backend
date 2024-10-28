const pagoService = require('../services/pagoService');

exports.createPago = async (req, res) => {
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
  } = req.body;

  // Validar los campos requeridos
  if (!monto || !fecha || !tipo_pago || (!traspaso_id && !EquipoId) || !userId) {
    return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
  }

  try {
    await pagoService.createPago({
      monto,
      fecha,
      referencia,
      tipo_pago,
      traspaso_id,
      EquipoId,
      estado,
      fecha_registro: fecha_registro || new Date(),
      userId
    });
    res.status(201).json({ message: 'Pago creado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el pago', error: error.message });
  }
};
