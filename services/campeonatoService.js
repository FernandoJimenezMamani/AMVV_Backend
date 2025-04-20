const {
  Campeonato,
  EquipoCampeonato,
  Equipo,
  Categoria,
  Sequelize,
} = require("../models");
const sequelize = require("../config/sequelize");
const { Op, where } = require("sequelize");
const moment = require("moment");
const campeonatoEstados = require("../constants/campeonatoEstados");
const { sendToClient, clients } = require("../server");
const campeonatoEquipoEstados = require("../constants/campeonatoEquipoEstado");

exports.createCampeonato = async (
  nombre,
  fecha_inicio_campeonato,
  fecha_fin_campeonato,
  fecha_inicio_transaccion,
  fecha_fin_transaccion,
) => {
  try {
    const inicioCampeonato = moment(fecha_inicio_campeonato).format(
      "YYYY-MM-DD HH:mm:ss",
    );
    const finCampeonato = moment(fecha_fin_campeonato).format(
      "YYYY-MM-DD HH:mm:ss",
    );
    const inicioTransaccion = moment(fecha_inicio_transaccion).format(
      "YYYY-MM-DD HH:mm:ss",
    );
    const finTransaccion = moment(fecha_fin_transaccion).format(
      "YYYY-MM-DD HH:mm:ss",
    );

    const normalizedNombre = nombre.replace(/\s+/g, "").toUpperCase();

    const campeonatosActivos = await Campeonato.findOne({
      where: {
        estado: { [Op.in]: [0, 1, 2] },
      },
    });

    if (campeonatosActivos) {
      throw new Error(
        "No se puede crear un nuevo campeonato mientras haya otro en estado en espera, en transacción o en curso.",
      );
    }

    const existingCampeonato = await Campeonato.findOne({
      where: sequelize.where(
        sequelize.fn(
          "REPLACE",
          sequelize.fn("UPPER", sequelize.col("nombre")),
          " ",
          "",
        ),
        normalizedNombre,
      ),
    });

    if (existingCampeonato) {
      throw new Error("El nombre del campeonato ya existe");
    }

    if (fecha_inicio_transaccion >= fecha_inicio_campeonato) {
      throw new Error(
        "La fecha de inicio de transacciones debe ser antes de la fecha de inicio del campeonato",
      );
    }

    if (fecha_fin_transaccion >= fecha_inicio_campeonato) {
      throw new Error(
        "La fecha de fin de transacciones debe ser antes de la fecha de inicio del campeonato",
      );
    }

    if (fecha_fin_transaccion < fecha_inicio_transaccion) {
      throw new Error(
        "La fecha de fin de transacciones no puede ser anterior a la fecha de inicio de transacciones",
      );
    }

    // Crear el campeonato
    const campeonato = await Campeonato.create({
      nombre,
      fecha_inicio_campeonato: sequelize.fn(
        "CONVERT",
        sequelize.literal("DATETIME"),
        inicioCampeonato,
      ),
      fecha_fin_campeonato: sequelize.fn(
        "CONVERT",
        sequelize.literal("DATETIME"),
        finCampeonato,
      ),
      fecha_inicio_transaccion: sequelize.fn(
        "CONVERT",
        sequelize.literal("DATETIME"),
        inicioTransaccion,
      ),
      fecha_fin_transaccion: sequelize.fn(
        "CONVERT",
        sequelize.literal("DATETIME"),
        finTransaccion,
      ),
      fecha_registro: sequelize.fn("GETDATE"),
      eliminado: "N",
      user_id: 1,
      estado: campeonatoEstados.enEspera,
    });

    console.log("Campeonato creado:", campeonato);

    await registrarEquiposDesdeCampeonatoAnterior(campeonato);

    return campeonato;
  } catch (err) {
    console.log("Error al crear el campeonato:", err);
    throw err;
  }
};

