const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');
const { upload } = require('../config/multer');

router.get('/get_persona', personaController.getAllPersonas);
router.get('/get_personaById/:id', personaController.getPersonaById);
router.post('/post_persona', upload.single('image'), personaController.createPersona);
router.put('/update_persona_image/:id', upload.single('image'), personaController.updatePersonaImage);
router.put('/update_persona/:id', personaController.updatePersona);
router.put('/delete_persona/:id', personaController.deletePersona);
router.get('/search_persona', personaController.searchPersonas);

module.exports = router;
