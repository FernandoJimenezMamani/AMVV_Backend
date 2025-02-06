const express = require('express');
const router = express.Router();
const jugadorController = require('../controllers/jugadorController');
const { upload } = require('../config/multer');

router.get('/jugadores', jugadorController.getAllJugadores);
router.post('/post_jugador', jugadorController.createJugador);
router.get('/get_jugadorById/:id', jugadorController.getJugadorById);
router.post('/post_new_jugador', upload.single('image'), jugadorController.createNewJugador);
router.post('/asignar_jugador_equipo', jugadorController.asignarJugadorAEquipo);
router.get('/get_jugador_club/:club_id', jugadorController.getJugadoresByClubId);
router.post('/get_jugador_club_Category', jugadorController.getJugadoresByClubIdAndCategory);
router.get('/search_jugadores_club/:club_id', jugadorController.searchJugadoresByClubId);
router.get('/get_jugadores_equipo/:equipo_id', jugadorController.getJugadoresByEquipoId);
router.get('/getJugadoresByEquipo/:equipo_id', jugadorController.getJugadoresByEquipo);
router.post('/post_jugadorEquipo', jugadorController.createJugadorEquipo);
router.post('/intercambio', jugadorController.getJugadoresAbleToExchange);
router.post('/intercambioEstado', jugadorController.getJugadoresPendingExchange);

module.exports = router;
