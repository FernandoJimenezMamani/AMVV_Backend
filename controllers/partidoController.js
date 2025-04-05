const partidoService = require("../services/partidoService");
const { Campeonato } = require("../models");
const fs = require("fs");
const path = require("path");
const generatePDF = require("../utils/generatePDF");
const campeonatoService = require("../services/campeonatoService");

exports.createPartido = async (req, res) => {
  const {
    campeonato_id,
    equipo_local_id,
    equipo_visitante_id,
    fecha,
    lugar_id,
    arbitros,
  } = req.body;

  if (
    !campeonato_id ||
    !equipo_local_id ||
    !equipo_visitante_id ||
    !fecha ||
    !lugar_id
  ) {
    return res.status(400).json({
      message: "Todos los campos requeridos deben ser proporcionados",
    });
  }

  try {
    await partidoService.createPartido({
      campeonato_id,
      equipo_local_id,
      equipo_visitante_id,
      fecha,
      lugar_id,
      arbitros,
    });
    return res.status(201).json({ message: "Partido creado exitosamente" });
  } catch (err) {
    console.error('Error en la creación del partido:', err.message);
    return res.status(400).json({ message: err.message });
  }
};

exports.getPartidosByCategoriaId = async (req, res) => {
  const { categoriaId, campeonatoId } = req.params;

  try {
    const partidos = await partidoService.getPartidosByCategoriaId(
      categoriaId,
      campeonatoId,
    );
    res.status(200).json(partidos);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error al obtener los partidos", error: err.message });
  }
};

exports.getPartidosByEquipoId = async (req, res) => {
  const { EquipoId, campeonatoId } = req.params;

  try {
    const partidos = await partidoService.getPartidosByEquipoId(
      EquipoId,
      campeonatoId,
    );
    res.status(200).json(partidos);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error al obtener los partidos", error: err.message });
  }
};

