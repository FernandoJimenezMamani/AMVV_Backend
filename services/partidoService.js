const { Partido, Equipo, Lugar, Campeonato,ResultadoLocal,ResultadoVisitante,Tarjeta ,ImagePlanilla,ArbitroPartido } = require('../models');
const sequelize = require('../config/sequelize');
const { uploadFile } = require('../utils/subirImagen');
const moment = require('moment');

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
        EL.nombre AS equipo_local_nombre,
        EV.nombre AS equipo_visitante_nombre,
        ICL.club_imagen AS equipo_local_imagen,
        ICV.club_imagen AS equipo_visitante_imagen,
        C.nombre AS categoria_nombre,P.estado

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
      WHERE 
        C.id = :categoriaId AND p.campeonato_id = :campeonatoId AND (P.estado IS NULL OR P.estado != 'J')
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
    // Crear los resultados para el equipo local
    const local = await ResultadoLocal.create({
      partido_id,
      set1: resultadoLocal.set1 ?? 0, // Asegura que si es null o undefined, se guarde como 0
      set2: resultadoLocal.set2 ?? 0,
      set3: resultadoLocal.set3 ?? 0,
      resultado: resultadoLocal.resultado || null,
      walkover: walkoverValue
    }, { transaction });

    // Crear los resultados para el equipo visitante
    const visitante = await ResultadoVisitante.create({
      partido_id,
      set1: resultadoVisitante.set1 ?? 0, // Asegura que si es null o undefined, se guarde como 0
      set2: resultadoVisitante.set2 ?? 0,
      set3: resultadoVisitante.set3 ?? 0,
      resultado: resultadoVisitante.resultado || null,
      walkover: walkoverValue
    }, { transaction });

    // Registrar las tarjetas
    await exports.submitTarjetas(partido_id, tarjetas, transaction);

    // Si hay una imagen de la planilla, subirla a Firebase y guardar la URL
    if (imagenPlanilla) {
      const fileName = `planilla_${partido_id}_${Date.now()}`;
      const { downloadURL } = await uploadFile(imagenPlanilla, fileName, null, 'FilesPlanillas');
      
      // Guardar la URL de la imagen en la tabla ImagePlanilla
      await ImagePlanilla.create({
        partido_id,
        partido_image: downloadURL
      }, { transaction });
    }

    // Actualizar el estado del partido a 'J' (Jugado)
    await Partido.update(
      { estado: 'J' },
      { where: { id: partido_id }, transaction }
    );

    // Confirmar la transacción
    await transaction.commit();
    return { local, visitante };
  } catch (error) {
    // Revertir la transacción en caso de error
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
        P.apellido AS arbitro_apellido
      FROM Arbitro_Partido AP
      JOIN Arbitro A ON AP.arbitro_id = A.id
      JOIN Persona P ON A.id = P.id
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
        P.lugar_id,
        P.estado,
        EL.id AS equipolocal_id,
        EL.nombre AS equipolocal_nombre,
        EV.id AS equipovisitante_id,
        EV.nombre AS equipovisitante_nombre,
        L.id AS lugar_id,
        L.nombre AS lugar_nombre,
        C.id AS campeonato_id,
        C.nombre AS campeonato_nombre
      FROM Partido P
      LEFT JOIN Equipo EL ON P.equipo_local_id = EL.id
      LEFT JOIN Equipo EV ON P.equipo_visitante_id = EV.id
      LEFT JOIN Lugar L ON P.lugar_id = L.id
      LEFT JOIN Campeonato C ON P.campeonato_id = C.id
      WHERE P.lugar_id = :lugarId 
      AND P.fecha BETWEEN :fechaInicio AND :fechaFin
      ORDER BY P.fecha ASC;
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
