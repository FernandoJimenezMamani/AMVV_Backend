const pagoService = require('../services/pagoService');


exports.createPagoInscripcion = async (req, res) => {
  try {
    const {
      monto,
      fecha,
      referencia,
      EquipoId,
      estado,
      fecha_registro,
      userId,
      campeonatoId
    } = req.body;
    
    console.log('req.body (Inscripción):', req.body);

    // Validación de campos requeridos
    if (!monto || !fecha || !userId || !EquipoId || !campeonatoId) {
      return res.status(400).json({ 
        message: 'Faltan datos obligatorios (monto, fecha, userId, EquipoId, campeonatoId).' 
      });
    }

    // Llamar al servicio de creación de pago de inscripción
    const nuevoPago = await pagoService.createPagoInscripcion({
      monto,
      fecha,
      referencia,
      EquipoId,
      estado,
      fecha_registro: fecha_registro || new Date(),
      userId,
      campeonatoId
    });

    return res.status(201).json({ 
      message: 'Pago de inscripción creado exitosamente', 
      pagoId: nuevoPago.id  
    });

  } catch (error) {
    console.error('Error en createPagoInscripcion:', error);
    return res.status(500).json({ 
      message: 'Error al crear el pago de inscripción', 
      error: error.message 
    });
  }
};


exports.createPagoTraspaso = async (req, res) => {
  try {
    const {
      monto,
      fecha,
      referencia,
      traspaso_id,
      estado,
      fecha_registro,
      userId,
      jugador_id,
      jugador_traspaso_id,
      club_destino_id,
      jugador_nombre,
      jugador_apellido,
      jugador_ci,
      jugador_fecha_nacimiento,
      nombre_campeonato,
      club_origen_nombre,
      club_destino_nombre,
      id_persona_presi_origen,
      nombre_presi_club_origen,
      apellido_presi_club_origen,
      id_persona_presi_det,
      nombre_presi_club_dest,
      apellido_presi_club_dest
    } = req.body;
    
    console.log('req.body (Traspaso):', req.body);

    // Validación de campos requeridos
    if (!monto || !fecha || !userId || !traspaso_id || !jugador_traspaso_id || !club_destino_id) {
      return res.status(400).json({ 
        message: 'Faltan datos obligatorios (monto, fecha, userId, traspaso_id, jugador_traspaso_id, club_destino_id).' 
      });
    }

    // Llamar al servicio de creación de pago de traspaso
    const nuevoPago = await pagoService.createPagoTraspaso({
      monto,
      fecha,
      referencia,
      traspaso_id,
      estado,
      fecha_registro: fecha_registro || new Date(),
      userId,
      jugador_id: jugador_id || null,
      jugador_traspaso_id,
      club_destino_id,
      jugador_nombre,
      jugador_apellido,
      jugador_ci,
      jugador_fecha_nacimiento,
      nombre_campeonato,
      club_origen_nombre,
      club_destino_nombre,
      id_persona_presi_origen,
      nombre_presi_club_origen,
      apellido_presi_club_origen,
      id_persona_presi_det,
      nombre_presi_club_dest,
      apellido_presi_club_dest
    });

    return res.status(201).json({ 
      message: 'Pago de traspaso creado exitosamente', 
      pagoId: nuevoPago.id  
    });

  } catch (error) {
    console.error('Error en createPagoTraspaso:', error);
    return res.status(500).json({ 
      message: 'Error al crear el pago de traspaso', 
      error: error.message 
    });
  }
};

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
      campeonatoId,
      jugador_id,
      jugador_traspaso_id,
      club_destino_id
    } = req.body;
    console.log('req.body:', req.body);

    // Validación de campos requeridos
    if (!monto || !fecha || !tipo_pago || !userId) {
      return res.status(400).json({ message: 'Faltan datos obligatorios (monto, fecha, tipo_pago, userId).' });
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
      campeonatoId,
      jugador_id: jugador_id || null,
      jugador_traspaso_id: jugador_traspaso_id|| null,
      club_destino_id :club_destino_id || null
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