exports.getCampeonatoCategoria = async (campeonato_id, categoria_id) => {
  const campeonato = await Campeonato.findOne({
    where: { id: campeonato_id },
    attributes: ["id", "nombre", "estado"],
  });

  if (!campeonato) {
    throw new Error("Campeonato no encontrado");
  }

  const equipoConCategoria = await EquipoCampeonato.findOne({
    where: {
      campeonatoId: campeonato_id,
      categoria_id: categoria_id,
    },
    include: [
      {
        model: Categoria,
        as: "categoria",
        attributes: ["nombre"],
      },
      {
        model: Equipo,
        as: "equipo",
        attributes: ["id", "nombre"],
      },
    ],
  });

  if (!equipoConCategoria) {
    throw new Error("No hay equipos en esta categoría dentro del campeonato");
  }

  return {
    campeonato_nombre: campeonato.nombre,
    categoria_nombre:
      equipoConCategoria.categoria?.nombre || "Categoría no encontrada",
    estado: campeonato.estado,
  };
};

exports.getAllCampeonatos = async () => {
  const campeonatos = await Campeonato.findAll({
    where: { eliminado: "N" },
    attributes: [
      "id",
      "nombre",
      "fecha_inicio_campeonato",
      "fecha_fin_campeonato",
      "fecha_inicio_transaccion",
      "fecha_fin_transaccion",
      "estado",
    ],
  });
  return campeonatos;
};

exports.getCampeonatoById = async (id) => {
  const campeonato = await Campeonato.findByPk(id, {
    attributes: [
      "id",
      "nombre",
      "fecha_inicio_campeonato",
      "fecha_fin_campeonato",
      "fecha_inicio_transaccion",
      "fecha_fin_transaccion",
      "estado",
    ],
  });

  if (!campeonato) {
    throw new Error("Campeonato no encontrado");
  }

  // Procesar las fechas para separarlas en fecha y hora
  const processedCampeonato = {
    id: campeonato.id,
    nombre: campeonato.nombre,
    estado: campeonato.estado,
    fecha_inicio_transaccion: campeonato.fecha_inicio_transaccion
      .toISOString()
      .split("T")[0], // Solo la fecha
    hora_inicio_transaccion: campeonato.fecha_inicio_transaccion
      .toISOString()
      .split("T")[1]
      .split(".")[0], // Solo la hora
    fecha_fin_transaccion: campeonato.fecha_fin_transaccion
      .toISOString()
      .split("T")[0],
    hora_fin_transaccion: campeonato.fecha_fin_transaccion
      .toISOString()
      .split("T")[1]
      .split(".")[0],
    fecha_inicio_campeonato: campeonato.fecha_inicio_campeonato
      .toISOString()
      .split("T")[0],
    hora_inicio_campeonato: campeonato.fecha_inicio_campeonato
      .toISOString()
      .split("T")[1]
      .split(".")[0],
    fecha_fin_campeonato: campeonato.fecha_fin_campeonato
      .toISOString()
      .split("T")[0],
    hora_fin_campeonato: campeonato.fecha_fin_campeonato
      .toISOString()
      .split("T")[1]
      .split(".")[0],
  };

  return processedCampeonato;
};

