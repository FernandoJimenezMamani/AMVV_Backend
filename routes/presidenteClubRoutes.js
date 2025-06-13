const express = require('express');
const router = express.Router();
const presidenteClubController = require('../controllers/presidenteClubController');

router.get('/get_presidente_club', presidenteClubController.getAllPresidentes);
router.get('/get_delegado_club', presidenteClubController.getAllDelegados);
router.get('/get_delegadoById/:id', presidenteClubController.getDelegadoById);
router.get('/get_presidenteById/:id', presidenteClubController.getPresidenteById);
router.post('/post_presidente_club', presidenteClubController.createPresidenteClub);
router.put('/delete_presidente/:id', presidenteClubController.deletePresidenteClub);

router.get('/clubActual/:presidenteId', presidenteClubController.getClubActualPresidente);
router.get('/clubesAnteriores/:presidenteId', presidenteClubController.getClubesAnterioresPresidente);
router.get('/clubActualDelegado/:delegadoId', presidenteClubController.getClubActualDelegado);
router.get('/clubesAnterioresDelegado/:delegadoId', presidenteClubController.getClubesAnterioresDelegado);

module.exports = router;
