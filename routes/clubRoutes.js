const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const { upload } = require('../config/multer');

router.get('/get_club', clubController.getClubs);
router.get('/get_club/:id', clubController.getClubById);
router.get('/get_club_teams/:id', clubController.getClubTeams);
router.post('/post_club', upload.single('image'), clubController.createClub);
router.put('/update_club/:id', clubController.updateClub);
router.put('/update_club_image/:id', upload.single('image'), clubController.updateClubImage);
router.put('/delete_club/:id', clubController.deleteClub);

module.exports = router;
