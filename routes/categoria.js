const express = require('express');
const sql = require('mssql');
const router = express.Router();

router.get('/get_categoria', async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query('SELECT id, nombre, fecha_registro, fecha_actualizacion, eliminado, user_id FROM Categoria WHERE eliminado = \'N\'');
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener categorías', error: err.message });
  }
});


router.get('/get_categoria/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'El ID de la categoría debe ser proporcionado' });
  }

  try {
    const request = new sql.Request();
    request.input('id', sql.Int, id);
    
    const result = await request.query('SELECT id, nombre, fecha_registro, fecha_actualizacion, eliminado, user_id FROM Categoria WHERE id = @id AND eliminado = \'N\'');
    
    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'Categoría no encontrada' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener la categoría', error: err.message });
  }
});


router.post('/post_categoria', async (req, res) => {
  const { nombre, user_id } = req.body;

  if (!nombre || !user_id) {
    return res.status(400).json({ message: 'Los campos nombre y user_id deben ser proporcionados' });
  }

  try {
    const request = new sql.Request();

    const resultCategoria = await request
      .input('nombre', sql.VarChar(50), nombre)
      .input('fecha_registro', sql.DateTime, new Date())
      .input('fecha_actualizacion', sql.DateTime, new Date())
      .input('eliminado', sql.Char(1), 'N')
      .input('user_id', sql.Int, user_id)
      .query(`
        INSERT INTO Categoria (nombre, fecha_registro, fecha_actualizacion, eliminado, user_id)
        OUTPUT inserted.id
        VALUES (@nombre, @fecha_registro, @fecha_actualizacion, @eliminado, @user_id)
      `);

    const categoriaId = resultCategoria.recordset[0].id;

    res.status(201).json({ message: 'Categoría creada', categoriaId });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al crear categoría', error: err.message });
  }
});

router.put('/update_categoria/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, user_id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'El ID de la categoría debe ser proporcionado' });
  }

  if (!nombre || !user_id) {
    return res.status(400).json({ message: 'Los campos nombre y user_id deben ser proporcionados' });
  }

  try {
    const request = new sql.Request();
    request.input('id', sql.SmallInt, id);
    request.input('nombre', sql.VarChar(50), nombre);
    request.input('fecha_actualizacion', sql.DateTime, new Date());
    request.input('user_id', sql.Int, user_id);

    const result = await request.query(`
      UPDATE Categoria
      SET nombre = @nombre, fecha_actualizacion = @fecha_actualizacion, user_id = @user_id
      WHERE id = @id
    `);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Categoría actualizada correctamente' });
    } else {
      res.status(404).json({ message: 'Categoría no encontrada' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al actualizar categoría', error: err.message });
  }
});

router.put('/delete_categoria/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'El ID de la categoría debe ser proporcionado' });
  }

  if (!user_id) {
    return res.status(400).json({ message: 'El user_id debe ser proporcionado' });
  }

  try {
    const request = new sql.Request();
    request.input('id', sql.SmallInt, id);
    request.input('user_id', sql.Int, user_id);
    request.input('fecha_actualizacion', sql.DateTime, new Date());

    const result = await request.query(`
      UPDATE Categoria
      SET eliminado = 'S', fecha_actualizacion = @fecha_actualizacion, user_id = @user_id
      WHERE id = @id
    `);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Categoría eliminada lógicamente correctamente' });
    } else {
      res.status(404).json({ message: 'Categoría no encontrada' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al eliminar lógicamente la categoría', error: err.message });
  }
});

module.exports = router;
