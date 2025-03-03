const { Campeonato, EquipoCampeonato, Equipo, Categoria , JugadorEquipo, Participacion} = require('../models');
const sequelize = require('../config/sequelize');
const { Op, where } = require('sequelize');
const campeonatoEstados = require('../constants/campeonatoEstados');
const moment = require('moment-timezone');
const campeonatoEquipoEstados = require('../constants/campeonatoEquipoEstado');

exports.actualizarEstadosCampeonatos = async () => {
    try {
        const campeonatosActualizados = []; // Lista de cambios
        const campeonato = await Campeonato.findOne({
            where: {
                estado: { [Op.in]: [0, 1, 2,3] }
            }
        });

        if (!campeonato) {
            return [];
        }

        // Obtener la hora actual en UTC y restarle 4 horas
        const now = moment().utc().subtract(4, 'hours');
        const fechaInicioTransaccion = moment.utc(campeonato.fecha_inicio_transaccion);
        const fechaFinTransaccion = moment.utc(campeonato.fecha_fin_transaccion);
        const fechaInicioCampeonato = moment.utc(campeonato.fecha_inicio_campeonato);
        const fechaFinCampeonato = moment.utc(campeonato.fecha_fin_campeonato);

        let nuevoEstado;

        // Comparar en UTC
        if (now.isBefore(fechaInicioTransaccion)) {
            nuevoEstado = campeonatoEstados.enEspera;
        } else if (now.isBetween(fechaInicioTransaccion, fechaFinTransaccion, null, "[)")) {
            nuevoEstado = campeonatoEstados.transaccionProceso;
        } else if (now.isBetween(fechaFinTransaccion, fechaInicioCampeonato, null, "(]")) {
            nuevoEstado = campeonatoEstados.enEspera;
        } else if (now.isBetween(fechaInicioCampeonato, fechaFinCampeonato, null, "[)")) {
            nuevoEstado = campeonatoEstados.campeonatoEnCurso;
        } else if (now.isAfter(fechaFinCampeonato)) {
            nuevoEstado = campeonatoEstados.campeonatoFinalizado;
        }

        if (Number(nuevoEstado) !== Number(campeonato.estado)) {
            console.log(`Actualizando estado del campeonato ID ${campeonato.id} de ${campeonato.estado} a ${nuevoEstado}`);

            await Campeonato.update(
                { estado: nuevoEstado },
                { where: { id: campeonato.id } }
            );

            campeonatosActualizados.push({
                id: campeonato.id,
                nuevoEstado
            });

            console.log("Estado del campeonato actualizado correctamente.");
        } else {
            console.log(`El estado del campeonato ID ${campeonato.id} ya es ${campeonato.estado}. No se requiere actualización.`);
        }

        if (nuevoEstado === campeonatoEstados.transaccionProceso) {
            console.log(`Verificando nuevos equipos para el campeonato ID ${campeonato.id} en fase de preparación...`);

            // Obtener todos los equipos existentes en la base de datos
            const todosLosEquipos = await Equipo.findAll({ where:{ eliminado: 'N'}, attributes: ['id'] });
            const idsTodosLosEquipos = todosLosEquipos.map(equipo => equipo.id);

            // Obtener los equipos ya registrados en la tabla EquipoCampeonato para este campeonato
            const equiposRegistrados = await EquipoCampeonato.findAll({
                where: { campeonatoId: campeonato.id },
                attributes: ['equipoId']
            });

            const idsEquiposRegistrados = equiposRegistrados.map(ec => ec.equipoId);

            // Encontrar equipos nuevos que aún no están en EquipoCampeonato
            const equiposNuevos = idsTodosLosEquipos.filter(equipoId => !idsEquiposRegistrados.includes(equipoId));

            if (equiposNuevos.length > 0) {
                console.log(`Se encontraron ${equiposNuevos.length} equipos nuevos. Añadiéndolos al campeonato...`);

                // Crear registros en la tabla EquipoCampeonato
                const nuevosRegistros = equiposNuevos.map(equipoId => ({
                    equipoId,
                    campeonatoId: campeonato.id,
                    estado: campeonatoEquipoEstados.DeudaInscripcion // Estado activo por defecto
                }));

                await EquipoCampeonato.bulkCreate(nuevosRegistros);
                console.log(`Se añadieron ${equiposNuevos.length} nuevos equipos al campeonato.`);
            } else {
                console.log("No hay equipos nuevos para añadir.");
            }
        }

        return campeonatosActualizados;
    } catch (error) {
        console.error("Error actualizando el estado del campeonato:", error);
        return [];
    }
};

exports.monitorearJugadoresParticipacion = async () => {
    try {
        const campeonatoActivo = await Campeonato.findOne({
            where: { estado: 1 } 
        });

        if (!campeonatoActivo) {
            return;
        }

        const jugadoresActivos = await JugadorEquipo.findAll({
            where: { activo: 1 }
        });

        if (jugadoresActivos.length === 0) {
            return;
        }

        for (const jugador of jugadoresActivos) {
            const equipoCampeonato = await EquipoCampeonato.findOne({
                where: {
                    equipoId: jugador.equipo_id,
                    campeonatoId: campeonatoActivo.id,
                    estado: campeonatoEquipoEstados.Inscrito
                }
            });

            if (!equipoCampeonato) {
                continue;
            }

            const participacionExistente = await Participacion.findOne({
                where: {
                    jugador_equipo_id: jugador.id,
                    equipo_campeonato_id: equipoCampeonato.id
                }
            });

            if (!participacionExistente) {

                await Participacion.create({
                    jugador_equipo_id: jugador.id,
                    equipo_campeonato_id: equipoCampeonato.id
                });
            } else {
                console.log(`🔄 El jugador ${jugador.jugador_id} ya está registrado en Participacion.`);
            }
        }

    } catch (error) {
        console.error("🚨 Error en el monitoreo de jugadores:", error);
    }
};