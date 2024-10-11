const express = require('express');
const router = express.Router();
const lugarController = require('../controllers/lugarController');

router.post('/insert', lugarController.createLugar);
router.get('/select', lugarController.getAllLugares);
router.get('/:id', lugarController.getLugarById);
router.put('/edit/:id', lugarController.updateLugar);
router.put('/delete/:id', lugarController.deleteLugar);

module.exports = router;
