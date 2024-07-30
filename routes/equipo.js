const express = require('express');
const sql = require('mssql');
const router = express.Router();

// Obtener equipos
router.get('/get_equipo', async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
      SELECT Equipo.id, Equipo.nombre, Club.nombre AS club_nombre, Categoria.nombre AS categoria_nombre
      FROM Equipo
      INNER JOIN Club ON Equipo.club_id = Club.id
      INNER JOIN Categoria ON Equipo.categoria_id = Categoria.id
      WHERE Equipo.eliminado = 'N'
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener equipos', error: err.message });
  }
});

// Obtener un equipo por ID
router.get('/get_equipo/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'El ID del equipo debe ser proporcionado' });
  }

  try {
    const request = new sql.Request();
    request.input('id', sql.Int, id);

    const result = await request.query('SELECT id, nombre, club_id, categoria_id FROM Equipo WHERE id = @id AND eliminado = \'N\'');

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'Equipo no encontrado' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener el equipo', error: err.message });
  }
});


// Crear equipo
router.post('/post_equipo', async (req, res) => {
  const { nombre, club_id, categoria_id, user_id } = req.body;

  if (!nombre || !club_id || !categoria_id || !user_id) {
    return res.status(400).json({ message: 'Todos los campos (nombre, club_id, categoria_id, user_id) deben ser proporcionados' });
  }

  try {
    const request = new sql.Request();

    const resultEquipo = await request
      .input('nombre', sql.VarChar(255), nombre)
      .input('club_id', sql.Int, club_id)
      .input('categoria_id', sql.SmallInt, categoria_id)
      .input('fecha_registro', sql.DateTime, new Date())
      .input('fecha_actualizacion', sql.DateTime, new Date())
      .input('eliminado', sql.Char(1), 'N')
      .input('user_id', sql.Int, user_id)
      .query(`
        INSERT INTO Equipo (nombre, club_id, categoria_id, fecha_registro, fecha_actualizacion, eliminado, user_id)
        OUTPUT inserted.id
        VALUES (@nombre, @club_id, @categoria_id, @fecha_registro, @fecha_actualizacion, @eliminado, @user_id)
      `);

    const equipoId = resultEquipo.recordset[0].id;

    res.status(201).json({ message: 'Equipo creado', equipoId });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al crear equipo', error: err.message });
  }
});

// Actualizar equipo
router.put('/update_equipo/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, club_id, categoria_id, user_id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'El ID del equipo debe ser proporcionado' });
  }

  if (!nombre && !club_id && !categoria_id && !user_id) {
    return res.status(400).json({ message: 'Al menos uno de los campos (nombre, club_id, categoria_id, user_id) debe ser proporcionado' });
  }

  try {
    const request = new sql.Request();
    request.input('id', sql.Int, id);
    request.input('fecha_actualizacion', sql.DateTime, new Date());
    request.input('user_id', sql.Int, user_id);

    let query = 'UPDATE Equipo SET ';
    const params = [];
    if (nombre) {
      request.input('nombre', sql.VarChar(255), nombre);
      params.push('nombre = @nombre');
    }
    if (club_id) {
      request.input('club_id', sql.Int, club_id);
      params.push('club_id = @club_id');
    }
    if (categoria_id) {
      request.input('categoria_id', sql.SmallInt, categoria_id);
      params.push('categoria_id = @categoria_id');
    }
    params.push('fecha_actualizacion = @fecha_actualizacion', 'user_id = @user_id');
    query += params.join(', ') + ' WHERE id = @id';

    const result = await request.query(query);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Equipo actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Equipo no encontrado' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al actualizar equipo', error: err.message });
  }
});

// Eliminar lógicamente equipo
router.put('/delete_equipo/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'El ID del equipo debe ser proporcionado' });
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
      UPDATE Equipo
      SET eliminado = 'S', fecha_actualizacion = @fecha_actualizacion, user_id = @user_id
      WHERE id = @id
    `);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Equipo eliminado lógicamente correctamente' });
    } else {
      res.status(404).json({ message: 'Equipo no encontrado' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al eliminar lógicamente el equipo', error: err.message });
  }
});

module.exports = router;
