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
  //const hash = crypto.createHash('sha256');
  //hash.update(contraseña);
  //const hashedPassword = hash.digest('hex');

  try {
    const pool = await sql.connect();
    const request = new sql.Request(pool);

    // Verificar las credenciales del usuario
    const userResult = await request
      .input('usuario', sql.VarChar(255), usuario)
      .input('contraseña', sql.VarChar(255), contraseña)
      .query(`
        SELECT u.id, u.usuario, u.correo, p.nombre, p.apellido, p.fecha_nacimiento, p.ci, p.direccion, ip.persona_image
        FROM Usuario u
        JOIN Persona p ON u.id = p.id
        LEFT JOIN ImagenPersona ip ON p.id = ip.persona_id
        WHERE u.usuario = @usuario AND u.contraseña = @contraseña
      `);

    if (userResult.recordset.length > 0) {
      const user = userResult.recordset[0];

      // Obtener información de roles del usuario
      const rolesResult = await request
        .input('personaId', sql.Int, user.id)
        .query(`
          SELECT r.nombre AS rol
          FROM Rol r
          JOIN PersonaRol pr ON pr.rol_id = r.id
          WHERE pr.persona_id = @personaId
        `);

      const roles = rolesResult.recordset.map(role => role.rol);

      // Almacenar la información del usuario en la sesión
      req.session.user = {
        id: user.id,
        usuario: user.usuario,
        correo: user.correo,
        nombre: user.nombre,
        apellido: user.apellido,
        fecha_nacimiento: user.fecha_nacimiento,
        ci: user.ci,
        direccion: user.direccion,
        imagen: user.persona_image,
        roles: roles
      };

      res.status(200).json({ message: 'Inicio de sesión exitoso', user: req.session.user });
    } else {
      res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al iniciar sesión', error: err.message });
  }
});

module.exports = router;
