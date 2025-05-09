const traspasoService = require('../services/traspasoService');
const { PresidenteClub, Traspaso } = require('../models');
const sendEmailService =require('../services/sendEmailTraspaso')
const notificationService = require('../services/notificationService');

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
    const {CampeonatoId} = req.params;
    try {
        const solicitudes = await traspasoService.getTraspasosPorJugador(jugador_id,CampeonatoId);
        res.status(200).json(solicitudes);
    } catch (error) {
        console.error('Error al obtener los traspasos del jugador:', error);
        res.status(500).json({ message: 'Error al obtener los traspasos del jugador' });
    }
};

exports.getTraspasosPorPresidente = async (req, res) => {
    const presidente_id = req.user.id; 
    const {CampeonatoId} = req.params;
    console.log(req.params)
    try {
        const solicitudes = await traspasoService.getTraspasosPorPresidente(presidente_id,CampeonatoId);
        res.status(200).json(solicitudes);
    } catch (error) {
        console.error('Error al obtener los traspasos del presidente:', error);
        res.status(500).json({ message: 'Error al obtener los traspasos del presidente' });
    }
};

exports.getTraspasosRelacionadosConPresidente = async (req, res) => {
    const presidente_id = req.user.id; 
    const {CampeonatoId} = req.params;
    console.log(req.params)
    try {
        const solicitudes = await traspasoService.getTraspasosRelacionadosConPresidente(presidente_id,CampeonatoId);
        res.status(200).json(solicitudes);
    } catch (error) {
        console.error('Error al obtener los traspasos del presidente:', error);
        res.status(500).json({ message: 'Error al obtener los traspasos del presidente' });
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

        const traspasoCompleto = await traspasoService.getTraspasoById(traspaso.id);
        const traspasoData = Array.isArray(traspasoCompleto) ? traspasoCompleto[0] : traspasoCompleto;
        await notificationService.sendPushNotification(
            traspasoData.usuario_jugador_id, 
            'Nueva solicitud de traspaso',
            `Tienes una nueva solicitud de traspaso del club ${traspasoData.club_destino_nombre}`,
            { type: 'TRASPASO', traspasoId: traspaso.id, screen: 'detalle_jugador' }
        );
        console.log(traspasoData.usuario_presidente_origen_id);
        // Notificar al PRESIDENTE CLUB ORIGEN (Club B)
        await notificationService.sendPushNotification(
            traspasoData.usuario_presidente_origen_id, 
            'Solicitud de traspaso de tu jugador',
            `El club ${traspasoData.club_destino_nombre} quiere traspasar a ${traspasoData.jugador_nombre}`,
            { type: 'TRASPASO', traspasoId: traspaso.id, screen: 'detalle_presidente' }
        );
        res.status(201).json({ message: 'Traspaso creado con éxito', traspaso });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error al crear el traspaso', error: error.message });
    }
};

exports.createTraspasoJugador = async (req, res) => {

    try {
        console.log('datos',req.body)
        const traspaso = await traspasoService.createTraspasoJugador(req.body);

        const traspasoData = await traspasoService.getTraspasoById(traspaso.id);
        const traspasoCompleto = Array.isArray(traspasoData) ? traspasoData[0] : traspasoData;
                // Notificar al PRESIDENTE CLUB ORIGEN (Club A)
                await notificationService.sendPushNotification(
                    traspasoCompleto.usuario_presidente_origen_id,
                    'Solicitud de traspaso iniciada por jugador',
                    `El jugador ${traspasoCompleto.jugador_nombre} quiere irse a ${traspasoCompleto.club_destino_nombre}`,
                    { 
                        type: 'TRASPASO_JUGADOR_INICIADO', 
                        traspasoId: traspaso.id, 
                        screen: 'detalle_presidente' 
                    }
                );
        
                // Notificar al PRESIDENTE CLUB DESTINO (Club B)
                await notificationService.sendPushNotification(
                    traspasoCompleto.usuario_presidente_destino_id,
                    'Solicitud de traspaso recibida',
                    `El jugador ${traspasoCompleto.jugador_nombre} quiere unirse a tu club`,
                    { 
                        type: 'TRASPASO_JUGADOR_INICIADO', 
                        traspasoId: traspaso.id, 
                        screen: 'detalle_presidente' 
                    }
                );
        res.status(201).json({ message: 'Traspaso creado con éxito', traspaso });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error al crear el traspaso', error: error.message });
    }
};

