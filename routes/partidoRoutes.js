const express = require('express');
const router = express.Router();
const partidoController = require('../controllers/partidoController');
const { upload } = require('../config/multer');

router.post('/insert', partidoController.createPartido);
router.post('/submitResultados', upload.single('imagenPlanilla'), partidoController.submitResultados);
router.get('/select/:categoriaId/:campeonatoId', partidoController.getPartidosByCategoriaId);
router.get('/get_upcoming_matches/:categoria', partidoController.getUpcomingMatchesByCategoria);
router.get('/get_all_matches/:categoria', partidoController.getAllMatchesExceptUpcoming);
router.get('/:id', partidoController.getPartidoById);
router.put('/edit/:id', partidoController.updatePartido);
router.put('/delete/:id', partidoController.deletePartido);
router.get('/get_partido_completo/:partidoId', partidoController.getPartidoCompletoById);
router.get('/get_jugadores/:equipoId', partidoController.getJugadoresByEquipoId);
router.get('/get_arbitros/:partidoId', partidoController.getArbitrosByPartidoId);
router.get('/partidos_pdf/filtrar', partidoController.getPartidosByLugarYFecha);
router.get('/partidos_pdf/filtrar_fecha', partidoController.getPartidosByFecha);

router.get('/generar-fixture/:campeonatoId/:categoriaId', partidoController.generarFixture);
router.get('/generar-fixture-con-fechas/:campeonatoId/:categoriaId', partidoController.generarFixtureConFechas);
router.get('/generar-fixture-completo/:campeonatoId/:categoriaId', partidoController.generarFixtureCompleto);
router.post('/registrar-partidos/:campeonatoId/:categoriaId', partidoController.registrarPartidos);

router.get('/campeonatoPartidosPDF/:campeonatoId', partidoController.getPartidosByCampeonato);

module.exports = router;
