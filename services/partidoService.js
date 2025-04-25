const {
  Partido,
  Equipo,
  Lugar,
  Campeonato,
  ResultadoLocal,
  ResultadoVisitante,
  Tarjeta,
  ImagePlanilla,
  ArbitroPartido,
  Jugador,
  EquipoCampeonato
} = require('../models');
const sequelize = require('../config/sequelize');
const { uploadFile } = require('../utils/subirImagen');
const moment = require('moment');
const partidoEstadosMapping = require('../constants/estadoPartido');
const { Op } = require('sequelize');
const { broadcastPositionsUpdate } = require('../utils/websocket');
const { broadcastPartidoUpdate } = require('../utils/websocket');
const estadosMapping = require('../constants/campeonatoEstados');
const { ref, deleteObject } = require('firebase/storage');
const { storage } = require('../config/firebase');

exports.createPartido = async (data) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      campeonato_id,
      equipo_local_id,
      equipo_visitante_id,
      fecha,
      lugar_id,
      arbitros,
    } = data;

    // 🔍 Obtener el ID del campeonato activo (estado != 3)
    const campeonatoActivo = await Campeonato.findOne({
      where: { estado: { [Op.ne]: estadosMapping.campeonatoFinalizado } }, // Diferente de 3
      attributes: ['id'],
      raw: true,
    });

    if (!campeonatoActivo) {
      throw new Error('❌ No hay un campeonato activo disponible.');
    }

    // Validar si ya existe un partido entre estos dos equipos en este campeonato
    const partidoExistente = await Partido.findOne({
      where: {
        campeonato_id: campeonatoActivo.id,
        [Op.or]: [
          { equipo_local_id, equipo_visitante_id },
          {
            equipo_local_id: equipo_visitante_id,
            equipo_visitante_id: equipo_local_id,
          }, // Invertidos
        ],
      },
      raw: true,
    });

    if (partidoExistente) {
      throw new Error(
        '🚨 Ya existe un partido entre estos equipos en este campeonato.',
      );
    }

    // 🔄 Convertir la fecha al formato correcto
    const formattedFecha = moment(fecha).format('YYYY-MM-DD HH:mm:ss');

    // 🔹 Insertar el partido
    const result = await Partido.create(
      {
        campeonato_id: campeonatoActivo.id, // Asegurarse de usar el campeonato activo
        equipo_local_id,
        equipo_visitante_id,
        fecha: sequelize.fn(
          'CONVERT',
          sequelize.literal('DATETIME'),
          formattedFecha,
        ),
        lugar_id,
        estado: partidoEstadosMapping.Confirmado,
      },
      { transaction },
    );

    console.log('✅ Partido creado exitosamente:', result);

    // 🔹 Insertar los árbitros asociados al partido
    for (const arbitro_id of arbitros) {
      await ArbitroPartido.create(
        {
          arbitro_id,
          partido_id: result.id,
        },
        { transaction },
      );
    }

    await transaction.commit();
    return result;
  } catch (error) {
    console.error('❌ Error al crear el partido:', error);
    await transaction.rollback();
    throw error;
  }
};

