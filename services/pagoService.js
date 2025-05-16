const { Pago,Campeonato,Equipo, PagoTraspaso, PagoInscripcion ,EquipoCampeonato,JugadorEquipo , Jugador ,Usuario, Traspaso,Club} = require('../models'); // Asegúrate de importar los modelos
const sequelize = require('../config/sequelize'); 
const pagoTipos = require('../constants/pagoTipos')
const campeonatoEstado = require('../constants/campeonatoEquipoEstado');
const pagoEstadosMapping = require('../constants/pagoEstados');
const traspasoEstados = require('../constants/estadoTraspasos')
const { sendEmail } = require('../services/emailService');
const { loadEmailTemplate } = require('../utils/emailTemplate');
const { sendTraspasoEmail, sendJugadorEmail, sendPresidenteEmail } = require('../services/sendEmailTraspaso');
const {broadcastRegistroPagoInscripcion} = require('../utils/websocket');

exports.obtenerEquiposPorCampeonatoById = async (id) => {
  try {
    const equipo = await sequelize.query(
      `SELECT 
        e.id AS equipo_id,
        e.nombre AS equipo_nombre,
        cat.nombre AS Categoria,
        cat.costo_inscripcion,
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
      FROM 
        EquipoCampeonato ec
      JOIN Equipo e ON ec.equipoId = e.id
      JOIN Campeonato c ON ec.campeonatoId = c.id
      JOIN Club cl ON cl.id = e.club_id
      JOIN PresidenteClub pc ON pc.club_id = cl.id
      JOIN Persona p ON p.id = pc.presidente_id
      JOIN Usuario u ON u.id = p.id
      LEFT JOIN ImagenClub ic ON ic.club_id = cl.id
      JOIN Categoria cat ON cat.id = ec.categoria_id
      WHERE 
        c.estado != 3 
        AND e.id = :id;
      `,
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

const getMontoTraspasoPorTraspasoId = async (traspasoId) => {
  try {
    const query = `
      WITH CampeonatosOrdenados AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY fecha_registro DESC) AS orden
        FROM Campeonato
      ),
      CampeonatoAnterior AS (
        SELECT id AS campeonatoAnteriorId FROM CampeonatosOrdenados WHERE orden = 2
      )
      SELECT cat.costo_traspaso
      FROM Traspaso t
      INNER JOIN Jugador j ON j.id = t.jugador_id
      INNER JOIN JugadorEquipo je ON je.jugador_id = j.id
      INNER JOIN EquipoCampeonato ec ON ec.equipoId = je.equipo_id
      INNER JOIN Categoria cat ON cat.id = ec.categoria_id
      INNER JOIN CampeonatoAnterior ca ON ec.campeonatoId = ca.campeonatoAnteriorId
      WHERE t.id = :traspasoId
    `;

    const result = await sequelize.query(query, {
      replacements: { traspasoId },
      type: sequelize.QueryTypes.SELECT
    });

    // Si no hay resultados, retornar monto por defecto
    return result.length > 0 ? result[0].costo_traspaso : 100;
  } catch (error) {
    console.error("Error al obtener el monto de traspaso:", error);
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
          j.jugador_id AS jugador_persona_id,
          p.nombre AS jugador_nombre,
          p.apellido AS jugador_apellido,
          p.ci AS jugador_ci,
          p.genero AS jugador_genero,
          p.fecha_nacimiento AS jugador_fecha_nacimiento,
          ppcd.id AS id_persona_presi_det,
          ppcd.nombre AS nombre_presi_club_dest,
          ppcd.apellido AS apellido_presi_club_dest,
          ppco.id AS id_persona_presi_origen,
          ppco.nombre AS nombre_presi_club_origen,
          ppco.apellido AS apellido_presi_club_origen,
          c.id AS campeonato_id,
          c.nombre AS nombre_campeonato,
          t.estado_deuda,
          ico.club_imagen AS club_origen_imagen,
          icd.club_imagen AS club_destino_imagen,
          impj.persona_imagen
      FROM Traspaso t
      LEFT JOIN Club clubOrigen ON t.club_origen_id = clubOrigen.id
      LEFT JOIN ImagenClub ico ON ico.club_id = clubOrigen.id
      LEFT JOIN Club clubDestino ON t.club_destino_id = clubDestino.id
      LEFT JOIN ImagenClub icd ON icd.club_id = clubDestino.id
      LEFT JOIN Jugador j ON t.jugador_id = j.id
      LEFT JOIN JugadorEquipo je ON je.jugador_id = j.id
      LEFT JOIN Equipo e ON e.id = je.equipo_id
      LEFT JOIN EquipoCampeonato ec ON ec.equipoId = e.id AND ec.campeonatoId = t.campeonato_id
      LEFT JOIN Categoria cat ON cat.id = ec.categoria_id
      LEFT JOIN Persona p ON j.jugador_id = p.id
      LEFT JOIN ImagenPersona impj ON impj.persona_id = p.id
      LEFT JOIN PresidenteClub pcd ON pcd.id = t.presidente_club_id_destino
      LEFT JOIN Persona ppcd ON ppcd.id = pcd.presidente_id
      LEFT JOIN PresidenteClub pco ON pco.id = t.presidente_club_id_origen
      LEFT JOIN Persona ppco ON ppco.id = pco.presidente_id
      LEFT JOIN Campeonato c ON c.id = t.campeonato_id
      WHERE 
          t.estado_club_origen = 'APROBADO'
          AND t.estado_jugador = 'APROBADO'
          AND t.estado_deuda = 'PENDIENTE'
          AND t.eliminado = 'N'
          AND c.estado = 1
          AND t.id = :id;
      ` ,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (traspasos.length > 0) {
      const montoReal = await getMontoTraspasoPorTraspasoId(id);
      console.log(montoReal, 'monto real traspaso');
      traspasos[0].costo_traspaso = montoReal;
    }

    return traspasos;
  } catch (error) {
    console.error("Error al obtener traspasos del campeonato:", error);
    throw error;
  }
};

exports.createPagoInscripcion = async (data) => {
  const {
    monto,
    fecha,
    referencia,
    EquipoId,
    estado,
    userId,
    campeonatoId
  } = data;

  console.log(data, 'Datos de inscripción');

  const transaction = await sequelize.transaction(); // Iniciar transacción

  try {
    const getEquipoCampeonato = await EquipoCampeonato.findOne({
      where: { equipoId: EquipoId, campeonatoId: campeonatoId }
    });

    if (!getEquipoCampeonato) {
      throw new Error("No se encontró información del equipo o del campeonato.");
    }

    const equipoInfo = await exports.obtenerEquiposPorCampeonatoById(EquipoId);
    if (!equipoInfo || equipoInfo.length === 0) {
      throw new Error("No se encontró información del equipo.");
    }

    const equipo = equipoInfo[0];
    const correoPresidente = equipo.correo_presidente;
    const nombrePresidente = `${equipo.nombre_presidente} ${equipo.apellido_presidente}`;

    const pago = await Pago.create({
      monto,
      fecha,
      referencia,
      estado,
      fecha_registro: sequelize.fn('GETDATE'),
      userId,
      tipo_pago: pagoTipos.Inscripcion,
      estado: pagoEstadosMapping.Activo
    }, { transaction });

    await PagoInscripcion.create({
      id: pago.id,
      equipoCampeonatoId: getEquipoCampeonato.id
    }, { transaction });

    await EquipoCampeonato.update(
      { estado: campeonatoEstado.Inscrito },
      { where: { id: getEquipoCampeonato.id } },
      transaction
    );

    await transaction.commit();
    console.log('Pago de inscripción creado exitosamente:', pago);
    broadcastRegistroPagoInscripcion(); 
    // Enviar correo de confirmación de inscripción
    setImmediate(() => {
      try {
        const emailHtml = loadEmailTemplate('pagoInscripcion', {
          PRESIDENTE_NOMBRE: nombrePresidente,
          EQUIPO_NOMBRE: equipo.equipo_nombre,
          CAMPEONATO_NOMBRE: equipo.campeonato_nombre,
          MONTO: monto,
          FECHA: fecha,
          REFERENCIA: referencia
        });

        sendEmail(
          correoPresidente,
          'Pago de Inscripción Confirmado',
          `Estimado ${nombrePresidente}, su pago de inscripción ha sido registrado.`,
          emailHtml
        ).then(() => {
          console.log("✅ Correo enviado correctamente a:", correoPresidente);
        }).catch((emailError) => {
          console.error("⚠️ Error al enviar el correo:", emailError);
        });

      } catch (templateError) {
        console.error("⚠️ Error al cargar la plantilla:", templateError);
      }
    });
    
    return pago;
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear el pago de inscripción:', error);
    throw error;
  }
};


exports.createPagoTraspaso = async (data) => {
  const {
    monto,
    fecha,
    referencia,
    traspaso_id,
    estado,
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
    id_persona_presi_det,
    nombre_presi_club_origen,
    apellido_presi_club_origen,
    id_persona_presi_origen,
    nombre_presi_club_dest,
    apellido_presi_club_dest
  } = data;

  console.log(data, 'Datos de traspaso');

  if (!traspaso_id) {
    throw new Error('Se requiere un traspaso_id para este tipo de pago.');
  }

  const transaction = await sequelize.transaction(); // Iniciar transacción

  try {
    // Registrar el pago
    const pago = await Pago.create({
      monto,
      fecha,
      referencia,
      estado,
      fecha_registro: sequelize.fn('GETDATE'),
      userId,
      tipo_pago: pagoTipos.Traspaso,
      estado: pagoEstadosMapping.Activo
    }, { transaction });

    // Desactivar al jugador en su equipo anterior
    await JugadorEquipo.update(
      { activo: 0 },
      { where: { jugador_id: jugador_traspaso_id } },
      { transaction }
    );

    // Desactivar al jugador globalmente
    await Jugador.update(
      { activo: 0 },
      { where: { jugador_id: jugador_traspaso_id } },
      { transaction }
    );

    // Actualizar estado del traspaso
    await Traspaso.update(
      { estado_deuda: traspasoEstados.FINALIZADO },
      {
        where: {
          estado_jugador: traspasoEstados.APROBADO,
          estado_club_origen: traspasoEstados.APROBADO,
          jugador_id: jugador_id
        }
      },
      { transaction }
    );

    // Registrar el pago de traspaso
    await PagoTraspaso.create({
      id: pago.id,
      traspaso_id : traspaso_id
    }, { transaction });

    // Obtener correos de los involucrados
    const correoJugador = await Usuario.findOne({ where: { id: jugador_traspaso_id } }, { transaction });
    const correoPresidenteOrigen = await Usuario.findOne({ where: { id: id_persona_presi_origen } }, { transaction });
    const correoPresidenteDestino = await Usuario.findOne({ where: { id: id_persona_presi_det } }, { transaction });

    // Validar que todos los correos fueron encontrados
    if (!correoJugador || !correoPresidenteOrigen || !correoPresidenteDestino) {
      throw new Error("No se pudieron recuperar todos los correos electrónicos necesarios.");
    }

    // Verificar si el jugador ya está en el club destino
    const obtenerClub = await Jugador.findOne({
      where: { jugador_id: jugador_traspaso_id, club_id: club_destino_id }
    });

    if (obtenerClub) {
      await Jugador.update(
        { activo: 1 },
        { where: { jugador_id: jugador_traspaso_id, club_id: club_destino_id } },
        { transaction }
      );
    } else {
      await Jugador.create({
        jugador_id: jugador_traspaso_id,
        club_id: club_destino_id,
        activo: 1
      }, { transaction });
    }

    // Enviar correos dentro de la transacción
    setImmediate(() => {
      sendTraspasoEmail({
        club_origen_nombre,
        nombre_presi_club_origen,
        apellido_presi_club_origen,
        club_destino_nombre,
        nombre_presi_club_dest,
        apellido_presi_club_dest,
        jugador_nombre,
        jugador_apellido,
        jugador_ci,
        jugador_fecha_nacimiento,
        nombre_campeonato
      }, correoPresidenteDestino.correo).catch(err =>
        console.error('❌ Error enviando correo al presidente destino:', err.message)
      );

      sendJugadorEmail({
        jugador_nombre,
        jugador_apellido,
        club_destino_nombre,
        nombre_presi_club_dest,
        apellido_presi_club_dest,
        nombre_campeonato,
        fecha_aprobacion: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      }, correoJugador.correo).catch(err =>
        console.error('❌ Error enviando correo al jugador:', err.message)
      );

      sendPresidenteEmail({
        nombre_presi_club_origen,
        apellido_presi_club_origen,
        club_origen_nombre,
        jugador_nombre,
        jugador_apellido,
        jugador_ci,
        jugador_fecha_nacimiento,
        fecha_aprobacion: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      }, correoPresidenteOrigen.correo).catch(err =>
        console.error('❌ Error enviando correo al presidente origen:', err.message)
      );
    });

    // Confirmar la transacción si todo salió bien
    await transaction.commit();
    console.log('✅ Pago de traspaso registrado correctamente y correos enviados.');
    return pago;

  } catch (error) {
    // Revertir la transacción en caso de error
    await transaction.rollback();
    console.error('❌ Error en el pago de traspaso:', error);
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
    campeonatoId,
    jugador_id,
    jugador_traspaso_id,
    club_destino_id
  } = data;
  console.log(data, 'datos chidos' );
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

    if (tipo_pago === pagoTipos.Traspaso) {
      if (!traspaso_id) {
        throw new Error('Se requiere un traspaso_id para este tipo de pago.');
      }
    
      await JugadorEquipo.update(
        { activo: 0 },
        { where: { jugador_id: jugador_traspaso_id } }
      );
    
      await Jugador.update(
        { activo: 0 },
        { where: { jugador_id: jugador_traspaso_id } }
      );

      await Traspaso.update({
        estado_deuda : traspasoEstados.FINALIZADO},
        {where:{estado_jugador : traspasoEstados.APROBADO , estado_club_origen : traspasoEstados.APROBADO , jugador_id : jugador_id }}
      );
    
      await PagoTraspaso.create(
        {
          id: pago.id,
          traspaso_id
        },
        { transaction }
      );
    
      const obtenerClub = await Jugador.findOne({
        where: { jugador_id: jugador_traspaso_id, club_id: club_destino_id }
      });
    
      if (obtenerClub) {
        await Jugador.update(
          { activo: 1 },
          { where: { jugador_id: jugador_traspaso_id, club_id: club_destino_id } }
        );
      } else {
        await Jugador.create({
          jugador_id: jugador_traspaso_id,
          club_id: club_destino_id,
          activo: 1
        });
      }
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
      `SELECT DISTINCT
        e.id AS equipo_id,
        e.nombre AS equipo_nombre,
        cat.nombre AS Categoria,
        cat.costo_inscripcion,
        cat.genero,
        c.id AS campeonato_id,
        c.nombre AS campeonato_nombre,
        ec.estado AS estado_equipo,
        cl.nombre AS nombre_club,
        ic.club_imagen AS imagen_club
      FROM 
        EquipoCampeonato ec
      JOIN Equipo e ON ec.equipoId = e.id
      JOIN Campeonato c ON ec.campeonatoId = c.id
      JOIN Club cl ON cl.id = e.club_id AND CL.presidente_asignado = 'S'
      LEFT JOIN ImagenClub ic ON ic.club_id = cl.id
      JOIN Categoria cat ON cat.id = ec.categoria_id
      JOIN PresidenteClub pc ON pc.club_id = cl.id 
      WHERE 
        c.estado != 3 
        AND ec.estado = 'Deuda'
      `,
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
      LEFT JOIN JugadorEquipo je ON je.jugador_id = j.id 
      LEFT JOIN Equipo e ON e.id = je.equipo_id
      LEFT JOIN EquipoCampeonato ec ON ec.equipoId = e.id AND ec.campeonatoId = t.campeonato_id
      LEFT JOIN Categoria cat ON cat.id = ec.categoria_id
      LEFT JOIN Persona p ON j.jugador_id = p.id
      LEFT JOIN ImagenPersona impj ON impj.persona_id = p.id
      LEFT JOIN PresidenteClub pcd ON pcd.id = t.presidente_club_id_destino
      LEFT JOIN Persona ppcd ON ppcd.id = pcd.presidente_id
      LEFT JOIN PresidenteClub pco ON pco.id = t.presidente_club_id_origen
      LEFT JOIN Persona ppco ON ppco.id = pco.presidente_id
      LEFT JOIN Campeonato c ON c.id = t.campeonato_id
      WHERE 
          t.estado_club_origen = 'APROBADO'
          AND t.estado_jugador = 'APROBADO'
          AND t.estado_club_receptor = 'APROBADO'
          AND t.estado_deuda = 'PENDIENTE'
          AND t.eliminado = 'N'
          AND c.estado = 1;`,
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

exports.obtenerResumenCampeonato = async () => {
  try {
    // Obtener el campeonato con estado = 1
    const campeonato = await Campeonato.findOne({
      where: { estado: 1 }
    });

    if (!campeonato) {
      throw new Error('No se encontró un campeonato activo.');
    }

    // Obtener equipos con estado "DeudaInscripcion"
    const equiposConDeuda = await sequelize.query(`
      SELECT ec.*
      FROM EquipoCampeonato ec
      JOIN Equipo e ON e.id = ec.equipoId
      JOIN Club c ON c.id = e.club_id
      WHERE ec.campeonatoId = :campeonatoId
        AND ec.estado = :estado
        AND c.presidente_asignado = 'S'
    `, {
      replacements: {
        campeonatoId: campeonato.id,
        estado: campeonatoEstado.DeudaInscripcion
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Obtener traspasos con las condiciones requeridas
    const traspasosPendientes = await Traspaso.findAll({
      where: {
        campeonato_id: campeonato.id,
        estado_club_origen: traspasoEstados.APROBADO,
        estado_jugador: traspasoEstados.APROBADO,
        estado_deuda: traspasoEstados.PENDIENTE,
        eliminado: 'N'
      }
    });

    // Contar resultados
    const totalEquiposConDeuda = equiposConDeuda.length;
    const totalTraspasosPendientes = traspasosPendientes.length;

    return {
      campeonato,
      totalEquiposConDeuda,
      totalTraspasosPendientes
    };
  } catch (error) {
    console.error('Error en obtenerResumenCampeonato:', error);
    throw new Error('Error al obtener el resumen del campeonato.');
  }
};

exports.getPagosInscripcionPorCampeonato = async (campeonatoId) => {
  try {
    const query = `
       SELECT 
        p.id,
        p.monto,
        p.fecha,
        p.referencia,
        p.estado,
        p.tipo_pago,
        e.nombre AS equipo,
        e.id AS equipoId,
        ec.campeonatoId,
        cat.nombre AS categoria,
        cat.genero,
        c.nombre AS nombre_club,
        ic.club_imagen AS imagen_club
      FROM PagoInscripcion pi
      JOIN Pago p ON pi.id = p.id
      JOIN EquipoCampeonato ec ON pi.equipoCampeonatoId = ec.id
      JOIN Equipo e ON ec.equipoId = e.id
      JOIN Club c ON e.club_id = c.id
	    LEFT JOIN ImagenClub ic ON ic.club_id = c.id
      LEFT JOIN Categoria cat ON ec.categoria_id = cat.id
      WHERE ec.campeonatoId = :campeonatoId
        AND p.tipo_pago = 'Inscripción'
    `;

    const results = await sequelize.query(query, {
      replacements: { campeonatoId },
      type: sequelize.QueryTypes.SELECT
    });
    
    return results;
    
  } catch (error) {
    console.error('Error al obtener pagos de inscripción (raw):', error);
    throw new Error('No se pudo obtener el historial de pagos');
  }
};

exports.getPagosTraspasoPorCampeonato = async (campeonatoId) => {
  try {
    const query = `
      SELECT 
        t.id AS traspaso_id,
        clubOrigen.id AS club_origen_id,
        clubOrigen.nombre AS club_origen_nombre,
        clubDestino.id AS club_destino_id,
        clubDestino.nombre AS club_destino_nombre,
        j.id AS jugador_id,
        j.jugador_id AS jugador_persona_id,
        p.nombre AS jugador_nombre,
        p.apellido AS jugador_apellido,
        p.ci AS jugador_ci,
        p.genero AS jugador_genero,
        p.fecha_nacimiento AS jugador_fecha_nacimiento,
        ppcd.id AS id_persona_presi_det,
        ppcd.nombre AS nombre_presi_club_dest,
        ppcd.apellido AS apellido_presi_club_dest,
        ppco.id AS id_persona_presi_origen,
        ppco.nombre AS nombre_presi_club_origen,
        ppco.apellido AS apellido_presi_club_origen,
        c.id AS campeonato_id,
        c.nombre AS nombre_campeonato,
        t.estado_deuda,
        cat.costo_traspaso,
        ico.club_imagen AS club_origen_imagen,
        icd.club_imagen AS club_destino_imagen,
        impj.persona_imagen,
        pgo.id AS pago_id,
        pgo.monto AS pago_monto,
        pgo.fecha AS pago_fecha,
        pgo.referencia AS pago_referencia
      FROM PagoTraspaso pt
      JOIN Pago pgo ON pt.id = pgo.id
      JOIN Traspaso t ON pt.traspaso_id = t.id
      LEFT JOIN Club clubOrigen ON t.club_origen_id = clubOrigen.id
      LEFT JOIN ImagenClub ico ON ico.club_id = clubOrigen.id
      LEFT JOIN Club clubDestino ON t.club_destino_id = clubDestino.id
      LEFT JOIN ImagenClub icd ON icd.club_id = clubDestino.id
      LEFT JOIN Jugador j ON t.jugador_id = j.id
      LEFT JOIN JugadorEquipo je ON je.jugador_id = j.id
      LEFT JOIN Equipo e ON e.id = je.equipo_id
      LEFT JOIN EquipoCampeonato ec ON ec.equipoId = e.id AND ec.campeonatoId = t.campeonato_id
      LEFT JOIN Categoria cat ON cat.id = ec.categoria_id
      LEFT JOIN Persona p ON j.jugador_id = p.id
      LEFT JOIN ImagenPersona impj ON impj.persona_id = p.id
      LEFT JOIN PresidenteClub pcd ON pcd.id = t.presidente_club_id_destino
      LEFT JOIN Persona ppcd ON ppcd.id = pcd.presidente_id
      LEFT JOIN PresidenteClub pco ON pco.id = t.presidente_club_id_origen
      LEFT JOIN Persona ppco ON ppco.id = pco.presidente_id
      LEFT JOIN Campeonato c ON c.id = t.campeonato_id
      WHERE 
        t.estado_club_origen = 'APROBADO'
        AND t.estado_jugador = 'APROBADO'
        AND t.estado_deuda = 'FINALIZADO'
        AND t.eliminado = 'N'
        AND c.id = :campeonatoId;
    `;

    const results = await sequelize.query(query, {
      replacements: { campeonatoId },
      type: sequelize.QueryTypes.SELECT
    });

    const resultadosConMontos = await Promise.all(results.map(async (row) => {
      const montoReal = await getMontoTraspasoPorTraspasoId(row.traspaso_id);
      return {
        ...row,
        monto_real: montoReal
      };
    }));

    return resultadosConMontos;
  } catch (error) {
    console.error('Error al obtener historial de pagos por traspaso:', error);
    throw new Error('No se pudo obtener el historial de pagos por traspaso');
  }
};

exports.getPagosInscripcionPorClub = async (clubId, campeonatoId) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.monto,
        p.fecha,
        p.referencia,
        p.estado,
        p.tipo_pago,
        e.nombre AS equipo,
        e.id AS equipoId,
        ec.campeonatoId,
        c.nombre AS nombre_club,
        cat.nombre AS categoria,
        cat.genero,
        ic.club_imagen AS imagen_club
      FROM PagoInscripcion pi
      JOIN Pago p ON pi.id = p.id
      JOIN EquipoCampeonato ec ON pi.equipoCampeonatoId = ec.id
      JOIN Equipo e ON ec.equipoId = e.id
      JOIN Club c ON e.club_id = c.id
      LEFT JOIN ImagenClub ic ON ic.club_id = c.id
      LEFT JOIN Categoria cat ON ec.categoria_id = cat.id
      WHERE 
        p.tipo_pago = 'Inscripción'
        AND c.id = :clubId
        AND ec.campeonatoId = :campeonatoId
    `;

    const results = await sequelize.query(query, {
      replacements: { clubId, campeonatoId },
      type: sequelize.QueryTypes.SELECT
    });

    return results;

  } catch (error) {
    console.error('Error al obtener pagos de inscripción por club:', error);
    throw new Error('No se pudo obtener el historial de pagos de inscripción');
  }
};


exports.getPagosTraspasoPorClub = async (clubId, campeonatoId) => {
  try {
    const query = `
      SELECT
        t.id AS traspaso_id,
        clubOrigen.id AS club_origen_id,
        clubOrigen.nombre AS club_origen_nombre,
        clubDestino.id AS club_destino_id,
        clubDestino.nombre AS club_destino_nombre,
        j.id AS jugador_id,
        j.jugador_id AS jugador_persona_id,
        p.nombre AS jugador_nombre,
        p.apellido AS jugador_apellido,
        p.ci AS jugador_ci,
        p.genero AS jugador_genero,
        p.fecha_nacimiento AS jugador_fecha_nacimiento,
        ppcd.id AS id_persona_presi_det,
        ppcd.nombre AS nombre_presi_club_dest,
        ppcd.apellido AS apellido_presi_club_dest,
        ppco.id AS id_persona_presi_origen,
        ppco.nombre AS nombre_presi_club_origen,
        ppco.apellido AS apellido_presi_club_origen,
        c.id AS campeonato_id,
        c.nombre AS nombre_campeonato,
        t.estado_deuda,
        cat.costo_traspaso,
        ico.club_imagen AS club_origen_imagen,
        icd.club_imagen AS club_destino_imagen,
        impj.persona_imagen,
        pgo.id AS pago_id,
        pgo.monto AS pago_monto,
        pgo.fecha AS pago_fecha,
        pgo.referencia AS pago_referencia
      FROM PagoTraspaso pt
      JOIN Pago pgo ON pt.id = pgo.id
      JOIN Traspaso t ON pt.traspaso_id = t.id
      LEFT JOIN Club clubOrigen ON t.club_origen_id = clubOrigen.id
      LEFT JOIN ImagenClub ico ON ico.club_id = clubOrigen.id
      LEFT JOIN Club clubDestino ON t.club_destino_id = clubDestino.id
      LEFT JOIN ImagenClub icd ON icd.club_id = clubDestino.id
      LEFT JOIN Jugador j ON t.jugador_id = j.id
      LEFT JOIN JugadorEquipo je ON je.jugador_id = j.id
      LEFT JOIN Equipo e ON e.id = je.equipo_id
      LEFT JOIN EquipoCampeonato ec ON ec.equipoId = e.id AND ec.campeonatoId = t.campeonato_id
      LEFT JOIN Categoria cat ON cat.id = ec.categoria_id
      LEFT JOIN Persona p ON j.jugador_id = p.id
      LEFT JOIN ImagenPersona impj ON impj.persona_id = p.id
      LEFT JOIN PresidenteClub pcd ON pcd.id = t.presidente_club_id_destino
      LEFT JOIN Persona ppcd ON ppcd.id = pcd.presidente_id
      LEFT JOIN PresidenteClub pco ON pco.id = t.presidente_club_id_origen
      LEFT JOIN Persona ppco ON ppco.id = pco.presidente_id
      LEFT JOIN Campeonato c ON c.id = t.campeonato_id
      WHERE 
        t.estado_club_origen = 'APROBADO'
        AND t.estado_jugador = 'APROBADO'
        AND t.estado_deuda = 'FINALIZADO'
        AND t.eliminado = 'N'
        AND t.club_destino_id = :clubId
        AND c.id = :campeonatoId;
    `;

    const results = await sequelize.query(query, {
      replacements: { clubId, campeonatoId },
      type: sequelize.QueryTypes.SELECT
    });

    const resultadosConMontos = await Promise.all(results.map(async (row) => {
      const montoReal = await getMontoTraspasoPorTraspasoId(row.traspaso_id);
      return { ...row, monto_real: montoReal };
    }));

    return resultadosConMontos;
  } catch (error) {
    console.error('Error al obtener pagos de traspaso por club:', error);
    throw new Error('No se pudo obtener el historial de pagos por traspaso');
  }
};
