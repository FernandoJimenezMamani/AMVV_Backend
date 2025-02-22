const { Partido, Equipo, Lugar, Campeonato,ResultadoLocal,ResultadoVisitante,Tarjeta ,ImagePlanilla,ArbitroPartido } = require('../models');
const sequelize = require('../config/sequelize');
const { uploadFile } = require('../utils/subirImagen');
const moment = require('moment');
const partidoEstadosMapping = require('../constants/estadoPartido');
const { Op } = require("sequelize");
const { broadcastPositionsUpdate } = require('../utils/websocket');

exports.createPartido = async (data) => {
  try {
    const transaction = await sequelize.transaction(); 
    const { campeonato_id, equipo_local_id, equipo_visitante_id, fecha, lugar_id ,arbitros} = data;

    // Convertir la fecha al formato YYYY-MM-DD HH:MM:SS
    const formattedFecha = moment(fecha).format('YYYY-MM-DD HH:mm:ss');
    console.log('Datos recibidos para crear el partido:');
    console.log('Campeonato ID:', campeonato_id);
    console.log('Equipo Local ID:', equipo_local_id);
    console.log('Equipo Visitante ID:', equipo_visitante_id);
    console.log('Fecha (formateada):', formattedFecha);
    console.log('Lugar ID:', lugar_id);
    console.log('arbitros ID:', arbitros);
 
    const result = await Partido.create({
        campeonato_id,
        equipo_local_id,
        equipo_visitante_id,
        fecha:sequelize.fn('CONVERT', sequelize.literal('DATETIME'), formattedFecha),
        lugar_id,
        estado: 1
      }, { transaction });

    console.log('Partido creado exitosamente:', result);

    for (const arbitro_id of arbitros) {
      console.log('arbitros:', arbitro_id);
      await ArbitroPartido.create({
        arbitro_id,
        partido_id: result.id 
      }, { transaction });
    }

    await transaction.commit();
    return result;

  } catch (error) {
    console.error('Error al crear el partido:', error);
    await transaction.rollback();
    throw error;
  }
};

exports.getPartidosByCategoriaId = async (categoriaId,campeonatoId) => {
  try {
    const resultPartidos = await sequelize.query(`
      SELECT 
        P.id, 
        P.campeonato_id, 
        P.equipo_local_id, 
        P.equipo_visitante_id, 
        P.fecha, 
        P.lugar_id, 
        P.estado,
        EL.nombre AS equipo_local_nombre,
        EV.nombre AS equipo_visitante_nombre,
        ICL.club_imagen AS equipo_local_imagen,
        ICV.club_imagen AS equipo_visitante_imagen,
        C.nombre AS categoria_nombre,P.estado,
        L.nombre AS lugar_nombre
      FROM 
        Partido P
      JOIN 
        Equipo EL ON P.equipo_local_id = EL.id
      JOIN 
        Equipo EV ON P.equipo_visitante_id = EV.id
      JOIN 
        ImagenClub ICL ON EL.club_id = ICL.club_id
      JOIN 
        ImagenClub ICV ON EV.club_id = ICV.club_id
      JOIN 
        Categoria C ON EL.categoria_id = C.id
      JOIN Lugar L ON P.lugar_id = L.id
      WHERE 
        C.id = :categoriaId AND p.campeonato_id = :campeonatoId 
      ORDER BY 
        P.fecha ASC;
    `, {
      replacements: { categoriaId , campeonatoId }, 
      type: sequelize.QueryTypes.SELECT 
    });

    return resultPartidos;
  } catch (error) {
    console.error('Error al obtener los partidos:', error);
    throw new Error('Error al obtener los partidos');
  }
};

