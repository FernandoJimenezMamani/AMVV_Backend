const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const notificationController = require('../controllers/notificationController');

router.post('/register-push-token', authMiddleware, notificationController.registerPushToken);
router.delete('/delete-push-token', authMiddleware, notificationController.deletePushToken);

module.exports = router;