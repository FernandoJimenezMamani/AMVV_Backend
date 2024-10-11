const authService = require('../services/authService');

exports.login = async (req, res) => {
  const { correo, contraseña } = req.body;

  if (!correo || !contraseña) {
    return res.status(400).json({ message: 'Todos los campos deben ser proporcionados' });
  }

  try {
    const token = await authService.login(correo, contraseña);
    res.status(200).json({ message: 'Inicio de sesión exitoso', token });
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