exports.getUpcomingMatchesByCategoria = async (categoriaId) => {
  try {
    const resultPartidos = await sequelize.query(`
      SELECT TOP 3 
        P.id, 
        P.fecha, 
        EL.nombre AS equipo_local_nombre, 
        EV.nombre AS equipo_visitante_nombre, 
        ICL.club_imagen AS equipo_local_imagen, 
        ICV.club_imagen AS equipo_visitante_imagen 
      FROM Partido P
      JOIN Equipo EL ON P.equipo_local_id = EL.id
      JOIN Equipo EV ON P.equipo_visitante_id = EV.id
      JOIN ImagenClub ICL ON EL.club_id = ICL.club_id
      JOIN ImagenClub ICV ON EV.club_id = ICV.club_id
      JOIN Categoria C ON EL.categoria_id = C.id
      WHERE C.id = :categoriaId
      ORDER BY P.fecha ASC;
    `, {
      replacements: { categoriaId },  
      type: sequelize.QueryTypes.SELECT
    });

    return resultPartidos;
  } catch (error) {
    console.error('Error al obtener los próximos partidos:', error);
    throw new Error('Error al obtener los partidos');
  }
};

exports.getAllMatchesExceptUpcoming = async (categoriaId) => {
  try {
    const resultPartidos = await sequelize.query(`
       SELECT 
        P.id, 
        P.fecha, 
        EL.nombre AS equipo_local_nombre, 
        EV.nombre AS equipo_visitante_nombre, 
        ICL.club_imagen AS equipo_local_imagen, 
        ICV.club_imagen AS equipo_visitante_imagen 
      FROM Partido P
      JOIN Equipo EL ON P.equipo_local_id = EL.id
      JOIN Equipo EV ON P.equipo_visitante_id = EV.id
      JOIN ImagenClub ICL ON EL.club_id = ICL.club_id
      JOIN ImagenClub ICV ON EV.club_id = ICV.club_id
      JOIN Categoria C ON EL.categoria_id = C.id
      WHERE C.id = :categoriaId
      AND P.id NOT IN (
        SELECT TOP 3 P.id 
        FROM Partido P
        JOIN Equipo EL ON P.equipo_local_id = EL.id
        JOIN Categoria C ON EL.categoria_id = C.id
        WHERE C.id = :categoriaId
        ORDER BY P.fecha ASC
      )
      ORDER BY P.fecha ASC;
    `, {
      replacements: { categoriaId },  
      type: sequelize.QueryTypes.SELECT 
    });

    return resultPartidos;
  } catch (error) {
    console.error('Error al obtener los próximos partidos:', error);
    throw new Error('Error al obtener los partidos');
  }
};

exports.getPartidoById = async (id) => {
  return await Partido.findOne({
    where: { id },
    include: [
      { model: Equipo, as: 'equipolocal', attributes: ['nombre'] },
      { model: Equipo, as: 'equipovisitante', attributes: ['nombre'] },
      { model: Lugar, as: 'lugar', attributes: ['nombre'] },
      { model: Campeonato, as: 'campeonato', attributes: ['nombre'] }
    ]
  });
};

exports.updatePartido = async (id, data) => {
  const { campeonato_id, equipo_local_id, equipo_visitante_id, fecha, lugar_id, resultado } = data;

  return await Partido.update(
    { campeonato_id, equipo_local_id, equipo_visitante_id, fecha, lugar_id, resultado },
    { where: { id } }
  );
};

exports.deletePartido = async (id) => {
  return await Partido.update(
    { resultado: 'ELIMINADO' },
    { where: { id } }
  );
};

exports.submitTarjetas = async (partidoId, tarjetas, transaction) => {
  try {
    for (const tarjeta of tarjetas) {
      if (!tarjeta.equipoId || !tarjeta.tipoTarjeta) {
        throw new Error('Equipo ID y tipo de tarjeta son obligatorios para cada tarjeta.');
      }

      await Tarjeta.create({
        partido_id: partidoId,
        equipo_id: tarjeta.equipoId,
        jugador_id: tarjeta.jugadorId,
        tipo_tarjeta: tarjeta.tipoTarjeta,
      }, { transaction });
    }
  } catch (error) {
    throw new Error('Error al registrar las tarjetas: ' + error.message);
  }
};


