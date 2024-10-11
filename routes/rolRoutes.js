const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolController');

router.get('/get_rol', rolController.getAllRoles);
router.post('/post_rol', rolController.createRol);

module.exports = router;
