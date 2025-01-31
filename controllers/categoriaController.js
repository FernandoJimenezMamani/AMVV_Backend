const categoriaService = require('../services/categoriaService');

exports.getCategorias = async (req, res) => {
  try {
    const categorias = await categoriaService.getCategorias();
    res.status(200).json(categorias);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener categorías', error: err.message });
  }
};

exports.getCategoriaByDivision = async (req, res) => {
  const { division } = req.params;

  try {
    const categorias = await categoriaService.getCategoriaByDivision(division);
    res.status(200).json(categorias);
  } catch (err) {
    res.status(500).json({ message: `Error al obtener categorías de la división ${division}`, error: err.message });
  }
};

exports.getCategoriaById = async (req, res) => {
  const { id } = req.params;

  try {
    const categoria = await categoriaService.getCategoriaById(id);
    if (categoria) {
      res.status(200).json(categoria);
    } else {
      res.status(404).json({ message: 'Categoría no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener la categoría', error: err.message });
  }
};

exports.createCategoria = async (req, res) => {
  const { nombre, genero, division, edad_minima, edad_maxima, costo_traspaso, user_id } = req.body;

  // Verificar si todos los campos requeridos están presentes
  if (!nombre || !genero || !division || !user_id || costo_traspaso === undefined) {
    return res.status(400).json({ message: 'Los campos nombre, genero, division, costo_traspaso y user_id deben ser proporcionados' });
  }

  try {
    // Llamar al servicio con los nuevos campos
    const nuevaCategoria = await categoriaService.createCategoria(nombre, genero, division, edad_minima, edad_maxima, costo_traspaso, user_id);
    res.status(201).json({ message: 'Categoría creada', categoriaId: nuevaCategoria.id });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear categoría', error: err.message });
  }
};

exports.updateCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, genero, division, edad_minima, edad_maxima, costo_traspaso, user_id } = req.body;
  console.log('req.body:', req.body);

  if (!id || !nombre  || costo_traspaso === undefined) {
    return res.status(400).json({ message: 'ID, nombre, user_id y costo_traspaso son necesarios' });
  }

  try {
    const updated = await categoriaService.updateCategoria(id, nombre, genero, division, edad_minima, edad_maxima, costo_traspaso, user_id);
    if (updated[0] > 0) {
      res.status(200).json({ message: 'Categoría actualizada correctamente' });
    } else {
      res.status(404).json({ message: 'Categoría no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar categoría', error: err.message });
  }
};

exports.deleteCategoria = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!id || !user_id) {
    return res.status(400).json({ message: 'ID y user_id son necesarios' });
  }

  try {
    const deleted = await categoriaService.deleteCategoria(id, user_id);
    if (deleted[0] > 0) {
      res.status(200).json({ message: 'Categoría eliminada correctamente' });
    } else {
      res.status(404).json({ message: 'Categoría no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar categoría', error: err.message });
  }
};