exports.submitResultados = async ({ partido_id, resultadoLocal, resultadoVisitante, walkover, tarjetas, imagenPlanilla }) => {
  const transaction = await sequelize.transaction();

  try {

    console.log('Datos recibidos:', {
      partido_id,
      resultadoLocal,
      resultadoVisitante,
      walkover,
      tarjetas,
      imagenPlanilla
    });

    const walkoverValue = walkover === '' ? null : walkover;
    const local = await ResultadoLocal.create({
      partido_id,
      set1: resultadoLocal.set1 ?? 0, 
      set2: resultadoLocal.set2 ?? 0,
      set3: resultadoLocal.set3 ?? 0,
      resultado: resultadoLocal.resultado || null,
      walkover: walkoverValue
    }, { transaction });

    const visitante = await ResultadoVisitante.create({
      partido_id,
      set1: resultadoVisitante.set1 ?? 0, 
      set2: resultadoVisitante.set2 ?? 0,
      set3: resultadoVisitante.set3 ?? 0,
      resultado: resultadoVisitante.resultado || null,
      walkover: walkoverValue
    }, { transaction });

    await exports.submitTarjetas(partido_id, tarjetas, transaction);

    if (imagenPlanilla) {
      const fileName = `planilla_${partido_id}_${Date.now()}`;
      const { downloadURL } = await uploadFile(imagenPlanilla, fileName, null, 'FilesPlanillas');
      
      await ImagePlanilla.create({
        partido_id,
        partido_image: downloadURL
      }, { transaction });
    }

    await Partido.update(
      { estado: partidoEstadosMapping.Finalizado },
      { where: { id: partido_id }, transaction }
    );

    await transaction.commit();

    console.log('Resultados registrados correctamente. Enviando actualización por WebSocket...');
    broadcastPositionsUpdate();
    return { local, visitante };
  } catch (error) {
    console.error('Error durante la transacción:', error);
    await transaction.rollback();
    throw new Error('Error al registrar los resultados: ' + error.message);
  }
};

exports.getPartidoCompletoById = async (partidoId) => {
  try {
    const result = await sequelize.query(`
      SELECT 
        P.id AS partido_id,
        P.fecha,
        P.estado,
        L.nombre AS lugar_nombre,
        L.longitud AS lugar_longitud,
        L.latitud AS lugar_latitud,
        EL.id AS equipo_local_id,
        EL.nombre AS equipo_local_nombre,
        ICL.club_imagen AS equipo_local_imagen,
        EV.id AS equipo_visitante_id,
        EV.nombre AS equipo_visitante_nombre,
        ICV.club_imagen AS equipo_visitante_imagen
      FROM Partido P
      JOIN Lugar L ON P.lugar_id = L.id
      JOIN Equipo EL ON P.equipo_local_id = EL.id
      JOIN Equipo EV ON P.equipo_visitante_id = EV.id
      JOIN ImagenClub ICL ON EL.club_id = ICL.club_id
      JOIN ImagenClub ICV ON EV.club_id = ICV.club_id
      WHERE P.id = :partidoId;
    `, {
      replacements: { partidoId },
      type: sequelize.QueryTypes.SELECT
    });

    return result[0]; // Devuelve el primer resultado, ya que estamos buscando por ID
  } catch (error) {
    console.error('Error al obtener la información del partido:', error);
    throw new Error('Error al obtener la información del partido');
  }
};

exports.getJugadoresByEquipoId = async (equipoId) => {
  try {
    const jugadores = await sequelize.query(`
      SELECT 
        J.id AS jugador_id,
        P.nombre AS jugador_nombre,
        P.apellido AS jugador_apellido
      FROM JugadorEquipo JE
      JOIN Jugador J ON JE.jugador_id = J.id
      JOIN Persona P ON J.id = P.id
      WHERE JE.equipo_id = :equipoId;
    `, {
      replacements: { equipoId },
      type: sequelize.QueryTypes.SELECT
    });

    return jugadores;
  } catch (error) {
    console.error('Error al obtener los jugadores del equipo:', error);
    throw new Error('Error al obtener los jugadores del equipo');
  }
};

exports.getArbitrosByPartidoId = async (partidoId) => {
  try {
    const arbitros = await sequelize.query(`
      SELECT 
        A.id AS arbitro_id,
        A.activo AS arbitro_activo,
        P.nombre AS arbitro_nombre,
        P.apellido AS arbitro_apellido,
        p.genero AS arbitro_genero,
		    IMP.persona_imagen
      FROM Arbitro_Partido AP
      JOIN Arbitro A ON AP.arbitro_id = A.id
      JOIN Persona P ON A.id = P.id
	    LEFT JOIN ImagenPersona IMP ON IMP.persona_id = P.id
      WHERE AP.partido_id = :partidoId;
    `, {
      replacements: { partidoId },
      type: sequelize.QueryTypes.SELECT
    });

    return arbitros;
  } catch (error) {
    console.error('Error al obtener los árbitros del partido:', error);
    throw new Error('Error al obtener los árbitros del partido');

  }
}

