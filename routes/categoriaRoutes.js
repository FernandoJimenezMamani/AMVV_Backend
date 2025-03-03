const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

router.get('/get_categoria', categoriaController.getCategorias);
router.get('/get_categoria/:division', categoriaController.getCategoriaByDivision);
router.get('/get_categoriaId/:id', categoriaController.getCategoriaById);
router.post('/post_categoria', categoriaController.createCategoria);
router.put('/update_categoria/:id', categoriaController.updateCategoria);
router.put('/delete_categoria/:id', categoriaController.deleteCategoria);
router.get('/nombres', categoriaController.getNombresCategorias);

module.exports = router;
