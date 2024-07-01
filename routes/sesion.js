const express = require('express');
const router = express.Router();
const sql = require('mssql');
const crypto = require('crypto');

// Ruta para el inicio de sesión
router.post('/login', async (req, res) => {
  const { usuario, contraseña } = req.body;

  if (!usuario || !contraseña) {
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  // Encriptar la contraseña usando SHA-256
  const hash = crypto.createHash('sha256');
  hash.update(contraseña);
  const hashedPassword = hash.digest('hex');

  try {
    const pool = await sql.connect();
    const request = new sql.Request(pool);

    // Verificar las credenciales del usuario
    const result = await request
      .input('usuario', sql.VarChar(255), usuario)
      .input('contraseña', sql.VarChar(255), hashedPassword)
      .query(`
        SELECT id, usuario, correo 
        FROM Usuario 
        WHERE usuario = @usuario AND contraseña = @contraseña
      `);

    if (result.recordset.length > 0) {
      // Credenciales correctas
      res.status(200).json({ message: 'Inicio de sesión exitoso', user: result.recordset[0] });
    } else {
      // Credenciales incorrectas
      res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al iniciar sesión', error: err.message });
  }
});

module.exports = router;