exports.getPartidosByLugarYFecha = async (lugarId, fecha) => {
  try {
    if (!lugarId || !fecha) {
      throw new Error('El lugarId y la fecha son obligatorios');
    }

    // Convertir la fecha a formato YYYY-MM-DD si viene en formato DD/MM/YYYY
    let fechaFormateada;
    if (fecha.includes('/')) {
      const [dia, mes, anio] = fecha.split('/');
      fechaFormateada = `${anio}-${mes}-${dia}`;
    } else {
      fechaFormateada = fecha;
    }

    // Definir el rango de fechas para incluir todo el día
    const fechaInicio = `${fechaFormateada} 00:00:00`;
    const fechaFin = `${fechaFormateada} 23:59:59`;

    // Ejecutar la consulta RAW
    const partidos = await sequelize.query(`
      SELECT 
        P.id AS partido_id,
        P.campeonato_id,
        P.equipo_local_id,
        P.equipo_visitante_id,
        P.fecha,
        FORMAT(P.fecha, 'HH:mm') AS hora_partido, 
        P.lugar_id,
        P.estado,
        EL.id AS equipolocal_id,
        EL.nombre AS equipolocal_nombre,
        EV.id AS equipovisitante_id,
        EV.nombre AS equipovisitante_nombre,
        L.id AS lugar_id,
        L.nombre AS lugar_nombre,
        C.id AS campeonato_id,
        C.nombre AS campeonato_nombre,
        CL.id AS categoria_id,
        CONCAT(CL.nombre, ' ', CL.genero) AS categoria_nombre
      FROM Partido P
      LEFT JOIN Equipo EL ON P.equipo_local_id = EL.id
      LEFT JOIN Equipo EV ON P.equipo_visitante_id = EV.id
      LEFT JOIN Lugar L ON P.lugar_id = L.id
      LEFT JOIN Campeonato C ON P.campeonato_id = C.id
      LEFT JOIN Categoria CL ON EL.categoria_id = CL.id
      WHERE P.lugar_id = :lugarId 
        AND P.fecha BETWEEN :fechaInicio AND :fechaFin
      ORDER BY CAST(FORMAT(P.fecha, 'HH:mm:ss') AS TIME) ASC;  -- Ordenar por la hora
    `, {
      replacements: { lugarId, fechaInicio, fechaFin },
      type: sequelize.QueryTypes.SELECT
    });

    return partidos;
  } catch (error) {
    console.error('Error en getPartidosByLugarYFecha:', error);
    throw new Error('Error al obtener los partidos por lugar y fecha');
  }
};

exports.getPartidosByFecha = async (fecha) => {
  try {
    if (!fecha) {
      throw new Error('La fecha es obligatoria');
    }

    // Convertir la fecha a formato YYYY-MM-DD si viene en formato DD/MM/YYYY
    let fechaFormateada;
    if (fecha.includes('/')) {
      const [dia, mes, anio] = fecha.split('/');
      fechaFormateada = `${anio}-${mes}-${dia}`;
    } else {
      fechaFormateada = fecha;
    }

    // Definir el rango de fechas para incluir todo el día
    const fechaInicio = `${fechaFormateada} 00:00:00`;
    const fechaFin = `${fechaFormateada} 23:59:59`;

    // Ejecutar la consulta RAW sin filtrar por lugar
    const partidos = await sequelize.query(`
      SELECT 
        P.id AS partido_id,
        P.campeonato_id,
        P.equipo_local_id,
        P.equipo_visitante_id,
        P.fecha,
        FORMAT(P.fecha, 'HH:mm') AS hora_partido, 
        P.lugar_id,
        P.estado,
        EL.id AS equipolocal_id,
        EL.nombre AS equipolocal_nombre,
        EV.id AS equipovisitante_id,
        EV.nombre AS equipovisitante_nombre,
        L.id AS lugar_id,
        L.nombre AS lugar_nombre,
        C.id AS campeonato_id,
        C.nombre AS campeonato_nombre,
        CL.id AS categoria_id,
        CONCAT(CL.nombre, ' ', CL.genero) AS categoria_nombre
      FROM Partido P
      LEFT JOIN Equipo EL ON P.equipo_local_id = EL.id
      LEFT JOIN Equipo EV ON P.equipo_visitante_id = EV.id
      LEFT JOIN Lugar L ON P.lugar_id = L.id
      LEFT JOIN Campeonato C ON P.campeonato_id = C.id
      LEFT JOIN Categoria CL ON EL.categoria_id = CL.id
      WHERE P.fecha BETWEEN :fechaInicio AND :fechaFin
      ORDER BY CAST(FORMAT(P.fecha, 'HH:mm:ss') AS TIME) ASC;
    `, {
      replacements: { fechaInicio, fechaFin },
      type: sequelize.QueryTypes.SELECT
    });

    return partidos;
  } catch (error) {
    console.error('Error en getPartidosByFecha:', error);
    throw new Error('Error al obtener los partidos por fecha');
  }
};

