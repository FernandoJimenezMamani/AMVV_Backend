const sequelize = require('../config/sequelize');
const estadosMapping = require('../constants/campeonatoEstados');

exports.getResumenDatos = async (campeonatoId) => {
  try {
    if (!campeonatoId) {
      throw new Error("Se requiere un ID de campeonato.");
    }

    // Contar los partidos del campeonato proporcionado
    const [totalPartidos] = await sequelize.query(`
      SELECT COUNT(*) as total FROM Partido WHERE campeonato_id = :campeonatoId;
    `, { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { campeonatoId }
    });

    // Contar los equipos del campeonato proporcionado
    const [totalEquipos] = await sequelize.query(`
      SELECT COUNT(DISTINCT equipoid) as total FROM EquipoCampeonato 
      WHERE campeonatoid = :campeonatoId;
    `, { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { campeonatoId }
    });

    // Contar los jugadores activos en los equipos del campeonato proporcionado
    const [totalJugadores] = await sequelize.query(`
      SELECT COUNT(DISTINCT j.id) as total FROM Jugador j
      JOIN Equipo e ON j.club_id = e.club_id
      JOIN EquipoCampeonato ec ON e.id = ec.equipoid
      WHERE j.activo = 1 AND ec.campeonatoid = :campeonatoId;
    `, { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { campeonatoId }
    });

    return {
      campeonatoId,
      totalPartidos: totalPartidos.total,
      totalEquipos: totalEquipos.total,
      totalJugadores: totalJugadores.total
    };

  } catch (error) {
    console.error('Error al obtener el resumen de datos:', error);
    throw new Error('Error al obtener el resumen de datos');
  }
};

exports.getDistribucionEdadGenero = async (campeonatoId) => {
  try {
    if (!campeonatoId) {
      throw new Error("Se requiere un ID de campeonato.");
    }
    
    const distribucion = await sequelize.query(`
      SELECT 
        c.division AS grupoEdad,  -- 'MY' (Mayores) o 'MN' (Menores)
        c.genero,                 -- 'V' (Varones) o 'D' (Damas)
        COUNT(e.id) AS totalEquipos
      FROM Equipo e
      JOIN Categoria c ON e.categoria_id = c.id
      JOIN EquipoCampeonato ec ON e.id = ec.equipoid
      WHERE ec.campeonatoid = :campeonatoId
      GROUP BY c.division, c.genero;
    `, { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { campeonatoId }
    });
    
    return {
      campeonatoId,
      distribucion
    };

  } catch (error) {
    console.error('Error al obtener la distribución de edad y género:', error);
    throw new Error('Error al obtener la distribución de edad y género');
  }
};