exports.getPartidosByCategoriaId = async (categoriaId, campeonatoId) => {
  try {
    const resultPartidos = await sequelize.query(
      `
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
        C.nombre AS categoria_nombre,
        P.estado,
        L.nombre AS lugar_nombre
      FROM 
        Partido P
      JOIN Equipo EL ON P.equipo_local_id = EL.id
      JOIN Equipo EV ON P.equipo_visitante_id = EV.id
       LEFT JOIN ImagenClub ICL ON EL.club_id = ICL.club_id
       LEFT JOIN ImagenClub ICV ON EV.club_id = ICV.club_id
      JOIN EquipoCampeonato ECL ON ECL.equipoId = EL.id AND ECL.campeonatoId = P.campeonato_id
      JOIN EquipoCampeonato ECV ON ECV.equipoId = EV.id AND ECV.campeonatoId = P.campeonato_id
      JOIN Categoria C ON ECL.categoria_id = C.id
      JOIN Lugar L ON P.lugar_id = L.id
      WHERE 
        C.id = :categoriaId AND p.campeonato_id = :campeonatoId  AND p.estado != 'E'
      ORDER BY 
        P.fecha ASC;
    `,
      {
        replacements: { categoriaId, campeonatoId },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return resultPartidos;
  } catch (error) {
    console.error('Error al obtener los partidos:', error);
    throw new Error('Error al obtener los partidos');
  }
};

exports.getPartidosByEquipoId = async (EquipoId, campeonatoId) => {
  try {
    const resultPartidos = await sequelize.query(
      `
      SELECT 
        p.id AS partido_id,
        p.fecha,
        p.estado,
        c.id AS campeonato_id,
        c.nombre AS campeonato_nombre,
        el.nombre AS equipo_local,
        ev.nombre AS equipo_visitante,
        el.nombre AS equipo_local_nombre,
        ev.nombre AS equipo_visitante_nombre,
        ICL.club_imagen AS equipo_local_imagen,
        ICV.club_imagen AS equipo_visitante_imagen,
        L.nombre AS lugar_nombre,
        ECL.categoria_id
      FROM Partido p
      JOIN Campeonato c ON p.campeonato_id = c.id
      JOIN Equipo el ON p.equipo_local_id = el.id
      JOIN Equipo ev ON p.equipo_visitante_id = ev.id
      LEFT JOIN ImagenClub ICL ON el.club_id = ICL.club_id
      LEFT JOIN ImagenClub ICV ON ev.club_id = ICV.club_id
      JOIN Lugar L ON p.lugar_id = L.id
      JOIN EquipoCampeonato ECL ON ECL.equipoId = el.id AND ECL.campeonatoId = c.id
      WHERE 
        (p.equipo_local_id = :EquipoId OR p.equipo_visitante_id = :EquipoId)
        AND c.id = :campeonatoId;
    `,
      {
        replacements: { EquipoId, campeonatoId },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return resultPartidos;
  } catch (error) {
    console.error('Error al obtener los partidos:', error);
    throw new Error('Error al obtener los partidos');
  }
};

exports.getUpcomingMatchesByCategoria = async (categoriaId, CampeonatoId) => {
  try {
    const resultPartidos = await sequelize.query(
      `
     SELECT TOP 3 
        P.id, 
        P.fecha, 
        EL.nombre AS equipo_local_nombre, 
        EV.nombre AS equipo_visitante_nombre, 
        ICL.club_imagen AS equipo_local_imagen, 
        ICV.club_imagen AS equipo_visitante_imagen,
        P.estado 
      FROM Partido P
      JOIN Equipo EL ON P.equipo_local_id = EL.id
      JOIN Equipo EV ON P.equipo_visitante_id = EV.id
      LEFT JOIN ImagenClub ICL ON EL.club_id = ICL.club_id
      LEFT JOIN ImagenClub ICV ON EV.club_id = ICV.club_id
      JOIN EquipoCampeonato ECL ON ECL.equipoId = EL.id AND ECL.campeonatoId = P.campeonato_id
      JOIN EquipoCampeonato ECV ON ECV.equipoId = EV.id AND ECV.campeonatoId = P.campeonato_id
      WHERE 
        ECL.categoria_id = :categoriaId AND
        ECV.categoria_id = :categoriaId AND
        P.estado = 'C' AND 
        P.fecha >= GETDATE() AND 
        P.campeonato_id = :CampeonatoId
      ORDER BY P.fecha ASC;
    `,
      {
        replacements: { categoriaId, CampeonatoId },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return resultPartidos;
  } catch (error) {
    console.error('Error al obtener los próximos partidos:', error);
    throw new Error('Error al obtener los partidos');
  }
};

exports.getPastMatchesByCategoria = async (categoriaId, CampeonatoId) => {
  try {
    const resultPartidos = await sequelize.query(
      `
      SELECT TOP 3 
        P.id, 
        P.fecha, 
        EL.nombre AS equipo_local_nombre, 
        EV.nombre AS equipo_visitante_nombre, 
        ICL.club_imagen AS equipo_local_imagen, 
        ICV.club_imagen AS equipo_visitante_imagen,
        P.estado 
      FROM Partido P
      JOIN Equipo EL ON P.equipo_local_id = EL.id
      JOIN Equipo EV ON P.equipo_visitante_id = EV.id
      LEFT JOIN ImagenClub ICL ON EL.club_id = ICL.club_id
      LEFT JOIN ImagenClub ICV ON EV.club_id = ICV.club_id
      JOIN EquipoCampeonato ECL ON ECL.equipoId = EL.id AND ECL.campeonatoId = P.campeonato_id
      JOIN EquipoCampeonato ECV ON ECV.equipoId = EV.id AND ECV.campeonatoId = P.campeonato_id
      WHERE 
        ECL.categoria_id = :categoriaId AND
        ECV.categoria_id = :categoriaId AND
        (P.estado = 'J' OR P.fecha < GETDATE()) AND 
        P.campeonato_id = :CampeonatoId
      ORDER BY P.fecha DESC;
    `,
      {
        replacements: { categoriaId, CampeonatoId },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return resultPartidos;
  } catch (error) {
    console.error('Error al obtener los partidos jugados:', error);
    throw new Error('Error al obtener los partidos');
  }
};

exports.getLiveMatchesByCategoria = async (categoriaId, CampeonatoId) => {
  try {
    const resultPartidos = await sequelize.query(
      `
      SELECT 
        P.id, 
        P.fecha, 
        EL.nombre AS equipo_local_nombre, 
        EV.nombre AS equipo_visitante_nombre, 
        ICL.club_imagen AS equipo_local_imagen, 
        ICV.club_imagen AS equipo_visitante_imagen,
        P.estado 
      FROM Partido P
      JOIN Equipo EL ON P.equipo_local_id = EL.id
      JOIN Equipo EV ON P.equipo_visitante_id = EV.id
      LEFT JOIN ImagenClub ICL ON EL.club_id = ICL.club_id
      LEFT JOIN ImagenClub ICV ON EV.club_id = ICV.club_id
      JOIN EquipoCampeonato ECL ON ECL.equipoId = EL.id AND ECL.campeonatoId = P.campeonato_id
      JOIN EquipoCampeonato ECV ON ECV.equipoId = EV.id AND ECV.campeonatoId = P.campeonato_id
      WHERE 
        ECL.categoria_id = :categoriaId AND
        ECV.categoria_id = :categoriaId AND
        P.estado = 'V' AND
        P.campeonato_id = :CampeonatoId
      ORDER BY P.fecha ASC;
      `,
      {
        replacements: { categoriaId, CampeonatoId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return resultPartidos;
  } catch (error) {
    console.error('Error al obtener partidos en vivo:', error);
    throw new Error('Error al obtener partidos en vivo');
  }
};

exports.getAllMatchesExceptUpcoming = async (categoriaId, CampeonatoId) => {
  try {
    const resultPartidos = await sequelize.query(
      `
       SELECT 
          P.id, 
          P.fecha, 
          EL.nombre AS equipo_local_nombre, 
          EV.nombre AS equipo_visitante_nombre, 
          ICL.club_imagen AS equipo_local_imagen, 
          ICV.club_imagen AS equipo_visitante_imagen,
          P.estado 
        FROM Partido P
        JOIN Equipo EL ON P.equipo_local_id = EL.id
        JOIN Equipo EV ON P.equipo_visitante_id = EV.id
        LEFT JOIN ImagenClub ICL ON EL.club_id = ICL.club_id
        LEFT JOIN ImagenClub ICV ON EV.club_id = ICV.club_id
        JOIN EquipoCampeonato ECL ON ECL.equipoId = EL.id AND ECL.campeonatoId = P.campeonato_id
        JOIN EquipoCampeonato ECV ON ECV.equipoId = EV.id AND ECV.campeonatoId = P.campeonato_id
        WHERE 
          ECL.categoria_id = :categoriaId AND
          ECV.categoria_id = :categoriaId AND
          P.estado != 'J' AND 
          P.fecha >= GETDATE() AND 
          P.campeonato_id = :CampeonatoId AND
          P.id NOT IN (
            SELECT TOP 3 P2.id
            FROM Partido P2
            JOIN Equipo EL2 ON P2.equipo_local_id = EL2.id
            JOIN EquipoCampeonato EC2 ON EC2.equipoId = EL2.id AND EC2.campeonatoId = P2.campeonato_id
            WHERE 
              EC2.categoria_id = :categoriaId AND
              P2.estado != 'J' AND 
              P2.fecha >= GETDATE() AND 
              P2.campeonato_id = :CampeonatoId
            ORDER BY P2.fecha ASC
          )
        ORDER BY P.fecha ASC;

    `,
      {
        replacements: { categoriaId, CampeonatoId },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return resultPartidos;
  } catch (error) {
    console.error('Error al obtener los próximos partidos:', error);
    throw new Error('Error al obtener los partidos');
  }
};

exports.getAllMatchesExceptPrevious = async (categoriaId, CampeonatoId) => {
  try {
    const resultPartidos = await sequelize.query(
      `
      SELECT 
        P.id, 
        P.fecha, 
        EL.nombre AS equipo_local_nombre, 
        EV.nombre AS equipo_visitante_nombre, 
        ICL.club_imagen AS equipo_local_imagen, 
        ICV.club_imagen AS equipo_visitante_imagen,
        P.estado 
      FROM Partido P
      JOIN Equipo EL ON P.equipo_local_id = EL.id
      JOIN Equipo EV ON P.equipo_visitante_id = EV.id
      LEFT JOIN ImagenClub ICL ON EL.club_id = ICL.club_id
      LEFT  JOIN ImagenClub ICV ON EV.club_id = ICV.club_id
      JOIN EquipoCampeonato ECL ON ECL.equipoId = EL.id AND ECL.campeonatoId = P.campeonato_id
      JOIN EquipoCampeonato ECV ON ECV.equipoId = EV.id AND ECV.campeonatoId = P.campeonato_id
      WHERE 
        ECL.categoria_id = :categoriaId AND
        ECV.categoria_id = :categoriaId AND
        (P.estado = 'J' OR P.fecha < GETDATE()) AND 
        P.campeonato_id = :CampeonatoId AND
        P.id NOT IN (
          SELECT TOP 3 P2.id 
          FROM Partido P2
          JOIN Equipo EL2 ON P2.equipo_local_id = EL2.id
          JOIN EquipoCampeonato EC2 ON EC2.equipoId = EL2.id AND EC2.campeonatoId = P2.campeonato_id
          WHERE 
            EC2.categoria_id = :categoriaId AND
            (P2.estado = 'J' OR P2.fecha < GETDATE()) AND 
            P2.campeonato_id = :CampeonatoId
          ORDER BY P2.fecha DESC
        )
      ORDER BY P.fecha DESC;
    `,
      {
        replacements: { categoriaId, CampeonatoId },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return resultPartidos;
  } catch (error) {
    console.error('Error al obtener los partidos previos:', error);
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
      { model: Campeonato, as: 'campeonato', attributes: ['nombre'] },
    ],
  });
};

exports.updatePartido = async (id, data) => {
  const {
    campeonato_id,
    equipo_local_id,
    equipo_visitante_id,
    fecha,
    lugar_id,
    resultado,
  } = data;

  return await Partido.update(
    {
      campeonato_id,
      equipo_local_id,
      equipo_visitante_id,
      fecha,
      lugar_id,
      resultado,
    },
    { where: { id } },
  );
};

exports.deletePartido = async (id) => {
  return await Partido.update({ resultado: 'ELIMINADO' }, { where: { id } });
};

exports.submitTarjetas = async (partidoId, tarjetas, transaction) => {
  try {
    for (const tarjeta of tarjetas) {
      if (!tarjeta.equipoId || !tarjeta.tipoTarjeta) {
        throw new Error(
          'Equipo ID y tipo de tarjeta son obligatorios para cada tarjeta.',
        );
      }

      await Tarjeta.create(
        {
          partido_id: partidoId,
          equipo_id: tarjeta.equipoId,
          jugador_id: tarjeta.jugadorId,
          tipo_tarjeta: tarjeta.tipoTarjeta,
        },
        { transaction },
      );
    }
  } catch (error) {
    throw new Error('Error al registrar las tarjetas: ' + error.message);
  }
};

exports.getPartidoCompletoById = async (partidoId) => {
  try {
    const result = await sequelize.query(
      `
      SELECT 
        P.id AS partido_id,
        P.fecha,
        P.estado,
        L.id AS lugar_id,
        L.nombre AS lugar_nombre,
        L.longitud AS lugar_longitud,
        L.latitud AS lugar_latitud,
        EL.id AS equipo_local_id,
        EL.nombre AS equipo_local_nombre,
        ICL.club_imagen AS equipo_local_imagen,
        EV.id AS equipo_visitante_id,
        EV.nombre AS equipo_visitante_nombre,
        ICV.club_imagen AS equipo_visitante_imagen,
		    IMP.partido_image
      FROM Partido P
      JOIN Lugar L ON P.lugar_id = L.id
      JOIN Equipo EL ON P.equipo_local_id = EL.id
      JOIN Equipo EV ON P.equipo_visitante_id = EV.id
      LEFT JOIN ImagenClub ICL ON EL.club_id = ICL.club_id
      LEFT JOIN ImagenClub ICV ON EV.club_id = ICV.club_id
      LEFT JOIN ImagePlanilla IMP ON IMP.partido_id = P.id
      WHERE P.id = :partidoId;
    `,
      {
        replacements: { partidoId },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return result[0]; // Devuelve el primer resultado, ya que estamos buscando por ID
  } catch (error) {
    console.error('Error al obtener la información del partido:', error);
    throw new Error('Error al obtener la información del partido');
  }
};

exports.getJugadoresByEquipoAndCampeonato = async (equipoId, campeonatoId) => {
  try {
    const jugadores = await sequelize.query(
      `
      SELECT 
      J.id AS jugador_id,
      P.nombre AS jugador_nombre,
      P.apellido AS jugador_apellido
      FROM 
          JugadorEquipo JE
      JOIN 
          Jugador J ON JE.jugador_id = J.id
      JOIN 
          Persona P ON J.jugador_id = P.id
      WHERE 
          JE.equipo_id = :equipoId AND 
          JE.campeonato_id = :campeonatoId AND 
          P.eliminado = 'N';
    `,
      {
        replacements: { equipoId, campeonatoId },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return jugadores;
  } catch (error) {
    console.error(
      'Error al obtener los jugadores del equipo en el campeonato:',
      error,
    );
    throw new Error(
      'Error al obtener los jugadores del equipo en el campeonato',
    );
  }
};

exports.getArbitrosByPartidoId = async (partidoId) => {
  try {
    const arbitros = await sequelize.query(
      `
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
    `,
      {
        replacements: { partidoId },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return arbitros;
  } catch (error) {
    console.error('Error al obtener los árbitros del partido:', error);
    throw new Error('Error al obtener los árbitros del partido');
  }
};

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
    const partidos = await sequelize.query(
      `
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
    `,
      {
        replacements: { lugarId, fechaInicio, fechaFin },
        type: sequelize.QueryTypes.SELECT,
      },
    );

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
    const partidos = await sequelize.query(
      `
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
    `,
      {
        replacements: { fechaInicio, fechaFin },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return partidos;
  } catch (error) {
    console.error('Error en getPartidosByFecha:', error);
    throw new Error('Error al obtener los partidos por fecha');
  }
};

exports.getEquiposInscritos = async (campeonatoId, categoriaId) => {
  try {
    const equipos = await sequelize.query(
      `
      SELECT E.id, E.nombre,IC.club_imagen
      FROM EquipoCampeonato EC
      JOIN Equipo E ON EC.equipoId = E.id
      JOIN Club C ON C.id = E.club_id
      LEFT JOIN ImagenClub IC ON IC.club_id = C.id
      WHERE EC.campeonatoId = :campeonatoId
      AND EC.categoria_id = :categoriaId
      AND EC.estado = 'Inscrito'
    `,
      {
        replacements: { campeonatoId, categoriaId },
        type: sequelize.QueryTypes.SELECT,
      },
    );

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
  let tieneDescanso = false;

  // ✅ Si hay número impar de equipos, agregamos "Descanso"
  if (numEquipos % 2 !== 0) {
    equipos.push({ id: null, nombre: 'Descanso', club_imagen: null });
    numEquipos++;
    tieneDescanso = true;
    console.log('🔹 Se agregó un equipo \'Descanso\' para balancear la liga.');
  }

  console.log(
    '📋 Equipos iniciales:',
    equipos.map((e) => e.nombre),
  );

  let jornadas = numEquipos - 1;
  let equiposCopia = [...equipos];

  // 🔄 **Rotación de equipos usando el algoritmo Round Robin**
  for (let ronda = 0; ronda < jornadas; ronda++) {
    console.log(`\n🗓️ Generando jornada ${ronda + 1}`);
    let partidos = [];

    for (let i = 0; i < numEquipos / 2; i++) {
      let equipoLocal = equiposCopia[i];
      let equipoVisitante = equiposCopia[numEquipos - 1 - i];

      console.log(
        `🔄 Emparejando: ${equipoLocal.nombre} vs ${equipoVisitante.nombre}`,
      );

      if (equipoLocal.id !== null && equipoVisitante.id !== null) {
        partidos.push({
          equipo_local_id: equipoLocal.id,
          equipo_local: equipoLocal.nombre,
          equipo_local_img: equipoLocal.club_imagen,

          equipo_visitante_id: equipoVisitante.id,
          equipo_visitante: equipoVisitante.nombre,
          equipo_visitante_img: equipoVisitante.club_imagen,
        });
      } else {
        console.log(
          '⚠️ Partido omitido porque uno de los equipos es \'Descanso\'',
        );
      }
    }

    console.log(`📊 Partidos generados en la jornada ${ronda + 1}:`, partidos);
    fixture.push(partidos);

    // 🔁 **Rotación Round Robin: Mantener el primer equipo fijo y rotar el resto**
    let equipoFijo = equiposCopia[0];
    equiposCopia = [
      equipoFijo,
      ...equiposCopia.slice(-1),
      ...equiposCopia.slice(1, -1),
    ];

    console.log(
      '🔁 Nueva rotación de equipos:',
      equiposCopia.map((e) => e.nombre),
    );
  }

  console.log('\n✅ Fixture final generado:');
  console.log(JSON.stringify(fixture, null, 2));
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
        let fechaPartido = fechaActual.format('YYYY-MM-DD');

        // Definir horarios disponibles según el día
        let horariosDisponibles =
          fechaActual.isoWeekday() === 6
            ? [
              "12:00",
              "13:00",
              '14:00',
              '15:00',
              "16:00",
              '17:00',
              '18:00',
              "19:00",
              '20:00',
              "21:00",
              "22:00",
            ] // Sábado
            : [
              "08:00",
              '09:00',
              '10:00',
              "11:00",
              '12:00',
              "13:00",
              "14:00",
              '15:00',
              '16:00',
              "17:00",
              '18:00',
              "19:00",
              '20:00',
              "21:00",
              '22:00',
            ]; // Domingo

        // Registrar horarios ocupados y equipos que han jugado en la fecha
        if (!horariosPorFecha[fechaPartido]) {
          horariosPorFecha[fechaPartido] = new Set();
        }
        if (!equiposPorFecha[fechaPartido]) {
          equiposPorFecha[fechaPartido] = new Set();
        }

        // Verificar si los equipos ya jugaron en la fecha actual
        if (
          equiposPorFecha[fechaPartido].has(partido.equipo_local_id) ||
          equiposPorFecha[fechaPartido].has(partido.equipo_visitante_id)
        ) {
          // Si ya jugaron, avanzar al siguiente fin de semana
          do {
            fechaActual.add(1, 'days');
            fechaPartido = fechaActual.format('YYYY-MM-DD');
          } while (
            fechaActual.isoWeekday() !== 6 &&
            fechaActual.isoWeekday() !== 7
          );

          continue;
        }

        let horarioDisponible = horariosDisponibles.find(
          (h) => !horariosPorFecha[fechaPartido].has(h),
        );

        if (!horarioDisponible) {
          // Si no hay horarios disponibles, avanzar al siguiente fin de semana
          do {
            fechaActual.add(1, 'days');
          } while (
            fechaActual.isoWeekday() !== 6 &&
            fechaActual.isoWeekday() !== 7
          );
          continue;
        }

        let lugarDisponible = await buscarLugarAleatorioDisponible(
          fechaPartido,
          horarioDisponible,
        );

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
              nombre: lugarDisponible.nombre,
            },
            arbitros: [],
          });

          horariosPorFecha[fechaPartido].add(horarioDisponible);
          equiposPorFecha[fechaPartido].add(partido.equipo_local_id);
          equiposPorFecha[fechaPartido].add(partido.equipo_visitante_id);
          asignado = true;
        } else {
          do {
            fechaActual.add(1, 'days');
          } while (
            fechaActual.isoWeekday() !== 6 &&
            fechaActual.isoWeekday() !== 7
          );
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
  const fechaInicio = moment(campeonato.fecha_inicio_campeonato);
  const fechaFin = moment(campeonato.fecha_fin_campeonato);

  let diasDisponibles = 0;
  let fechaActual = fechaInicio.clone();

  const horariosSabado = 10;
  const horariosDomingo = 14;

  while (
    fechaActual.isBefore(fechaFin) ||
    fechaActual.isSame(fechaFin, 'day')
  ) {
    if (fechaActual.isoWeekday() === 6) {
      diasDisponibles += horariosSabado;
    } else if (fechaActual.isoWeekday() === 7) {
      diasDisponibles += horariosDomingo;
    }
    fechaActual.add(1, 'days');
  }

  let totalPartidos = fixture.reduce((acc, jornada) => acc + jornada.length, 0);

  return diasDisponibles >= totalPartidos;
};

exports.getLugaresDisponibles = async () => {
  try {
    const lugares = await sequelize.query(
      `
      SELECT id, nombre 
      FROM Lugar
      WHERE eliminado IS NULL OR eliminado != 'S'
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return lugares;
  } catch (error) {
    console.error('Error al obtener los complejos deportivos:', error);
    throw new Error('No se pudieron obtener los complejos deportivos.');
  }
};

exports.asignarLugaresAPartidos = async (partidos) => {
  let partidosConLugar = [];

  for (let partido of partidos) {
    let lugarDisponible = await buscarLugarAleatorioDisponible(
      partido.fecha.split(' ')[0],
      partido.fecha.split(' ')[1],
    );

    if (!lugarDisponible) {
      throw new Error(
        `No hay lugares disponibles para el partido ${partido.equipo_local_id} vs ${partido.equipo_visitante_id} en la fecha ${partido.fecha}`,
      );
    }

    partidosConLugar.push({
      ...partido,
      lugar_id: lugarDisponible,
    });
  }

  return partidosConLugar;
};

exports.getArbitrosDisponibles = async () => {
  try {
    const arbitros = await sequelize.query(
      `
      SELECT a.id ,p.nombre,p.apellido,imp.persona_imagen
      FROM Arbitro a
      INNER JOIN Persona p ON p.id = a.id
      LEFT JOIN ImagenPersona imp ON imp.persona_id = p.id
      WHERE activo = 1
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (!arbitros || arbitros.length === 0) {
      console.error('🚨 No hay árbitros disponibles.');
      throw new Error(
        'No hay árbitros disponibles para asignar a los partidos.',
      );
    }

    return arbitros;
  } catch (error) {
    console.error('🚨 Error al obtener árbitros disponibles:', error);
    throw new Error('Error al obtener los árbitros.');
  }
};

exports.asignarArbitrosAPartidos = async (partidos) => {
  try {
    console.log('🚀 Iniciando asignación de árbitros...');

    let arbitros = await exports.getArbitrosDisponibles();
    console.log('✅ Árbitros disponibles obtenidos:', arbitros);

    if (!arbitros || arbitros.length < 2) {
      throw new Error(
        'No hay suficientes árbitros disponibles para asignar a los partidos.',
      );
    }
    let lugaresAsignadosPorArbitro = {}; // <--- NUEVO: para rastrear lugar asignado por fecha
    let asignaciones = {}; // Objeto para rastrear asignaciones en memoria
    let contadorArbitros = {}; // Para contar partidos asignados en esta ejecución

    for (let partido of partidos) {
      let fechaPartido = partido.fecha.split(' ')[0]; // Extrae la fecha
      let horaPartido = partido.fecha.split(' ')[1]; // Extrae la hora
      let lugarId =
        typeof partido.lugar_id === 'object'
          ? partido.lugar_id.id
          : partido.lugar_id;

      console.log(
        `🎯 Procesando partido ID: ${partido.id} | Fecha: ${fechaPartido} | Hora: ${horaPartido} | Lugar: ${lugarId}`,
      );

      if (!asignaciones[fechaPartido]) {
        asignaciones[fechaPartido] = {};
      }
      if (!asignaciones[fechaPartido][lugarId]) {
        asignaciones[fechaPartido][lugarId] = new Set();
      }

      let arbitrosAsignados = [];

      for (let i = 0; i < 2; i++) {
        console.log(
          `🔍 Buscando árbitro disponible para el partido ID: ${partido.id}`,
        );

        let arbitroDisponible = null;
        for (let arbitro of arbitros) {
          // Validar si ya fue asignado en otro lugar el mismo día (en esta ejecución)
          if (
            lugaresAsignadosPorArbitro[arbitro.id] &&
            lugaresAsignadosPorArbitro[arbitro.id][fechaPartido] &&
            lugaresAsignadosPorArbitro[arbitro.id][fechaPartido] !== lugarId
          ) {
            console.log(`⚠️ Árbitro ${arbitro.id} ya fue asignado en otro lugar el mismo día.`);
            continue;
          }

          if (arbitrosAsignados.some((a) => a.id === arbitro.id)) {
            continue; // Evita asignar el mismo árbitro dos veces en el mismo partido
          }

          console.log(`👀 Verificando árbitro ID: ${arbitro.id}`);

          const partidosAsignados = await sequelize.query(
            `
              SELECT COUNT(*) AS cantidad
              FROM Arbitro_Partido ap
              INNER JOIN Partido p ON ap.partido_id = p.id
              WHERE ap.arbitro_id = :arbitro_id 
              AND CONVERT(DATE, p.fecha) = :fecha;
          `,
            {
              replacements: {
                arbitro_id: arbitro.id,
                fecha: fechaPartido,
              },
              type: sequelize.QueryTypes.SELECT,
            },
          );

          const cantidadPartidos =
            (partidosAsignados[0]?.cantidad || 0) +
            (contadorArbitros[arbitro.id]?.[fechaPartido] || 0);

          console.log(
            `📝 Árbitro ${arbitro.id} tiene ${cantidadPartidos} partidos en ${fechaPartido}`,
          );

          if (cantidadPartidos >= 8) {
            console.log(
              `⚠️ Árbitro ${arbitro.id} ya alcanzó el límite de 8 partidos en este día.`,
            );
            continue; // Saltar al siguiente árbitro
          }

          // Verificar si ya está asignado en el mismo día y otro lugar
          const existe = await sequelize.query(
            `
              SELECT TOP 1 p.id, p.fecha, p.lugar_id
              FROM Arbitro_Partido ap
              INNER JOIN Partido p ON ap.partido_id = p.id
              WHERE ap.arbitro_id = :arbitro_id 
              AND CONVERT(DATE, p.fecha) = :fecha
              AND p.lugar_id != :lugar_id;
          `,
            {
              replacements: {
                arbitro_id: arbitro.id,
                fecha: fechaPartido,
                lugar_id: lugarId,
              },
              type: sequelize.QueryTypes.SELECT,
            },
          );

          if (existe.length > 0) {
            console.log(
              `⚠️ Árbitro ${arbitro.id} ya está asignado en otro lugar el mismo día.`,
            );
            continue; // Saltar al siguiente árbitro
          }

          arbitroDisponible = arbitro;
          console.log(`✅ Árbitro ${arbitro.id} disponible para el partido.`);
          break;
        }

        if (!arbitroDisponible) {
          console.error(
            `❌ No hay árbitros disponibles para el partido en ${fechaPartido} en el lugar ${lugarId}`,
          );
          throw new Error(
            `No hay árbitros disponibles para el partido en ${fechaPartido} en el lugar ${lugarId}`,
          );
        }

        console.log(
          `✔️ Asignando árbitro ID: ${arbitroDisponible.id} al partido ID: ${partido.id}`,
        );

        arbitrosAsignados.push(arbitroDisponible);
        // Guardar lugar asignado en esta ejecución
        if (!lugaresAsignadosPorArbitro[arbitroDisponible.id]) {
          lugaresAsignadosPorArbitro[arbitroDisponible.id] = {};
        }
        lugaresAsignadosPorArbitro[arbitroDisponible.id][fechaPartido] = lugarId;

        asignaciones[fechaPartido][lugarId].add(arbitroDisponible.id);

        // Aumentar el contador de partidos asignados en este día
        if (!contadorArbitros[arbitroDisponible.id]) {
          contadorArbitros[arbitroDisponible.id] = {};
        }
        if (!contadorArbitros[arbitroDisponible.id][fechaPartido]) {
          contadorArbitros[arbitroDisponible.id][fechaPartido] = 0;
        }
        contadorArbitros[arbitroDisponible.id][fechaPartido]++;
      }

      partido.arbitros = arbitrosAsignados;
      console.log(
        `✅ Partido ID: ${partido.id} tiene asignados los árbitros:`,
        arbitrosAsignados,
      );
    }

    console.log('🎉 Asignación de árbitros completada con éxito.');
    return partidos;
  } catch (error) {
    console.error('❌ Error al asignar árbitros:', error);
    throw error;
  }
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
    },
  );

  const lugaresDisponibles = await exports.getLugaresDisponibles();

  const lugaresFiltrados = lugaresDisponibles.filter(
    (lugar) =>
      !lugaresOcupados.some((ocupado) => ocupado.lugar_id === lugar.id),
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
      throw new Error('No hay partidos para registrar.');
    }

    // 🔹 Obtener la fecha de fin del campeonato
    const campeonato = await Campeonato.findByPk(campeonatoId);
    if (!campeonato) {
      throw new Error('El campeonato no existe.');
    }

    const fechaFinCampeonato = moment(campeonato.fecha_fin_campeonato);

    // 🔹 Validar si hay partidos después de la fecha de fin del campeonato
    const partidosExcedenFecha = partidos.some((partido) =>
      moment(partido.fecha.split(' ')[0]).isAfter(fechaFinCampeonato),
    );

    if (partidosExcedenFecha) {
      throw new Error(
        'Los partidos generados exceden la fecha de fin del campeonato. Amplía el rango de fechas.',
      );
    }

    console.log(
      '📌 Verificando si hay partidos finalizados en la categoría...',
    );

    // 🔹 Buscar si hay partidos finalizados en el campeonato y la categoría
    const partidosExistentes = await sequelize.query(
      `
     SELECT p.id, p.estado 
      FROM Partido p
      JOIN EquipoCampeonato ec1 ON p.equipo_local_id = ec1.equipoId AND ec1.campeonatoId = p.campeonato_id
      JOIN EquipoCampeonato ec2 ON p.equipo_visitante_id = ec2.equipoId AND ec2.campeonatoId = p.campeonato_id
      WHERE p.campeonato_id = :campeonatoId
      AND ec1.categoria_id = :categoriaId
      AND ec2.categoria_id = :categoriaId

    `,
      {
        replacements: { campeonatoId, categoriaId },
        type: sequelize.QueryTypes.SELECT,
        transaction,
      },
    );

    const hayPartidosFinalizados = partidosExistentes.some(
      (p) => p.estado === partidoEstadosMapping.Finalizado,
    );

    if (hayPartidosFinalizados) {
      throw new Error(
        'No se pueden registrar nuevos partidos porque hay partidos finalizados en esta categoría. Solo se pueden posponer.',
      );
    }

    console.log('📌 Eliminando partidos confirmados de la categoría...');

    const partidosAEliminar = await sequelize.query(
      `
      SELECT p.id 
      FROM Partido p
      JOIN EquipoCampeonato ec1 ON p.equipo_local_id = ec1.equipoId AND ec1.campeonatoId = p.campeonato_id
      JOIN EquipoCampeonato ec2 ON p.equipo_visitante_id = ec2.equipoId AND ec2.campeonatoId = p.campeonato_id
      WHERE p.campeonato_id = :campeonatoId
      AND ec1.categoria_id = :categoriaId
      AND ec2.categoria_id = :categoriaId
      AND p.estado = :estadoConfirmado

      `,
      {
        replacements: {
          campeonatoId,
          categoriaId,
          estadoConfirmado: partidoEstadosMapping.Confirmado,
        },
        type: sequelize.QueryTypes.SELECT,
        transaction,
      },
    );

    const idsPartidosAEliminar = partidosAEliminar.map((p) => p.id);

    if (idsPartidosAEliminar.length > 0) {
      console.log(
        `📌 Eliminando ${idsPartidosAEliminar.length} partidos confirmados de la categoría...`,
      );

      await Partido.update(
        { estado: partidoEstadosMapping.Eliminado },
        {
          where: {
            id: idsPartidosAEliminar, // ✅ Ahora sí estamos eliminando solo los partidos de la categoría correcta
          },
          transaction,
        },
      );
    } else {
      console.log('📌 No hay partidos confirmados para eliminar.');
    }

    console.log('📌 Asignando árbitros a los partidos...');
    let partidosConArbitros = await exports.asignarArbitrosAPartidos(partidos);

    console.log(
      `📌 Registrando ${partidos.length} nuevos partidos con árbitros asignados...`,
    );

    for (const partido of partidosConArbitros) {
      console.log('revisando el formato xd', partido.fecha);
      const fechaFormateada = moment(partido.fecha).format(
        'YYYY-MM-DD HH:mm:ss',
      );
      const partidoRegistrado = await Partido.create(
        {
          campeonato_id: campeonatoId,
          equipo_local_id: partido.equipo_local_id,
          equipo_visitante_id: partido.equipo_visitante_id,
          fecha: sequelize.literal(`'${fechaFormateada}'`),
          lugar_id: partido.lugar_id.id,
          estado: partidoEstadosMapping.Confirmado,
        },
        { transaction },
      );

      for (const arbitro of partido.arbitros) {
        await ArbitroPartido.create(
          {
            arbitro_id: arbitro.id,
            partido_id: partidoRegistrado.id,
          },
          { transaction },
        );
      }
    }

    await transaction.commit();
    console.log('✅ Partidos y árbitros registrados correctamente.');
    return {
      message: 'Partidos registrados exitosamente con árbitros asignados.',
    };
  } catch (error) {
    console.error('🚨 Error al registrar partidos con árbitros:', error);
    await transaction.rollback();
    throw error;
  }
};

exports.getPartidosByCampeonatoYFecha = async (campeonatoId, fecha) => {
  try {
    const resultPartidos = await sequelize.query(
      `
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
    LEFT JOIN 
        ImagenClub ICL ON EL.club_id = ICL.club_id
    LEFT JOIN 
        ImagenClub ICV ON EV.club_id = ICV.club_id
    JOIN 
        Lugar L ON P.lugar_id = L.id
    JOIN 
        EquipoCampeonato EC ON EC.equipoId = EL.id AND EC.campeonatoId = P.campeonato_id
    JOIN 
        Categoria C ON EC.categoria_id = C.id
    LEFT JOIN 
        Arbitro_Partido AP ON P.id = AP.partido_id
    LEFT JOIN 
        Arbitro A ON A.id = AP.arbitro_id
    LEFT JOIN 
        Persona PE ON PE.id = A.id
    WHERE 
        P.campeonato_id = :campeonatoId
        AND (P.estado IS NULL OR P.estado != 'J')
        AND CONVERT(DATE, P.fecha) = :fecha
    GROUP BY 
        P.id, P.campeonato_id, P.equipo_local_id, P.equipo_visitante_id, P.fecha, 
        P.lugar_id, EL.nombre, EV.nombre, ICL.club_imagen, ICV.club_imagen, 
        C.nombre, L.nombre, P.estado
    ORDER BY 
        P.fecha ASC;
    `,
      {
        replacements: { campeonatoId, fecha },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return resultPartidos;
  } catch (error) {
    console.error('Error al obtener los partidos del campeonato:', error);
    throw new Error('Error al obtener los partidos del campeonato');
  }
};

exports.buscarNuevaFechaYHoraYLugarYArbitros = async (partido, campeonato) => {
  let fechaActual = moment(partido.fecha).add(1, 'days'); // 🔹 Iniciar desde la fecha actual del partido, no desde el inicio del campeonato
  const fechaFin = moment(campeonato.fecha_fin_campeonato);

  let horariosPorFecha = {};
  let equiposPorFecha = {};

  // 🔹 Asegurar que la primera fecha de búsqueda sea un sábado o domingo
  while (fechaActual.isoWeekday() !== 6 && fechaActual.isoWeekday() !== 7) {
    fechaActual.add(1, 'days');
  }

  while (
    fechaActual.isBefore(fechaFin) ||
    fechaActual.isSame(fechaFin, 'day')
  ) {
    let fechaPartido = fechaActual.format('YYYY-MM-DD');

    // 🔹 Definir horarios disponibles según el día (sábado o domingo)
    let horariosDisponibles =
      fechaActual.isoWeekday() === 6
        ? [
          "12:00",
          "13:00",
          "14:00",
          '15:00',
          "16:00",
          '17:00',
          "18:00",
          "19:00",
          "20:00",
          "21:00",
          "22:00",
        ]
        : [
          "08:00",
          "09:00",
          '10:00',
          "11:00",
          '12:00',
          "13:00",
          "14:00",
          '15:00',
          "16:00",
          '17:00',
          "18:00",
          "19:00",
          '20:00',
          "21:00",
          '22:00',
        ];

    if (!horariosPorFecha[fechaPartido]) {
      horariosPorFecha[fechaPartido] = new Set();
    }
    if (!equiposPorFecha[fechaPartido]) {
      equiposPorFecha[fechaPartido] = new Set();
    }

    // 🔹 Verificar si los equipos ya tienen partido ese día
    const partidosExistentes = await Partido.findAll({
      where: {
        fecha: { [Op.startsWith]: fechaPartido },
        [Op.or]: [
          { equipo_local_id: partido.equipo_local_id },
          { equipo_visitante_id: partido.equipo_visitante_id },
        ],
      },
    });

    if (partidosExistentes.length > 0) {
      console.log(
        `⚠️ ${partido.equipo_local_id} o ${partido.equipo_visitante_id} ya tiene partido el ${fechaPartido}. Buscando siguiente fecha...`,
      );
      do {
        fechaActual.add(1, 'days');
      } while (
        fechaActual.isoWeekday() !== 6 &&
        fechaActual.isoWeekday() !== 7
      );
      continue;
    }

    // 🔹 Buscar el primer horario disponible en esa fecha
    let horarioDisponible = horariosDisponibles.find(
      (h) => !horariosPorFecha[fechaPartido].has(h),
    );

    if (!horarioDisponible) {
      console.log(
        `⚠️ No hay horarios disponibles el ${fechaPartido}. Buscando siguiente fecha...`,
      );
      do {
        fechaActual.add(1, 'days');
      } while (
        fechaActual.isoWeekday() !== 6 &&
        fechaActual.isoWeekday() !== 7
      );
      continue;
    }

    // 🔹 Buscar un lugar disponible en esa fecha y horario
    let lugarDisponible = await buscarLugarAleatorioDisponible(
      fechaPartido,
      horarioDisponible,
    );

    if (lugarDisponible) {
      // 🔹 Obtener árbitros disponibles
      const partidoTemporal = {
        fecha: `${fechaPartido} ${horarioDisponible}:00`,
        lugar_id: lugarDisponible.id,
      };

      const partidosReprogramados = await exports.asignarArbitrosAPartidos([
        partidoTemporal,
      ]);

      if (
        !partidosReprogramados ||
        partidosReprogramados.length === 0 ||
        !partidosReprogramados[0].arbitros
      ) {
        throw new Error(
          'No se encontraron árbitros disponibles para este partido reprogramado.',
        );
      }

      const arbitrosAsignados = partidosReprogramados[0].arbitros;

      console.log(
        `✅ Partido reprogramado: ${fechaPartido} a las ${horarioDisponible} en ${lugarDisponible.nombre}`,
      );
      return {
        nuevaFechaHora: `${fechaPartido} ${horarioDisponible}:00`,
        nuevoLugar: lugarDisponible,
        arbitrosAsignados,
      };
    }

    // 🔹 Si no se encontró lugar disponible, pasar al siguiente fin de semana
    console.log(
      `⚠️ No hay lugar disponible en ${fechaPartido} a las ${horarioDisponible}. Buscando siguiente fecha...`,
    );
    do {
      fechaActual.add(1, 'days');
    } while (fechaActual.isoWeekday() !== 6 && fechaActual.isoWeekday() !== 7);
  }

  throw new Error(
    'No hay fechas disponibles dentro del rango del campeonato. Amplíe la fecha de fin del campeonato.',
  );
};

exports.reprogramarPartido = async (partidoId) => {
  try {
    const partido = await Partido.findByPk(partidoId);
    if (!partido) {
      throw new Error('Partido no encontrado.');
    }

    if (partido.estado === partidoEstadosMapping.Finalizado) {
      throw new Error(
        'El partido ya ha finalizado y no puede ser reprogramado.',
      );
    }

    const campeonato = await Campeonato.findByPk(partido.campeonato_id);
    if (!campeonato) {
      throw new Error('El campeonato del partido no existe.');
    }

    const fechaInicioCampeonato = campeonato.fecha_inicio_campeonato;
    const fechaFinCampeonato = campeonato.fecha_fin_campeonato;

    const datosCampeonato = {
      fecha_inicio_campeonato: fechaInicioCampeonato,
      fecha_fin_campeonato: fechaFinCampeonato,
    };

    const resultadoSimulacion =
      await exports.buscarNuevaFechaYHoraYLugarYArbitros(
        partido,
        datosCampeonato,
      );

    return {
      message: 'Simulación de reprogramación exitosa',
      nuevaFechaHora: resultadoSimulacion.nuevaFechaHora,
      nuevoLugar: resultadoSimulacion.nuevoLugar,
      arbitrosAsignados: resultadoSimulacion.arbitrosAsignados,
    };
  } catch (error) {
    console.error('Error al reprogramar el partido:', error);
    throw new Error(error.message);
  }
};

exports.confirmarReprogramacionPartido = async (
  partidoId,
  nuevaFechaHora,
  nuevoLugar,
  arbitrosAsignados,
) => {
  console.log(
    `🔄 Iniciando transacción para reprogramar el partido ID: ${partidoId}`,
  );
  const transaction = await sequelize.transaction();

  try {
    console.log('📌 Buscando partido en la base de datos...');
    const partido = await Partido.findByPk(partidoId, { transaction });

    if (!partido) {
      console.error(`❌ Partido con ID ${partidoId} no encontrado.`);
      throw new Error('Partido no encontrado.');
    }

    console.log(`✅ Partido encontrado: ${JSON.stringify(partido)}`);
    console.log(
      `📆 Nueva fecha y hora: ${nuevaFechaHora}, 📍 Nuevo lugar: ${JSON.stringify(nuevoLugar)}`,
    );
    const fechaFormateada = moment(nuevaFechaHora).format(
      'YYYY-MM-DD HH:mm:ss',
    );
    partido.fecha = sequelize.literal(`'${fechaFormateada}'`);
    partido.lugar_id = nuevoLugar.id;
    console.log('🔄 Guardando cambios en el partido...');
    await partido.save({ transaction });

    console.log('🗑 Eliminando árbitros anteriores...');
    await ArbitroPartido.destroy({
      where: { partido_id: partidoId },
      transaction,
    });

    console.log('✅ Árbitros anteriores eliminados.');

    console.log('🆕 Asignando nuevos árbitros...');
    for (const arbitro of arbitrosAsignados) {
      console.log(
        `👤 Asignando árbitro ID: ${arbitro.id} (${arbitro.nombre} ${arbitro.apellido})`,
      );
      await ArbitroPartido.create(
        {
          partido_id: partidoId,
          arbitro_id: arbitro.id,
        },
        { transaction },
      );
    }

    console.log('✅ Todos los árbitros asignados correctamente.');

    console.log('✅ Confirmando transacción...');
    await transaction.commit();

    console.log('🎉 Partido reprogramado exitosamente.');

    return {
      message: 'Partido reprogramado exitosamente',
      partido,
      arbitrosAsignados,
    };
  } catch (error) {
    console.error(`🚨 Error durante la reprogramación: ${error.message}`);

    if (transaction) {
      console.log('⏪ Realizando rollback de la transacción...');
      await transaction.rollback();
    }

    throw new Error(error.message);
  }
};

exports.obtenerResultadosPartido = async (partidoId) => {
  try {
    console.log(`🔍 Buscando información del partido ID: ${partidoId}`);

    const partidoIdNumerico = Number(partidoId);
    if (isNaN(partidoIdNumerico)) {
      throw new Error('El ID del partido debe ser un número válido.');
    }

    const query = `
      SELECT DISTINCT
        p.id AS partido_id,
        t.equipo_id AS equipo_tarjeta_id,
        el.nombre AS equipo_local,
        ev.nombre AS equipo_visitante,
        p.fecha,
        rl.set1 AS local_set1, rl.set2 AS local_set2, rl.set3 AS local_set3, rl.resultado AS local_resultado, rl.walkover AS local_walkover,
        rv.set1 AS visitante_set1, rv.set2 AS visitante_set2, rv.set3 AS visitante_set3, rv.resultado AS visitante_resultado, rv.walkover AS visitante_walkover,
        t.id AS tarjeta_id, t.jugador_id AS jugador_tarjeta_id, e.nombre AS equipo_tarjeta, pe.nombre AS jugador_nombre, pe.apellido AS jugador_apellido, t.tipo_tarjeta,
        ip.partido_image AS imagen_planilla
      FROM Partido p
      JOIN Equipo el ON p.equipo_local_id = el.id
      JOIN Equipo ev ON p.equipo_visitante_id = ev.id
      LEFT JOIN ResultadoLocal rl ON p.id = rl.partido_id
      LEFT JOIN ResultadoVisitante rv ON p.id = rv.partido_id
      LEFT JOIN Tarjeta t ON p.id = t.partido_id
      LEFT JOIN Equipo e ON t.equipo_id = e.id
      LEFT JOIN Jugador j ON t.jugador_id = j.id
      LEFT JOIN Persona pe ON pe.id = j.jugador_id
      LEFT JOIN ImagePlanilla ip ON ip.partido_id = p.id
      WHERE p.id = :partidoId;
    `;

    const resultados = await sequelize.query(query, {
      replacements: { partidoId: partidoIdNumerico },
      type: sequelize.QueryTypes.SELECT,
    });

    if (resultados.length === 0) {
      throw new Error('No se encontraron datos para el partido proporcionado.');
    }

    const partidoInfo = {
      partido_id: resultados[0].partido_id,
      equipo_local: resultados[0].equipo_local,
      equipo_visitante: resultados[0].equipo_visitante,
      fecha: resultados[0].fecha,
      imagenPlanilla: resultados[0].imagen_planilla || null,
      resultadoLocal:
        resultados[0].local_set1 !== null
          ? {
              set1: resultados[0].local_set1,
              set2: resultados[0].local_set2,
              set3: resultados[0].local_set3,
              resultado: resultados[0].local_resultado,
              walkover: resultados[0].local_walkover?.trim(),
            }
          : null,
      resultadoVisitante:
        resultados[0].visitante_set1 !== null
          ? {
              set1: resultados[0].visitante_set1,
              set2: resultados[0].visitante_set2,
              set3: resultados[0].visitante_set3,
              resultado: resultados[0].visitante_resultado,
              walkover: resultados[0].visitante_walkover?.trim(),
            }
          : null,
      tarjetas: resultados
        .filter((r) => r.tarjeta_id !== null)
        .map((r) => ({
          equipoId: r.equipo_tarjeta_id,
          equipo: r.equipo_tarjeta,
          jugador_tarjeta_id: r.jugador_tarjeta_id,
          jugador: r.jugador_nombre
            ? `${r.jugador_nombre} ${r.jugador_apellido}`
            : 'Sin jugador asignado',
          tipo_tarjeta: r.tipo_tarjeta,
        })),
    };

    return partidoInfo;
  } catch (error) {
    console.error('🚨 Error al obtener los resultados del partido:', error);
    throw new Error(error.message);
  }
};

exports.obtenerGanadorPartido = async (partidoId) => {
  try {
    console.log(`🔍 Buscando resultado del partido ID: ${partidoId}`);

    const partidoIdNumerico = Number(partidoId);
    if (isNaN(partidoIdNumerico)) {
      throw new Error('El ID del partido debe ser un número válido.');
    }

    // 🔹 Consulta SQL para obtener los resultados del partido
    const query = `
      SELECT 
        rl.walkover AS walkover_local, 
        rv.walkover AS walkover_visitante,
        rl.set1 AS local_set1, rl.set2 AS local_set2, rl.set3 AS local_set3, rl.resultado AS resultado_local,
        rv.set1 AS visitante_set1, rv.set2 AS visitante_set2, rv.set3 AS visitante_set3, rv.resultado AS resultado_visitante,
        el.nombre AS equipo_local, ev.nombre AS equipo_visitante
      FROM Partido p
      JOIN Equipo el ON p.equipo_local_id = el.id
      JOIN Equipo ev ON p.equipo_visitante_id = ev.id
      LEFT JOIN ResultadoLocal rl ON p.id = rl.partido_id
      LEFT JOIN ResultadoVisitante rv ON p.id = rv.partido_id
      WHERE p.id = :partidoId;
    `;

    const resultados = await sequelize.query(query, {
      replacements: { partidoId: partidoIdNumerico },
      type: sequelize.QueryTypes.SELECT,
    });

    if (resultados.length === 0) {
      throw new Error('No se encontraron datos para el partido proporcionado.');
    }

    const resultado = resultados[0];

    // 🔹 Verificar si hay walkover
    if (
      resultado.walkover_local !== null &&
      resultado.walkover_visitante !== null
    ) {
      let tipoWalkover = resultado.walkover_local; // Ambas tablas contienen el mismo valor de walkover

      let resultadoFinal = {
        partido_id: partidoId,
        equipo_local: resultado.equipo_local,
        equipo_visitante: resultado.equipo_visitante,
        walkover: tipoWalkover.trim(), // Puede ser 'L', 'V' o 'both'
      };

      console.log('✅ Walkover detectado:', resultadoFinal);
      return resultadoFinal;
    }

    // 🔹 Si no hay walkover, calcular el ganador según los sets
    let setsGanadosLocal = 0;
    let setsGanadosVisitante = 0;

    const sets = [
      { local: resultado.local_set1, visitante: resultado.visitante_set1 },
      { local: resultado.local_set2, visitante: resultado.visitante_set2 },
      { local: resultado.local_set3, visitante: resultado.visitante_set3 },
    ];
    
    for (const set of sets) {
      if (
        typeof set.local === "number" &&
        typeof set.visitante === "number"
      ) {
        if (set.local > set.visitante) {
          setsGanadosLocal++;
        } else if (set.visitante > set.local) {
          setsGanadosVisitante++;
        }
      }
    }    

    // Definir el resultado final basado en sets ganados
    let resultadoFinal = {
      partido_id: partidoId,
      equipo_local: resultado.equipo_local,
      equipo_visitante: resultado.equipo_visitante,
      marcador: `${setsGanadosLocal}-${setsGanadosVisitante}`, // Ejemplo: "2-1"
      ganador:
        setsGanadosLocal > setsGanadosVisitante
          ? resultado.equipo_local
          : resultado.equipo_visitante,
    };

    console.log('✅ Resultado calculado:', resultadoFinal);
    return resultadoFinal;
  } catch (error) {
    console.error('🚨 Error al obtener el resultado del partido:', error);
    throw new Error(error.message);
  }
};

exports.obtenerFechasDisponiblesPorLugar = async (lugar_id) => {
  try {
    console.log(`🔍 Buscando fechas disponibles para el lugar ID: ${lugar_id}`);

    // Obtener el campeonato activo
    const campeonato = await Campeonato.findOne({
      where: { estado: { [Op.ne]: estadosMapping.campeonatoFinalizado } },
      attributes: ['id', 'fecha_inicio_campeonato', 'fecha_fin_campeonato'],
    });

    if (!campeonato) {
      throw new Error('❌ No se encontró un campeonato activo.');
    }

    const fechaInicio = moment(campeonato.fecha_inicio_campeonato);
    const fechaFin = moment(campeonato.fecha_fin_campeonato);

    if (!fechaInicio.isValid() || !fechaFin.isValid()) {
      throw new Error('❌ Fechas del campeonato no válidas.');
    }

    console.log(
      `📅 Rango del campeonato: ${fechaInicio.format('YYYY-MM-DD')} - ${fechaFin.format('YYYY-MM-DD')}`,
    );

    // Obtener las fechas ocupadas
    const partidosOcupados = await Partido.findAll({
      attributes: ['fecha'],
      where: { campeonato_id: campeonato.id, lugar_id },
      raw: true,
    });

    let fechasOcupadas = new Set(
      partidosOcupados.map((p) => moment(p.fecha).format('YYYY-MM-DD')),
    );

    // Generar todas las fechas disponibles
    let fechasDisponibles = [];
    let fechaIterador = fechaInicio.clone();

    while (fechaIterador.isSameOrBefore(fechaFin)) {
      const fechaStr = fechaIterador.format('YYYY-MM-DD');

      if (
        (fechaIterador.isoWeekday() === 6 ||
          fechaIterador.isoWeekday() === 7) &&
        !fechasOcupadas.has(fechaStr)
      ) {
        fechasDisponibles.push(fechaStr);
      }

      fechaIterador.add(1, 'day');
    }

    console.log('✅ Fechas disponibles:', fechasDisponibles);
    return fechasDisponibles;
  } catch (error) {
    console.error('❌ Error al obtener fechas disponibles:', error);
    throw error;
  }
};

exports.obtenerHorariosDisponiblesPorFechaYLugar = async (lugar_id, fecha) => {
  try {
    console.log(
      `🔍 Buscando horarios disponibles para el lugar ID: ${lugar_id} en la fecha: ${fecha}`,
    );

    // Verificar si la fecha es sábado o domingo
    const fechaMoment = moment(fecha, 'YYYY-MM-DD');
    if (fechaMoment.isoWeekday() !== 6 && fechaMoment.isoWeekday() !== 7) {
      throw new Error(
        '❌ Solo se pueden consultar horarios para sábados y domingos.',
      );
    }

    // Definir los horarios disponibles según el día
    let horariosDisponibles =
      fechaMoment.isoWeekday() === 6
        ? [
          '12:00',
          "13:00",
          '14:00',
          "15:00",
          '16:00',
          "17:00",
          "18:00",
          "19:00",
          "20:00",
          "21:00",
          '22:00',
        ]
        : [
          '08:00',
          "09:00",
          "10:00",
          '11:00',
          "12:00",
          '13:00',
          "14:00",
          '15:00',
          "16:00",
          '17:00',
          "18:00",
          '19:00',
          "20:00",
          "21:00",
          '22:00',
        ];

    // Obtener horarios ocupados en la fecha
    const partidosEnFecha = await Partido.findAll({
      attributes: ['fecha'],
      where: {
        lugar_id,
        fecha: { [Op.startsWith]: fecha },
      },
      raw: true,
    });

    // Extraer horarios ocupados
    let horariosOcupados = new Set(
      partidosEnFecha.map((p) => moment(p.fecha).format('HH:mm')),
    );

    // Filtrar horarios disponibles
    let horariosLibres = horariosDisponibles.filter(
      (h) => !horariosOcupados.has(h),
    );

    console.log('✅ Horarios disponibles:', horariosLibres);
    return horariosLibres;
  } catch (error) {
    console.error('❌ Error al obtener horarios disponibles:', error);
    throw error;
  }
};

exports.getArbitrosDisponiblesPorFechaYLugar = async (
  fecha,
  hora,
  lugar_id,
) => {
  try {
    console.log(
      `🔍 Buscando árbitros disponibles para la fecha: ${fecha}, hora: ${hora} y el lugar ID: ${lugar_id}`,
    );

    // Obtener todos los árbitros activos
    const arbitrosDisponibles = await sequelize.query(
      `
      SELECT a.id, p.nombre, p.apellido, imp.persona_imagen
      FROM Arbitro a
      INNER JOIN Persona p ON p.id = a.id
      LEFT JOIN ImagenPersona imp ON imp.persona_id = p.id
      WHERE activo = 1
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (!arbitrosDisponibles || arbitrosDisponibles.length === 0) {
      console.error('🚨 No hay árbitros disponibles.');
      throw new Error(
        'No hay árbitros disponibles para asignar a los partidos.',
      );
    }

    // 🛑 1. Excluir árbitros si ya tienen un partido en el MISMO LUGAR y a la MISMA HORA
    const arbitrosOcupadosMismoLugarHora = await sequelize.query(
      `
      SELECT DISTINCT ap.arbitro_id
      FROM Arbitro_Partido ap
      INNER JOIN Partido p ON ap.partido_id = p.id
      WHERE p.fecha = CONCAT(:fecha, ' ', :hora) 
      AND p.lugar_id = :lugar_id
    `,
      {
        replacements: { fecha, hora, lugar_id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const arbitrosOcupadosMismoLugarHoraSet = new Set(
      arbitrosOcupadosMismoLugarHora.map((a) => a.arbitro_id),
    );

    // 🛑 2. Excluir árbitros si ya tienen un partido en OTRO LUGAR a la MISMA FECHA Y HORA
    const arbitrosOcupadosOtroLugarMismaHora = await sequelize.query(
      `
      SELECT DISTINCT ap.arbitro_id
      FROM Arbitro_Partido ap
      INNER JOIN Partido p ON ap.partido_id = p.id
      WHERE p.fecha = CONCAT(:fecha, ' ', :hora)
      AND p.lugar_id != :lugar_id
    `,
      {
        replacements: { fecha, hora, lugar_id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const arbitrosOcupadosOtroLugarMismaHoraSet = new Set(
      arbitrosOcupadosOtroLugarMismaHora.map((a) => a.arbitro_id),
    );

    // 🛑 3. Excluir árbitros si ya tienen 8 partidos en la MISMA FECHA y el MISMO LUGAR
    const arbitrosConCantidadPartidos = await sequelize.query(
      `
      SELECT ap.arbitro_id, COUNT(p.id) AS cantidad
      FROM Arbitro_Partido ap
      INNER JOIN Partido p ON ap.partido_id = p.id
      WHERE CONVERT(DATE, p.fecha) = :fecha 
      AND p.lugar_id = :lugar_id
      GROUP BY ap.arbitro_id
    `,
      {
        replacements: { fecha, lugar_id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const arbitrosCon8Partidos = new Set(
      arbitrosConCantidadPartidos
        .filter((a) => a.cantidad >= 8)
        .map((a) => a.arbitro_id),
    );

    console.log('🚨 Árbitros ocupados en este lugar y hora:', [
      ...arbitrosOcupadosMismoLugarHoraSet,
    ]);
    console.log(
      '🚨 Árbitros con partidos en otro lugar a la misma fecha y hora:',
      [...arbitrosOcupadosOtroLugarMismaHoraSet],
    );
    console.log('🚨 Árbitros con 8 partidos asignados en este lugar:', [
      ...arbitrosCon8Partidos,
    ]);

    // 🏆 Filtrar árbitros disponibles correctamente
    const arbitrosFiltrados = arbitrosDisponibles.filter(
      (a) =>
        !arbitrosOcupadosMismoLugarHoraSet.has(a.id) && // Si ya tiene un partido en el mismo lugar y hora
        !arbitrosOcupadosOtroLugarMismaHoraSet.has(a.id) && // Si ya tiene un partido en otro lugar en la misma fecha y hora
        !arbitrosCon8Partidos.has(a.id), // Si ya tiene 8 partidos en el mismo día y lugar
    );

    console.log(
      '✅ Árbitros disponibles después de validaciones:',
      arbitrosFiltrados,
    );
    return arbitrosFiltrados;
  } catch (error) {
    console.error('❌ Error al obtener árbitros disponibles:', error);
    throw new Error('Error al obtener los árbitros.');
  }
};

exports.updateResultadoSets = async ({
  partido_id,
  resultadoLocal,
  resultadoVisitante,
  walkover = null,
}) => {
  console.log("hHaciendo la prueba nomas",partido_id, resultadoLocal, resultadoVisitante, walkover);
  const transaction = await sequelize.transaction();

  // Obtener resultados ya registrados
  const local = await ResultadoLocal.findOne({ where: { partido_id } });
  const visitante = await ResultadoVisitante.findOne({ where: { partido_id } });

  const isSetRegistrado = (setL, setV) => {
    return (
      setL !== null &&
      setL !== undefined &&
      setL !== '' &&
      setV !== null &&
      setV !== undefined &&
      setV !== ''
    );
  };

  const validarOrdenDeRegistro = () => {
    const setsBDLocal = [local?.set1, local?.set2, local?.set3];
    const setsBDVisitante = [visitante?.set1, visitante?.set2, visitante?.set3];
  
    console.log("📥 setsBDLocal:", setsBDLocal);
    console.log("📥 setsBDVisitante:", setsBDVisitante);
  
    const set1Nuevo = resultadoLocal.set1 !== '' && resultadoLocal.set1 != null ||
                      resultadoVisitante.set1 !== '' && resultadoVisitante.set1 != null;
    const set1YaRegistrado = isSetRegistrado(setsBDLocal[0], setsBDVisitante[0]);
  
    const set2Nuevo = resultadoLocal.set2 !== '' && resultadoLocal.set2 != null ||
                      resultadoVisitante.set2 !== '' && resultadoVisitante.set2 != null;
    const set2YaRegistrado = isSetRegistrado(setsBDLocal[1], setsBDVisitante[1]);
  
    const set3Nuevo = resultadoLocal.set3 !== '' && resultadoLocal.set3 != null ||
                      resultadoVisitante.set3 !== '' && resultadoVisitante.set3 != null;
  
    console.log("🔍 Set 1 nuevo:", set1Nuevo);
    console.log("🔍 Set 1 ya registrado:", set1YaRegistrado);
    console.log("🔍 Set 2 nuevo:", set2Nuevo);
    console.log("🔍 Set 2 ya registrado:", set2YaRegistrado);
    console.log("🔍 Set 3 nuevo:", set3Nuevo);
  
    if (set2Nuevo && !(set1Nuevo || set1YaRegistrado)) {
      throw new Error("No se puede registrar el Set 2 sin haber registrado primero el Set 1.");
    }
  
    if (set3Nuevo && !(set2Nuevo || set2YaRegistrado)) {
      throw new Error("No se puede registrar el Set 3 sin haber registrado primero el Set 2.");
    }
  };
  

  const validarSet = (a, b, maximo) => {
    a = parseInt(a);
    b = parseInt(b);
    if (isNaN(a) || isNaN(b)) return true;
  
    const mayor = Math.max(a, b);
    const menor = Math.min(a, b);
    const diferencia = Math.abs(a - b);

    if (mayor > maximo && menor < maximo && diferencia >= 2) {
      return false; 
    }

    if (a >= maximo - 1 && b >= maximo - 1) {
      return diferencia === 2;
    }
  
    return mayor >= maximo && diferencia >= 2;
  };

  const validarResultados = () => {
    const sets = [
      [resultadoLocal.set1, resultadoVisitante.set1, 25, "Set 1"],
      [resultadoLocal.set2, resultadoVisitante.set2, 25, "Set 2"],
      [resultadoLocal.set3, resultadoVisitante.set3, 15, "Set 3"],
    ];
    for (const [a, b, max, nombre] of sets) {
      const ambosCero = (!a || a === 0) && (!b || b === 0);
      if (ambosCero) continue;
      if (!validarSet(a, b, max)) {
        throw new Error(`${nombre} inválido: el ganador debe tener mínimo ${max} puntos y una diferencia de al menos 2 puntos. Resultado actual: ${a}-${b}`);
      }
    }
  };

  try {
    const walkoverValue = walkover === '' ? null : walkover;

    if (!local) {
      await ResultadoLocal.create(
        {
          partido_id,
          set1: resultadoLocal.set1 !== "" && resultadoLocal.set1 !== undefined ? resultadoLocal.set1 : null,
          set2: resultadoLocal.set2 !== "" && resultadoLocal.set2 !== undefined ? resultadoLocal.set2 : null,
          set3: resultadoLocal.set3 !== "" && resultadoLocal.set3 !== undefined ? resultadoLocal.set3 : null,
          walkover: walkoverValue,
        },
        { transaction },
      );      
    } else {
      await local.update(
        {
          set1: resultadoLocal.set1 !== '' && resultadoLocal.set1 !== undefined ? resultadoLocal.set1 : null,
          set2: resultadoLocal.set2 !== '' && resultadoLocal.set2 !== undefined ? resultadoLocal.set2 : null,
          set3: resultadoLocal.set3 !== '' && resultadoLocal.set3 !== undefined ? resultadoLocal.set3 : null,
          walkover: walkoverValue,
        },
        { transaction }
      );
          
    }

    if (!visitante) {
      await ResultadoVisitante.create(
        {
          partido_id,
          set1: resultadoVisitante.set1 !== "" && resultadoVisitante.set1 !== undefined ? resultadoVisitante.set1 : null,
          set2: resultadoVisitante.set2 !== "" && resultadoVisitante.set2 !== undefined ? resultadoVisitante.set2 : null,
          set3: resultadoVisitante.set3 !== "" && resultadoVisitante.set3 !== undefined ? resultadoVisitante.set3 : null,
          walkover: walkoverValue,
        },
        { transaction },
      );      
    } else {
      await visitante.update(
        {
          set1: resultadoVisitante.set1 !== '' && resultadoVisitante.set1 !== undefined ? resultadoVisitante.set1 : null,
          set2: resultadoVisitante.set2 !== '' && resultadoVisitante.set2 !== undefined ? resultadoVisitante.set2 : null,
          set3: resultadoVisitante.set3 !== '' && resultadoVisitante.set3 !== undefined ? resultadoVisitante.set3 : null,
          walkover: walkoverValue,
        },
        { transaction }
      );
      
    }

    validarOrdenDeRegistro();
    validarResultados();

    const setsLocal = [resultadoLocal.set1 , resultadoLocal.set2 , resultadoLocal.set3 ];
    const setsVisitante = [resultadoVisitante.set1 , resultadoVisitante.set2 , resultadoVisitante.set3 ];

    let ganadosLocal = 0;
    let ganadosVisitante = 0;

    // Evalúa solo los primeros dos sets
    let setsGanadosLocalPrimeros2 = 0;
    let setsGanadosVisitantePrimeros2 = 0;

    if (setsLocal[0] > setsVisitante[0]) setsGanadosLocalPrimeros2++;
    else if (setsVisitante[0] > setsLocal[0]) setsGanadosVisitantePrimeros2++;

    if (setsLocal[1] > setsVisitante[1]) setsGanadosLocalPrimeros2++;
    else if (setsVisitante[1] > setsLocal[1]) setsGanadosVisitantePrimeros2++;

    // Si un equipo ya ganó 2 sets en los primeros 2, no debe haber un tercer set registrado
    if ((setsGanadosLocalPrimeros2 === 2 || setsGanadosVisitantePrimeros2 === 2)) {
      const set3Local = parseInt(setsLocal[2]);
      const set3Visitante = parseInt(setsVisitante[2]);

      if ((set3Local && set3Local > 0) || (set3Visitante && set3Visitante > 0)) {
        throw new Error("No se debe registrar un tercer set si un equipo ganó los dos primeros.");
      }
    }


    for (let i = 0; i < 3; i++) {
      if (setsLocal[i] > setsVisitante[i]) ganadosLocal++;
      else if (setsVisitante[i] > setsLocal[i]) ganadosVisitante++;
    }

    if (ganadosLocal === 3 || ganadosVisitante === 3) {
      throw new Error("Un equipo no puede ganar los 3 sets. El resultado válido debe ser 2-0 o 2-1.");
    }

    const localActual = await ResultadoLocal.findOne({ where: { partido_id }, transaction });
    const visitanteActual = await ResultadoVisitante.findOne({ where: { partido_id }, transaction });

    await localActual.update({ resultado: ganadosLocal > ganadosVisitante ? 'G' : 'P' }, { transaction });
    await visitanteActual.update({ resultado: ganadosVisitante > ganadosLocal ? 'G' : 'P' }, { transaction });

    const partido = await Partido.findByPk(partido_id, { transaction });

    const otroPartidoVivo = await Partido.findOne({
      where: {
        estado: partidoEstadosMapping.Vivo,
        id: { [Op.ne]: partido_id },
        [Op.or]: [
          { equipo_local_id: partido.equipo_local_id },
          { equipo_visitante_id: partido.equipo_local_id },
          { equipo_local_id: partido.equipo_visitante_id },
          { equipo_visitante_id: partido.equipo_visitante_id },
        ],
      },
      transaction,
    });

    if (otroPartidoVivo) {
      throw new Error('Uno de los equipos ya tiene un partido en curso. Finalice ese partido antes de continuar.');
    }

    if (partido.estado === partidoEstadosMapping.Confirmado) {
      await partido.update(
        { estado: partidoEstadosMapping.Vivo },
        { transaction },
      );
    }

    await transaction.commit();
    broadcastPartidoUpdate(partido_id);
    broadcastPositionsUpdate();

    return { message: 'Sets actualizados correctamente' };
  } catch (error) {
    console.error('Error al actualizar los sets:', error);
    await transaction.rollback();
    throw error;
  }
};

exports.syncTarjetas = async (
  partido_id,
  nuevasTarjetas,
  transaction = null,
) => {
  const t = transaction || (await sequelize.transaction());

  try {
    const existentes = await Tarjeta.findAll({
      where: { partido_id },
      transaction: t,
    });

    const serialize = (t) => {
      const equipo = t.equipoId || t.equipo_id;
      const jugador = t.jugadorId || t.jugador_id;
      const tipo = t.tipoTarjeta || t.tipo_tarjeta;
      return `${equipo}-${jugador}-${tipo}`;
    };
    
    const nuevasSerializadas = nuevasTarjetas.map(serialize);
    const existentesSerializadas = existentes.map(serialize);

    // Eliminar tarjetas que ya no están
    for (const tarjetaBD of existentes) {
      if (!nuevasSerializadas.includes(serialize(tarjetaBD))) {
        await tarjetaBD.destroy({ transaction: t });
      }
    }

    // Agregar tarjetas nuevas
    for (const tarjeta of nuevasTarjetas) {
      if (!existentesSerializadas.includes(serialize(tarjeta))) {
        await Tarjeta.create(
          {
            partido_id,
            equipo_id: tarjeta.equipoId,
            jugador_id: tarjeta.jugadorId,
            tipo_tarjeta: tarjeta.tipoTarjeta,
          },
          { transaction: t },
        );
      }
    }

    if (!transaction) await t.commit();
    if (!transaction) broadcastPartidoUpdate(partido_id);
    return { message: 'Tarjetas sincronizadas correctamente' };
  } catch (error) {
    console.error('Error al sincronizar tarjetas:', error);
    if (!transaction) await t.rollback();
    throw new Error('Error al sincronizar tarjetas: ' + error.message);
  }
};

exports.submitResultados = async ({
  partido_id,
  resultadoLocal,
  resultadoVisitante,
  walkover,
  tarjetas,
  imagenPlanilla,
}) => {
  const transaction = await sequelize.transaction();

  try {
    const walkoverValue = walkover === '' ? null : walkover;
    if (!walkoverValue) {
      const setsL = [resultadoLocal.set1, resultadoLocal.set2, resultadoLocal.set3].map(Number);
      const setsV = [resultadoVisitante.set1, resultadoVisitante.set2, resultadoVisitante.set3].map(Number);
    
      let ganadosLocal = 0;
      let ganadosVisitante = 0;
    
      for (let i = 0; i < 3; i++) {
        if (setsL[i] > setsV[i]) ganadosLocal++;
        else if (setsV[i] > setsL[i]) ganadosVisitante++;
      }

      if (ganadosLocal === ganadosVisitante) {
        throw new Error("El partido no puede finalizar sin un equipo ganador.");
      }
    
      if (ganadosLocal < 2 && ganadosVisitante < 2) {
        throw new Error("Uno de los equipos debe haber ganado al menos dos sets para finalizar el partido.");
      }
    }

    // ✅ Sets y Walkover
    await exports.updateResultadoSets({
      partido_id,
      resultadoLocal,
      resultadoVisitante,
      walkover: walkoverValue,
    });

    // ✅ Tarjetas
    await exports.syncTarjetas(partido_id, tarjetas, transaction);

    // ✅ Imagen de planilla (actualizar si ya existe)
    if (imagenPlanilla) {
      const existing = await ImagePlanilla.findOne({
        where: { partido_id },
      });

      let previousRef = null;

      if (existing && existing.partido_image) {
        // Si ya hay una imagen, extraer la referencia de Firebase (solo el path)
        const url = new URL(existing.partido_image);
        const path = decodeURIComponent(url.pathname.replace('/v0/b/', '').split('/o/')[1]);
        previousRef = ref(storage, path);
      }

      const fileName = `planilla_${partido_id}`;
      const { downloadURL } = await uploadFile(imagenPlanilla, fileName, previousRef, 'FilesPlanillas');

      if (existing) {
        // Actualizar registro
        await ImagePlanilla.update(
          { partido_image: downloadURL },
          { where: { partido_id }, transaction }
        );
      } else {
        // Crear nuevo registro
        await ImagePlanilla.create(
          { partido_id, partido_image: downloadURL },
          { transaction }
        );
      }
    }

    // ✅ Marcar como finalizado
    await Partido.update(
      { estado: partidoEstadosMapping.Finalizado },
      { where: { id: partido_id }, transaction }
    );

    await transaction.commit();

    broadcastPartidoUpdate(partido_id);
    broadcastPositionsUpdate();

    return { message: 'Partido finalizado y datos registrados correctamente' };
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error durante la finalización:', error.message);
    throw new Error('Error al finalizar el partido: ' + error.message);
  }
};

exports.obtenerMarcadoresVivos = async (campeonatoId, categoriaId) => {
  try {
    const query = `
      SELECT 
        p.id AS partido_id,
        p.equipo_local_id,
        p.equipo_visitante_id,
        rl.set1 AS local_set1, rl.set2 AS local_set2, rl.set3 AS local_set3,
        rv.set1 AS visitante_set1, rv.set2 AS visitante_set2, rv.set3 AS visitante_set3
      FROM Partido p
      LEFT JOIN ResultadoLocal rl ON p.id = rl.partido_id
      LEFT JOIN ResultadoVisitante rv ON p.id = rv.partido_id
      JOIN EquipoCampeonato ecl ON ecl.equipoid = p.equipo_local_id AND ecl.campeonatoId = p.campeonato_id
      JOIN EquipoCampeonato ecv ON ecv.equipoid = p.equipo_visitante_id AND ecv.campeonatoId = p.campeonato_id
      WHERE p.estado = 'V'
        AND p.campeonato_id = :campeonatoId
        AND ecl.categoria_id = :categoriaId
        AND ecv.categoria_id = :categoriaId
    `;

    const partidos = await sequelize.query(query, {
      replacements: { campeonatoId, categoriaId },
      type: sequelize.QueryTypes.SELECT,
    });

    const resultados = [];

    for (const partido of partidos) {
      let setsLocal = 0;
      let setsVisitante = 0;

      if (partido.local_set1 > partido.visitante_set1) setsLocal++;
      else if (partido.visitante_set1 > partido.local_set1) setsVisitante++;

      if (partido.local_set2 > partido.visitante_set2) setsLocal++;
      else if (partido.visitante_set2 > partido.local_set2) setsVisitante++;

      if (setsLocal === 1 && setsVisitante === 1) {
        if (partido.local_set3 > partido.visitante_set3) setsLocal++;
        else if (partido.visitante_set3 > partido.local_set3) setsVisitante++;
      }

      let estadoLocal = 'empate';
      let estadoVisitante = 'empate';

      if (setsLocal > setsVisitante) {
        estadoLocal = 'ganando';
        estadoVisitante = 'perdiendo';
      } else if (setsLocal < setsVisitante) {
        estadoLocal = 'perdiendo';
        estadoVisitante = 'ganando';
      }

      resultados.push(
        {
          partido_id: partido.partido_id,
          equipo_id: partido.equipo_local_id,
          marcador: `${setsLocal}-${setsVisitante}`,
          estado: estadoLocal,
        },
        {
          partido_id: partido.partido_id,
          equipo_id: partido.equipo_visitante_id,
          marcador: `${setsVisitante}-${setsLocal}`,
          estado: estadoVisitante,
        }
      );
    }

    return resultados;
  } catch (error) {
    console.error("❌ Error al obtener marcadores en vivo:", error);
    throw new Error("Error al obtener marcadores en vivo");
  }
};

exports.updatePartidoReal = async ({
  partido_id,
  fecha,
  lugar_id,
  arbitros,
}) => {
  console.log("🚀 Datos recibidos para actualizar el partido:", {
    partido_id,
    fecha,
    lugar_id,
    arbitros,
  });

  await validarConflictoEquipos(partido_id, fecha);
  await validarRestriccionesArbitros(arbitros, fecha, lugar_id);

  let transaction;

  try {
    transaction = await sequelize.transaction();
    console.log("🧾 Transacción iniciada");

    // 🔁 1. Actualizar partido
    console.log("✏️ Actualizando partido...");

    const formattedFecha = moment(fecha).format('YYYY-MM-DD HH:mm:ss');
    const updateResult = await Partido.update(
      { fecha: sequelize.fn(
        'CONVERT',
        sequelize.literal('DATETIME'),
        formattedFecha,
      ) , lugar_id },
      { where: { id: partido_id }, transaction }
    );
    console.log("✅ Partido actualizado:", updateResult);

    // 🔁 2. Eliminar árbitros anteriores
    console.log("🗑️ Eliminando árbitros anteriores...");
    await sequelize.query(
      `DELETE FROM Arbitro_Partido WHERE partido_id = :partido_id`,
      {
        replacements: { partido_id },
        type: sequelize.QueryTypes.DELETE,
        transaction,
      }
    );
    console.log("✅ Árbitros eliminados");

    // 🔁 3. Insertar nuevos árbitros
    console.log("➕ Insertando árbitros nuevos...");
    for (const arbitro_id of arbitros) {
      console.log(`🔹 Insertando árbitro ${arbitro_id}`);
      await sequelize.query(
        `INSERT INTO Arbitro_Partido (partido_id, arbitro_id)
         VALUES (:partido_id, :arbitro_id)`,
        {
          replacements: { partido_id, arbitro_id },
          type: sequelize.QueryTypes.INSERT,
          transaction,
        }
      );
    }

    console.log("✅ Árbitros insertados correctamente");

    await transaction.commit();
    console.log("💾 Transacción commit completado");
    return { message: "Partido actualizado correctamente" };

  } catch (error) {
    if (transaction) {
      console.log("🔁 Intentando rollback por error...");
      try {
        await transaction.rollback();
        console.log("↩️ Rollback exitoso");
      } catch (rollbackError) {
        console.error("❌ Falló el rollback:", rollbackError);
      }
    }

    console.error("❌ Error en updatePartidoReal:", error);
    throw new Error("Error al actualizar el partido");
  }
};

// Validar si alguno de los equipos ya tiene un partido ese día
const validarConflictoEquipos = async (partido_id, fecha) => {
  const fechaSolo = fecha.split(' ')[0];

  const datos = await sequelize.query(
    `SELECT equipo_local_id, equipo_visitante_id FROM Partido WHERE id = :partido_id`,
    {
      replacements: { partido_id },
      type: sequelize.QueryTypes.SELECT
    }
  );

  if (!datos.length) throw new Error('No se encontró el partido.');

  const { equipo_local_id, equipo_visitante_id } = datos[0];

  const partidos = await sequelize.query(
    `SELECT * FROM Partido 
     WHERE CONVERT(DATE, fecha) = :fecha
     AND id != :partido_id
     AND (equipo_local_id = :equipo_local_id OR equipo_visitante_id = :equipo_local_id
          OR equipo_local_id = :equipo_visitante_id OR equipo_visitante_id = :equipo_visitante_id)`,
    {
      replacements: { fecha: fechaSolo, equipo_local_id, equipo_visitante_id, partido_id },
      type: sequelize.QueryTypes.SELECT
    }
  );

  if (partidos.length > 0) {
    throw new Error('Uno de los equipos ya tiene un partido ese día.');
  }
};

const validarRestriccionesArbitros = async (arbitros, fecha, lugar_id) => {
  const fechaSolo = moment(fecha).format('YYYY-MM-DD');

  for (const arbitro_id of arbitros) {
    // Obtener nombre del árbitro
    const persona = await sequelize.query(
      `SELECT nombre, apellido FROM Persona WHERE id = :arbitro_id`,
      {
        replacements: { arbitro_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    const nombreCompleto = persona.length > 0 ? `${persona[0].nombre} ${persona[0].apellido}` : `ID ${arbitro_id}`;

    // Validar cantidad de partidos en el mismo lugar
    const cantidad = await sequelize.query(
      `SELECT COUNT(*) AS total FROM Arbitro_Partido AP
       JOIN Partido P ON P.id = AP.partido_id
       WHERE AP.arbitro_id = :arbitro_id
       AND CONVERT(DATE, P.fecha) = :fecha
       AND P.lugar_id = :lugar_id`,
      {
        replacements: { arbitro_id, fecha: fechaSolo, lugar_id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (cantidad[0].total >= 8) {
      throw new Error(`El árbitro ${nombreCompleto} ya tiene 8 partidos en este lugar ese día.`);
    }

    // Validar si ya está asignado en otro lugar
    const enOtroLugar = await sequelize.query(
      `SELECT * FROM Arbitro_Partido AP
       JOIN Partido P ON P.id = AP.partido_id
       WHERE AP.arbitro_id = :arbitro_id
       AND CONVERT(DATE, P.fecha) = :fecha
       AND P.lugar_id != :lugar_id`,
      {
        replacements: { arbitro_id, fecha: fechaSolo, lugar_id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (enOtroLugar.length > 0) {
      throw new Error(`El árbitro ${nombreCompleto} ya está asignado en otro lugar ese día.`);
    }
  }
};

exports.verificarFixtureCompleto = async (campeonatoId, categoriaId) => {
  try {
    // 1. Obtener los equipos inscritos
    const equipos = await sequelize.query(`
      SELECT equipoId
      FROM EquipoCampeonato
      WHERE campeonatoId = :campeonatoId
      AND categoria_id = :categoriaId
      AND estado = 'Inscrito'
    `, {
      replacements: { campeonatoId, categoriaId },
      type: sequelize.QueryTypes.SELECT
    });

    const equipoIds = equipos.map(e => e.equipoId);
    const totalEquipos = equipoIds.length;

    // ⚠ Si hay menos de 2 equipos, no se puede generar fixture
    if (totalEquipos < 2) return false;

    // 2. Calcular la cantidad teórica de partidos
    const totalTeorico = (totalEquipos * (totalEquipos - 1)) / 2;

    // 3. Contar los partidos registrados entre estos equipos
    const [partidos] = await sequelize.query(`
      SELECT COUNT(*) AS total
      FROM Partido
      WHERE campeonato_id = :campeonatoId
      AND equipo_local_id IN (:equipoIds)
      AND equipo_visitante_id IN (:equipoIds)
    `, {
      replacements: { campeonatoId, equipoIds },
      type: sequelize.QueryTypes.SELECT
    });

    const totalRegistrados = partidos.total || 0;
    return totalRegistrados >= totalTeorico;

  } catch (error) {
    console.error("❌ Error al verificar fixture completo:", error);
    throw new Error("Error al verificar fixture completo");
  }
};
