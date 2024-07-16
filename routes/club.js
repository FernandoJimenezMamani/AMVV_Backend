const express = require('express');
const sql = require('mssql');
const router = express.Router();

router.get('/get_club', async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query('SELECT id, nombre, descripcion, fecha_registro, fecha_actualizacion, eliminado, user_id FROM Club WHERE eliminado = \'N\'');
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener clubs', error: err.message });
  }
});

router.post('/post_club', async (req, res) => {
  const { nombre, descripcion, user_id } = req.body;

  if (!nombre || !descripcion || !user_id) {
    return res.status(400).json({ message: 'Los campos nombre, descripcion y user_id deben ser proporcionados' });
  }

  try {
    const request = new sql.Request();

    const resultClub = await request
      .input('nombre', sql.VarChar(255), nombre)
      .input('descripcion', sql.VarChar(255), descripcion)
      .input('fecha_registro', sql.DateTime, new Date())
      .input('fecha_actualizacion', sql.DateTime, new Date())
      .input('eliminado', sql.Char(1), 'N')
      .input('user_id', sql.Int, user_id)
      .query(`
        INSERT INTO Club (nombre, descripcion, fecha_registro, fecha_actualizacion, eliminado, user_id)
        OUTPUT inserted.id
        VALUES (@nombre, @descripcion, @fecha_registro, @fecha_actualizacion, @eliminado, @user_id)
      `);

    const clubId = resultClub.recordset[0].id;

    res.status(201).json({ message: 'Club creado', clubId });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al crear Club', error: err.message });
  }
});

router.put('/update_club/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, user_id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'El ID del club debe ser proporcionado' });
  }

  if (!nombre && !descripcion && !user_id) {
    return res.status(400).json({ message: 'Al menos uno de los campos nombre, descripcion o user_id debe ser proporcionado' });
  }

  try {
    const request = new sql.Request();
    request.input('id', sql.Int, id);
    request.input('fecha_actualizacion', sql.DateTime, new Date());

    let query = 'UPDATE Club SET fecha_actualizacion = @fecha_actualizacion';
    if (nombre) {
      request.input('nombre', sql.VarChar(255), nombre);
      query += ', nombre = @nombre';
    }
    if (descripcion) {
      request.input('descripcion', sql.VarChar(255), descripcion);
      query += ', descripcion = @descripcion';
    }
    if (user_id) {
      request.input('user_id', sql.Int, user_id);
      query += ', user_id = @user_id';
    }
    query += ' WHERE id = @id';

    const result = await request.query(query);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Club actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Club no encontrado' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al actualizar club', error: err.message });
  }
});

router.put('/delete_club/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'El ID del club debe ser proporcionado' });
  }

  if (!user_id) {
    return res.status(400).json({ message: 'El user_id debe ser proporcionado' });
  }

  try {
    const request = new sql.Request();
    request.input('id', sql.Int, id);
    request.input('user_id', sql.Int, user_id);
    request.input('fecha_actualizacion', sql.DateTime, new Date());

    const result = await request.query(`
      UPDATE Club
      SET eliminado = 'S', fecha_actualizacion = @fecha_actualizacion, user_id = @user_id
      WHERE id = @id
    `);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Club eliminado lógicamente correctamente' });
    } else {
      res.status(404).json({ message: 'Club no encontrado' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al eliminar lógicamente el club', error: err.message });
  }
});

module.exports = router;
