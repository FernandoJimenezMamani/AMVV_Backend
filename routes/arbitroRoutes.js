const express = require('express');
const router = express.Router();
const arbitroController = require('../controllers/arbitroController'); // Asegúrate de que el controlador esté correctamente importado

router.get('/get_arbitros', arbitroController.getArbitros);
router.get('/get_arbitroById/:id', arbitroController.getArbitroById);
router.post('/post_arbitro', arbitroController.createArbitro);

module.exports = router;
