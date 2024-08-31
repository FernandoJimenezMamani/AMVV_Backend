const express = require('express');
const sql = require('mssql');
const { upload } = require('../config/multer');
const { uploadFile } = require('../until/subirImagen');
const { ref, deleteObject } = require('firebase/storage');
const { storage } = require('../config/firebase');
const router = express.Router();
 
router.get('/get_club', async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
      SELECT
        Club.id,
        Club.nombre,
        Club.descripcion,
        Club.eliminado,
        Club.user_id,
        ImagenClub.club_imagen
      FROM
        Club
      LEFT JOIN
        ImagenClub
      ON
        Club.id = ImagenClub.club_id
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
        Club.presidente_asignado,
        Club.eliminado,
        Club.user_id,
        ImagenClub.club_imagen
      FROM
        Club
      LEFT JOIN
        ImagenClub
      ON
        Club.id = ImagenClub.club_id
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
        Club.presidente_asignado,
        Club.eliminado AS club_eliminado,
        ImagenClub.club_imagen AS club_imagen,
        Equipo.id AS equipo_id,
        Equipo.nombre AS equipo_nombre,
        Equipo.eliminado AS equipo_eliminado,
        Categoria.id AS categoria_id,
        Categoria.nombre AS categoria_nombre,
        Persona.id AS presidente_id,
        CONCAT(Persona.nombre, ' ', Persona.apellido) AS presidente_nombre
      FROM
        Club
      LEFT JOIN
        ImagenClub
      ON
        Club.id = ImagenClub.club_id
      LEFT JOIN
        Equipo
      ON
        Club.id = Equipo.club_id
      LEFT JOIN
        Categoria
      ON
        Equipo.categoria_id = Categoria.id
      LEFT JOIN
        PresidenteClub
      ON
        Club.id = PresidenteClub.club_id
      LEFT JOIN
        Persona
      ON
        PresidenteClub.id = Persona.id
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
 
    // Generar el nombre del archivo basado en el nombre del club
    const fileName = `${nombre.replace(/\s+/g, '_')}_image`;
 
    // Subir la imagen a la carpeta FilesClubs
    const { downloadURL } = await uploadFile(imagen, fileName, null, 'FilesClubs');
 
    // Insertar en Club
    const resultClub = await request
      .input('nombre', sql.VarChar(255), nombre)
      .input('descripcion', sql.VarChar(255), descripcion)
      .input('fecha_registro', sql.DateTime, new Date())
      .input('fecha_actualizacion', sql.DateTime, new Date())
      .input('eliminado', sql.Char(1), 'N')
      .input('user_id', sql.Int, user_id)
      .input('presidente_asignado', sql.Char(1), 'N') // Agregar este campo
      .query(`
        INSERT INTO Club (nombre, descripcion, fecha_registro, fecha_actualizacion, eliminado, user_id, presidente_asignado)
        OUTPUT inserted.id
        VALUES (@nombre, @descripcion, @fecha_registro, @fecha_actualizacion, @eliminado, @user_id, @presidente_asignado)
      `);
 
    const clubId = resultClub.recordset[0].id;
 
    // Insertar en ImagenClub
    await request
      .input('club_id', sql.Int, clubId)
      .input('club_imagen', sql.VarChar(255), downloadURL)
      .query(`
        INSERT INTO ImagenClub (club_id, club_imagen)
        VALUES (@club_id, @club_imagen)
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
 
router.put('/update_club_image/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const imagen = req.file;
 
  if (!id) {
    return res.status(400).json({ message: 'El ID del club debe ser proporcionado' });
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
 
    // Obtener la URL de descarga de la nueva imagen
    const { downloadURL } = await uploadFile(imagen, null, null, 'FilesClubs');
 
    // Obtener la referencia de la imagen actual para eliminarla después
    const resultImagen = await request
      .input('club_id', sql.Int, id)
      .query(`SELECT club_imagen FROM ImagenClub WHERE club_id = @club_id`);
 
    if (resultImagen.recordset.length > 0) {
      const previousImageURL = resultImagen.recordset[0].club_imagen;
 
      // Eliminar la imagen anterior de Firebase Storage
      const previousImageRef = ref(storage, previousImageURL);
      await deleteObject(previousImageRef); // Asegúrate de que deleteObject está importado correctamente
 
      // Actualizar la imagen en la tabla ImagenClub
      await request
        .input('club_imagen', sql.VarChar(255), downloadURL)
        .query(`
          UPDATE ImagenClub
          SET club_imagen = @club_imagen
          WHERE club_id = @club_id
        `);
    } else {
      // Insertar la nueva imagen en la base de datos
      await request
        .input('club_id', sql.Int, id)
        .input('club_imagen', sql.VarChar(255), downloadURL)
        .query(`
          INSERT INTO ImagenClub (club_id, club_imagen)
          VALUES (@club_id, @club_imagen)
        `);
    }
 
    // Commit de la transacción
    await transaction.commit();
 
    res.status(200).json({ message: 'Imagen del club actualizada correctamente' });
  } catch (err) {
    console.error('Error:', err.message);
 
    // Rollback de la transacción en caso de error
    if (transaction) {
      await transaction.rollback();
    }
 
    res.status(500).json({ message: 'Error al actualizar la imagen del club', error: err.message });
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