// Aprobar traspaso por el jugador
exports.aprobarTraspasoPorJugador = async (req, res) => {
    const { id } = req.params;
    try {
         await traspasoService.aprobarTraspasoPorJugador(id);
        const traspasoData = await traspasoService.getTraspasoById(id);
        const traspasoCompleto = Array.isArray(traspasoData) ? traspasoData[0] : traspasoData;
                await notificationService.sendPushNotification(
                    traspasoCompleto.usuario_presidente_origen_id,
                    'Jugador aceptó traspaso',
                    `${traspasoCompleto.jugador_nombre} aceptó el traspaso a ${traspasoCompleto.club_destino_nombre}`,
                    { type: 'TRASPASO', traspasoId: id, screen: 'detalle_presidente' }
                );
                await notificationService.sendPushNotification(
                    traspasoCompleto.usuario_presidente_destino_id,
                    'Jugador aceptó traspaso',
                    `${traspasoCompleto.jugador_nombre} aceptó unirse a tu club`,
                    { type: 'TRASPASO', traspasoId: id, screen: 'detalle_solicitante' }
                );
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
        const traspasoData = await traspasoService.getTraspasoById(id);
        const traspasoCompleto = Array.isArray(traspasoData) ? traspasoData[0] : traspasoData;
           // Notificar al JUGADOR
           await notificationService.sendPushNotification(
            traspasoCompleto.usuario_jugador_id,
            'Traspaso aprobado por tu club',
            `Tu club actual aprobó tu traspaso a ${traspasoCompleto.club_destino_nombre}`,
            { type: 'TRASPASO', traspasoId: id, screen: 'detalle_jugador' }
        );

        // Notificar al PRESIDENTE DESTINO (A)
        await notificationService.sendPushNotification(
            traspasoCompleto.usuario_presidente_destino_id,
            'Traspaso aprobado por club origen',
            `El club ${traspasoCompleto.club_origen_nombre} aprobó el traspaso de ${traspasoCompleto.jugador_nombre}`,
            { type: 'TRASPASO', traspasoId: id, screen: 'detalle_solicitante' }
        );
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
        const traspasoData = await traspasoService.getTraspasoById(id);
        const traspasoCompleto = Array.isArray(traspasoData) ? traspasoData[0] : traspasoData;
          // Notificar a ambos presidentes
          await notificationService.sendPushNotification(
            traspasoCompleto.usuario_presidente_origen_id,
            'Jugador rechazó traspaso',
            `${traspasoCompleto.jugador_nombre} rechazó el traspaso a ${traspasoCompleto.club_destino_nombre}`,
            { type: 'TRASPASO', traspasoId: id, screen: 'detalle_presidente' }
        );
        await notificationService.sendPushNotification(
            traspasoCompleto.usuario_presidente_destino_id,
            'Jugador rechazó traspaso',
            `${traspasoCompleto.jugador_nombre} no aceptó unirse a tu club`,
            { type: 'TRASPASO', traspasoId: id, screen: 'detalle_solicitante' }
        );
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
        const traspasoData = await traspasoService.getTraspasoById(id);
        const traspasoCompleto = Array.isArray(traspasoData) ? traspasoData[0] : traspasoData;
           // Notificar al JUGADOR
           await notificationService.sendPushNotification(
            traspasoCompleto.usuario_jugador_id,
            'Traspaso rechazado por tu club',
            `Tu club actual rechazó tu traspaso a ${traspasoCompleto.club_destino_nombre}`,
            { type: 'TRASPASO', traspasoId: id, screen: 'detalle_jugador' }
        );

        // Notificar al PRESIDENTE DESTINO (A)
        await notificationService.sendPushNotification(
            traspasoCompleto.usuario_presidente_destino_id,
            'Traspaso rechazado por club origen',
            `El club ${traspasoCompleto.club_origen_nombre} rechazó el traspaso de ${traspasoCompleto.jugador_nombre}`,
            { type: 'TRASPASO', traspasoId: id, screen: 'detalle_solicitante' }
        );
        res.status(200).json({ message: 'Traspaso rechazado por el club de origen' });
    } catch (error) {
        res.status(500).json({ message: 'Error al rechazar traspaso por el club de origen', error: error.message });
    }
};

