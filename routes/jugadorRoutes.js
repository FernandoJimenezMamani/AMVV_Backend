const express = require('express');
const router = express.Router();
const jugadorController = require('../controllers/jugadorController');

router.get('/jugadores', jugadorController.getAllJugadores);
router.post('/post_jugador', jugadorController.createJugador);
router.post('/asignar_jugador_equipo', jugadorController.asignarJugadorAEquipo);
router.get('/get_jugador_club/:club_id', jugadorController.getJugadoresByClubId);
router.get('/search_jugadores_club/:club_id', jugadorController.searchJugadoresByClubId);
router.get('/get_jugadores_equipo/:equipo_id', jugadorController.getJugadoresByEquipoId);
router.get('/getJugadoresByEquipo/:equipo_id', jugadorController.getJugadoresByEquipo);

module.exports = router;