exports.getEquiposInscritos = async (campeonatoId, categoriaId) => {
  try {
    const equipos = await sequelize.query(`
      SELECT E.id, E.nombre,IC.club_imagen
      FROM EquipoCampeonato EC
      JOIN Equipo E ON EC.equipoId = E.id
      JOIN Club C ON C.id = E.club_id
      LEFT JOIN ImagenClub IC ON IC.club_id = C.id
      WHERE EC.campeonatoId = :campeonatoId
      AND E.categoria_id = :categoriaId
      AND EC.estado = 'Inscrito'
    `, {
      replacements: { campeonatoId, categoriaId },
      type: sequelize.QueryTypes.SELECT
    });

    return equipos;
  } catch (error) {
    console.error('Error al obtener equipos inscritos:', error);
    throw new Error('No se pudieron obtener los equipos inscritos.');
  }
};

exports.generarFixtureRoundRobin = (equipos) => {
  if (equipos.length < 2) {
    throw new Error('Se necesitan al menos dos equipos para generar partidos.');
  }

  let fixture = [];
  let numEquipos = equipos.length;
  let jornadas = numEquipos - 1;

  let equiposCopia = [...equipos];
  if (numEquipos % 2 !== 0) {
    equiposCopia.push({ id: null, nombre: 'Descanso', club_imagen: null });
    numEquipos++;
  }

  for (let ronda = 0; ronda < jornadas; ronda++) {
    let partidos = [];

    for (let i = 0; i < numEquipos / 2; i++) {
      let equipoLocal = equiposCopia[i];
      let equipoVisitante = equiposCopia[numEquipos - 1 - i];

      if (ronda % 2 === 0) {
        [equipoLocal, equipoVisitante] = [equipoVisitante, equipoLocal]; 
      }

      if (equipoLocal.id !== null && equipoVisitante.id !== null) {
        partidos.push({
          equipo_local_id: equipoLocal.id,
          equipo_local: equipoLocal.nombre,
          equipo_local_img: equipoLocal.club_imagen,

          equipo_visitante_id: equipoVisitante.id,
          equipo_visitante: equipoVisitante.nombre,
          equipo_visitante_img: equipoVisitante.club_imagen
        });
      }
    }

    fixture.push(partidos);
    equiposCopia.splice(1, 0, equiposCopia.pop());
  }

  return fixture;
};

