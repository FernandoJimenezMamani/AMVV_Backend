const express = require('express');
const router = express.Router();
const jugadorController = require('../controllers/jugadorController');

router.post('/post_jugador', jugadorController.createJugador);
router.get('/get_jugador_club/:club_id', jugadorController.getJugadoresByClubId);
router.get('/getJugadoresByEquipo/:equipo_id', jugadorController.getJugadoresByEquipo);

module.exports = router;
