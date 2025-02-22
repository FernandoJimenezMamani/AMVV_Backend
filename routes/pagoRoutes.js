const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

router.post('/insertPagoInscripcion', pagoController.createPagoInscripcion);
router.post('/insertPagoTraspaso', pagoController.createPagoTraspaso);
router.get('/getEquiposDebt', pagoController.getEquiposDebt);
router.get('/getEquipoDebtById/:id', pagoController.getEquipoDebtById);
router.get('/getTraspasosDebt', pagoController.getTraspasoDebt);
router.get('/getTraspasoDebtById/:id', pagoController.getTraspasoDebtById);
module.exports = router;
