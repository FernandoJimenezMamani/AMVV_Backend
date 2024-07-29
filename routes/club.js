const express = require('express');
const sql = require('mssql');
const { upload } = require('../config/multer');
const { uploadFile } = require('../until/subirImagen');
const router = express.Router();

router.get('/get_club', async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
      SELECT 
        Club.id, 
        Club.nombre, 
        Club.descripcion, 
        Club.fecha_registro, 
        Club.fecha_actualizacion, 
        Club.eliminado, 
        Club.user_id, 
        ImagenClub.club_imagen
      FROM 
        Club
      LEFT JOIN 
        ImagenClub 
      ON 
        Club.id = ImagenClub.club_id AND ImagenClub.imagen_actual = 'S'
      WHERE 
        Club.eliminado = 'N'
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener clubs', error: err.message });
  }
});

router.get('/get_club/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'El ID del club debe ser proporcionado' });
  }

  try {
    const request = new sql.Request();
    request.input('id', sql.Int, id);

    const result = await request.query(`
      SELECT 
        Club.id, 
        Club.nombre, 
        Club.descripcion, 
        Club.fecha_registro, 
        Club.fecha_actualizacion, 
        Club.eliminado, 
        Club.user_id, 
        ImagenClub.club_imagen
      FROM 
        Club
      LEFT JOIN 
        ImagenClub 
      ON 
        Club.id = ImagenClub.club_id AND ImagenClub.imagen_actual = 'S'
      WHERE 
        Club.id = @id AND Club.eliminado = 'N'
    `);

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'Club no encontrado' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener el club', error: err.message });
  }
});


router.get('/get_club_teams/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'El ID del club debe ser proporcionado' });
  }

  try {
    const request = new sql.Request();
    request.input('id', sql.Int, id);

    const result = await request.query(`
      SELECT 
        Club.id AS club_id,
        Club.nombre AS club_nombre,
        Club.descripcion AS club_descripcion,
        Club.fecha_registro AS club_fecha_registro,
        Club.fecha_actualizacion AS club_fecha_actualizacion,
        Club.eliminado AS club_eliminado,
        Club.user_id AS club_user_id,
        ImagenClub.club_imagen AS club_imagen,
        Equipo.id AS equipo_id,
        Equipo.nombre AS equipo_nombre,
        Equipo.fecha_registro AS equipo_fecha_registro,
        Equipo.fecha_actualizacion AS equipo_fecha_actualizacion,
        Equipo.eliminado AS equipo_eliminado,
        Equipo.user_id AS equipo_user_id,
        Categoria.id AS categoria_id,
        Categoria.nombre AS categoria_nombre
      FROM 
        Club
      LEFT JOIN 
        ImagenClub 
      ON 
        Club.id = ImagenClub.club_id AND ImagenClub.imagen_actual = 'S'
      LEFT JOIN 
        Equipo 
      ON 
        Club.id = Equipo.club_id
      LEFT JOIN 
        Categoria 
      ON 
        Equipo.categoria_id = Categoria.id
      WHERE 
        Club.id = @id AND Club.eliminado = 'N'
    `);

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset);
    } else {
      res.status(404).json({ message: 'Club no encontrado o no tiene equipos' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener los equipos del club', error: err.message });
  }
});


router.post('/post_club', upload.single('image'), async (req, res) => {
  console.log('Files:', req.file);
  console.log('Body:', req.body);

  const { nombre, descripcion, user_id } = req.body;
  const imagen = req.file;

  if (!nombre || !descripcion || !user_id) {
    return res.status(400).json({ message: 'Los campos nombre, descripcion y user_id deben ser proporcionados' });
  }

  if (!imagen) {
    return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
  }

  let transaction;
  try {
    // Inicia la transacción
    transaction = new sql.Transaction();
    await transaction.begin();

    const request = new sql.Request(transaction);

    const { downloadURL } = await uploadFile(imagen);

    // Insertar en Club
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

    // Insertar en ImagenClub
    await request
      .input('club_id', sql.Int, clubId)
      .input('club_imagen', sql.VarChar(255), downloadURL)
      .input('imagen_actual', sql.Char(1), 'S')
      .query(`
        INSERT INTO ImagenClub (club_id, club_imagen, imagen_actual)
        VALUES (@club_id, @club_imagen, @imagen_actual)
      `);

    // Commit de la transacción
    await transaction.commit();

    res.status(201).json({ message: 'Club e ImagenClub creados', clubId });

  } catch (err) {
    console.error('Error:', err.message);

    // Rollback de la transacción en caso de error
    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: 'Error al crear Club e ImagenClub', error: err.message });
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
