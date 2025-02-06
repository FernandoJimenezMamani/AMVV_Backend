const express = require('express');
const router = express.Router();
const traspasoController = require('../controllers/traspasoController');
const authMiddleware = require('../middlewares/auth');

router.get('/detalle/:id', traspasoController.getTraspasoById);
router.get('/aprobados', traspasoController.getTraspasosAprobados);
router.get('/jugador', authMiddleware, traspasoController.getTraspasosPorJugador);
router.get('/presidente', authMiddleware, traspasoController.getTraspasosPorPresidente);
router.get('/club/enviados/:club_id', traspasoController.getTraspasosEnviadosPorClub);
router.get('/club/recibidos/:club_id', traspasoController.getTraspasosRecibidosPorClub);
router.post('/crear', traspasoController.createTraspaso);
router.put('/aprobar/club/:id', traspasoController.aprobarTraspasoPorClub);
router.put('/aprobar/jugador/:id', traspasoController.aprobarTraspasoPorJugador);
router.put('/rechazar/club/:id', traspasoController.rechazarTraspasoPorClub);
router.put('/rechazar/jugador/:id', traspasoController.rechazarTraspasoPorJugador);
router.put('/eliminar/:id', traspasoController.eliminarTraspaso);

module.exports = router;
