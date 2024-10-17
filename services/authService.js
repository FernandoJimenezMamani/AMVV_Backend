const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
const { Usuario, Persona, Rol ,ImagenPersona} = require('../models');
require('dotenv').config();

exports.login = async (correo, contraseña) => {
  const usuario = await Usuario.findOne({
    where: { correo },
    include: [
      {
        model: Persona,
        as: 'persona',
        attributes: ['nombre', 'apellido', 'fecha_nacimiento', 'ci', 'direccion'],
        include: [
          {
            model: Rol,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['nombre'],
          },
          {
            model: ImagenPersona,
            as: 'imagenes', 
            attributes: ['persona_imagen'],
          },
        ],
      },
    ],
  });

  if (!usuario) {
    throw new Error('Correo o contraseña incorrectos');
  }

  if (contraseña !== usuario.contraseña) {
    throw new Error('Correo o contraseña incorrectos');
  }

  const roles = usuario.persona.roles.map((rol) => rol.nombre);

  // Verificamos si hay imágenes asociadas
  const imagen = usuario.persona.imagenes.length > 0 ? usuario.persona.imagenes[0].persona_imagen : null;

  const payload = {
    id: usuario.id,
    correo: usuario.correo,
    nombre: usuario.persona.nombre,
    apellido: usuario.persona.apellido,
    fecha_nacimiento: usuario.persona.fecha_nacimiento,
    ci: usuario.persona.ci,
    direccion: usuario.persona.direccion,
    imagen: imagen,  // Asignar la imagen
    roles: roles,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION || '1h',
  });

  return token;
};

exports.changePassword = async (userId, currentPassword, newPassword) => {
  const usuario = await Usuario.findByPk(userId);

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  const isPasswordMatch = await bcrypt.compare(currentPassword, usuario.contraseña);
  if (!isPasswordMatch) {
    throw new Error('La contraseña actual es incorrecta');
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await Usuario.update(
    { contraseña: hashedNewPassword },
    { where: { id: userId } }
  );
};