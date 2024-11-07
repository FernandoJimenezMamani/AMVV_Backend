const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
const { Usuario, Persona, Rol, ImagenPersona, Jugador, PresidenteClub, Club } = require('../models');
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
          {
            model: Jugador,
            as: 'jugador',
            include: [
              {
                model: Club,
                as: 'club',
                attributes: ['id', 'nombre']
              }
            ]
          },
          {
            model: PresidenteClub,
            as: 'presidente',
            include: [
              {
                model: Club,
                as: 'club',
                attributes: ['id', 'nombre']
              }
            ]
          }
        ],
      },
    ],
  });

  if (!usuario) {
    throw new Error('Correo o contraseña incorrectos');
  }

  const isPasswordMatch = await bcrypt.compare(contraseña, usuario.contraseña);
  if (!isPasswordMatch) {
    throw new Error('Correo o contraseña incorrectos');
  }

  const roles = usuario.persona.roles.map((rol) => rol.nombre);
  const imagen = usuario.persona.imagenes.length > 0 ? usuario.persona.imagenes[0].persona_imagen : null;

  // Obtener datos del club donde es jugador (si tiene rol de jugador)
  const clubJugador = usuario.persona.jugador ? usuario.persona.jugador.club : null;

  // Obtener datos del club donde es presidente (si tiene rol de presidente)
  const clubPresidente = usuario.persona.presidente ? usuario.persona.presidente.club : null;

  const payload = {
    id: usuario.id,
    correo: usuario.correo,
    nombre: usuario.persona.nombre,
    apellido: usuario.persona.apellido,
    fecha_nacimiento: usuario.persona.fecha_nacimiento,
    ci: usuario.persona.ci,
    direccion: usuario.persona.direccion,
    imagen: imagen,
    roles: roles,
    clubJugador: clubJugador ? { id: clubJugador.id, nombre: clubJugador.nombre } : null,
    clubPresidente: clubPresidente ? { id: clubPresidente.id, nombre: clubPresidente.nombre } : null,
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