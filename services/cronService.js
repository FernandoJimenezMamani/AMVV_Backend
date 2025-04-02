const { Campeonato, EquipoCampeonato, Equipo, Categoria , JugadorEquipo, Participacion} = require('../models');
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
                estado: { [Op.in]: [0, 1, 2] }
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
            const [result] = await sequelize.query(`
                SELECT TOP 1 * 
                FROM Campeonato 
                WHERE estado = :estadoFinalizado 
                  AND fecha_registro < :fechaReferencia 
                ORDER BY fecha_registro DESC
              `, {
                replacements: {
                  estadoFinalizado: campeonatoEstados.campeonatoFinalizado,
                  fechaReferencia: moment(campeonato.fecha_registro).format('YYYY-MM-DD HH:mm:ss')
                },
                type: sequelize.QueryTypes.SELECT
              });
              
              const campeonatoAnterior = result || null;
              
              
              if (!campeonatoAnterior) {
                console.log('No se encontró un campeonato anterior finalizado. No se realizará asignación de categorías.');
                return campeonatosActualizados; 
              }
              const equiposAnteriorCampeonato = await EquipoCampeonato.findAll({
                where: {
                  campeonatoId: campeonatoAnterior.id
                },
                include: [{
                  model: Categoria,
                  as: 'categoria',
                  attributes: ['id', 'nombre', 'es_ascenso', 'genero']
                }]
              });
              
            const categorias = await Categoria.findAll({
                where: { eliminado: 'N' },
                attributes: ['id', 'nombre', 'genero']
              });
              
            const cambiosCategoria = new Map();

            const ascensosVarones = await campeonatoService.getEquiposAscensoDescenso(campeonatoAnterior.id, 'V');
            ascensosVarones.forEach((cambio) => {
            const equipoId = cambio.equipo.equipo_id;
            const nuevaCategoria = categorias.find(cat => cat.nombre === cambio.a && cat.genero === 'V');
            if (nuevaCategoria) {
                cambiosCategoria.set(equipoId, nuevaCategoria.id);
            }
            });

            const ascensosMujeres = await campeonatoService.getEquiposAscensoDescenso(campeonatoAnterior.id, 'D');
            ascensosMujeres.forEach((cambio) => {
            const equipoId = cambio.equipo.equipo_id;
            const nuevaCategoria = categorias.find(cat => cat.nombre === cambio.a && cat.genero === 'D');
            if (nuevaCategoria) {
                cambiosCategoria.set(equipoId, nuevaCategoria.id);
            }
            });

            const nuevosRegistrosConCategoria = [];
            const equiposYaRegistrados = await EquipoCampeonato.findAll({
                where: { campeonatoId: campeonato.id },
                attributes: ['equipoId'],
            });
            const idsYaRegistrados = new Set(equiposYaRegistrados.map(e => e.equipoId));

            for (const equipo of equiposAnteriorCampeonato) {
                const equipoId = equipo.equipoId;

                if (idsYaRegistrados.has(equipoId)) {
                continue; 
                }
            
                const nuevaCategoriaId = cambiosCategoria.get(equipoId) || equipo.categoria_id;
            
                nuevosRegistrosConCategoria.push({
                equipoId,
                campeonatoId: campeonato.id,
                categoria_id: nuevaCategoriaId,
                estado: campeonatoEquipoEstados.DeudaInscripcion,
                });
            }
  

            if (nuevosRegistrosConCategoria.length > 0) {
            await EquipoCampeonato.bulkCreate(nuevosRegistrosConCategoria);
            console.log(`Se insertaron ${nuevosRegistrosConCategoria.length} equipos con sus categorías actualizadas.`);
            } else {
            console.log("No se encontraron equipos del campeonato anterior para insertar.");
            }

        }

        return campeonatosActualizados;
    } catch (error) {
        console.error("Error actualizando el estado del campeonato:", error);
        return [];
    }
};
