const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario, Persona, Rol, ImagenPersona, Jugador, PresidenteClub, Club  } = require('../models');
require('dotenv').config();

exports.login = async (correo, contraseña, selectedRoleId = null) => {
  try{
    const usuario = await Usuario.findOne({
      where: { correo },
      include: [
        {
          model: Persona,
          as: 'persona',
          attributes: ['nombre', 'apellido'],
          include: [
            {
              model: Rol,
              as: 'roles',
              through: { attributes: [] },
              attributes: ['id', 'nombre'],
            },
          ],
        },
      ],
    });
  
    if (!usuario) throw new Error('Correo o contraseña incorrectos');
  
    const isPasswordMatch = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!isPasswordMatch) throw new Error('Correo o contraseña incorrectos');
  
    const roles = usuario.persona.roles.map((rol) => ({ id: rol.id, nombre: rol.nombre }));
  
    if (roles.length > 1 && !selectedRoleId) {
      return { requireRoleSelection: true, roles };
    }

    const selectedRole = roles.find((rol) => rol.id === parseInt(selectedRoleId, 10)) || roles[0];
  
    if (!selectedRole) {
      throw new Error('El rol seleccionado no es válido');
    }

    const payload = {
      id: usuario.id,
      correo: usuario.correo,
      rol: selectedRole,
    };
    console.log('🔑 Clave secreta usada para JWT:', process.env.JWT_SECRET);

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || '1h',
    });
  
    return { token, user: payload };
  }catch(error){
    console.log(error);
  }
  
};


exports.changePassword = async (userId, currentPassword, newPassword) => {
  const usuario = await Usuario.findByPk(userId);

  if (!usuario) throw new Error('Usuario no encontrado');

  const isPasswordMatch = await bcrypt.compare(currentPassword, usuario.contraseña);
  if (!isPasswordMatch) throw new Error('La contraseña actual es incorrecta');

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await Usuario.update(
    { contraseña: hashedNewPassword },
    { where: { id: userId } }
  );
};

// Función para generar una contraseña aleatoria
function generatePassword() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// Servicio para restablecer la contraseña
exports.resetPassword = async (correo) => {
  if (!correo) throw new Error('El correo es obligatorio');

  const usuario = await Usuario.findOne({ where: { correo } });

  if (!usuario) {
    throw new Error('No se encontró un usuario con ese correo');
  }

  const newPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  usuario.contraseña = hashedPassword;
  await usuario.save();

  return newPassword;  // Devuelve la nueva contraseña generada
};
