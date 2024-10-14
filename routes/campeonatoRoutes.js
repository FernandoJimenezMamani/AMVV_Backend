const express = require('express');
const router = express.Router();
const campeonatoController = require('../controllers/campeonatoController');

router.post('/insert', campeonatoController.createCampeonato);
router.get('/get_campeonato_categoria/:campeonato_id/:categoria_id', campeonatoController.getCampeonatoCategoria);
router.get('/get_campeonato_posiciones/:campeonato_id/:categoria_id', campeonatoController.getCampeonatoPosiciones);
router.get('/select', campeonatoController.getAllCampeonatos);
router.get('/:id', campeonatoController.getCampeonatoById);
router.put('/edit/:id', campeonatoController.updateCampeonato);

module.exports = router;
