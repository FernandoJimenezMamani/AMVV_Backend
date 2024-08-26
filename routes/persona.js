const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const { upload } = require('../config/multer');
const { uploadFile } = require('../until/subirImagen');
const { ref, deleteObject } = require('firebase/storage');
const { storage } = require('../config/firebase');
const router = express.Router();

const saltRounds = 10;

router.get('/get_persona', async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
      SELECT 
        Persona.id, 
        Persona.nombre, 
        Persona.apellido, 
        Persona.fecha_nacimiento, 
        Persona.ci, 
        Persona.direccion, 
        Persona.fecha_registro, 
        Persona.fecha_actualizacion, 
        Persona.eliminado, 
        ImagenPersona.persona_imagen,
        Usuario.correo
      FROM 
        Persona
      LEFT JOIN 
        ImagenPersona 
      ON 
        Persona.id = ImagenPersona.persona_id
      LEFT JOIN 
        Usuario 
      ON 
        Persona.user_id = Usuario.id
      WHERE 
        Persona.eliminado = 'N'
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener personas', error: err.message });
  }
});

router.get('/get_persona/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'El ID de la persona debe ser proporcionado' });
  }

  try {
    const request = new sql.Request();
    request.input('id', sql.Int, id);

    const result = await request.query(`
      SELECT 
        Persona.id, 
        Persona.nombre, 
        Persona.apellido, 
        Persona.fecha_nacimiento, 
        Persona.ci, 
        Persona.direccion, 
        Persona.fecha_registro, 
        Persona.fecha_actualizacion, 
        Persona.eliminado, 
        ImagenPersona.persona_imagen,
        Usuario.correo
      FROM 
        Persona
      LEFT JOIN 
        ImagenPersona 
      ON 
        Persona.id = ImagenPersona.persona_id
      LEFT JOIN 
        Usuario 
      ON 
        Persona.user_id = Usuario.id
      WHERE 
        Persona.id = @id AND Persona.eliminado = 'N'
    `);

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'Persona no encontrada' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al obtener la persona', error: err.message });
  }
});

router.post('/post_persona', upload.single('image'), async (req, res) => {
  console.log('Files:', req.file);
  console.log('Body:', req.body);

  const { nombre, apellido, fecha_nacimiento, ci, direccion, contrasena, correo } = req.body;
  const imagen = req.file;

  if (!nombre || !apellido || !ci || !contrasena || !correo) {
    return res.status(400).json({ message: 'Los campos nombre, apellido, ci, contrasena y correo deben ser proporcionados' });
  }
  if (!imagen) {
    return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
  }

  let transaction;
  try {
    const request = new sql.Request();

    // Verificar si el correo ya existe en la base de datos
    const emailCheckResult = await request
      .input('correo', sql.VarChar(255), correo)
      .query('SELECT COUNT(*) AS count FROM Usuario WHERE correo = @correo');

    if (emailCheckResult.recordset[0].count > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Inicia la transacción
    transaction = new sql.Transaction();
    await transaction.begin();

    // Crear una nueva solicitud SQL dentro de la transacción
    const transactionRequest = new sql.Request(transaction);

    // Insertar en Persona
    const resultPersona = await transactionRequest
      .input('nombre', sql.VarChar(255), nombre)
      .input('apellido', sql.VarChar(255), apellido)
      .input('fecha_nacimiento', sql.Date, fecha_nacimiento)
      .input('ci', sql.VarChar(255), ci)
      .input('direccion', sql.VarChar(255), direccion)
      .input('fecha_registro', sql.DateTime, new Date())
      .input('fecha_actualizacion', sql.DateTime, new Date())
      .input('eliminado', sql.Char(1), 'N')
      .query(`
        INSERT INTO Persona (nombre, apellido, fecha_nacimiento, ci, direccion, fecha_registro, fecha_actualizacion, eliminado)
        OUTPUT inserted.id
        VALUES (@nombre, @apellido, @fecha_nacimiento, @ci, @direccion, @fecha_registro, @fecha_actualizacion, @eliminado)
      `);

    const personaId = resultPersona.recordset[0].id;

    // Cifrar la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    // Insertar en Usuario con el mismo ID de Persona
    await transactionRequest
      .input('personaId', sql.Int, personaId)  
      .input('contraseña', sql.VarChar(255), hashedPassword)
      .input('correo', sql.VarChar(255), correo)
      .query(`
        INSERT INTO Usuario (id, contraseña, correo)
        VALUES (@personaId, @contraseña, @correo)
      `);

    // Actualizar el campo user_id en Persona
    await transactionRequest
      .input('user_id', sql.Int, personaId) 
      .query(`
        UPDATE Persona
        SET user_id = @user_id
        WHERE id = @personaId
      `);

    // Insertar en PersonaRol con el rol de 'Persona' (id 8)
    await transactionRequest
      .input('persona_id_rol', sql.Int, personaId)  // Cambié el nombre del parámetro a persona_id_rol
      .input('rol_id', sql.Int, 8)  // id 8 es el rol de 'Persona'
      .query(`
        INSERT INTO PersonaRol (persona_id, rol_id)
        VALUES (@persona_id_rol, @rol_id)
      `);

   // Generar el nombre del archivo basado en el nombre de la persona
    const fileName = `${nombre.replace(/\s+/g, '_')}_${apellido.replace(/\s+/g, '_')}_image`;

    // Subir la imagen a la carpeta FilesPersonas
    const { downloadURL } = await uploadFile(imagen, fileName, null, 'FilesPersonas');

    // Insertar en ImagenPersona
    await transactionRequest
      .input('persona_id_imagen', sql.Int, personaId) // Cambié el nombre del parámetro a persona_id_imagen
      .input('persona_imagen', sql.VarChar(255), downloadURL)
      .query(`
        INSERT INTO ImagenPersona (persona_id, persona_imagen)
        VALUES (@persona_id_imagen, @persona_imagen)
      `);

    // Commit de la transacción
    await transaction.commit();

    res.status(201).json({ message: 'Persona creada correctamente', personaId });

  } catch (err) {
    console.error('Error:', err.message);

    // Rollback de la transacción en caso de error
    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: 'Error al crear la persona', error: err.message });
  }
});

