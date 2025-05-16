const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

router.post('/insertPagoInscripcion', pagoController.createPagoInscripcion);
router.post('/insertPagoTraspaso', pagoController.createPagoTraspaso);
router.get('/getEquiposDebt', pagoController.getEquiposDebt);
router.get('/getEquipoDebtById/:id', pagoController.getEquipoDebtById);
router.get('/getTraspasosDebt', pagoController.getTraspasoDebt);
router.get('/getTraspasoDebtById/:id', pagoController.getTraspasoDebtById);
router.get('/resumen-campeonato', pagoController.getResumenCampeonato);
router.get('/historial-inscripcion/:campeonatoId', pagoController.getPagosInscripcionPorCampeonato);
router.get('/historial-traspasos/:campeonatoId', pagoController.obtenerPagosTraspasoPorCampeonato);
router.get('/inscripcion/por-club/:clubId/:campeonatoId', pagoController.obtenerPagosInscripcionPorClub);
router.get('/traspasos/por-club/:clubId/:campeonatoId', pagoController.obtenerPagosTraspasoPorClub);

module.exports = router;
