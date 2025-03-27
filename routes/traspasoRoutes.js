const express = require('express');
const router = express.Router();
const traspasoController = require('../controllers/traspasoController');
const authMiddleware = require('../middlewares/auth');

router.get('/detalle/:id', traspasoController.getTraspasoById);
router.get('/aprobados', traspasoController.getTraspasosAprobados);
router.get('/jugador/:CampeonatoId', authMiddleware, traspasoController.getTraspasosPorJugador);
router.get('/presidente/:CampeonatoId', authMiddleware, traspasoController.getTraspasosPorPresidente);
router.get('/presidente_por_jugador/:CampeonatoId', authMiddleware, traspasoController.getTraspasosRelacionadosConPresidente);
router.get('/club/enviados/:club_id', traspasoController.getTraspasosEnviadosPorClub);
router.get('/club/recibidos/:club_id', traspasoController.getTraspasosRecibidosPorClub);
router.post('/crear', traspasoController.createTraspaso);
router.post('/crearJugador', traspasoController.createTraspasoJugador);
router.put('/aprobar/club/:id', traspasoController.aprobarTraspasoPorClub);
router.put('/aprobar/jugador/:id', traspasoController.aprobarTraspasoPorJugador);
router.put('/rechazar/club/:id', traspasoController.rechazarTraspasoPorClub);
router.put('/rechazar/jugador/:id', traspasoController.rechazarTraspasoPorJugador);
router.put('/eliminar/:id', traspasoController.eliminarTraspaso);

router.post('/test-email-traspaso', traspasoController.testSendTraspasoEmail);
router.post('/test-email-traspasoJugador', traspasoController.sendJugadorEmail);
router.post('/test-email-testSendPresidenteO', traspasoController.testSendPresidenteEmail);


router.put('/aprobarPorPresidente/:id', traspasoController.aprobarTraspasoJugador);
router.put('/rechazarPorPresidente/:id', traspasoController.rechazarTraspasoJugador);
module.exports = router;
