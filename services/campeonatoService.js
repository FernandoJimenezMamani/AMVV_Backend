const { Campeonato, EquipoCampeonato, Equipo, Categoria } = require('../models');
const sequelize = require('../config/sequelize');

exports.createCampeonato = async (nombre, fecha_inicio, fecha_fin) => {
  const normalizedNombre = nombre.replace(/\s+/g, '').toUpperCase();

  // Check if the championship name already exists
  const existingCampeonato = await Campeonato.findOne({
    where: sequelize.where(
      sequelize.fn('REPLACE', sequelize.fn('UPPER', sequelize.col('nombre')), ' ', ''),
      normalizedNombre
    )
  });

  if (existingCampeonato) {
    throw new Error('El nombre del campeonato ya existe');
  }

  // Create Campeonato
  const campeonato = await Campeonato.create({ nombre, fecha_inicio, fecha_fin });
  return campeonato;
};

exports.getCampeonatoCategoria = async (campeonato_id, categoria_id) => {
  const campeonato = await Campeonato.findOne({
    where: { id: campeonato_id },
    include: [
      {
        model: EquipoCampeonato,
        as: 'equipos', 
        include: [
          {
            model: Equipo,
            as: 'equipo', 
            include: [
              {
                model: Categoria,
                where: { id: categoria_id },
                attributes: ['nombre'],
                as: 'categoria', 
              },
            ],
          },
        ],
      },
    ],
  });

  if (!campeonato) {
    throw new Error('Campeonato o Categoría no encontrados');
  }

  return {
    campeonato_nombre: campeonato.nombre,
    categoria_nombre: campeonato.equipos[0]?.equipo.categoria.nombre, 
  };
};


exports.getAllCampeonatos = async () => {
  const campeonatos = await Campeonato.findAll({
    attributes: ['id', 'nombre', 'fecha_inicio', 'fecha_fin'],
  });
  return campeonatos;
};

exports.getCampeonatoById = async (id) => {
  const campeonato = await Campeonato.findByPk(id, {
    attributes: ['id', 'nombre', 'fecha_inicio', 'fecha_fin'],
  });

  if (!campeonato) {
    throw new Error('Campeonato no encontrado');
  }

  return campeonato;
};

exports.updateCampeonato = async (id, nombre, fecha_inicio, fecha_fin) => {
  const normalizedNombre = nombre.replace(/\s+/g, '').toUpperCase();

  // Check if the championship name already exists for another record
  const existingCampeonato = await Campeonato.findOne({
    where: {
      id: { [sequelize.Op.ne]: id },
      [sequelize.Op.and]: sequelize.where(
        sequelize.fn('REPLACE', sequelize.fn('UPPER', sequelize.col('nombre')), ' ', ''),
        normalizedNombre
      ),
    },
  });

  if (existingCampeonato) {
    throw new Error('El nombre del campeonato ya existe para otro registro');
  }

  // Update Campeonato
  await Campeonato.update({ nombre, fecha_inicio, fecha_fin }, { where: { id } });
};


exports.getChampionshipPositions = async (categoriaId,campeonato_id) => {
  try {
    const positions = await sequelize.query(`
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
        ec.campeonatoid = :campeonato_id AND ec.estado = 'C' AND e.categoria_id = :categoriaId
    GROUP BY 
        e.id, e.nombre, ic.club_imagen
    ORDER BY 
        pts DESC, sets_a_favor DESC, diferencia_sets DESC, diferencia_puntos DESC;
    `, {
      replacements: { categoriaId , campeonato_id},  
      type: sequelize.QueryTypes.SELECT 
    });

    return positions;
  } catch (error) {
    console.error('Error al obtener los próximos partidos:', error);
    throw new Error('Error al obtener los partidos');
  }
};

