const { Traspaso, Club, Jugador, Sequelize, Persona, Campeonato ,PresidenteClub} = require('../models');
const sequelize = require('../config/sequelize');
const { Op, where } = require('sequelize');
const estadoTraspaso = require('../constants/estadoTraspasos')
const estadoCampeonatos= require('../constants/campeonatoEstados');
const tiposSolicitudes = require('../constants/tiposSolicitudes');

exports.getTraspasoById = async (id) => {
  try {
    const traspasosByJugador = await sequelize.query(
      `SELECT 
          t.id AS traspaso_id,
          clubOrigen.id AS club_origen_id,
          clubOrigen.nombre AS club_origen_nombre,
          clubDestino.id AS club_destino_id,
          clubDestino.nombre AS club_destino_nombre,
          j.id AS jugador_id,
          j.jugador_id AS usuario_jugador_id,
          p.nombre AS jugador_nombre,
          p.apellido AS jugador_apellido,
          p.ci AS jugador_ci,
          p.genero AS jugador_genero,
          CONVERT(VARCHAR(10), p.fecha_nacimiento, 120) AS jugador_fecha_nacimiento,
          ppcd.nombre AS nombre_presi_club_dest,
          ppcd.apellido AS apellido_presi_club_dest,
          ppco.nombre AS nombre_presi_club_origen,
          ppco.apellido AS apellido_presi_club_origen,
		      c.nombre AS nombre_campeonato,
		      t.estado_jugador,
          t.estado_club_origen,
          t.estado_club_receptor,
          t.tipo_solicitud,
          t.estado_deuda,
          t.presidente_club_id_origen,
          t.presidente_club_id_destino,
          pco.presidente_id AS usuario_presidente_origen_id, 
		      pcd.presidente_id AS usuario_presidente_destino_id,
          imp.persona_imagen AS imagen_jugador,
          ic.club_imagen AS imagen_club_origen,
          icd.club_imagen AS imagen_club_destino
          FROM Traspaso t
          LEFT JOIN Club clubOrigen ON t.club_origen_id = clubOrigen.id
          LEFT JOIN ImagenClub ic ON ic.club_id = clubOrigen.id
          LEFT JOIN Club clubDestino ON t.club_destino_id = clubDestino.id
          LEFT JOIN ImagenClub icd ON icd.club_id = clubDestino.id
          LEFT JOIN Jugador j ON t.jugador_id = j.id
          LEFT JOIN Persona p ON j.jugador_id = p.id
          LEFT JOIN ImagenPersona imp ON imp.persona_id = p.id
          LEFT JOIN PresidenteClub pcd ON pcd.id = t.presidente_club_id_destino
          LEFT JOIN Persona ppcd ON ppcd.id = pcd.presidente_id

          LEFT JOIN PresidenteClub pco ON pco.id = t.presidente_club_id_origen
          LEFT JOIN Persona ppco ON ppco.id = pco.presidente_id
          LEFT JOIN Campeonato c ON c.id = t.campeonato_id
          WHERE t.id =  :id;`,
      {
        replacements: {id},
        type: sequelize.QueryTypes.SELECT
      }
    );

    return traspasosByJugador;
  } catch (error) {
    console.error("Error al obtener la lista de traspasos:", error);
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

exports.getTraspasosPorJugador = async (jugador_id,CampeonatoId) => {
  try {
    const jugador = await Jugador.findOne({
      where: { jugador_id: jugador_id , activo :1  },
      attributes: ['id'], 
    });
    
    const jugadorId = jugador ? jugador.id : null; 
    const traspasosByJugador = await sequelize.query(
      `SELECT 
          t.id AS traspaso_id,
          t.jugador_id,
          clubOrigen.id AS club_origen_id,
          clubOrigen.nombre AS club_origen_nombre,
          clubDestino.id AS club_destino_id,
          clubDestino.nombre AS club_destino_nombre,
          t.fecha_solicitud,
          p.nombre,
          p.apellido,
		      t.estado_jugador,
          t.estado_club_origen
          FROM Traspaso t
          LEFT JOIN Club clubOrigen ON t.club_origen_id = clubOrigen.id
          LEFT JOIN Club clubDestino ON t.club_destino_id = clubDestino.id
          LEFT JOIN PresidenteClub pc ON pc.id = t.presidente_club_id_destino
          LEFT JOIN Persona p ON p.id = pc.presidente_id
          WHERE t.jugador_id = :jugador_id AND t.eliminado = 'N' AND t.campeonato_id =:CampeonatoId AND t.tipo_solicitud = 'Presidente';`,
      {
        replacements: {jugador_id,CampeonatoId},
        type: sequelize.QueryTypes.SELECT
      }
    );

    return traspasosByJugador;
  } catch (error) {
    console.error("Error al obtener la lista de traspasos:", error);
    throw error;
  }
};

exports.getTraspasosPorPresidente = async (presidente_id,CampeonatoId) => {
  try {
    const presidente = await PresidenteClub.findOne({
      where: { presidente_id: presidente_id , activo :1  , delegado : 'N' },
      attributes: ['id'], 
    });
    
    const presidenteId = presidente ? presidente.id : null; 
    const traspasosByPresidente = await sequelize.query(
      `SELECT 
          t.id AS traspaso_id,
          t.jugador_id,
          clubOrigen.id AS club_origen_id,
          clubOrigen.nombre AS club_origen_nombre,
          clubDestino.id AS club_destino_id,
          clubDestino.nombre AS club_destino_nombre,
          t.fecha_solicitud,
          p.nombre,
          p.apellido,
          p.genero,
          t.estado_club_origen,
          t.estado_club_receptor,
          t.tipo_solicitud,
          pj.nombre AS nombre_jugador,
          pj.apellido AS apellido_jugador,
          pj.genero AS genero_persona,
          impj.persona_imagen AS imagen_jugador,
          ic.club_imagen,
          ippc.persona_imagen AS imagen_presidente
          FROM Traspaso t
          LEFT JOIN Club clubOrigen ON t.club_origen_id = clubOrigen.id
          LEFT JOIN Club clubDestino ON t.club_destino_id = clubDestino.id
		      LEFT JOIN ImagenClub ic ON ic.club_id = clubDestino.id
          LEFT JOIN PresidenteClub pc ON pc.id = t.presidente_club_id_destino  
          LEFT JOIN Persona p ON p.id = pc.presidente_id
		      LEFT JOIN ImagenPersona ippc ON ippc.persona_id = p.id

          LEFT JOIN Jugador j ON j.id = t.jugador_id
          LEFT JOIN Persona pj ON pj.id = j.jugador_id
          LEFT JOIN ImagenPersona impj ON impj.persona_id = pj.id
          WHERE t.presidente_club_id_origen =:presidenteId AND t.eliminado = 'N' AND t.campeonato_id = :CampeonatoId;`,
      {
        replacements: {presidenteId,CampeonatoId},
        type: sequelize.QueryTypes.SELECT
      }
    );

    return traspasosByPresidente;
  } catch (error) {
    console.error("Error al obtener la lista de traspasos:", error);
    throw error;
  }
};

// Nueva función
exports.getTraspasosRelacionadosConPresidente = async (presidente_id, CampeonatoId) => {
  try {
    const presidente = await PresidenteClub.findOne({
      where: { presidente_id, activo: 1, delegado: 'N' },
      attributes: ['id'],
    });

    const presidenteId = presidente?.id;
    if (!presidenteId) throw new Error('Presidente no encontrado o inactivo.');

    const traspasos = await sequelize.query(
      `SELECT 
          t.id AS traspaso_id,
          t.jugador_id,
          clubOrigen.id AS club_origen_id,
          clubOrigen.nombre AS club_origen_nombre,
          clubDestino.id AS club_destino_id,
          clubDestino.nombre AS club_destino_nombre,
          t.fecha_solicitud,
          p.nombre,
          p.apellido,
          p.genero,
          t.estado_club_origen,
          t.estado_club_receptor,
          t.tipo_solicitud,
          pj.nombre AS nombre_jugador,
          pj.apellido AS apellido_jugador,
          pj.genero AS genero_persona,
          impj.persona_imagen AS imagen_jugador,
          ic.club_imagen,
          ippc.persona_imagen AS imagen_presidente
          FROM Traspaso t
          LEFT JOIN Club clubOrigen ON t.club_origen_id = clubOrigen.id
          LEFT JOIN Club clubDestino ON t.club_destino_id = clubDestino.id
		      LEFT JOIN ImagenClub ic ON ic.club_id = clubDestino.id
          LEFT JOIN PresidenteClub pc ON pc.id = t.presidente_club_id_destino  
          LEFT JOIN Persona p ON p.id = pc.presidente_id
		      LEFT JOIN ImagenPersona ippc ON ippc.persona_id = p.id

          LEFT JOIN Jugador j ON j.id = t.jugador_id
          LEFT JOIN Persona pj ON pj.id = j.jugador_id
          LEFT JOIN ImagenPersona impj ON impj.persona_id = pj.id
        WHERE 
          (t.presidente_club_id_origen = :presidenteId OR t.presidente_club_id_destino = :presidenteId)
          AND t.eliminado = 'N'
          AND t.estado_jugador != 'RECHAZADO'
          AND t.campeonato_id = :CampeonatoId;`,
      {
        replacements: { presidenteId, CampeonatoId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return traspasos;
  } catch (error) {
    console.error("Error al obtener traspasos relacionados con el presidente:", error);
    throw error;
  }
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
      // Buscar un campeonato que no esté finalizado
      const campeonato = await Campeonato.findOne({
          where: {
              estado: {
                  [Op.ne]: estadoCampeonatos.campeonatoFinalizado
              }
          },
          attributes: ['id']
      });

      const presidenteIdOrigen = await PresidenteClub.findOne({
          where :{
            club_id : traspasoData.club_origen_id ,
            delegado : 'N',
            activo : 1
          },
          attributes: ['id']
      });

      if (!presidenteIdOrigen) {
        throw new Error("El club nno cuenta actualmente con un presidente asignado,podra solicitar el traspaso una vez el club cuente con un presidente");
      } 

      // Verificar si se encontró un campeonato válido
      if (!campeonato) {
          throw new Error("No hay campeonatos disponibles para realizar el traspaso.");
      }

      // Crear el traspaso
      return await Traspaso.create({
          ...traspasoData,
          fecha_solicitud: sequelize.fn('GETDATE'), 
          estado_jugador: estadoTraspaso.PENDIENTE,
          estado_club_origen: estadoTraspaso.PENDIENTE,
          estado_club_receptor: estadoTraspaso.APROBADO,
          campeonato_id: campeonato.id,
          eliminado: 'N',
          presidente_club_id_origen :presidenteIdOrigen.id,
          fecha_creacion: sequelize.fn('GETDATE'),
          tipo_solicitud: tiposSolicitudes.Presidente
      });

  } catch (error) {
      console.error("Error en createTraspaso:", error);
      throw error;
  }
};

exports.createTraspasoJugador = async (traspasoData) => {
  try {
      // Buscar un campeonato que no esté finalizado
      const campeonato = await Campeonato.findOne({
          where: {
              estado: {
                  [Op.ne]: estadoCampeonatos.campeonatoFinalizado
              }
          },
          attributes: ['id']
      });

      const presidenteIdOrigen = await PresidenteClub.findOne({
          where :{
            club_id : traspasoData.club_origen_id ,
            delegado : 'N',
            activo : 1
          },
          attributes: ['id']
      });

      if (!presidenteIdOrigen) {
        throw new Error("El club nno cuenta actualmente con un presidente asignado,podra solicitar el traspaso una vez el club cuente con un presidente");
      } 

      // Verificar si se encontró un campeonato válido
      if (!campeonato) {
          throw new Error("No hay campeonatos disponibles para realizar el traspaso.");
      }

      // Crear el traspaso
      return await Traspaso.create({
          ...traspasoData,
          fecha_solicitud: sequelize.fn('GETDATE'), 
          estado_jugador: estadoTraspaso.APROBADO,
          estado_club_origen: estadoTraspaso.PENDIENTE,
          estado_club_receptor: estadoTraspaso.PENDIENTE,
          campeonato_id: campeonato.id,
          eliminado: 'N',
          presidente_club_id_origen :presidenteIdOrigen.id,
          fecha_creacion: sequelize.fn('GETDATE'),
          tipo_solicitud: tiposSolicitudes.Jugador
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
          estado_jugador: estadoTraspaso.APROBADO,
          fecha_actualizacion: sequelize.fn('GETDATE')
      },
      { where: { id} }
  );
};

// Aprobar traspaso por el presidente del club de origen
exports.aprobarTraspasoPorClub = async (id) => {
  try {
    await Traspaso.update(
      {
        estado_club_origen: estadoTraspaso.APROBADO,
        fecha_actualizacion: sequelize.fn('GETDATE')
      },
      { where: { id } }
    );

    return true; 
  } catch (error) {
    console.error("Error en aprobarTraspasoPorClub:", error);
    throw error;
  }
};

// Rechazar traspaso por el jugador
exports.rechazarTraspasoPorJugador = async (id) => {
  return await Traspaso.update(
      {
          estado_jugador: estadoTraspaso.RECHAZADO,
          fecha_actualizacion: sequelize.fn('GETDATE')
      },
      { where: { id}}
  );
};

// Rechazar traspaso por el presidente del club de origen
exports.rechazarTraspasoPorClub = async (id) => {
  return await Traspaso.update(
      {
        estado_club_origen: estadoTraspaso.RECHAZADO,
          fecha_actualizacion: sequelize.fn('GETDATE')
      },
      { where: { id} }
  );
};

exports.eliminarTraspaso= async (id) => {
  return await Traspaso.update(
      {
          eliminado: 'S',
          fecha_actualizacion: sequelize.fn('GETDATE')
      },
      { where: { id } } 
  );
};


const obtenerListaTraspasos = async () => {
  try {
    const traspasos = await sequelize.query(
      `SELECT 
          t.id AS traspaso_id,
          t.jugador_id,
          e_origen.nombre AS club_origen,
          e_destino.nombre AS club_destino,
          t.costo_traspaso,
          t.fecha_solicitud,
          t.estado_solicitud,
          t.aprobado_por_jugador,
          t.aprobado_por_club
          FROM Traspaso t
          JOIN Equipo e_origen ON t.club_origen_id = e_origen.id
          JOIN Equipo e_destino ON t.club_destino_id = e_destino.id
          ORDER BY t.fecha_solicitud DESC;`,
      {
        type: QueryTypes.SELECT
      }
    );

    return traspasos;
  } catch (error) {
    console.error("Error al obtener la lista de traspasos:", error);
    throw error;
  }
};

// services/traspasoService.js

exports.aprobarTraspasoDeJugadorPorPresidente = async (id, presidenteId) => {
  try {
    const presidente = await PresidenteClub.findOne({
      where: { presidente_id: presidenteId },
      attributes: ['id']
    });
    console.log('seewf', presidente.id);
    const traspaso = await Traspaso.findOne({ where: { id } });

    if (!traspaso) {
      throw new Error('Traspaso no encontrado');
    }

    if (
      traspaso.presidente_club_id_origen === presidente.id
    ) {
      await Traspaso.update(
        {
          estado_club_origen: estadoTraspaso.APROBADO,
          fecha_actualizacion: sequelize.fn('GETDATE')
        },
        { where: { id } }
      );
    } else if (
      traspaso.presidente_club_id_destino === presidente.id
    ) {
      await Traspaso.update(
        {
          estado_club_receptor: estadoTraspaso.APROBADO,
          fecha_actualizacion: sequelize.fn('GETDATE')
        },
        { where: { id } }
      );
    } else {
      throw new Error('El presidente no está asociado al traspaso');
    }

    return true;

  } catch (error) {
    console.error("Error en aprobarTraspasoPorPresidente:", error);
    throw error;
  }
};

exports.rechazarTraspasoDeJugadorPorPresidente = async (id, presidenteId) => {
  try {

    const presidente = await PresidenteClub.findOne({
      where: { presidente_id: presidenteId },
      attributes: ['id']
    });
   
    const traspaso = await Traspaso.findOne({ where: { id } });

    if (!traspaso) {
      throw new Error('Traspaso no encontrado');
    }

    if (
      traspaso.presidente_club_id_origen === presidente.id
    ) {
      await Traspaso.update(
        {
          estado_club_origen: estadoTraspaso.RECHAZADO,
          fecha_actualizacion: sequelize.fn('GETDATE')
        },
        { where: { id } }
      );
    } else if (
      traspaso.presidente_club_id_destino === presidente.id
    ) {
      await Traspaso.update(
        {
          estado_club_receptor: estadoTraspaso.RECHAZADO,
          fecha_actualizacion: sequelize.fn('GETDATE')
        },
        { where: { id } }
      );
    } else {
      throw new Error('El presidente no está asociado al traspaso');
    }

    return true;

  } catch (error) {
    console.error("Error en aprobarTraspasoPorPresidente:", error);
    throw error;
  }
};
