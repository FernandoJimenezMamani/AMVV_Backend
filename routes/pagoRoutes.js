const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

router.post('/insert', pagoController.createPago);


module.exports = router;
