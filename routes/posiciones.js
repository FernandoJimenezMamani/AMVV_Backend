const express = require('express');
const sql = require('mssql');
const router = express.Router();

// Obtener equipos por categoría y campeonato
router.get('/get_positions/:categoria_id/:campeonato_id', async (req, res) => {
  const { categoria_id, campeonato_id } = req.params;

  try {
    const request = new sql.Request();

    // Prepare the SQL query
    const query = `
      SELECT 
    e.id AS equipo_id,
    e.nombre AS equipo_nombre,
    COALESCE(SUM(CASE WHEN p.estado = 'J' THEN 1 ELSE 0 END), 0) AS partidos_jugados,
    COALESCE(SUM(CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.resultado = 'G' THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.resultado = 'G' THEN 1 
            ELSE 0 
        END), 0) AS partidos_ganados,
    COALESCE(SUM(CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.resultado = 'P' THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.resultado = 'P' THEN 1 
            ELSE 0 
        END), 0) AS partidos_perdidos,
    COALESCE(SUM(
        CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.set1 > rv.set1 THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.set1 > rl.set1 THEN 1 
            ELSE 0 
        END +
        CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.set2 > rv.set2 THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.set2 > rl.set2 THEN 1 
            ELSE 0 
        END +
        CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND COALESCE(rl.set3, 0) > COALESCE(rv.set3, 0) THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND COALESCE(rv.set3, 0) > COALESCE(rl.set3, 0) THEN 1 
            ELSE 0 
        END
    ), 0) AS sets_a_favor,
    COALESCE(SUM(
        CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.set1 < rv.set1 THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.set1 < rl.set1 THEN 1 
            ELSE 0 
        END +
        CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.set2 < rv.set2 THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.set2 < rl.set2 THEN 1 
            ELSE 0 
        END +
        CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND COALESCE(rl.set3, 0) < COALESCE(rv.set3, 0) THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND COALESCE(rv.set3, 0) < COALESCE(rl.set3, 0) THEN 1 
            ELSE 0 
        END
    ), 0) AS sets_en_contra,
    COALESCE(SUM(
        (CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.set1 > rv.set1 THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.set1 < rv.set1 THEN -1 
            ELSE 0 
        END) +
        (CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.set2 > rv.set2 THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.set2 < rv.set2 THEN -1 
            ELSE 0 
        END) +
        (CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND COALESCE(rl.set3, 0) > COALESCE(rv.set3, 0) THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND COALESCE(rl.set3, 0) < COALESCE(rv.set3, 0) THEN -1 
            ELSE 0 
        END) +
        (CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.set1 > rl.set1 THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.set1 < rl.set1 THEN -1 
            ELSE 0 
        END) +
        (CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.set2 > rl.set2 THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.set2 < rl.set2 THEN -1 
            ELSE 0 
        END) +
        (CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND COALESCE(rv.set3, 0) > COALESCE(rl.set3, 0) THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND COALESCE(rv.set3, 0) < COALESCE(rl.set3, 0) THEN -1 
            ELSE 0 
        END)
    ), 0) AS diferencia_sets,
    COALESCE(SUM(
        CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id THEN rl.set1 + rl.set2 + COALESCE(rl.set3, 0) 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id THEN rv.set1 + rv.set2 + COALESCE(rv.set3, 0)
            ELSE 0 
        END
    ), 0) AS puntos_a_favor,
    COALESCE(SUM(
        CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id THEN rv.set1 + rv.set2 + COALESCE(rv.set3, 0) 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id THEN rl.set1 + rl.set2 + COALESCE(rl.set3, 0)
            ELSE 0 
        END
    ), 0) AS puntos_en_contra,
    COALESCE(SUM(
        (CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id THEN rl.set1 + rl.set2 + COALESCE(rl.set3, 0) 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id THEN rv.set1 + rv.set2 + COALESCE(rv.set3, 0)
            ELSE 0 
        END) -
        (CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id THEN rv.set1 + rv.set2 + COALESCE(rv.set3, 0) 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id THEN rl.set1 + rl.set2 + COALESCE(rl.set3, 0)
            ELSE 0 
        END)
    ), 0) AS diferencia_puntos,
    COALESCE(SUM(
        CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.resultado = 'G' THEN 2 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.resultado = 'G' THEN 2 
            ELSE 0 
        END +
        CASE 
            WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.resultado = 'P' THEN 1 
            WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.resultado = 'P' THEN 1 
            ELSE 0 
        END
    ), 0) AS pts,
        ic.club_imagen AS escudo
    FROM 
        EquipoCampeonato ec
    INNER JOIN 
        Equipo e ON ec.equipoid = e.id
    LEFT JOIN 
        Partido p ON e.id = p.equipo_local_id OR e.id = p.equipo_visitante_id
    LEFT JOIN 
        ResultadoLocal rl ON p.id = rl.partido_id
    LEFT JOIN 
        ResultadoVisitante rv ON p.id = rv.partido_id
    LEFT JOIN
        Club c ON e.club_id = c.id
    LEFT JOIN
        ImagenClub ic ON c.id = ic.club_id
    WHERE 
        ec.campeonatoid = 1 AND ec.estado = 'C' AND e.categoria_id = 4
    GROUP BY 
        e.id, e.nombre, ic.club_imagen
    ORDER BY 
        pts DESC, sets_a_favor DESC, diferencia_sets DESC, diferencia_puntos DESC;

    `;

    // Set the input parameters for categoria_id and campeonato_id
    request.input('categoria_id', sql.Int, categoria_id);
    request.input('campeonato_id', sql.Int, campeonato_id);

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener equipos', error: err.message });
  }
});

module.exports = router;
