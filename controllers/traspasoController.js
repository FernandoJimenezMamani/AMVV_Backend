const traspasoService = require('../services/traspasoService');

// Obtener traspaso por ID
exports.getTraspasoById = async (req, res) => {
    const { id } = req.params;
    try {
        const traspaso = await traspasoService.getTraspasoById(id);
        if (!traspaso) {
            return res.status(404).json({ message: 'Traspaso no encontrado' });
        }
        res.status(200).json(traspaso);
    } catch (error) {
        console.error('Error al obtener el traspaso:', error);
        res.status(500).json({ message: 'Error al obtener el traspaso', error: error.message });
    }
};

// Obtener traspasos aprobados
exports.getTraspasosAprobados = async (req, res) => {
    try {
        const traspasos = await traspasoService.getTraspasosAprobados();
        res.status(200).json(traspasos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener traspasos aprobados', error: error.message });
    }
};

// Obtener traspasos por jugador
exports.getTraspasosPorJugador = async (req, res) => {
    const jugador_id = req.user.id; // Suponiendo que `req.user` tiene el ID del jugador en sesión
    try {
        const solicitudes = await traspasoService.getTraspasosPorJugador(jugador_id);
        res.status(200).json(solicitudes);
    } catch (error) {
        console.error('Error al obtener los traspasos del jugador:', error);
        res.status(500).json({ message: 'Error al obtener los traspasos del jugador' });
    }
};

exports.getTraspasosEnviadosPorClub = async (req, res) => {
  const { club_id } = req.params;

  try {
    const traspasosEnviados = await traspasoService.getTraspasosEnviadosPorClub(club_id);
    res.status(200).json(traspasosEnviados);
  } catch (error) {
    console.error('Error al obtener los traspasos enviados:', error);
    res.status(500).json({ message: 'Error al obtener los traspasos enviados' });
  }
};

exports.getTraspasosRecibidosPorClub = async (req, res) => {
  const { club_id } = req.params;

  try {
    const traspasosRecibidos = await traspasoService.getTraspasosRecibidosPorClub(club_id);
    res.status(200).json(traspasosRecibidos);
  } catch (error) {
    console.error('Error al obtener los traspasos recibidos:', error);
    res.status(500).json({ message: 'Error al obtener los traspasos recibidos' });
  }
};


// Crear un nuevo traspaso
exports.createTraspaso = async (req, res) => {
    try {
        const traspaso = await traspasoService.createTraspaso(req.body);
        res.status(201).json({ message: 'Traspaso creado con éxito', traspaso });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el traspaso', error: error.message });
    }
};

// Aprobar traspaso por el jugador
exports.aprobarTraspasoPorJugador = async (req, res) => {
    const { id } = req.params;
    try {
        await traspasoService.aprobarTraspasoPorJugador(id);
        res.status(200).json({ message: 'Traspaso aprobado por el jugador' });
    } catch (error) {
        res.status(500).json({ message: 'Error al aprobar traspaso por el jugador', error: error.message });
    }
};

// Aprobar traspaso por el club de origen
exports.aprobarTraspasoPorClub = async (req, res) => {
    const { id } = req.params;
    try {
        await traspasoService.aprobarTraspasoPorClub(id);
        res.status(200).json({ message: 'Traspaso aprobado por el club de origen' });
    } catch (error) {
        res.status(500).json({ message: 'Error al aprobar traspaso por el club de origen', error: error.message });
    }
};

// Rechazar traspaso por el jugador
exports.rechazarTraspasoPorJugador = async (req, res) => {
    const { id } = req.params;
    try {
        await traspasoService.rechazarTraspasoPorJugador(id);
        res.status(200).json({ message: 'Traspaso rechazado por el jugador' });
    } catch (error) {
        res.status(500).json({ message: 'Error al rechazar traspaso por el jugador', error: error.message });
    }
};

// Rechazar traspaso por el club de origen
exports.rechazarTraspasoPorClub = async (req, res) => {
    const { id } = req.params;
    try {
        await traspasoService.rechazarTraspasoPorClub(id);
        res.status(200).json({ message: 'Traspaso rechazado por el club de origen' });
    } catch (error) {
        res.status(500).json({ message: 'Error al rechazar traspaso por el club de origen', error: error.message });
    }
};

exports.getTraspasos = async (req, res) => {
    try {
      const traspasos = await obtenerListaTraspasos();
      res.status(200).json(traspasos);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener la lista de traspasos", error: error.message });
    }
  };