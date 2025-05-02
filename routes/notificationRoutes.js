const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const notificationController = require('../controllers/notificationController');
// Ruta para registrar/actualizar el token push del usuario
router.post('/register-push-token', authMiddleware, notificationController.registerPushToken);

module.exports = router;