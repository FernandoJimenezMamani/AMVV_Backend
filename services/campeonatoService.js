const { Campeonato, EquipoCampeonato, Equipo, Categoria } = require('../models');
const sequelize = require('../config/sequelize');
const { Op, where } = require('sequelize');
const moment = require('moment');
const campeonatoEstados = require('../constants/campeonatoEstados');
const { sendToClient, clients } = require('../server');
const campeonatoEquipoEstados = require('../constants/campeonatoEquipoEstado');

exports.createCampeonato = async (nombre, fecha_inicio_campeonato, fecha_fin_campeonato, fecha_inicio_transaccion, fecha_fin_transaccion) => {
  try {
    const inicioCampeonato = moment(fecha_inicio_campeonato).format('YYYY-MM-DD HH:mm:ss');
    const finCampeonato = moment(fecha_fin_campeonato).format('YYYY-MM-DD HH:mm:ss');
    const inicioTransaccion = moment(fecha_inicio_transaccion).format('YYYY-MM-DD HH:mm:ss');
    const finTransaccion = moment(fecha_fin_transaccion).format('YYYY-MM-DD HH:mm:ss');

    const normalizedNombre = nombre.replace(/\s+/g, '').toUpperCase();
    
    const campeonatosActivos = await Campeonato.findOne({
      where: {
        estado: { [Op.in]: [0, 1, 2] }
      }
    });

    if (campeonatosActivos) {
      throw new Error('No se puede crear un nuevo campeonato mientras haya otro en estado en espera, en transacción o en curso.');
    }

    const existingCampeonato = await Campeonato.findOne({
      where: sequelize.where(
        sequelize.fn('REPLACE', sequelize.fn('UPPER', sequelize.col('nombre')), ' ', ''),
        normalizedNombre
      ),
    });

    if (existingCampeonato) {
      throw new Error('El nombre del campeonato ya existe');
    }

    if (fecha_inicio_transaccion >= fecha_inicio_campeonato) {
      throw new Error('La fecha de inicio de transacciones debe ser antes de la fecha de inicio del campeonato');
    }

    if (fecha_fin_transaccion >= fecha_inicio_campeonato) {
      throw new Error('La fecha de fin de transacciones debe ser antes de la fecha de inicio del campeonato');
    }

    if (fecha_fin_transaccion < fecha_inicio_transaccion) {
      throw new Error('La fecha de fin de transacciones no puede ser anterior a la fecha de inicio de transacciones');
    }

    // Crear el campeonato
    const campeonato = await Campeonato.create({
      nombre,
      fecha_inicio_campeonato: sequelize.fn('CONVERT', sequelize.literal('DATETIME'), inicioCampeonato),
      fecha_fin_campeonato: sequelize.fn('CONVERT', sequelize.literal('DATETIME'), finCampeonato),
      fecha_inicio_transaccion: sequelize.fn('CONVERT', sequelize.literal('DATETIME'), inicioTransaccion),
      fecha_fin_transaccion: sequelize.fn('CONVERT', sequelize.literal('DATETIME'), finTransaccion),
      fecha_registro: sequelize.fn('GETDATE'),
      eliminado: 'N',
      user_id: 1,
      estado: campeonatoEstados.enEspera
    });

    console.log('Campeonato creado:', campeonato);

    // Obtener todos los equipos existentes
    const equipos = await Equipo.findAll({
      where: { eliminado: 'N' }
    });
    
    if (equipos.length === 0) {
      console.log('No hay equipos registrados para asignar al campeonato.');
    } else {
      console.log(`Registrando ${equipos.length} equipos en el campeonato...`);
      
      // Crear registros en EquipoCampeonato
      const equiposCampeonato = equipos.map(equipo => ({
        equipoId: equipo.id,
        campeonatoId: campeonato.id,
        estado: campeonatoEquipoEstados.DeudaInscripcion 
      }));

      await EquipoCampeonato.bulkCreate(equiposCampeonato);
      console.log('Todos los equipos fueron registrados en el campeonato.');
    }

    return campeonato;
  } catch (err) {
    console.log('Error al crear el campeonato:', err);
    throw new Error('Error al crear el campeonato');
  }
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
    attributes: ['id', 'nombre', 'fecha_inicio_campeonato', 'fecha_fin_campeonato', 'fecha_inicio_transaccion' , 'fecha_fin_transaccion' , 'estado'],
  });
  return campeonatos;
};

