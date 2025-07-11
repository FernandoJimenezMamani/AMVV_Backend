const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');
const { upload } = require('../config/multer');

router.get('/get_persona', personaController.getAllPersonas);
router.get('/get_personaById/:id', personaController.getPersonaById);
router.post('/post_persona', upload.single('image'), personaController.createPersona);
router.put('/update_persona_image/:id', upload.single('image'), personaController.updatePersonaImage);
router.put('/update_persona/:id', personaController.updatePersona);
router.put('/update_persona_with_roles/:id', upload.single('image'), personaController.updatePersonaWithRoles);
router.put('/delete_persona/:id', personaController.deletePersona);
router.put('/activatePersona/:id', personaController.activatePersona);
router.get('/search_persona', personaController.searchPersonas);
// Buscar solo las personas que no tienen el rol de jugador
router.get('/search_personas_sin_jugador', personaController.searchPersonasSinRolJugador);

module.exports = router;
