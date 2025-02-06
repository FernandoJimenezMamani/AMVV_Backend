const pagoService = require('../services/pagoService');

exports.createPago = async (req, res) => {
  try {
    const {
      monto,
      fecha,
      referencia,
      tipo_pago,
      traspaso_id,
      EquipoId,
      estado,
      fecha_registro,
      userId,
      campeonatoId
    } = req.body;
    console.log('req.body:', req.body);

    // Validación de campos requeridos
    if (!monto || !fecha || !tipo_pago || !userId) {
      return res.status(400).json({ message: 'Faltan datos obligatorios (monto, fecha, tipo_pago, userId).' });
    }

    // Validar que solo se reciba uno de los dos (traspaso_id o EquipoId)
    if ((!traspaso_id && !EquipoId) || (traspaso_id && EquipoId)) {
      return res.status(400).json({ message: 'Debe proporcionar solo un traspaso_id o un EquipoId, no ambos.' });
    }

    // Llamar al servicio de creación de pago
    const nuevoPago = await pagoService.createPago({
      monto,
      fecha,
      referencia,
      tipo_pago,
      traspaso_id: traspaso_id || null, // Evita enviar undefined
      EquipoId: EquipoId || null,
      estado,
      fecha_registro: fecha_registro || new Date(),
      userId,
      campeonatoId
    });

    return res.status(201).json({ 
      message: 'Pago creado exitosamente', 
      pagoId: nuevoPago.id  // Retornar el ID del pago creado
    });

  } catch (error) {
    console.error('Error en createPago:', error);
    return res.status(500).json({ 
      message: 'Error al crear el pago', 
      error: error.message 
    });
  }
};

exports.getEquiposDebt = async (req, res) => {
  try {
    const equipos = await pagoService.obtenerEquiposPorCampeonato();
    res.status(200).json(equipos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los equipos", error: error.message });
  }
};

exports.getEquipoDebtById = async (req, res) => {
  const id = req.params.id;
  try {
    const equipos = await pagoService.obtenerEquiposPorCampeonatoById(id);
    res.status(200).json(equipos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los equipos", error: error.message });
  }
};

exports.getTraspasoDebt = async (req, res) => {
  try {
    const traspasos = await pagoService.obtenerTraspasosPorCampeonato();
    res.status(200).json(traspasos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los equipos", error: error.message });
  }
};

exports.getTraspasoDebtById = async (req, res) => {
  const id = req.params.id;
  try {
    const traspasos = await pagoService.obtenerTraspasosPorCampeonatoById(id);
    res.status(200).json(traspasos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los equipos", error: error.message });
  }
};