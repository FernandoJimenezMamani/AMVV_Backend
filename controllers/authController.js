const authService = require('../services/authService');
const nodemailer = require('nodemailer');

exports.login = async (req, res) => {
  const { correo, contraseña, selectedRoleId } = req.body;

  if (!correo || !contraseña) {
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  try {
    const response = await authService.login(correo, contraseña, selectedRoleId);

    if (response.requireRoleSelection) {
      return res.status(200).json({
        message: 'Se requiere selección de rol',
        requireRoleSelection: true,
        roles: response.roles,
      });
    }

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token: response.token,
      user: response.user,
    });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'La nueva contraseña y la confirmación no coinciden' });
  }

  try {
    await authService.changePassword(userId, currentPassword, newPassword);
    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Controlador para restablecer la contraseña
exports.resetPassword = async (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ message: 'El correo es obligatorio' });
  }

  try {
    const newPassword = await authService.resetPassword(correo);

    // Configuración del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: correo,
      subject: 'Restablecimiento de contraseña',
      text: `Tu nueva contraseña es: ${newPassword}. Por favor, cámbiala después de iniciar sesión.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar correo:', error);
        return res.status(500).json({ message: 'Fallo al enviar el correo' });
      }
      console.log('Correo enviado:', info.response);
      return res.status(200).json({ message: 'Contraseña restablecida. Revisa tu correo.' });
    });
  } catch (error) {
    console.error('Error interno:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail', // O cualquier servicio que estés utilizando (Gmail, Outlook, etc.)
  auth: {
    user: 'ferjimenezm933@gmail.com', // Cambia por el correo que utilizarás para enviar los emails
    pass: 'rssd pwxw cpuh jpwc', // Cambia por la contraseña de tu correo
  }
});