exports.getProgresoPartidosDashboard = async (categoria, genero) => {
  try {
    const [campeonato] = await sequelize.query(`
      SELECT id, nombre ,fecha_inicio_campeonato ,fecha_fin_campeonato FROM Campeonato WHERE estado = 2;
    `, { type: sequelize.QueryTypes.SELECT });

    if (!campeonato) {
      return null;
    }

    const campeonatoId = campeonato.id;
    const campeonato_nombre = campeonato.nombre;
    const fecha_inicio_campeonato = campeonato.fecha_inicio_campeonato;
    const fecha_fin_campeonato = campeonato.fecha_fin_campeonato;

    const filtros = {
      campeonatoId,
      ...(categoria && { categoria }),
      ...(genero && { genero })
    };

    // Total de partidos programados
    const [totalPartidos] = await sequelize.query(`
      SELECT COUNT(*) as total FROM Partido 
      JOIN EquipoCampeonato ec ON Partido.equipo_local_id = ec.equipoid
      JOIN Categoria c ON ec.categoria_id = c.id
      WHERE ec.campeonatoid = :campeonatoId
      ${categoria ? "AND c.nombre = :categoria" : ""}
      ${genero ? "AND c.genero = :genero" : ""}
    `, {
      type: sequelize.QueryTypes.SELECT,
      replacements: filtros
    });
    

    // Partidos jugados (estado = 'J')
    const [partidosJugados] = await sequelize.query(`
      SELECT COUNT(*) as total FROM Partido 
      JOIN EquipoCampeonato ec ON Partido.equipo_local_id = ec.equipoid
      JOIN Categoria c ON ec.categoria_id = c.id
      WHERE ec.campeonatoid = :campeonatoId 
      AND Partido.estado = 'J'
      ${categoria ? "AND c.nombre = :categoria" : ""}
      ${genero ? "AND c.genero = :genero" : ""}
    `, {
      type: sequelize.QueryTypes.SELECT,
      replacements: filtros
    });    

    // Partidos vencidos sin registro (estado = 'C' y fecha pasada)
    const [partidosVencidosSinRegistro] = await sequelize.query(`
      SELECT COUNT(*) as total FROM Partido 
      JOIN EquipoCampeonato ec ON Partido.equipo_local_id = ec.equipoid
      JOIN Categoria c ON ec.categoria_id = c.id
      WHERE ec.campeonatoid = :campeonatoId
      AND Partido.estado = 'C'
      AND Partido.fecha < GETDATE()
      ${categoria ? "AND c.nombre = :categoria" : ""}
      ${genero ? "AND c.genero = :genero" : ""}
    `, {
      type: sequelize.QueryTypes.SELECT,
      replacements: filtros
    });    

    // Partidos pendientes (estado = 'C' y fecha futura)
    const [partidosPendientes] = await sequelize.query(`
      SELECT COUNT(*) as total FROM Partido 
      JOIN EquipoCampeonato ec ON Partido.equipo_local_id = ec.equipoid
      JOIN Categoria c ON ec.categoria_id = c.id
      WHERE ec.campeonatoid = :campeonatoId
      AND Partido.estado = 'C'
      AND Partido.fecha >= GETDATE()
      ${categoria ? "AND c.nombre = :categoria" : ""}
      ${genero ? "AND c.genero = :genero" : ""}
    `, {
      type: sequelize.QueryTypes.SELECT,
      replacements: filtros
    });    

    // Partidos en curso (estado = 'V')
      const [partidosEnCurso] = await sequelize.query(`
        SELECT COUNT(*) as total FROM Partido 
        JOIN EquipoCampeonato ec ON Partido.equipo_local_id = ec.equipoid
        JOIN Categoria c ON ec.categoria_id = c.id
        WHERE ec.campeonatoid = :campeonatoId
        AND Partido.estado = 'V'
        ${categoria ? "AND c.nombre = :categoria" : ""}
        ${genero ? "AND c.genero = :genero" : ""}
      `, {
        type: sequelize.QueryTypes.SELECT,
        replacements: filtros
      });


    // Cálculo de partidos faltantes
    const partidosFaltantes = totalPartidos.total - partidosJugados.total;

    return {
      campeonatoId,
      campeonato_nombre,
      fecha_inicio_campeonato,
      fecha_fin_campeonato,
      categoria: categoria || "Todas",
      genero: genero || "Todos",
      totalPartidos: totalPartidos.total,
      partidosJugados: partidosJugados.total,
      partidosPendientes: partidosPendientes.total,
      partidosVencidosSinRegistro: partidosVencidosSinRegistro.total,
      partidosFaltantes: partidosFaltantes >= 0 ? partidosFaltantes : 0,
      partidosEnCurso: partidosEnCurso.total,
    };

  } catch (error) {
    console.error('Error al obtener el progreso de partidos:', error);
    throw new Error('Error al obtener el progreso de partidos');
  }
};

exports.getMonitoreoEquiposDashboard = async () => {
  try {
    const [campeonato] = await sequelize.query(`
      SELECT id, nombre ,fecha_inicio_transaccion ,fecha_fin_transaccion FROM Campeonato WHERE  estado = 1;
    `, { type: sequelize.QueryTypes.SELECT });

    if (!campeonato) {
      return null;
    }

    const campeonatoId = campeonato.id;
    const campeonato_nombre = campeonato.nombre;
    const fecha_inicio_transaccion = campeonato.fecha_inicio_transaccion;
    const fecha_fin_transaccion = campeonato.fecha_fin_transaccion;

    const [totalEquipos] = await sequelize.query(`
      SELECT COUNT(*) as total FROM EquipoCampeonato 
      WHERE campeonatoid = :campeonatoId;
    `, { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { campeonatoId }
    });

    const [equiposPagaron] = await sequelize.query(`
      SELECT COUNT(DISTINCT ec.equipoid) as total 
      FROM EquipoCampeonato ec
      LEFT JOIN PagoInscripcion pi ON ec.id = pi.equipoCampeonatoid
      LEFT JOIN Pago p ON pi.id = p.id
      WHERE ec.campeonatoid = :campeonatoId and ec.estado = 'Inscrito';
    `, { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { campeonatoId }
    });

    const equiposPendientes = totalEquipos.total - equiposPagaron.total;

    return {
      campeonatoId,
      campeonato_nombre,
      fecha_inicio_transaccion,
      fecha_fin_transaccion,
      totalEquipos: totalEquipos.total,
      equiposPagaron: equiposPagaron.total,
      equiposPendientes: equiposPendientes >= 0 ? equiposPendientes : 0
    };

  } catch (error) {
    console.error('Error al obtener el monitoreo de equipos:', error);
    throw new Error('Error al obtener el monitoreo de equipos');
  }
};

