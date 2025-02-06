const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');

// Definir la ruta para obtener el resumen de datos del campeonato
router.get('/resumen/:campeonatoId', reporteController.getResumenDatos);
router.get('/edad-genero/:campeonatoId', reporteController.getDistribucionEdadGenero);

module.exports = router;