router.put('/update_persona/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, fecha_nacimiento, ci, direccion, user_id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'El ID de la persona debe ser proporcionado' });
  }

  if (!nombre && !apellido && !fecha_nacimiento && !ci && !direccion && !user_id) {
    return res.status(400).json({ message: 'Al menos uno de los campos nombre, apellido, fecha_nacimiento, ci, direccion o user_id debe ser proporcionado' });
  }

  try {
    const request = new sql.Request();
    request.input('id', sql.Int, id);
    request.input('fecha_actualizacion', sql.DateTime, new Date());
    request.input('user_id', sql.Int, user_id);

    let query = 'UPDATE Persona SET fecha_actualizacion = @fecha_actualizacion, user_id = @user_id';
    if (nombre) {
      request.input('nombre', sql.VarChar(255), nombre);
      query += ', nombre = @nombre';
    }
    if (apellido) {
      request.input('apellido', sql.VarChar(255), apellido);
      query += ', apellido = @apellido';
    }
    if (fecha_nacimiento) {
      request.input('fecha_nacimiento', sql.Date, fecha_nacimiento);
      query += ', fecha_nacimiento = @fecha_nacimiento';
    }
    if (ci) {
      request.input('ci', sql.VarChar(255), ci);
      query += ', ci = @ci';
    }
    if (direccion) {
      request.input('direccion', sql.VarChar(255), direccion);
      query += ', direccion = @direccion';
    }
    query += ' WHERE id = @id';

    const result = await request.query(query);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Persona actualizada correctamente' });
    } else {
      res.status(404).json({ message: 'Persona no encontrada' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al actualizar persona', error: err.message });
  }
});

router.put('/update_persona_image/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const imagen = req.file;

  if (!id) {
    return res.status(400).json({ message: 'El ID de la persona debe ser proporcionado' });
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
    const { downloadURL } = await uploadFile(imagen, null, null, 'FilesPersonas');

    // Obtener la referencia de la imagen actual para eliminarla después
    const resultImagen = await request
      .input('persona_id', sql.Int, id)
      .query(`SELECT persona_imagen FROM ImagenPersona WHERE persona_id = @persona_id`);

    if (resultImagen.recordset.length > 0) {
      const previousImageURL = resultImagen.recordset[0].persona_imagen;

      // Eliminar la imagen anterior de Firebase Storage
      const previousImageRef = ref(storage, previousImageURL);
      await deleteObject(previousImageRef); 

      // Actualizar la imagen en la tabla ImagenPersona
      await request
        .input('persona_imagen', sql.VarChar(255), downloadURL)
        .query(`
          UPDATE ImagenPersona
          SET persona_imagen = @persona_imagen
          WHERE persona_id = @persona_id
        `);
    } else {
      // Insertar la nueva imagen en la base de datos
      await request
        .input('persona_id', sql.Int, id)
        .input('persona_imagen', sql.VarChar(255), downloadURL)
        .query(`
          INSERT INTO ImagenPersona (persona_id, persona_imagen)
          VALUES (@persona_id, @persona_imagen)
        `);
    }

    // Commit de la transacción
    await transaction.commit();

    res.status(200).json({ message: 'Imagen de la persona actualizada correctamente' });
  } catch (err) {
    console.error('Error:', err.message);

    // Rollback de la transacción en caso de error
    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: 'Error al actualizar la imagen de la persona', error: err.message });
  }
});

router.put('/delete_persona/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'El ID de la persona debe ser proporcionado' });
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
      UPDATE Persona
      SET eliminado = 'S', fecha_actualizacion = @fecha_actualizacion, user_id = @user_id
      WHERE id = @id
    `);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Persona eliminada lógicamente correctamente' });
    } else {
      res.status(404).json({ message: 'Persona no encontrada' });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al eliminar lógicamente la persona', error: err.message });
  }
});

router.get('/search_persona', async (req, res) => {
  const { searchTerm } = req.query;

  if (!searchTerm) {
    return res.status(400).json({ message: 'Debe proporcionar un término de búsqueda' });
  }

  try {
    const request = new sql.Request();

    // Realizar la consulta para buscar personas por nombre o apellido
    const result = await request
      .input('searchTerm', sql.VarChar(255), `%${searchTerm}%`)
      .query(`
        SELECT 
          Persona.id, 
          Persona.nombre, 
          Persona.apellido, 
          Persona.fecha_nacimiento, 
          Persona.ci, 
          Persona.direccion, 
          ImagenPersona.persona_imagen,
          Usuario.correo
        FROM 
          Persona
        LEFT JOIN 
          ImagenPersona 
        ON 
          Persona.id = ImagenPersona.persona_id
        LEFT JOIN 
          Usuario 
        ON 
          Persona.id = Usuario.id
        WHERE 
          (Persona.nombre LIKE @searchTerm OR Persona.apellido LIKE @searchTerm)
          AND Persona.eliminado = 'N'
      `);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al buscar personas', error: err.message });
  }
});


module.exports = router;
