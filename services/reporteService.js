const sequelize = require('../config/sequelize');

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
