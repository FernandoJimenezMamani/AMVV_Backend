const {
  Campeonato,
  EquipoCampeonato,
  Equipo,
  Categoria,
  JugadorEquipo,
  Participacion,
} = require('../models');
const sequelize = require('../config/sequelize');
const { Op, where } = require('sequelize');
const campeonatoEstados = require('../constants/campeonatoEstados');
const moment = require('moment-timezone');
const campeonatoEquipoEstados = require('../constants/campeonatoEquipoEstado');
const campeonatoService = require('./campeonatoService');

exports.actualizarEstadosCampeonatos = async () => {
  try {
    const campeonatosActualizados = []; // Lista de cambios
    const campeonato = await Campeonato.findOne({
      where: {
        estado: { [Op.in]: [0, 1, 2] },
      },
    });

    if (!campeonato) {
      return [];
    }

    // Obtener la hora actual en UTC y restarle 4 horas
    const now = moment().utc().subtract(4, "hours");
    const fechaInicioTransaccion = moment.utc(
      campeonato.fecha_inicio_transaccion,
    );
    const fechaFinTransaccion = moment.utc(campeonato.fecha_fin_transaccion);
    const fechaInicioCampeonato = moment.utc(
      campeonato.fecha_inicio_campeonato,
    );
    const fechaFinCampeonato = moment.utc(campeonato.fecha_fin_campeonato);

    let nuevoEstado;

    // Comparar en UTC
    if (now.isBefore(fechaInicioTransaccion)) {
      nuevoEstado = campeonatoEstados.enEspera;
    } else if (
      now.isBetween(fechaInicioTransaccion, fechaFinTransaccion, null, "[)")
    ) {
      nuevoEstado = campeonatoEstados.transaccionProceso;
    } else if (
      now.isBetween(fechaFinTransaccion, fechaInicioCampeonato, null, "(]")
    ) {
      nuevoEstado = campeonatoEstados.enEspera;
    } else if (
      now.isBetween(fechaInicioCampeonato, fechaFinCampeonato, null, "[)")
    ) {
      nuevoEstado = campeonatoEstados.campeonatoEnCurso;
    } else if (now.isAfter(fechaFinCampeonato)) {
      nuevoEstado = campeonatoEstados.campeonatoFinalizado;
    }

    if (Number(nuevoEstado) !== Number(campeonato.estado)) {
      await Campeonato.update(
        { estado: nuevoEstado },
        { where: { id: campeonato.id } },
      );

      campeonatosActualizados.push({
        id: campeonato.id,
        nuevoEstado,
      });
    } else {
      console.log(
        `El estado del campeonato ID ${campeonato.id} ya es ${campeonato.estado}. No se requiere actualización.`,
      );
    }

    console.log(`⏳ Estado actual del campeonato: ${campeonato.estado}`);
    console.log(`📥 Nuevo estado calculado: ${nuevoEstado}`);

    return campeonatosActualizados;
  } catch (error) {
    console.error("Error actualizando el estado del campeonato:", error);
    return [];
  }
};
