const express = require('express');
const router = express.Router();
const presidenteClubController = require('../controllers/presidenteClubController');

router.post('/post_presidente_club', presidenteClubController.createPresidenteClub);

module.exports = router;
