const { Pago, PagoTraspaso, PagoInscripcion ,EquipoCampeonato} = require('../models'); // Asegúrate de importar los modelos
const sequelize = require('../config/sequelize');
const pagoTipos = require('../constants/pagoTipos')
const campeonatoEstado = require('../constants/campeonatoEquipoEstado');
const { where } = require('sequelize');
const pagoEstadosMapping = require('../constants/pagoEstados');
const { sendEmail } = require('../services/emailService');
const { loadEmailTemplate } = require('../utils/emailTemplate');

exports.obtenerEquiposPorCampeonatoById = async (id) => {
  try {
    const equipo = await sequelize.query(
      `SELECT 
          e.id AS equipo_id,
          e.nombre AS equipo_nombre,
          cat.nombre AS Categoria,
          cat.costo_inscripcion ,
          cat.genero,
          c.id AS campeonato_id,
          c.nombre AS campeonato_nombre,
          ec.estado AS estado_equipo,
          cl.nombre AS nombre_club,
          ic.club_imagen AS imagen_club,
          pc.presidente_id,
          p.nombre AS nombre_presidente,
          p.apellido AS apellido_presidente,
		      u.correo AS correo_presidente
          FROM EquipoCampeonato ec
          JOIN Equipo e ON ec.equipoId = e.id
          JOIN Campeonato c ON ec.campeonatoId = c.id
          JOIN Club cl ON cl.id = e.club_id
          JOIN PresidenteClub pc ON PC.club_id = CL.id
          JOIN Persona p ON p.id = pc.presidente_id
		      JOIN Usuario u ON u.id = p.id
          JOIN ImagenClub ic ON ic.club_id = cl.id
          JOIN Categoria cat ON cat.id = e.categoria_id
          WHERE c.estado != 3 AND e.id = :id`,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    return equipo;
  } catch (error) {
    console.error("Error al obtener equipos del campeonato:", error);
    throw error;
  }
};

exports.obtenerTraspasosPorCampeonatoById = async (id) => {
  try {
    const traspasos = await sequelize.query(
      `SELECT 
          t.id AS traspaso_id,
          clubOrigen.id AS club_origen_id,
          clubOrigen.nombre AS club_origen_nombre,
          clubDestino.id AS club_destino_id,
          clubDestino.nombre AS club_destino_nombre,
          j.id AS jugador_id,
          p.nombre AS jugador_nombre,
          p.apellido AS jugador_apellido,
          p.ci AS jugador_ci,
          p.genero AS jugador_genero,
          p.fecha_nacimiento AS jugador_fecha_nacimiento,
          ppcd.nombre AS nombre_presi_club_dest,
          ppcd.apellido AS apellido_presi_club_dest,
          ppco.nombre AS nombre_presi_club_origen,
          ppco.apellido AS apellido_presi_club_origen,
	        c.nombre AS nombre_campeonato,
          t.estado_deuda,
          cat.costo_traspaso,
          ico.club_imagen AS club_origen_imagen,
		      icd.club_imagen AS club_destino_imagen,
		      impj.persona_imagen
          FROM Traspaso t
          LEFT JOIN Club clubOrigen ON t.club_origen_id = clubOrigen.id
		      LEFT JOIN ImagenClub ico ON ico.club_id = clubOrigen.id
          LEFT JOIN Club clubDestino ON t.club_destino_id = clubDestino.id
		      LEFT JOIN ImagenClub icd ON icd.club_id = clubDestino.id
          LEFT JOIN Jugador j ON t.jugador_id = j.id
          LEFT JOIN JugadorEquipo je ON je.jugador_id = j.id AND je.activo = 1
          LEFT JOIN Equipo e ON  e.id = je .equipo_id
          LEFT JOIN Categoria cat ON cat.id = e.categoria_id
          LEFT JOIN Persona p ON j.jugador_id = p.id
          LEFT JOIN ImagenPersona impj ON impj.persona_id = p.id

          LEFT JOIN PresidenteClub pcd ON pcd.id = t.presidente_club_id_destino
          LEFT JOIN Persona ppcd ON ppcd.id = pcd.presidente_id

          LEFT JOIN PresidenteClub pco ON pco.id = t.presidente_club_id_origen
          LEFT JOIN Persona ppco ON ppco.id = pco.presidente_id
          LEFT JOIN Campeonato c ON c.id = t.campeonato_id

          WHERE t.estado_club = 'APROBADO' AND t.estado_jugador = 'APROBADO' AND t.estado_deuda = 'PENDIENTE' AND t.eliminado = 'N' AND c.estado != 3 AND t.id = :id` ,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    return traspasos;
  } catch (error) {
    console.error("Error al obtener traspasos del campeonato:", error);
    throw error;
  }
};

exports.createPago = async (data) => {
  const {
    monto,
    fecha,
    referencia,
    tipo_pago,
    traspaso_id,
    EquipoId,
    estado,
    userId,
    campeonatoId
  } = data;

  const transaction = await sequelize.transaction(); // Iniciar transacción

  try {
    const getEquipoCampeonato = await EquipoCampeonato.findOne({
      where: { equipoId: EquipoId, campeonatoId: campeonatoId }
    });

    const equipoInfo = await exports.obtenerEquiposPorCampeonatoById(EquipoId);
    if (!equipoInfo || equipoInfo.length === 0) {
      throw new Error("No se encontró información del equipo o del campeonato.");
    }

    const equipo = equipoInfo[0];
    const correoPresidente = equipo.correo_presidente;
    const nombrePresidente = `${equipo.nombre_presidente} ${equipo.apellido_presidente}`;

    const pago = await Pago.create({
      monto,
      fecha,
      referencia,
      estado,
      fecha_registro : sequelize.fn('GETDATE'),
      userId,
      tipo_pago,
      estado:pagoEstadosMapping.Activo
    }, { transaction });

    // Validar que solo se envíe uno de los dos valores: EquipoId o TraspasoId
    if (tipo_pago === pagoTipos.Traspaso) {
      if (!traspaso_id) {
        throw new Error('Se requiere un traspaso_id para este tipo de pago.');
      }
      await PagoTraspaso.create({
        id: pago.id, 
        traspaso_id
      }, { transaction });
    } else if (tipo_pago === pagoTipos.Inscripcion) {
      if (!EquipoId) {
        throw new Error('Se requiere un EquipoId para este tipo de pago.');
      }
      await PagoInscripcion.create({
        id: pago.id, 
        equipoCampeonatoId:getEquipoCampeonato.id
      }, { transaction });

      await EquipoCampeonato.update(
        {estado:campeonatoEstado.Inscrito},
        {
          where:{
            id: getEquipoCampeonato.id
          }
        }
      ,transaction);
    } else {
      throw new Error('Tipo de pago no válido.');
    }

    await transaction.commit(); 
    console.log('Pago creado exitosamente:', pago);

    try {
      const emailHtml = loadEmailTemplate('pagoInscripcion', {
        PRESIDENTE_NOMBRE: nombrePresidente,
        EQUIPO_NOMBRE: equipo.equipo_nombre,
        CAMPEONATO_NOMBRE: equipo.campeonato_nombre,
        MONTO: monto,
        FECHA: fecha,
        REFERENCIA: referencia
      });

      await sendEmail(
        correoPresidente,
        'Pago de Inscripción Confirmado',
        `Estimado ${nombrePresidente}, su pago de inscripción ha sido registrado.`,
        emailHtml
      );

      console.log("✅ Correo enviado correctamente a:", correoPresidente);
    } catch (emailError) {
      console.error("⚠️ Error al enviar el correo:", emailError);
      // Registrar el fallo en logs, pero no lanzar un error que afecte la operación
    }

    return pago;

  } catch (error) {
    await transaction.rollback(); 
    console.error('Error al crear el pago:', error);
    throw error;
  }
};

exports.obtenerEquiposPorCampeonato = async () => {
  try {
    const equipos = await sequelize.query(
      `SELECT 
          e.id AS equipo_id,
          e.nombre AS equipo_nombre,
          cat.nombre AS Categoria,
          cat.costo_inscripcion ,
          cat.genero,
          c.id AS campeonato_id,
          c.nombre AS campeonato_nombre,
          ec.estado AS estado_equipo,
          cl.nombre AS nombre_club,
          ic.club_imagen AS imagen_club
          FROM EquipoCampeonato ec
          JOIN Equipo e ON ec.equipoId = e.id
          JOIN Campeonato c ON ec.campeonatoId = c.id
          JOIN Club cl ON cl.id = e.club_id
          JOIN ImagenClub ic ON ic.club_id = cl.id
          JOIN Categoria cat ON cat.id = e.categoria_id
          WHERE c.estado != 3`,
      {
        type: sequelize.QueryTypes.SELECT
      }
    );

    return equipos;
  } catch (error) {
    console.error("Error al obtener equipos del campeonato:", error);
    throw error;
  }
};

exports.obtenerTraspasosPorCampeonato = async () => {
  try {
    const traspasos = await sequelize.query(
      `SELECT 
          t.id AS traspaso_id,
          clubOrigen.id AS club_origen_id,
          clubOrigen.nombre AS club_origen_nombre,
          clubDestino.id AS club_destino_id,
          clubDestino.nombre AS club_destino_nombre,
          j.id AS jugador_id,
          p.nombre AS jugador_nombre,
          p.apellido AS jugador_apellido,
          p.ci AS jugador_ci,
          p.genero AS jugador_genero,
          p.fecha_nacimiento AS jugador_fecha_nacimiento,
          ppcd.nombre AS nombre_presi_club_dest,
          ppcd.apellido AS apellido_presi_club_dest,
          ppco.nombre AS nombre_presi_club_origen,
          ppco.apellido AS apellido_presi_club_origen,
	        c.nombre AS nombre_campeonato,
          t.estado_deuda,
          cat.costo_traspaso,
          ico.club_imagen AS club_origen_imagen,
		      icd.club_imagen AS club_destino_imagen,
		      impj.persona_imagen
          FROM Traspaso t
          LEFT JOIN Club clubOrigen ON t.club_origen_id = clubOrigen.id
		      LEFT JOIN ImagenClub ico ON ico.club_id = clubOrigen.id
          LEFT JOIN Club clubDestino ON t.club_destino_id = clubDestino.id
		      LEFT JOIN ImagenClub icd ON icd.club_id = clubDestino.id
          LEFT JOIN Jugador j ON t.jugador_id = j.id
          LEFT JOIN JugadorEquipo je ON je.jugador_id = j.id AND je.activo = 1
          LEFT JOIN Equipo e ON  e.id = je .equipo_id
          LEFT JOIN Categoria cat ON cat.id = e.categoria_id
          LEFT JOIN Persona p ON j.jugador_id = p.id
          LEFT JOIN ImagenPersona impj ON impj.persona_id = p.id

          LEFT JOIN PresidenteClub pcd ON pcd.id = t.presidente_club_id_destino
          LEFT JOIN Persona ppcd ON ppcd.id = pcd.presidente_id

          LEFT JOIN PresidenteClub pco ON pco.id = t.presidente_club_id_origen
          LEFT JOIN Persona ppco ON ppco.id = pco.presidente_id
          LEFT JOIN Campeonato c ON c.id = t.campeonato_id

          WHERE t.estado_club = 'APROBADO' AND t.estado_jugador = 'APROBADO' AND t.estado_deuda = 'PENDIENTE' AND t.eliminado = 'N' AND c.estado != 3`,
      {
        type: sequelize.QueryTypes.SELECT
      }
    );

    return traspasos;
  } catch (error) {
    console.error("Error al obtener traspasos del campeonato:", error);
    throw error;
  }
};