exports.eliminarTraspaso = async (req, res) => {
    const { id } = req.params;
    try {
        await traspasoService.eliminarTraspaso(id);
        res.status(200).json({ message: 'Traspaso eliminado por el club de origen' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar traspaso por el club de origen', error: error.message });
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

  exports.testSendTraspasoEmail = async (req, res) => {
      try {
          // Datos estáticos para prueba
          const solicitud = {
              club_origen_nombre: "Club Original",
              nombre_presi_club_origen: "Juan",
              apellido_presi_club_origen: "Pérez",
              club_destino_nombre: "Club Destino",
              nombre_presi_club_dest: "María",
              apellido_presi_club_dest: "López",
              jugador_nombre: "Carlos",
              jugador_apellido: "Gómez",
              jugador_genero: "V", // 'V' para varón, 'D' para dama
              jugador_ci: "12345678",
              jugador_fecha_nacimiento: "2000-05-15",
              nombre_campeonato: "Campeonato Nacional 2024",
              estado_jugador: "APROBADO",
              estado_club: "APROBADO",
              estado_deuda: "PENDIENTE"
          };
  
          const destinatario = "raymondverletzer@gmail.com"; // Cambia por un correo válido para pruebas
  
          const result = await sendEmailService.sendTraspasoEmail(solicitud, destinatario);
          return res.status(result.success ? 200 : 500).json(result);
      } catch (error) {
          console.error("Error en el endpoint de prueba:", error);
          return res.status(500).json({ message: "Error en el servidor", error: error.message });
      }
  };

  exports.sendJugadorEmail = async (req, res) => {
    try {
        const solicitud = {
            jugador_nombre: "Carlos",
            jugador_apellido: "Gómez",
            club_destino_nombre: "Club Estrella",
            nombre_presi_club_dest: "María",
            apellido_presi_club_dest: "López",
            nombre_campeonato: "Campeonato Nacional 2024"
        };

        const destinatario = "raymondverletzer@gmail.com"; // Cambia por un correo válido para pruebas

        const result = await sendEmailService.sendJugadorEmail(solicitud, destinatario);
        return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
        console.error("Error en el endpoint de prueba:", error);
        return res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};

exports.testSendPresidenteEmail = async (req, res) => {
    try {
        const solicitud = {
            nombre_presi_club_origen: "Juan",
            apellido_presi_club_origen: "Pérez",
            club_origen_nombre: "Club Los Leones",
            jugador_nombre: "Carlos",
            jugador_apellido: "Gómez",
            jugador_ci: "12345678",
            jugador_fecha_nacimiento: "2000-05-15"
        };

        const destinatario = "raymondverletzer@gmail.com"; // Cambia por un correo válido para pruebas

        const result = await sendEmailService.sendPresidenteEmail(solicitud, destinatario);
        return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
        console.error("Error en el endpoint de prueba:", error);
        return res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};

exports.aprobarTraspasoJugador = async (req, res) => {
    const { id } = req.params;
    const { presidenteId } = req.body;
  
    try {
      await traspasoService.aprobarTraspasoDeJugadorPorPresidente(id, presidenteId);
      
      // Obtener datos completos del traspaso para las notificaciones
      const traspasoData = await traspasoService.getTraspasoById(id);
      const traspasoCompleto = Array.isArray(traspasoData) ? traspasoData[0] : traspasoData;

      // Obtener el presidente que aprobó para comparar correctamente
      const presidente = await PresidenteClub.findOne({
        where: { presidente_id: presidenteId },
        attributes: ['id']
      });

      // Determinar qué presidente aprobó y notificar al otro
      if (traspasoCompleto.presidente_club_id_origen === presidente.id) {
        // Presidente origen aprobó - notificar al presidente destino y jugador
        await notificationService.sendPushNotification(
          traspasoCompleto.usuario_presidente_destino_id,
          'Traspaso aprobado por club origen',
          `El club ${traspasoCompleto.club_origen_nombre} aprobó el traspaso de ${traspasoCompleto.jugador_nombre}`,
          { type: 'TRASPASO', traspasoId: id, screen: 'detalle_presidente' }
        );
        await notificationService.sendPushNotification(
          traspasoCompleto.usuario_jugador_id,
          'Actualización de traspaso',
          `Tu club actual aprobó tu traspaso a ${traspasoCompleto.club_destino_nombre}`,
          { type: 'TRASPASO', traspasoId: id, screen: 'detalle_jugador' }
        );
      } else if (traspasoCompleto.presidente_club_id_destino === presidente.id) {
        // Presidente destino aprobó - notificar al presidente origen y jugador
        await notificationService.sendPushNotification(
          traspasoCompleto.usuario_presidente_origen_id,
          'Traspaso aprobado por club destino',
          `El club ${traspasoCompleto.club_destino_nombre} aprobó recibir a ${traspasoCompleto.jugador_nombre}`,
          { type: 'TRASPASO', traspasoId: id, screen: 'detalle_presidente' }
        );
        await notificationService.sendPushNotification(
          traspasoCompleto.usuario_jugador_id,
          'Actualización de traspaso',
          `El club ${traspasoCompleto.club_destino_nombre} aprobó tu traspaso`,
          { type: 'TRASPASO', traspasoId: id, screen: 'detalle_jugador' }
        );
      }

      res.status(200).json({ message: 'Traspaso aprobado correctamente' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
};

// Similar para rechazarTraspasoJugador
exports.rechazarTraspasoJugador = async (req, res) => {
    const { id } = req.params;
    const { presidenteId } = req.body;
  
    try {
      await traspasoService.rechazarTraspasoDeJugadorPorPresidente(id, presidenteId);
      
      const traspasoData = await traspasoService.getTraspasoById(id);
      const traspasoCompleto = Array.isArray(traspasoData) ? traspasoData[0] : traspasoData;

      const presidente = await PresidenteClub.findOne({
        where: { presidente_id: presidenteId },
        attributes: ['id']
      });

      if (traspasoCompleto.presidente_club_id_origen === presidente.id) {
        await notificationService.sendPushNotification(
          traspasoCompleto.usuario_presidente_destino_id,
          'Traspaso rechazado por club origen',
          `El club ${traspasoCompleto.club_origen_nombre} rechazó el traspaso de ${traspasoCompleto.jugador_nombre}`,
          { type: 'TRASPASO', traspasoId: id, screen: 'detalle_presidente' }
        );
        await notificationService.sendPushNotification(
          traspasoCompleto.usuario_jugador_id,
          'Actualización de traspaso',
          `Tu club actual rechazó tu traspaso a ${traspasoCompleto.club_destino_nombre}`,
          { type: 'TRASPASO', traspasoId: id, screen: 'detalle_jugador' }
        );
      } else if (traspasoCompleto.presidente_club_id_destino === presidente.id) {
        await notificationService.sendPushNotification(
          traspasoCompleto.usuario_presidente_origen_id,
          'Traspaso rechazado por club destino',
          `El club ${traspasoCompleto.club_destino_nombre} rechazó recibir a ${traspasoCompleto.jugador_nombre}`,
          { type: 'TRASPASO', traspasoId: id, screen: 'detalle_presidente' }
        );
        await notificationService.sendPushNotification(
          traspasoCompleto.usuario_jugador_id,
          'Actualización de traspaso',
          `El club ${traspasoCompleto.club_destino_nombre} rechazó tu traspaso`,
          { type: 'TRASPASO', traspasoId: id, screen: 'detalle_jugador' }
        );
      }

      res.status(200).json({ message: 'Traspaso rechazado correctamente' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
};
  