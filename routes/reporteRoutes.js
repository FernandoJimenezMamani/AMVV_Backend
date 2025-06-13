const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');

// Definir la ruta para obtener el resumen de datos del campeonato
router.get('/resumen/:campeonatoId', reporteController.getResumenDatos);
router.get('/edad-genero/:campeonatoId', reporteController.getDistribucionEdadGenero);
router.get("/progreso-partidosDashboard", reporteController.getProgresoPartidosDashboard);  
router.get('/progreso/:campeonatoId', reporteController.getProgresoPartidos);
router.get('/pendientes/:campeonatoId', reporteController.getPartidosPendientes);
router.get('/comparar-equipos/:campeonatoA/:campeonatoB', reporteController.getComparacionEquipos);
router.get('/comparar-ingresos/:campeonatoA/:campeonatoB', reporteController.getComparacionIngresos);
router.get('/dashboard/monitoreo-equipos', reporteController.getMonitoreoEquiposDashboard);


module.exports = router;
