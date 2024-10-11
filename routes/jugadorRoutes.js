const express = require('express');
const router = express.Router();
const jugadorController = require('../controllers/jugadorController');

router.post('/post_jugador', jugadorController.createJugador);
router.get('/get_jugador_club/:club_id', jugadorController.getJugadoresByClubId);

module.exports = router;