exports.getProgresoPartidos = async (campeonatoId) => {
  try {
    if (!campeonatoId) {
      throw new Error("Se requiere un ID de campeonato.");
    }

    const [totalPartidos] = await sequelize.query(`
      SELECT COUNT(*) as total FROM Partido WHERE campeonato_id = :campeonatoId;
    `, { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { campeonatoId }
    });

    const [partidosJugados] = await sequelize.query(`
      SELECT COUNT(*) as total FROM Partido 
      WHERE campeonato_id = :campeonatoId AND estado = 'J';
    `, { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { campeonatoId }
    });

    const partidosFaltantes = totalPartidos.total - partidosJugados.total;

    return {
      campeonatoId,
      totalPartidos: totalPartidos.total,
      partidosJugados: partidosJugados.total,
      partidosFaltantes: partidosFaltantes >= 0 ? partidosFaltantes : 0
    };

  } catch (error) {
    console.error('Error al obtener el progreso de partidos:', error);
    throw new Error('Error al obtener el progreso de partidos');
  }
};

exports.getPartidosPendientes = async (campeonatoId) => {
  try {
    if (!campeonatoId) {
      throw new Error("Se requiere un ID de campeonato.");
    }

    // Obtener el total de partidos en el campeonato
    const [totalPartidos] = await sequelize.query(`
      SELECT COUNT(*) as total FROM Partido WHERE campeonato_id = :campeonatoId;
    `, { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { campeonatoId }
    });

    // Obtener los partidos cuya fecha ya pasó pero que no tienen estado 'J' (finalizado)
    const [partidosSinRegistro] = await sequelize.query(`
      SELECT COUNT(*) as total FROM Partido 
      WHERE campeonato_id = :campeonatoId 
      AND fecha < GETDATE() 
      AND estado <> 'J';
    `, { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { campeonatoId }
    });

    return {
      campeonatoId,
      totalPartidos: totalPartidos.total,
      partidosSinRegistro: partidosSinRegistro.total
    };

  } catch (error) {
    console.error('Error al obtener los partidos sin resultados:', error);
    throw new Error('Error al obtener los partidos sin resultados');
  }
};

exports.getComparacionEquipos = async (campeonatoA, campeonatoB) => {
  try {
    if (!campeonatoA || !campeonatoB) {
      throw new Error("Se requieren dos campeonatos para la comparación.");
    }

    const resultados = await sequelize.query(`
      SELECT 
          c.id AS campeonato_id,
          c.nombre AS campeonato_nombre,
          COUNT(DISTINCT ec.equipoid) AS total_equipos
      FROM Campeonato c
      LEFT JOIN EquipoCampeonato ec ON c.id = ec.campeonatoid
      WHERE c.id IN (:campeonatoA, :campeonatoB) AND ec.estado = 'Inscrito'
      GROUP BY c.id, c.nombre;
    `, { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { campeonatoA, campeonatoB }
    });

    return resultados;

  } catch (error) {
    console.error("Error al obtener la comparación de equipos:", error);
    throw new Error("Error al obtener la comparación de equipos");
  }
};

exports.getComparacionIngresos = async (campeonatoA, campeonatoB) => {
  try {
    if (!campeonatoA || !campeonatoB) {
      throw new Error("Se requieren dos campeonatos para la comparación.");
    }

    const resultados = await sequelize.query(`
      SELECT 
          c.id AS campeonato_id,
          c.nombre AS campeonato_nombre,
          COALESCE(SUM(p.monto), 0) AS total_ingresos
      FROM Campeonato c
      LEFT JOIN EquipoCampeonato ec ON c.id = ec.campeonatoid
      LEFT JOIN PagoInscripcion pi ON ec.id = pi.equipoCampeonatoid
      LEFT JOIN Pago p ON pi.id = p.id
      WHERE c.id IN (:campeonatoA, :campeonatoB) 
      GROUP BY c.id, c.nombre;

    `, { 
      type: sequelize.QueryTypes.SELECT,
      replacements: { campeonatoA, campeonatoB }
    });

    return resultados;

  } catch (error) {
    console.error("Error al obtener la comparación de ingresos:", error);
    throw new Error("Error al obtener la comparación de ingresos");
  }
};
