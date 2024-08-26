const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcrypt');

// Ruta para el inicio de sesión
// Ruta para el inicio de sesión
router.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;

  if (!correo || !contraseña) {
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  try {
    const pool = await sql.connect();
    const request = new sql.Request(pool);

    // Buscar al usuario por su correo electrónico
    const userResult = await request
      .input('correo', sql.VarChar(255), correo)
      .query(`
        SELECT u.id, u.contraseña, p.nombre, p.apellido, p.fecha_nacimiento, p.ci, p.direccion, ip.persona_imagen
        FROM Usuario u
        JOIN Persona p ON u.id = p.id
        LEFT JOIN ImagenPersona ip ON p.id = ip.persona_id
        WHERE u.correo = @correo
      `);

    if (userResult.recordset.length > 0) {
      const user = userResult.recordset[0];

      // Comparar la contraseña proporcionada con la contraseña encriptada almacenada
      const match = await bcrypt.compare(contraseña, user.contraseña);

      if (match) {
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
          correo: user.correo,
          nombre: user.nombre,
          apellido: user.apellido,
          fecha_nacimiento: user.fecha_nacimiento,
          ci: user.ci,
          direccion: user.direccion,
          imagen: user.persona_imagen,
          roles: roles
        };

        console.log('Sesión de usuario establecida:', req.session.user);

        res.status(200).json({ message: 'Inicio de sesión exitoso', user: req.session.user });
      } else {
        res.status(401).json({ message: 'Correo o contraseña incorrectos' });
      }
    } else {
      res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al iniciar sesión', error: err.message });
  }
});

// Ruta para cambiar la contraseña
router.put('/change-password', async (req, res) => {
  console.log('Información de sesión del usuario:', req.session.user);

  // Verifica que la sesión esté correctamente definida antes de proceder
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ message: 'No autorizado. Inicie sesión para continuar.' });
  }

  const { id } = req.session.user; // Obtener el ID del usuario autenticado desde la sesión
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'La nueva contraseña y la confirmación de la contraseña no coinciden' });
  }

  try {
    const pool = await sql.connect();
    const request = new sql.Request(pool);

    // Buscar al usuario por su ID
    const userResult = await request
      .input('id', sql.Int, id)
      .query(`
        SELECT contraseña
        FROM Usuario
        WHERE id = @id
      `);

    if (userResult.recordset.length > 0) {
      const user = userResult.recordset[0];

      // Comparar la contraseña actual proporcionada con la contraseña encriptada almacenada
      const match = await bcrypt.compare(currentPassword, user.contraseña);

      if (match) {
        // Encriptar la nueva contraseña
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar la contraseña en la base de datos
        await request
          .input('id', sql.Int, id)
          .input('newPassword', sql.VarChar(255), hashedNewPassword)
          .query(`
            UPDATE Usuario
            SET contraseña = @newPassword
            WHERE id = @id
          `);

        res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
      } else {
        res.status(401).json({ message: 'La contraseña actual es incorrecta' });
      }
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error al cambiar la contraseña', error: err.message });
  }
});

module.exports = router;