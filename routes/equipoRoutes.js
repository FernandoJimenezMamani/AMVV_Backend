const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');

router.get('/get_equipoCategoria/:categoria_id', equipoController.getEquiposByCategoriaId);
router.get('/get_equipo/:id', equipoController.getEquipoById);
router.post('/post_equipo', equipoController.createEquipo);
router.put('/update_equipo/:id', equipoController.updateEquipo);
router.put('/delete_equipo/:id', equipoController.deleteEquipo);

module.exports = router;
