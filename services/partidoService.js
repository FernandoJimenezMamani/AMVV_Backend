const { Partido, Equipo, Lugar, Campeonato,ResultadoLocal,ResultadoVisitante  } = require('../models');
const sequelize = require('../config/sequelize');

exports.createPartido = async (data) => {
  const { campeonato_id, equipo_local_id, equipo_visitante_id, fecha, lugar_id, resultado } = data;

  return await Partido.create({
    campeonato_id,
    equipo_local_id,
    equipo_visitante_id,
    fecha,
    lugar_id,
    resultado
  });
};

exports.getPartidosByCategoriaId = async (categoriaId) => {
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
        C.nombre AS categoria_nombre
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
        C.id = :categoriaId
      ORDER BY 
        P.fecha ASC;
    `, {
      replacements: { categoriaId }, 
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

exports.submitResultados = async (data) => {
  const { partido_id, resultadoLocal, resultadoVisitante , walkover} = data;

  const transaction = await sequelize.transaction();

  try {
    const local = await ResultadoLocal.create({
      partido_id: partido_id,
      set1: resultadoLocal.set1 || null,
      set2: resultadoLocal.set2 || null,
      set3: resultadoLocal.set3 || null,
      resultado: resultadoLocal.resultado || null,
    }, { transaction });

    const visitante = await ResultadoVisitante.create({
      partido_id: partido_id,
      set1: resultadoVisitante.set1 || null,
      set2: resultadoVisitante.set2 || null,
      set3: resultadoVisitante.set3 || null,
      resultado: resultadoVisitante.resultado || null,
    }, { transaction });
    
    await Partido.update(
      { 
        estado:'J', 
        walkover: walkover || null 
      },
      { where: { id: partido_id }, transaction }
    );
    await transaction.commit();
    return { local, visitante };
  } catch (error) {
    await transaction.rollback();
    throw new Error('Error al registrar los resultados: ' + error.message);
  }
};