exports.updateCampeonato = async (
  id,
  nombre,
  fecha_inicio_transaccion,
  fecha_fin_transaccion,
  fecha_inicio_campeonato,
  fecha_fin_campeonato,
) => {
  try {
    const inicioCampeonato = moment(fecha_inicio_campeonato).format(
      "YYYY-MM-DD HH:mm:ss",
    );
    const finCampeonato = moment(fecha_fin_campeonato).format(
      "YYYY-MM-DD HH:mm:ss",
    );
    const inicioTransaccion = moment(fecha_inicio_transaccion).format(
      "YYYY-MM-DD HH:mm:ss",
    );
    const finTransaccion = moment(fecha_fin_transaccion).format(
      "YYYY-MM-DD HH:mm:ss",
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
            "",
          ),
          normalizedNombre,
        ),
      },
    });
    console.log("Resultado de búsqueda por nombre:", existingCampeonato);

    if (existingCampeonato) {
      throw new Error("El nombre del campeonato ya existe para otro registro");
    }

    // Validar que las fechas de transacciones estén antes del inicio del campeonato
    console.log("Validando fechas de transacciones...");
    if (fecha_inicio_transaccion >= fecha_inicio_campeonato) {
      throw new Error(
        "La fecha de inicio de transacciones debe ser antes de la fecha de inicio del campeonato",
      );
    }

    if (fecha_fin_transaccion >= fecha_inicio_campeonato) {
      throw new Error(
        "La fecha de fin de transacciones debe ser antes de la fecha de inicio del campeonato",
      );
    }

    if (fecha_fin_transaccion < fecha_inicio_transaccion) {
      throw new Error(
        "La fecha de fin de transacciones no puede ser anterior a la fecha de inicio de transacciones",
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
          inicioCampeonato,
        ),
        fecha_fin_campeonato: sequelize.fn(
          "CONVERT",
          sequelize.literal("DATETIME"),
          finCampeonato,
        ),
        fecha_inicio_transaccion: sequelize.fn(
          "CONVERT",
          sequelize.literal("DATETIME"),
          inicioTransaccion,
        ),
        fecha_fin_transaccion: sequelize.fn(
          "CONVERT",
          sequelize.literal("DATETIME"),
          finTransaccion,
        ),
        fecha_actualizacion: sequelize.fn("GETDATE"),
      },
      {
        where: { id },
      },
    );

    if (updatedRowsCount === 0) {
      throw new Error(
        `No se encontró el campeonato con el ID ${id} para actualizar`,
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

exports.getChampionshipPositions = async (
  categoriaId,
  campeonato_id,
  incluirNoInscritos = false,
) => {
  try {
    const estadoFiltro = incluirNoInscritos ? "" : "AND ec.estado = 'Inscrito'";
    const query = `
    SELECT 
    e.id AS equipo_id,
    e.nombre AS equipo_nombre,
    COALESCE(SUM(CASE WHEN p.estado IN ('J', 'V') THEN 1 ELSE 0 END), 0) AS partidos_jugados,
    COALESCE(SUM(CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rl.resultado = 'G' THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rv.resultado = 'G' THEN 1 
        ELSE 0 
    END), 0) AS partidos_ganados,
    COALESCE(SUM(CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rl.resultado = 'P' THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rv.resultado = 'P' THEN 1 
        ELSE 0 
    END), 0) AS partidos_perdidos,
    COALESCE(SUM(
    CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rl.set1 > rv.set1 THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rv.set1 > rl.set1 THEN 1 
        ELSE 0 
    END +
    CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rl.set2 > rv.set2 THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rv.set2 > rl.set2 THEN 1 
        ELSE 0 
    END +
    CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND COALESCE(rl.set3, 0) > COALESCE(rv.set3, 0) THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND COALESCE(rv.set3, 0) > COALESCE(rl.set3, 0) THEN 1 
        ELSE 0 
    END
    ), 0) AS sets_a_favor,
    COALESCE(SUM(
    CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rl.set1 < rv.set1 THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rv.set1 < rl.set1 THEN 1 
        ELSE 0 
    END +
    CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rl.set2 < rv.set2 THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rv.set2 < rl.set2 THEN 1 
        ELSE 0 
    END +
    CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND COALESCE(rl.set3, 0) < COALESCE(rv.set3, 0) THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND COALESCE(rv.set3, 0) < COALESCE(rl.set3, 0) THEN 1 
        ELSE 0 
    END
   ), 0) AS sets_en_contra,
    COALESCE(SUM(
    (CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rl.set1 > rv.set1 THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rl.set1 < rv.set1 THEN -1 
        ELSE 0 
    END) +
    (CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rl.set2 > rv.set2 THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rl.set2 < rv.set2 THEN -1 
        ELSE 0 
    END) +
    (CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND COALESCE(rl.set3, 0) > COALESCE(rv.set3, 0) THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND COALESCE(rl.set3, 0) < COALESCE(rv.set3, 0) THEN -1 
        ELSE 0 
    END) +
    (CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rv.set1 > rl.set1 THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rv.set1 < rl.set1 THEN -1 
        ELSE 0 
    END) +
    (CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rv.set2 > rl.set2 THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rv.set2 < rl.set2 THEN -1 
        ELSE 0 
    END) +
    (CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND COALESCE(rv.set3, 0) > COALESCE(rl.set3, 0) THEN 1 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND COALESCE(rv.set3, 0) < COALESCE(rl.set3, 0) THEN -1 
        ELSE 0 
    END)
    ), 0) AS diferencia_sets,
    COALESCE(SUM(
    CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id THEN rl.set1 + rl.set2 + COALESCE(rl.set3, 0) 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id THEN rv.set1 + rv.set2 + COALESCE(rv.set3, 0)
        ELSE 0 
    END
    ), 0) AS puntos_a_favor,
    COALESCE(SUM(
    CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id THEN rv.set1 + rv.set2 + COALESCE(rv.set3, 0) 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id THEN rl.set1 + rl.set2 + COALESCE(rl.set3, 0)
        ELSE 0 
    END
    ), 0) AS puntos_en_contra,
    COALESCE(SUM(
    (CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id THEN rl.set1 + rl.set2 + COALESCE(rl.set3, 0) 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id THEN rv.set1 + rv.set2 + COALESCE(rv.set3, 0)
        ELSE 0 
    END) -
    (CASE 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id THEN rv.set1 + rv.set2 + COALESCE(rv.set3, 0) 
        WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id THEN rl.set1 + rl.set2 + COALESCE(rl.set3, 0)
        ELSE 0 
    END)
    ), 0) AS diferencia_puntos,
    COALESCE(SUM(
    CASE 
    WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rv.walkover = 'Y' THEN 2
    WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rl.walkover = 'Y' THEN 2
    WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rl.walkover = 'Y' THEN 0
    WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rv.walkover = 'Y' THEN 0
    WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rl.resultado = 'G' THEN 2 
    WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rv.resultado = 'G' THEN 2 
    WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_local_id AND rl.resultado = 'P' THEN 1 
    WHEN p.estado IN ('J', 'V') AND e.id = p.equipo_visitante_id AND rv.resultado = 'P' THEN 1 
    ELSE 0 
    END
    ), 0) AS pts,
    ic.club_imagen AS escudo,
    ec.estado  AS estado,
    CASE 
      WHEN MAX(CASE WHEN pv.equipo_id IS NOT NULL THEN 1 ELSE 0 END) = 1 THEN 1
      ELSE 0
    END AS en_vivo,
	  MAX(pv.partido_id) AS partido_vivo_id
    FROM 
        EquipoCampeonato ec
    INNER JOIN 
        Equipo e ON ec.equipoid = e.id
    LEFT JOIN Partido p 
        ON (e.id = p.equipo_local_id OR e.id = p.equipo_visitante_id)
        AND p.campeonato_id = ec.campeonatoId
    LEFT JOIN 
        ResultadoLocal rl ON p.id = rl.partido_id
    LEFT JOIN 
        ResultadoVisitante rv ON p.id = rv.partido_id
    LEFT JOIN
        Club c ON e.club_id = c.id
    LEFT JOIN
        ImagenClub ic ON c.id = ic.club_id
        LEFT JOIN (
        SELECT 
          id AS partido_id,
          equipo_local_id AS equipo_id,
          campeonato_id 
        FROM Partido 
        WHERE estado = 'V'
        UNION
        SELECT 
          id AS partido_id,
          equipo_visitante_id AS equipo_id,
          campeonato_id 
        FROM Partido 
        WHERE estado = 'V'
      ) pv ON pv.equipo_id = e.id AND pv.campeonato_id = ec.campeonatoId
    WHERE 
        ec.campeonatoId = :campeonato_id  
        ${estadoFiltro} AND 
        ec.categoria_id = :categoriaId
    GROUP BY 
        e.id, e.nombre, ic.club_imagen , ec.estado 
    ORDER BY 
        pts DESC, sets_a_favor DESC, diferencia_sets DESC, diferencia_puntos DESC;

      `;

    const positions = await sequelize.query(query, {
      replacements: { categoriaId, campeonato_id },
      type: sequelize.QueryTypes.SELECT,
      logging: false 
    });

    return positions;
  } catch (error) {
    console.error("Error al obtener los próximos partidos:", error);
    throw new Error("Error al obtener los partidos");
  }
};

exports.obtenerFechasDePartidos = async (campeonatoId) => {
  const campeonato = await Campeonato.findByPk(campeonatoId);
  if (!campeonato) {
    throw new Error("Campeonato no encontrado");
  }

  const fechas = [];
  let fechaActual = new Date(campeonato.fecha_inicio_campeonato);
  const fechaFin = new Date(campeonato.fecha_fin_campeonato);

  while (fechaActual <= fechaFin) {
    if (fechaActual.getDay() === 6 || fechaActual.getDay() === 0) {
      // Sábado (6) y Domingo (0)
      fechas.push(fechaActual.toISOString().split("T")[0]); // Obtener solo la parte de la fecha (YYYY-MM-DD)
    }
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return fechas;
};

exports.getCampeonatoEnCurso = async () => {
  try {
    const campeonato = await Campeonato.findOne({
      where: { estado: campeonatoEstados.campeonatoEnCurso },
      attributes: ["id", "nombre"],
    });

    return campeonato || null;
  } catch (error) {
    console.error("Error al obtener el campeonato en curso:", error);
    throw new Error("Error al obtener el campeonato en curso");
  }
};

exports.getCampeonatoEnTransaccion = async () => {
  try {
    const campeonato = await Campeonato.findOne({
      where: { estado: campeonatoEstados.transaccionProceso },
      attributes: ["id", "nombre"],
    });

    return campeonato || null;
  } catch (error) {
    console.error("Error al obtener el campeonato en transaccion:", error);
    throw new Error("Error al obtener el campeonato en transaccion");
  }
};

exports.getTeamPosition = async (campeonato_id, equipoId) => {
  try {
    // 🔍 Obtener la categoría a partir de EquipoCampeonato
    const equipoCampeonato = await EquipoCampeonato.findOne({
      where: {
        campeonatoId: campeonato_id,
        equipoId: equipoId,
      },
    });

    if (!equipoCampeonato || !equipoCampeonato.categoria_id) {
      throw new Error(
        "No se encontró la categoría del equipo para este campeonato",
      );
    }

    const categoriaId = equipoCampeonato.categoria_id;
    const estadoParticipacion = equipoCampeonato.estado;

    const positions = await exports.getChampionshipPositions(
      categoriaId,
      campeonato_id,
      (incluirNoInscritos = false),
    );

    positions.forEach((team, index) => {
      team.posicion = index + 1;
    });

    const teamPosition = positions.find((team) => team.equipo_id === equipoId);

    if (!teamPosition) {
      throw new Error("Equipo no encontrado en el campeonato");
    }

    return {
      equipo_id: teamPosition.equipo_id,
      equipo_nombre: teamPosition.equipo_nombre,
      posicion: teamPosition.posicion,
      puntos: teamPosition.pts,
      sets_a_favor: teamPosition.sets_a_favor,
      diferencia_sets: teamPosition.diferencia_sets,
      diferencia_puntos: teamPosition.diferencia_puntos,
      escudo: teamPosition.escudo,
      estado_equipo_campeonato: estadoParticipacion,
    };
  } catch (error) {
    console.error("Error al obtener la posición del equipo:", error);
    throw new Error("Error al obtener la posición del equipo");
  }
};

exports.eliminarCampeonato = async (campeonatoId) => {
  try {
    const campeonato = await Campeonato.findByPk(campeonatoId);

    if (!campeonato) {
      throw new Error("Campeonato no encontrado");
    }

    campeonato.eliminado = "S";
    campeonato.fecha_actualizacion = sequelize.fn("GETDATE"); // Opcional: actualiza la fecha

    await campeonato.save();

    return { message: "Campeonato eliminado correctamente", campeonato };
  } catch (error) {
    console.error("Error al eliminar campeonato:", error);
    throw new Error("No se pudo eliminar el campeonato");
  }
};

const getEquiposAscensoDescenso = async (campeonatoId, genero = "V") => {
  try {
    const categorias = await Categoria.findAll({
      where: { eliminado: "N", division: "MY", es_ascenso: "S", genero },
      order: [["nivel_jerarquico", "ASC"]],
    });

    console.log("🔍 Categorías ordenadas:", categorias.map(c => `${c.nombre} (nivel ${c.nivel_jerarquico})`));

    const resultados = [];

    for (let i = 0; i < categorias.length; i++) {
      const categoria = categorias[i];
      const siguiente = categorias[i - 1]; // categoría superior
      const anterior = categorias[i + 1]; // categoría inferior

      console.log(`\n📘 Procesando categoría: ${categoria.nombre}`);

      const posiciones = await exports.getChampionshipPositions(
        categoria.id,
        campeonatoId,
        (incluirNoInscritos = true),
      );

      console.log(`📊 Posiciones en ${categoria.nombre}:`, posiciones.map(p => p.equipo_nombre));

      if (!posiciones.length) {
        console.log("⚠️ Sin equipos en esta categoría");
        continue;
      }

      const primero = posiciones[0];
      const ultimo = posiciones[posiciones.length - 1];

      // ASCENSO
      if (i > 0 && siguiente) {
        console.log(`🟢 ASCENSO -> de ${categoria.nombre} a ${siguiente.nombre}:`, primero.equipo_nombre);
        resultados.push({
          tipo: "ASCENSO",
          de: categoria.nombre,
          a: siguiente.nombre,
          equipo: primero,
        });
      }

      // DESCENSO
      if (i < categorias.length - 1 && anterior) {
        console.log(`🔻 DESCENSO -> de ${categoria.nombre} a ${anterior.nombre}:`, ultimo.equipo_nombre);
        resultados.push({
          tipo: "DESCENSO",
          de: categoria.nombre,
          a: anterior.nombre,
          equipo: ultimo,
        });
      }
    }

    console.log("\n✅ Resultados finales de ascensos/descensos:", resultados);
    return resultados;
  } catch (error) {
    console.error("❌ Error al calcular ascensos/descensos:", error);
    throw error;
  }
};

const registrarEquiposDesdeCampeonatoAnterior = async (nuevoCampeonato) => {
  try {
    const [result] = await sequelize.query(
      `
      SELECT TOP 1 * 
      FROM Campeonato 
      WHERE estado = :estadoFinalizado 
        AND fecha_registro < :fechaReferencia 
      ORDER BY fecha_registro DESC
    `,
      {
        replacements: {
          estadoFinalizado: campeonatoEstados.campeonatoFinalizado,
          fechaReferencia: moment(nuevoCampeonato.fecha_registro).format("YYYY-MM-DD HH:mm:ss"),
        },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const campeonatoAnterior = result || null;
    console.log("📌 Campeonato anterior encontrado:", campeonatoAnterior);

    if (!campeonatoAnterior) return;

    const equiposAnteriorCampeonato = await EquipoCampeonato.findAll({
      where: { campeonatoId: campeonatoAnterior.id },
      include: [
        {
          model: Categoria,
          as: "categoria",
          attributes: ["id", "nombre", "es_ascenso", "genero"],
        },
      ],
    });

    const categorias = await Categoria.findAll({
      where: { eliminado: "N" },
      attributes: ["id", "nombre", "genero"],
    });

    const cambiosCategoria = new Map();

    const ascensosVarones = await getEquiposAscensoDescenso(campeonatoAnterior.id, "V");
    ascensosVarones.forEach((cambio) => {
      const equipoId = cambio.equipo.equipo_id;
      const nuevaCategoria = categorias.find((cat) => cat.nombre === cambio.a && cat.genero === "V");
      if (nuevaCategoria) cambiosCategoria.set(equipoId, nuevaCategoria.id);
    });

    const ascensosMujeres = await getEquiposAscensoDescenso(campeonatoAnterior.id, "D");
    ascensosMujeres.forEach((cambio) => {
      const equipoId = cambio.equipo.equipo_id;
      const nuevaCategoria = categorias.find((cat) => cat.nombre === cambio.a && cat.genero === "D");
      if (nuevaCategoria) cambiosCategoria.set(equipoId, nuevaCategoria.id);
    });

    const nuevosRegistrosConCategoria = [];
    const equiposYaRegistrados = await EquipoCampeonato.findAll({
      where: { campeonatoId: nuevoCampeonato.id },
      attributes: ["equipoId"],
    });
    const idsYaRegistrados = new Set(equiposYaRegistrados.map((e) => e.equipoId));

    for (const equipo of equiposAnteriorCampeonato) {
      const equipoId = equipo.equipoId;
      if (idsYaRegistrados.has(equipoId)) continue;

      const nuevaCategoriaId = cambiosCategoria.get(equipoId) || equipo.categoria_id;
      nuevosRegistrosConCategoria.push({
        equipoId,
        campeonatoId: nuevoCampeonato.id,
        categoria_id: nuevaCategoriaId,
        estado: campeonatoEquipoEstados.DeudaInscripcion,
      });
    }

    if (nuevosRegistrosConCategoria.length > 0) {
      await EquipoCampeonato.bulkCreate(nuevosRegistrosConCategoria);
      console.log(`✅ Se insertaron ${nuevosRegistrosConCategoria.length} equipos con categoría`);
    } else {
      console.log("⚠️ No se encontraron equipos del campeonato anterior para insertar.");
    }
  } catch (error) {
    console.error("❌ Error registrando equipos desde el campeonato anterior:", error);
    throw error;
  }
};