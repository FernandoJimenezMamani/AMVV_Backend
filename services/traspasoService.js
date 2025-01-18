const { Traspaso, Club, Jugador, Sequelize, Persona } = require('../models');
const sequelize = require('../config/sequelize');
const { Op } = require('sequelize');

exports.getTraspasoById = async (id) => {
  try {
    const traspaso = await Traspaso.findOne({
      where: { id },
      include: [
        { model: Club, as: 'clubOrigen', attributes: ['id', 'nombre'] },
        { model: Club, as: 'clubDestino', attributes: ['id', 'nombre'] },
        {
          model: Jugador,
          as: 'jugador',
          include: [
            {
              model: Persona,
              as: 'persona', // Alias para Persona
              attributes: ['nombre', 'apellido', 'ci', 'fecha_nacimiento']
            }
          ]
        }
      ]
    });
    return traspaso;
  } catch (error) {
    console.error("Error en getTraspasoById:", error);
    throw error;
  }
};

exports.getTraspasosAprobados = async () => {
  return await Traspaso.findAll({
    where: { estado_solicitud: 'APROBADO' },
    include: [
      { model: Club, as: 'clubOrigen', attributes: ['id', 'nombre'] },
      { model: Club, as: 'clubDestino', attributes: ['id', 'nombre'] },
      {
        model: Jugador,
        as: 'jugador',
        include: [
          {
            model: Persona,
            as: 'persona', // Alias para Persona
            attributes: ['nombre', 'apellido']
          }
        ]
      }
    ]
  });
};

exports.getTraspasosPorJugador = async (jugador_id) => {
  const traspasos = await Traspaso.findAll({
    where: { jugador_id },
    include: [
      { model: Club, as: 'clubOrigen', attributes: ['id', 'nombre'] },
      { model: Club, as: 'clubDestino', attributes: ['id', 'nombre'] }
    ]
  });
  console.log('Traspasos obtenidos:', traspasos); // Verificar los datos obtenidos
  return traspasos;
};

exports.getTraspasosEnviadosPorClub = async (club_id) => {
  return await Traspaso.findAll({
    where: { club_destino_id: club_id },
    include: [
      { model: Club, as: 'clubOrigen', attributes: ['id', 'nombre'] },
      { model: Club, as: 'clubDestino', attributes: ['id', 'nombre'] },
      {
        model: Jugador,
        as: 'jugador',
        include: [
          {
            model: Persona,
            as: 'persona', // Alias para Persona
            attributes: ['nombre', 'apellido']
          }
        ]
      }
    ]
  });
};

exports.getTraspasosRecibidosPorClub = async (club_id) => {
  return await Traspaso.findAll({
    where: { 
      club_origen_id: club_id,
      aprobado_por_jugador: 'S'  // Condición para mostrar solo los traspasos aprobados por el jugador
    },
    include: [
      { model: Club, as: 'clubOrigen', attributes: ['id', 'nombre'] },
      { model: Club, as: 'clubDestino', attributes: ['id', 'nombre'] },
      {
        model: Jugador,
        as: 'jugador',
        include: [
          {
            model: Persona,
            as: 'persona', // Alias para Persona
            attributes: ['nombre', 'apellido']
          }
        ]
      }
    ]
  });
};

  
// Crear un nuevo traspaso
exports.createTraspaso = async (traspasoData) => {
  try {
      return await Traspaso.create({
          ...traspasoData,
          fecha_solicitud: new Date(),
          estado_solicitud: 'PENDIENTE'
      });
  } catch (error) {
      console.error("Error en createTraspaso:", error);
      throw error;
  }
};

// Aprobar traspaso por el jugador
exports.aprobarTraspasoPorJugador = async (id) => {
  return await Traspaso.update(
      {
          aprobado_por_jugador: 'S',
          estado_solicitud: 'ACEPTADO_POR_JUGADOR' // Nuevo estado intermedio
      },
      { where: { id, estado_solicitud: 'PENDIENTE' } }
  );
};

// Aprobar traspaso por el presidente del club de origen
exports.aprobarTraspasoPorClub = async (id) => {
  try {
    const traspaso = await Traspaso.findOne({ where: { id, estado_solicitud: 'ACEPTADO_POR_JUGADOR' } });

    if (!traspaso) {
      throw new Error('Traspaso no encontrado o no está en estado válido para aprobación.');
    }

    await Traspaso.update(
      {
        aprobado_por_club: 'S',
        estado_solicitud: 'APROBADO', // Estado final
        fecha_actualizacion: new Date()
      },
      { where: { id } }
    );

    // Cambiar el club del jugador
    await Jugador.update(
      { club_id: traspaso.club_destino_id }, // Actualizar club al de destino
      { where: { id: traspaso.jugador_id } }
    );

    return true; // Indicar éxito
  } catch (error) {
    console.error("Error en aprobarTraspasoPorClub:", error);
    throw error;
  }
};

// Rechazar traspaso por el jugador
exports.rechazarTraspasoPorJugador = async (id) => {
  return await Traspaso.update(
      {
          estado_solicitud: 'RECHAZADO',
          fecha_actualizacion: new Date()
      },
      { where: { id, estado_solicitud: 'PENDIENTE' } }
  );
};

// Rechazar traspaso por el presidente del club de origen
exports.rechazarTraspasoPorClub = async (id) => {
  return await Traspaso.update(
      {
          estado_solicitud: 'RECHAZADO',
          fecha_actualizacion: new Date()
      },
      { where: { id, estado_solicitud: 'ACEPTADO_POR_JUGADOR' } } // Solo permite rechazo si ya fue aceptado por el jugador
  );
};