exports.asignarFechasHorarios = async (fixture, campeonato) => {
  const fechaInicio = moment(campeonato.fecha_inicio_campeonato);
  const fechaFin = moment(campeonato.fecha_fin_campeonato);
  let fechaActual = fechaInicio.clone();

  let partidosAsignados = [];
  let horariosPorFecha = {}; 
  let equiposPorFecha = {}; // Registro de equipos que juegan en cada fecha

  // Asegurar que el primer día sea sábado o domingo
  while (fechaActual.isoWeekday() !== 6 && fechaActual.isoWeekday() !== 7) {
      fechaActual.add(1, 'days');
  }

  for (let jornada of fixture) {
      for (let partido of jornada) {
          let asignado = false;

          while (!asignado) {
              let fechaPartido = fechaActual.format("YYYY-MM-DD");

              // Definir horarios disponibles según el día
              let horariosDisponibles =
                  fechaActual.isoWeekday() === 6
                      ? ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"] // Sábado
                      : ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"]; // Domingo

              // Registrar horarios ocupados y equipos que han jugado en la fecha
              if (!horariosPorFecha[fechaPartido]) {
                  horariosPorFecha[fechaPartido] = new Set();
              }
              if (!equiposPorFecha[fechaPartido]) {
                  equiposPorFecha[fechaPartido] = new Set();
              }

              // Verificar si los equipos ya jugaron en la fecha actual
              if (equiposPorFecha[fechaPartido].has(partido.equipo_local_id) || 
                  equiposPorFecha[fechaPartido].has(partido.equipo_visitante_id)) {
                  
                  // Si ya jugaron, avanzar al siguiente fin de semana
                  do {
                      fechaActual.add(1, "days");
                      fechaPartido = fechaActual.format("YYYY-MM-DD");
                  } while (fechaActual.isoWeekday() !== 6 && fechaActual.isoWeekday() !== 7);
                  
                  continue;
              }

              let horarioDisponible = horariosDisponibles.find(h => !horariosPorFecha[fechaPartido].has(h));

              if (!horarioDisponible) {
                  // Si no hay horarios disponibles, avanzar al siguiente fin de semana
                  do {
                      fechaActual.add(1, "days");
                  } while (fechaActual.isoWeekday() !== 6 && fechaActual.isoWeekday() !== 7);
                  continue;
              }

              let lugarDisponible = await buscarLugarAleatorioDisponible(fechaPartido, horarioDisponible);

              if (lugarDisponible) {
                  partidosAsignados.push({
                      equipo_local_id: partido.equipo_local_id,
                      equipo_local: partido.equipo_local,
                      equipo_local_img: partido.equipo_local_img,

                      equipo_visitante_id: partido.equipo_visitante_id,
                      equipo_visitante: partido.equipo_visitante,
                      equipo_visitante_img: partido.equipo_visitante_img,

                      fecha: `${fechaPartido} ${horarioDisponible}:00`,
                      lugar_id: {
                          id: lugarDisponible.id,
                          nombre: lugarDisponible.nombre
                      },
                      arbitros: [] 
                  });

                  horariosPorFecha[fechaPartido].add(horarioDisponible);
                  equiposPorFecha[fechaPartido].add(partido.equipo_local_id);
                  equiposPorFecha[fechaPartido].add(partido.equipo_visitante_id);
                  asignado = true;
              } else {
                  do {
                      fechaActual.add(1, "days");
                  } while (fechaActual.isoWeekday() !== 6 && fechaActual.isoWeekday() !== 7);
              }
          }
      }
  }

  return partidosAsignados;
};

exports.validarDisponibilidadFechas = (fixture, campeonato) => {
  if (!fixture || fixture.length === 0) {
    throw new Error('Error: El fixture está vacío o no definido.');
  }

  console.log("Validando disponibilidad de fechas con fixture:", fixture); 

  const fechaInicio = moment(campeonato.fecha_inicio_campeonato);
  const fechaFin = moment(campeonato.fecha_fin_campeonato);

  let diasDisponibles = 0;
  let fechaActual = fechaInicio.clone();

  const horariosSabado = 10; 
  const horariosDomingo = 14; 

  while (fechaActual.isBefore(fechaFin) || fechaActual.isSame(fechaFin, 'day')) {
    if (fechaActual.isoWeekday() === 6) {
      diasDisponibles += horariosSabado;
    } else if (fechaActual.isoWeekday() === 7) {
      diasDisponibles += horariosDomingo;
    }
    fechaActual.add(1, 'days');
  }

  let totalPartidos = fixture.reduce((acc, jornada) => acc + jornada.length, 0);

  console.log(`Días disponibles: ${diasDisponibles}, Partidos requeridos: ${totalPartidos}`); // 📌 Depuración

  return diasDisponibles >= totalPartidos;
};