exports.getCampeonatoById = async (id) => {
  const campeonato = await Campeonato.findByPk(id, {
    attributes: ['id', 'nombre', 'fecha_inicio_campeonato', 'fecha_fin_campeonato', 'fecha_inicio_transaccion', 'fecha_fin_transaccion', 'estado'],
  });

  if (!campeonato) {
    throw new Error('Campeonato no encontrado');
  }

  // Procesar las fechas para separarlas en fecha y hora
  const processedCampeonato = {
    id: campeonato.id,
    nombre: campeonato.nombre,
    estado: campeonato.estado,
    fecha_inicio_transaccion: campeonato.fecha_inicio_transaccion.toISOString().split('T')[0], // Solo la fecha
    hora_inicio_transaccion: campeonato.fecha_inicio_transaccion.toISOString().split('T')[1].split('.')[0], // Solo la hora
    fecha_fin_transaccion: campeonato.fecha_fin_transaccion.toISOString().split('T')[0],
    hora_fin_transaccion: campeonato.fecha_fin_transaccion.toISOString().split('T')[1].split('.')[0],
    fecha_inicio_campeonato: campeonato.fecha_inicio_campeonato.toISOString().split('T')[0],
    hora_inicio_campeonato: campeonato.fecha_inicio_campeonato.toISOString().split('T')[1].split('.')[0],
    fecha_fin_campeonato: campeonato.fecha_fin_campeonato.toISOString().split('T')[0],
    hora_fin_campeonato: campeonato.fecha_fin_campeonato.toISOString().split('T')[1].split('.')[0],
  };

  return processedCampeonato;
};


exports.updateCampeonato = async (
  id,
  nombre,
  fecha_inicio_transaccion,
  fecha_fin_transaccion,
  fecha_inicio_campeonato,
  fecha_fin_campeonato
) => {
  try {
    const inicioCampeonato = moment(fecha_inicio_campeonato).format(
      "YYYY-MM-DD HH:mm:ss"
    );
    const finCampeonato = moment(fecha_fin_campeonato).format(
      "YYYY-MM-DD HH:mm:ss"
    );
    const inicioTransaccion = moment(fecha_inicio_transaccion).format(
      "YYYY-MM-DD HH:mm:ss"
    );
    const finTransaccion = moment(fecha_fin_transaccion).format(
      "YYYY-MM-DD HH:mm:ss"
    );

    const normalizedNombre = nombre.replace(/\s+/g, "").toUpperCase();
    console.log("Nombre normalizado:", normalizedNombre);

    // Validar si el nombre del campeonato ya existe para otro registro
    console.log("Validando si el nombre ya existe...");
    const existingCampeonato = await Campeonato.findOne({
      where: {
        id: { [Op.ne]: id },
        [Op.and]: sequelize.where(
          sequelize.fn(
            "REPLACE",
            sequelize.fn("UPPER", sequelize.col("nombre")),
            " ",
            ""
          ),
          normalizedNombre
        ),
      },
    });
    console.log("Resultado de búsqueda por nombre:", existingCampeonato);

    if (existingCampeonato) {
      throw new Error(
        "El nombre del campeonato ya existe para otro registro"
      );
    }

    // Validar que las fechas de transacciones estén antes del inicio del campeonato
    console.log("Validando fechas de transacciones...");
    if (fecha_inicio_transaccion >= fecha_inicio_campeonato) {
      throw new Error(
        "La fecha de inicio de transacciones debe ser antes de la fecha de inicio del campeonato"
      );
    }

    if (fecha_fin_transaccion >= fecha_inicio_campeonato) {
      throw new Error(
        "La fecha de fin de transacciones debe ser antes de la fecha de inicio del campeonato"
      );
    }

    if (fecha_fin_transaccion < fecha_inicio_transaccion) {
      throw new Error(
        "La fecha de fin de transacciones no puede ser anterior a la fecha de inicio de transacciones"
      );
    }

    // Actualizar el campeonato
    console.log("Actualizando campeonato...");
    const [updatedRowsCount] = await Campeonato.update(
      {
        nombre,
        fecha_inicio_campeonato: sequelize.fn(
          "CONVERT",
          sequelize.literal("DATETIME"),
          inicioCampeonato
        ),
        fecha_fin_campeonato: sequelize.fn(
          "CONVERT",
          sequelize.literal("DATETIME"),
          finCampeonato
        ),
        fecha_inicio_transaccion: sequelize.fn(
          "CONVERT",
          sequelize.literal("DATETIME"),
          inicioTransaccion
        ),
        fecha_fin_transaccion: sequelize.fn(
          "CONVERT",
          sequelize.literal("DATETIME"),
          finTransaccion
        ),
        fecha_actualizacion: sequelize.fn("GETDATE"),
      },
      {
        where: { id },
      }
    );

    if (updatedRowsCount === 0) {
      throw new Error(
        `No se encontró el campeonato con el ID ${id} para actualizar`
      );
    }

    console.log("Campeonato actualizado correctamente.");
    return { message: "Campeonato actualizado correctamente" };
  } catch (err) {
    console.log("Error al actualizar el campeonato:", err);
    console.log("Detalles del error:", {
      message: err.message,
      stack: err.stack,
    });
    throw new Error("Error al actualizar el campeonato");
  }
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
        WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rv.walkover = 'Y' THEN 2
        WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rl.walkover = 'Y' THEN 2
        WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.walkover = 'Y' THEN 0
        WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.walkover = 'Y' THEN 0
        WHEN p.estado = 'J' AND e.id = p.equipo_local_id AND rl.resultado = 'G' THEN 2 
        WHEN p.estado = 'J' AND e.id = p.equipo_visitante_id AND rv.resultado = 'G' THEN 2 
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
        ec.campeonatoid = :campeonato_id AND ec.estado = 'Inscrito' AND e.categoria_id = :categoriaId
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