exports.getUpcomingMatchesByCategoria = async (req, res) => {
  const { categoria, CampeonatoId } = req.params;

  try {
    const partidos = await partidoService.getUpcomingMatchesByCategoria(
      categoria,
      CampeonatoId,
    );
    res.status(200).json(partidos);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getPastMatchesByCategoria = async (req, res) => {
  const { categoria, CampeonatoId } = req.params;

  try {
    const partidos = await partidoService.getPastMatchesByCategoria(
      categoria,
      CampeonatoId,
    );
    res.status(200).json(partidos);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllMatchesExceptUpcoming = async (req, res) => {
  const { categoria, CampeonatoId } = req.params;

  try {
    const partidos = await partidoService.getAllMatchesExceptUpcoming(
      categoria,
      CampeonatoId,
    );
    res.status(200).json(partidos);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllMatchesExceptPrevious = async (req, res) => {
  const { categoria, CampeonatoId } = req.params;

  try {
    const partidos = await partidoService.getAllMatchesExceptPrevious(
      categoria,
      CampeonatoId,
    );
    res.status(200).json(partidos);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getPartidoById = async (req, res) => {
  const { id } = req.params;

  try {
    const partido = await partidoService.getPartidoById(id);
    if (!partido) {
      return res.status(404).json({ message: "Partido no encontrado" });
    }
    res.status(200).json(partido);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error al obtener el Partido", error: err.message });
  }
};

exports.updatePartido = async (req, res) => {
  const { id } = req.params;
  const {
    campeonato_id,
    equipo_local_id,
    equipo_visitante_id,
    fecha,
    lugar_id,
    resultado,
  } = req.body;

  if (
    !campeonato_id ||
    !equipo_local_id ||
    !equipo_visitante_id ||
    !fecha ||
    !lugar_id
  ) {
    return res.status(400).json({
      message: "Todos los campos requeridos deben ser proporcionados",
    });
  }

  try {
    await partidoService.updatePartido(id, {
      campeonato_id,
      equipo_local_id,
      equipo_visitante_id,
      fecha,
      lugar_id,
      resultado,
    });
    res.status(200).json({ message: "Partido editado exitosamente" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error al editar el Partido", error: err.message });
  }
};

exports.deletePartido = async (req, res) => {
  const { id } = req.params;

  try {
    await partidoService.deletePartido(id);
    res.status(200).json({ message: "Partido eliminado exitosamente" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error al eliminar el Partido", error: err.message });
  }
};

exports.submitResultados = async (req, res) => {
  let { partido_id, resultadoLocal, resultadoVisitante, walkover, tarjetas } =
    req.body;
  const imagenPlanilla = req.file;

  // Validar los campos requeridos
  if (
    !partido_id ||
    !resultadoLocal ||
    !resultadoVisitante ||
    !imagenPlanilla
  ) {
    return res.status(400).json({
      message: "Todos los campos requeridos deben ser proporcionados",
    });
  }

  try {
    // Parsear los datos si llegan como strings
    resultadoLocal = JSON.parse(resultadoLocal);
    resultadoVisitante = JSON.parse(resultadoVisitante);
    tarjetas = JSON.parse(tarjetas);

    // Llamar al servicio para registrar los resultados
    const resultados = await partidoService.submitResultados({
      partido_id,
      resultadoLocal,
      resultadoVisitante,
      walkover,
      tarjetas,
      imagenPlanilla,
    });

    res.status(201).json({
      message:
        "Resultados, tarjetas e imagen de la planilla registrados exitosamente",
      resultados,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar los resultados",
      error: error.message,
    });
  }
};
exports.getPartidoCompletoById = async (req, res) => {
  const { partidoId } = req.params;

  try {
    const partido = await partidoService.getPartidoCompletoById(partidoId);
    if (!partido) {
      return res.status(404).json({ message: "Partido no encontrado" });
    }
    res.status(200).json(partido);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener la información del partido",
      error: error.message,
    });
  }
};

// Obtener los jugadores de un equipo por su ID
exports.getJugadoresByEquipoId = async (req, res) => {
  const { equipoId, campeonatoId } = req.params;

  try {
    const jugadores = await partidoService.getJugadoresByEquipoAndCampeonato(
      equipoId,
      campeonatoId,
    );
    res.status(200).json(jugadores);
  } catch (error) {
    console.error("Error en getJugadoresByEquipoAndCampeonato:", error);
    res.status(500).json({
      message: "Error al obtener los jugadores del equipo en el campeonato",
      error: error.message,
    });
  }
};

// Obtener los árbitros asignados a un partido por su ID
exports.getArbitrosByPartidoId = async (req, res) => {
  const { partidoId } = req.params;

  try {
    const arbitros = await partidoService.getArbitrosByPartidoId(partidoId);
    res.status(200).json(arbitros);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener los árbitros del partido",
      error: error.message,
    });
  }
};

exports.getPartidosByLugarYFecha = async (req, res) => {
  const { lugarId, fecha } = req.query;

  if (!lugarId || !fecha) {
    return res
      .status(400)
      .json({ message: 'El lugar y la fecha son obligatorios' });
  }

  try {
    const partidos = await partidoService.getPartidosByLugarYFecha(
      lugarId,
      fecha,
    );
    const pdfPath = await generatePDF(lugarId, fecha, partidos);

    // Verificar si el archivo realmente existe antes de enviarlo
    if (!fs.existsSync(pdfPath)) {
      return res.status(500).json({ message: 'No se pudo generar el PDF' });
    }

    // 📌 Configurar la respuesta para abrir el PDF en el navegador
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="partidos.pdf"');
    res.sendFile(path.resolve(pdfPath));
  } catch (err) {
    console.error('Error en getPartidosByLugarYFecha:', err.message);
    res
      .status(500)
      .json({ message: 'Error al obtener los partidos', error: err.message });
  }
};

exports.getPartidosByFecha = async (req, res) => {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({ message: 'La fecha es obligatoria' });
  }

  try {
    const partidos = await partidoService.getPartidosByFecha(fecha);
    const pdfPath = await generatePDF(fecha, partidos);

    // Verificar si el archivo realmente existe antes de enviarlo
    if (!fs.existsSync(pdfPath)) {
      return res.status(500).json({ message: 'No se pudo generar el PDF' });
    }

    // 📌 Configurar la respuesta para abrir el PDF en el navegador
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="partidos.pdf"');
    res.sendFile(path.resolve(pdfPath));
  } catch (err) {
    console.error('Error en getPartidosByFecha:', err.message);
    res
      .status(500)
      .json({ message: 'Error al obtener los partidos', error: err.message });
  }
};

exports.generarFixture = async (req, res) => {
  const { campeonatoId, categoriaId } = req.params;

  if (!campeonatoId || !categoriaId) {
    return res
      .status(400)
      .json({ message: "Se requiere el ID del campeonato y la categoría." });
  }

  try {
    const equipos = await partidoService.getEquiposInscritos(
      campeonatoId,
      categoriaId,
    );

    if (equipos.length < 2) {
      return res.status(400).json({
        message: "No hay suficientes equipos inscritos para generar partidos.",
      });
    }

    const fixture = partidoService.generarFixtureRoundRobin(equipos);

    res.status(200).json({ fixture });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al generar el fixture.", error: error.message });
  }
};

exports.generarFixtureConFechas = async (req, res) => {
  const { campeonatoId, categoriaId } = req.params;

  if (!campeonatoId || !categoriaId) {
    return res
      .status(400)
      .json({ message: "Se requiere el ID del campeonato y la categoría." });
  }

  try {
    const campeonato = await Campeonato.findByPk(campeonatoId);
    if (!campeonato) {
      return res.status(404).json({ message: "Campeonato no encontrado" });
    }

    const equipos = await partidoService.getEquiposInscritos(
      campeonatoId,
      categoriaId,
    );
    if (!equipos || equipos.length < 2) {
      return res.status(400).json({
        message: "No hay suficientes equipos inscritos para generar partidos.",
      });
    }

    console.log('Equipos obtenidos:', equipos); // 📌 Depuración

    const fixture = partidoService.generarFixtureRoundRobin(equipos);

    if (!fixture || fixture.length === 0) {
      return res
        .status(400)
        .json({ message: "Error: No se pudo generar el fixture." });
    }

    console.log('Fixture generado:', fixture); // 📌 Depuración

    const fechasSuficientes = partidoService.validarDisponibilidadFechas(
      fixture,
      campeonato,
    );
    if (!fechasSuficientes) {
      return res.status(400).json({
        message:
          "El rango de fechas del campeonato no permite jugar todos los partidos. Amplía el rango de fechas.",
      });
    }

    const partidosConFechas = await partidoService.asignarFechasHorarios(
      fixture,
      campeonato,
    );

    if (!partidosConFechas || partidosConFechas.length === 0) {
      return res
        .status(400)
        .json({ message: "Error: No se pudo asignar fechas a los partidos." });
    }

    res.status(200).json({ partidos: partidosConFechas });
  } catch (error) {
    console.error('Error en la generación de partidos:', error); // 📌 Depuración
    res.status(500).json({
      message: "Error al generar los partidos con fechas.",
      error: error.message,
    });
  }
};

exports.generarFixtureCompleto = async (req, res) => {
  const { campeonatoId, categoriaId } = req.params;

  if (!campeonatoId || !categoriaId) {
    console.error('🚨 Error: Faltan parámetros');
    return res
      .status(400)
      .json({ message: "Se requiere el ID del campeonato y la categoría." });
  }

  try {
    const campeonato = await Campeonato.findByPk(campeonatoId);
    if (!campeonato) {
      console.error('🚨 Error: Campeonato no encontrado');
      return res.status(404).json({ message: "Campeonato no encontrado" });
    }

    const equipos = await partidoService.getEquiposInscritos(
      campeonatoId,
      categoriaId,
    );
    if (equipos.length < 2) {
      console.error('🚨 Error: No hay suficientes equipos inscritos');
      return res.status(400).json({
        message: "No hay suficientes equipos inscritos para generar partidos.",
      });
    }

    const fixture = partidoService.generarFixtureRoundRobin(equipos);
    const fechasSuficientes = partidoService.validarDisponibilidadFechas(
      fixture,
      campeonato,
    );
    if (!fechasSuficientes) {
      console.error('🚨 Error: No hay suficientes fechas disponibles');
      return res.status(400).json({
        message:
          "El rango de fechas del campeonato no permite jugar todos los partidos. Amplía el rango de fechas.",
      });
    }

    let partidosConFechas = await partidoService.asignarFechasHorarios(
      fixture,
      campeonato,
    );
    let partidosConLugares =
      await partidoService.asignarLugaresAPartidos(partidosConFechas);
    let partidosConArbitros =
      await partidoService.asignarArbitrosAPartidos(partidosConLugares);

    res.status(200).json({ partidos: partidosConArbitros });
  } catch (error) {
    console.error('🚨 Error en la generación del fixture completo:', error);
    res.status(500).json({
      message: "Error al generar los partidos con árbitros.",
      error: error.message,
    });
  }
};

exports.registrarPartidos = async (req, res) => {
  const { campeonatoId, categoriaId } = req.params;
  const { partidos } = req.body;

  if (!campeonatoId || !categoriaId) {
    return res
      .status(400)
      .json({ message: "Se requiere el ID del campeonato y la categoría." });
  }

  if (!partidos || partidos.length === 0) {
    return res.status(400).json({ message: 'No hay partidos para registrar.' });
  }

  try {
    const resultado = await partidoService.registrarPartidos(
      partidos,
      campeonatoId,
      categoriaId,
    );
    res.status(201).json(resultado);
  } catch (error) {
    console.error('🚨 Error en el registro de partidos:', error);
    res
      .status(400)
      .json({ message: error.message || "Error al registrar los partidos." });
  }
};

exports.getPartidosByCampeonato = async (req, res) => {
  const { campeonatoId } = req.params;
  const { fecha } = req.query;

  if (!campeonatoId) {
    return res
      .status(400)
      .json({ message: 'El ID del campeonato es obligatorio' });
  }
  if (!fecha) {
    return res.status(400).json({ message: 'La fecha es obligatoria' });
  }

  try {
    // Obtener los partidos por campeonato y fecha específica
    const partidos = await partidoService.getPartidosByCampeonatoYFecha(
      campeonatoId,
      fecha,
    );

    if (partidos.length === 0) {
      return res.status(404).json({
        message:
          'No se encontraron partidos para este campeonato en la fecha indicada',
      });
    }
    // Obtener el nombre del campeonato para incluirlo en el PDF
    const campeonato = await campeonatoService.getCampeonatoById(campeonatoId);
    const campeonatoNombre = campeonato.nombre;

    // Generar el PDF con los partidos filtrados por fecha
    const pdfPath = await generatePDF(partidos, campeonatoNombre, fecha);

    // Verificar si el archivo se generó correctamente
    if (!fs.existsSync(pdfPath)) {
      return res.status(500).json({ message: 'No se pudo generar el PDF' });
    }

    // Configurar la respuesta para abrir el PDF en el navegador
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${campeonatoNombre}_${fecha}.pdf"`,
    );
    res.sendFile(path.resolve(pdfPath));
  } catch (err) {
    console.error('Error en getPartidosByCampeonatoYFecha:', err.message);
    res
      .status(500)
      .json({ message: 'Error al obtener los partidos', error: err.message });
  }
};

exports.reprogramarPartidoController = async (req, res) => {
  try {
    const { partidoId } = req.params;

    if (!partidoId) {
      return res
        .status(400)
        .json({ message: "Falta el parámetro requerido: partidoId." });
    }

    const resultadoSimulacion =
      await partidoService.reprogramarPartido(partidoId);

    return res.status(200).json(resultadoSimulacion);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.confirmarReprogramacionPartidoController = async (req, res) => {
  try {
    const { partidoId, nuevaFechaHora, nuevoLugar, arbitrosAsignados } =
      req.body;

    if (!partidoId || !nuevaFechaHora || !nuevoLugar || !arbitrosAsignados) {
      return res.status(400).json({
        message:
          "Faltan parámetros requeridos para confirmar la reprogramación.",
      });
    }

    const resultado = await partidoService.confirmarReprogramacionPartido(
      partidoId,
      nuevaFechaHora,
      nuevoLugar,
      arbitrosAsignados,
    );

    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.obtenerResultadosPartidoController = async (req, res) => {
  try {
    const { partidoId } = req.params;

    if (!partidoId) {
      return res
        .status(400)
        .json({ message: "Falta el parámetro requerido: partidoId." });
    }

    const resultados = await partidoService.obtenerResultadosPartido(partidoId);

    return res.status(200).json(resultados);
  } catch (error) {
    console.error("Error al obtener los resultados del partido:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.obtenerGanadorPartido = async (req, res) => {
  const { partidoId } = req.params;

  try {
    const resultado = await partidoService.obtenerGanadorPartido(partidoId);
    res.status(200).json(resultado);
  } catch (error) {
    console.error("🚨 Error en obtenerGanadorPartido:", error);
    res.status(500).json({
      message: "Error al obtener el ganador del partido",
      error: error.message,
    });
  }
};

exports.getFechasDisponiblesPorLugar = async (req, res) => {
  try {
    const { lugar_id } = req.params;

    if (!lugar_id) {
      return res.status(400).json({ error: 'El lugar_id es requerido.' });
    }

    const fechasDisponibles =
      await partidoService.obtenerFechasDisponiblesPorLugar(parseInt(lugar_id));

    return res.json({ fechas_disponibles: fechasDisponibles });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getHorariosDisponiblesPorFechaYLugar = async (req, res) => {
  try {
    const { lugar_id, fecha } = req.params;

    if (!lugar_id || !fecha) {
      return res
        .status(400)
        .json({ error: "El lugar_id y la fecha son requeridos." });
    }

    const horariosDisponibles =
      await partidoService.obtenerHorariosDisponiblesPorFechaYLugar(
        parseInt(lugar_id),
        fecha,
      );

    return res.json({ horarios_disponibles: horariosDisponibles });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getArbitrosDisponiblesPorFechaYLugar = async (req, res) => {
  try {
    const { fecha, hora, lugar_id } = req.params;

    if (!fecha || !hora || !lugar_id) {
      return res
        .status(400)
        .json({ error: "La fecha, la hora y el lugar_id son requeridos." });
    }

    const arbitrosDisponibles =
      await partidoService.getArbitrosDisponiblesPorFechaYLugar(
        fecha,
        hora,
        parseInt(lugar_id),
      );

    return res.json({ arbitros_disponibles: arbitrosDisponibles });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateParcialResultados = async (req, res) => {
  try {
    let { partido_id, resultadoLocal, resultadoVisitante, walkover, tarjetas } =
      req.body;

    // Solo parsear si es string
    if (typeof resultadoLocal === "string")
      resultadoLocal = JSON.parse(resultadoLocal);
    if (typeof resultadoVisitante === "string")
      resultadoVisitante = JSON.parse(resultadoVisitante);
    if (typeof tarjetas === "string") tarjetas = JSON.parse(tarjetas);

    // Lógica de actualización
    await partidoService.updateResultadoSets({
      partido_id,
      resultadoLocal,
      resultadoVisitante,
      walkover,
    });
    await partidoService.syncTarjetas(partido_id, tarjetas);

    return res.status(200).json({ message: "Actualización parcial exitosa" });
  } catch (error) {
    console.error("Error al actualizar resultados parciales:", error);
    return res.status(500).json({
      message: "Error al actualizar resultados parciales",
      error: error.message,
    });
  }
};
