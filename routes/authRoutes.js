const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

router.post('/login', authController.login);
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
