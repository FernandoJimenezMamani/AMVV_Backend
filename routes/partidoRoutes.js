const express = require('express');
const router = express.Router();
const partidoController = require('../controllers/partidoController');

router.post('/insert', partidoController.createPartido);
router.get('/select/:categoriaId', partidoController.getPartidosByCategoriaId);
router.get('/get_upcoming_matches/:categoria', partidoController.getUpcomingMatchesByCategoria);
router.get('/get_all_matches/:categoria', partidoController.getAllMatchesExceptUpcoming);
router.get('/:id', partidoController.getPartidoById);
router.put('/edit/:id', partidoController.updatePartido);
router.put('/delete/:id', partidoController.deletePartido);

module.exports = router;
