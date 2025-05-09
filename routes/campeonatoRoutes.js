const express = require('express');
const router = express.Router();
const campeonatoController = require('../controllers/campeonatoController');

router.post('/insert', campeonatoController.createCampeonato);
router.get('/get_campeonato_categoria/:campeonato_id/:categoria_id', campeonatoController.getCampeonatoCategoria);
router.get('/get_campeonato_posiciones/:campeonato_id/:categoria_id/:incluirNoInscritos', campeonatoController.getCampeonatoPosiciones);
router.get('/select', campeonatoController.getAllCampeonatos);
router.get('/:id', campeonatoController.getCampeonatoById);
router.put('/edit/:id', campeonatoController.updateCampeonato);

router.get('/obtenerFechas/:campeonatoId', campeonatoController.getFechasPartidos);
router.get('/obtenerCampeonatosEnCurso/EnCurso', campeonatoController.getCampeonatoEnCurso);
router.get('/obtenerCampeonatosEnTransaccion/EnTransaccion', campeonatoController.getCampeonatoEnTransaccion);
router.post('/obtenerEquipoPosicion', campeonatoController.getTeamPosition);
router.delete('/delete_campeonato/:id', campeonatoController.removeCampeonato);
router.get('/ascensos-descensos/:campeonatoId/:genero', campeonatoController.obtenerAscensosDescensos);
router.get('/obtenerCampeonatoActivo/activo', campeonatoController.getCampeonatoActivo);

module.exports = router;
