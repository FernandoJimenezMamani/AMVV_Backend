const reporteService = require('../services/reporteService');

exports.getResumenDatos = async (req, res) => {
    try {
      const { campeonatoId } = req.params;
  
      if (!campeonatoId) {
        return res.status(400).json({ error: "El ID del campeonato es requerido." });
      }
  
      if (isNaN(campeonatoId)) {
        return res.status(400).json({ error: "El ID del campeonato debe ser un número válido." });
      }
  
      const resumen = await reporteService.getResumenDatos(campeonatoId);
      return res.status(200).json(resumen);
  
    } catch (error) {
      console.error("Error en el controlador de resumen de datos:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };
  
  exports.getDistribucionEdadGenero = async (req, res) => {
    try {
      const { campeonatoId } = req.params;
      if (!campeonatoId) {
        return res.status(400).json({ error: "Se requiere un ID de campeonato." });
      }
  
      const distribucion = await reporteService.getDistribucionEdadGenero(campeonatoId);
      return res.status(200).json(distribucion);
    } catch (error) {
      console.error("Error en el controlador de distribución de edad y género:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };
  
  exports.getProgresoPartidosDashboard = async (req, res) => {
    try {
      const { categoria, genero } = req.query; 

      const progreso = await reporteService.getProgresoPartidosDashboard(categoria, genero);

      if (!progreso) {
        return res.status(404).json({ error: "No hay un campeonato en curso actualmente." });
      }
  
      return res.json(progreso);
  
    } catch (error) {
      console.error("Error al obtener el progreso de partidos:", error);
      return res.status(500).json({ error: "Error interno al obtener el progreso de partidos." });
    }
  };
  
  exports.getProgresoPartidos = async (req, res) => {
    try {
      const { campeonatoId } = req.params;
  
      if (!campeonatoId) {
        return res.status(400).json({ error: "El ID del campeonato es obligatorio." });
      }
  
      const progreso = await reporteService.getProgresoPartidos(campeonatoId);
      return res.json(progreso);
  
    } catch (error) {
      console.error('Error al obtener el progreso de partidos:', error);
      return res.status(500).json({ error: "Error interno al obtener el progreso de partidos." });
    }
  };

  exports.getPartidosPendientes = async (req, res) => {
    try {
      const { campeonatoId } = req.params;
  
      if (!campeonatoId) {
        return res.status(400).json({ error: "El ID del campeonato es obligatorio." });
      }
  
      const data = await reporteService.getPartidosPendientes(campeonatoId);
      return res.json(data);
  
    } catch (error) {
      console.error('Error al obtener los partidos pendientes:', error);
      return res.status(500).json({ error: "Error interno al obtener los partidos pendientes." });
    }
  };

  exports.getComparacionEquipos = async (req, res) => {
    try {
      const { campeonatoA, campeonatoB } = req.params;
  
      if (!campeonatoA || !campeonatoB) {
        return res.status(400).json({ error: "Se requieren dos campeonatos para la comparación." });
      }
  
      const comparacion = await reporteService.getComparacionEquipos(campeonatoA, campeonatoB);
      return res.json(comparacion);
  
    } catch (error) {
      console.error("Error al obtener la comparación de equipos:", error);
      return res.status(500).json({ error: "Error interno al obtener la comparación de equipos." });
    }
  };

  exports.getComparacionIngresos = async (req, res) => {
    try {
      const { campeonatoA, campeonatoB } = req.params;
  
      if (!campeonatoA || !campeonatoB) {
        return res.status(400).json({ error: "Se requieren dos campeonatos para la comparación." });
      }
  
      const comparacion = await reporteService.getComparacionIngresos(campeonatoA, campeonatoB);
      return res.json(comparacion);
  
    } catch (error) {
      console.error("Error al obtener la comparación de ingresos:", error);
      return res.status(500).json({ error: "Error interno al obtener la comparación de ingresos." });
    }
  };

  exports.getMonitoreoEquiposDashboard = async (req, res) => {
    try {
      const monitoreo = await reporteService.getMonitoreoEquiposDashboard();
      return res.json(monitoreo);
    } catch (error) {
      console.error("Error al obtener el monitoreo de equipos:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };
  