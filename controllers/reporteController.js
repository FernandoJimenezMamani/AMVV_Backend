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
  