exports.getLugaresDisponibles = async () => {
  try {
    const lugares = await sequelize.query(`
      SELECT id, nombre 
      FROM Lugar
      WHERE eliminado IS NULL OR eliminado != 'S'
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    return lugares;
  } catch (error) {
    console.error("Error al obtener los complejos deportivos:", error);
    throw new Error("No se pudieron obtener los complejos deportivos.");
  }
};

exports.asignarLugaresAPartidos = async (partidos) => {
  let partidosConLugar = [];

  for (let partido of partidos) {
    let lugarDisponible = await buscarLugarAleatorioDisponible(partido.fecha.split(" ")[0], partido.fecha.split(" ")[1]);

    if (!lugarDisponible) {
      throw new Error(`No hay lugares disponibles para el partido ${partido.equipo_local_id} vs ${partido.equipo_visitante_id} en la fecha ${partido.fecha}`);
    }

    partidosConLugar.push({
      ...partido,
      lugar_id: lugarDisponible
    });
  }

  return partidosConLugar;
};

exports.getArbitrosDisponibles = async () => {
  try {
    const arbitros = await sequelize.query(`
      SELECT a.id ,p.nombre,p.apellido,imp.persona_imagen
      FROM Arbitro a
      INNER JOIN Persona p ON p.id = a.id
      LEFT JOIN ImagenPersona imp ON imp.persona_id = p.id
      WHERE activo = 1
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    if (!arbitros || arbitros.length === 0) {
      console.error("🚨 No hay árbitros disponibles.");
      throw new Error("No hay árbitros disponibles para asignar a los partidos.");
    }

    return arbitros;
  } catch (error) {
    console.error("🚨 Error al obtener árbitros disponibles:", error);
    throw new Error("Error al obtener los árbitros.");
  }
};

exports.asignarArbitrosAPartidos = async (partidos) => {
  const arbitros = await exports.getArbitrosDisponibles();

  if (!arbitros || arbitros.length < 2) {
      throw new Error("No hay suficientes árbitros disponibles para asignar a los partidos.");
  }

  let asignaciones = {}; 
  let arbitrosIndex = 0;
  
  for (let partido of partidos) {
      let fechaPartido = partido.fecha.split(' ')[0];
      let complejo = partido.lugar_id.id;

      if (!asignaciones[fechaPartido]) {
          asignaciones[fechaPartido] = {};
      }
      if (!asignaciones[fechaPartido][complejo]) {
          asignaciones[fechaPartido][complejo] = new Set();
      }

      let arbitrosAsignados = [];
      for (let i = 0; i < 2; i++) {
          arbitrosAsignados.push(arbitros[arbitrosIndex % arbitros.length]);
          arbitrosIndex++;
      }

      partido.arbitros = arbitrosAsignados;
  }

  return partidos;
};

const buscarLugarAleatorioDisponible = async (fecha, hora) => {
  const lugaresOcupados = await sequelize.query(
    `
    SELECT P.lugar_id, L.nombre
    FROM Partido P
    JOIN Lugar L ON P.lugar_id = L.id
    WHERE P.fecha = :fechaHora
  `,
    {
      replacements: { fechaHora: `${fecha} ${hora}:00` },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  const lugaresDisponibles = await exports.getLugaresDisponibles();

  const lugaresFiltrados = lugaresDisponibles.filter(
    (lugar) => !lugaresOcupados.some((ocupado) => ocupado.lugar_id === lugar.id)
  );

  if (lugaresFiltrados.length === 0) {
    return null; 
  }

  return lugaresFiltrados[Math.floor(Math.random() * lugaresFiltrados.length)];
};

exports.registrarPartidos = async (partidos, campeonatoId, categoriaId) => {
  const transaction = await sequelize.transaction();

  try {
    if (!partidos || partidos.length === 0) {
      throw new Error("No hay partidos para registrar.");
    }

    // Obtener la fecha de fin del campeonato
    const campeonato = await Campeonato.findByPk(campeonatoId);
    if (!campeonato) {
      throw new Error("El campeonato no existe.");
    }

    const fechaFinCampeonato = moment(campeonato.fecha_fin_campeonato);

    // Validar si hay partidos después de la fecha de fin del campeonato
    const partidosExcedenFecha = partidos.some((partido) =>
      moment(partido.fecha.split(" ")[0]).isAfter(fechaFinCampeonato)
    );

    if (partidosExcedenFecha) {
      throw new Error(
        "Los partidos generados exceden la fecha de fin del campeonato. Amplía el rango de fechas."
      );
    }

    console.log(`📌 Cambiando estado de partidos anteriores a 'Eliminado'...`);

    await Partido.update(
      { estado: partidoEstadosMapping.Eliminado },
      {
        where: { campeonato_id: campeonatoId, estado: partidoEstadosMapping.Confirmado },
        transaction,
      }
    );

    console.log(`📌 Asignando árbitros a los partidos...`);
    let partidosConArbitros = await exports.asignarArbitrosAPartidos(partidos);

    console.log(`📌 Registrando ${partidos.length} nuevos partidos con árbitros asignados...`);

    for (const partido of partidosConArbitros) {
      console.log('revisando el formato xd' ,partido.fecha);
      const fechaFormateada = moment(partido.fecha).format("YYYY-MM-DD HH:mm:ss");
      const partidoRegistrado = await Partido.create(
        {
          campeonato_id: campeonatoId,
          equipo_local_id: partido.equipo_local_id,
          equipo_visitante_id: partido.equipo_visitante_id,
          fecha: sequelize.literal(`'${fechaFormateada}'`),
          lugar_id: partido.lugar_id.id,
          estado: partidoEstadosMapping.Confirmado,
        },
        { transaction }
      );

      for (const arbitro of partido.arbitros) {
        await ArbitroPartido.create(
          {
            arbitro_id: arbitro.id,
            partido_id: partidoRegistrado.id,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();
    console.log("✅ Partidos y árbitros registrados correctamente.");
    return { message: "Partidos registrados exitosamente con árbitros asignados." };

  } catch (error) {
    console.error("🚨 Error al registrar partidos con árbitros:", error);
    await transaction.rollback();
    throw error; 
  }
};

exports.getPartidosByCampeonatoYFecha = async (campeonatoId,fecha) => {
  try {
    const resultPartidos = await sequelize.query(`
     SELECT 
    P.id AS partido_id,
    P.campeonato_id,
    P.equipo_local_id, 
    P.equipo_visitante_id, 
    P.fecha, 
    P.lugar_id, 
    EL.nombre AS equipo_local_nombre,
    EV.nombre AS equipo_visitante_nombre,
    ICL.club_imagen AS equipo_local_imagen,
    ICV.club_imagen AS equipo_visitante_imagen,
    C.nombre AS categoria_nombre,
    L.nombre AS lugar_nombre,
    STRING_AGG(PE.nombre, ', ') AS arbitros,
    P.estado
    FROM 
        Partido P
    JOIN 
        Equipo EL ON P.equipo_local_id = EL.id
    JOIN 
        Equipo EV ON P.equipo_visitante_id = EV.id
    JOIN 
        ImagenClub ICL ON EL.club_id = ICL.club_id
    JOIN 
        ImagenClub ICV ON EV.club_id = ICV.club_id
    JOIN 
        Categoria C ON EL.categoria_id = C.id
    JOIN 
        Lugar L ON P.lugar_id = L.id
    LEFT JOIN 
        Arbitro_Partido AP ON P.id = AP.partido_id
    LEFT JOIN 
        Arbitro A ON A.id = AP.arbitro_id
    LEFT JOIN 
        Persona PE ON PE.id = A.id
    WHERE 
        P.campeonato_id = :campeonatoId
        AND (P.estado IS NULL OR P.estado != 'J')
        AND CONVERT(DATE, P.fecha) = :fecha  -- Aquí pasamos la fecha específica
    GROUP BY 
        P.id, P.campeonato_id, P.equipo_local_id, P.equipo_visitante_id, P.fecha, 
        P.lugar_id, EL.nombre, EV.nombre, ICL.club_imagen, ICV.club_imagen, 
        C.nombre, L.nombre, P.estado
    ORDER BY 
        P.fecha ASC;
    `, {
      replacements: { campeonatoId ,fecha }, 
      type: sequelize.QueryTypes.SELECT 
    });

    return resultPartidos;
  } catch (error) {
    console.error('Error al obtener los partidos del campeonato:', error);
    throw new Error('Error al obtener los partidos del campeonato');
  }
};
