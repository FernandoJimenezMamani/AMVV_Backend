const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

router.post('/insert', pagoController.createPago);
router.get('/getEquiposDebt', pagoController.getEquiposDebt);

module.exports = router;
