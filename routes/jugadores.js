const express = require('express');
const router = express.Router();
const sql = require('mssql');
const crypto = require('crypto');

// Crear una nueva persona, usuario y jugador en una transacción
router.post('/post_player', async (req, res) => {
  const { nombre, apellido, fecha_nacimiento, ci, direccion, usuario, contraseña, correo } = req.body;

  if (!nombre || !apellido || !fecha_nacimiento || !ci || !direccion || !usuario || !contraseña || !correo) {
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  // Encriptar la contraseña usando SHA-256
  const hash = crypto.createHash('sha256');
  hash.update(contraseña);
  const hashedPassword = hash.digest('hex');

  let transaction;
  try {
    // Inicia la transacción
    transaction = new sql.Transaction();
    await transaction.begin();

    const request = new sql.Request(transaction);

    // Insertar en Persona
    const resultPersona = await request
      .input('nombre', sql.VarChar(255), nombre)
      .input('apellido', sql.VarChar(255), apellido)
      .input('fecha_nacimiento', sql.Date, fecha_nacimiento)
      .input('ci', sql.VarChar(255), ci)
      .input('direccion', sql.VarChar(255), direccion)
      .query(`
        INSERT INTO Persona (nombre, apellido, fecha_nacimiento, ci, direccion)
        OUTPUT inserted.id
        VALUES (@nombre, @apellido, @fecha_nacimiento, @ci, @direccion)
      `);

    const personaId = resultPersona.recordset[0].id;

    // Insertar en Usuario
    const resultUsuario = await request
      .input('usuario', sql.VarChar(255), usuario)
      .input('contraseña', sql.VarChar(255), hashedPassword)
      .input('persona_id', sql.Int, personaId)
      .input('correo', sql.VarChar(250), correo)
      .query(`
        INSERT INTO Usuario (usuario, contraseña, persona_id, correo)
        OUTPUT inserted.id
        VALUES (@usuario, @contraseña, @persona_id, @correo)
      `);

    const usuarioId = resultUsuario.recordset[0].id;

    // Commit de la transacción
    await transaction.commit();
    res.status(201).json({ message: 'Persona, Usuario y Jugador creados', personaId, usuarioId });

  } catch (err) {
    console.error('Error:', err.message);

    // Rollback de la transacción en caso de error
    if (transaction) {
      await transaction.rollback();
    }

    res.status(500).json({ message: 'Error al crear Persona, Usuario y Jugador', error: err.message });
  }
});

module.exports = router;