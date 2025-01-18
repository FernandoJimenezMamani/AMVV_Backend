const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
const { Usuario, Persona, Rol, ImagenPersona, Jugador, PresidenteClub, Club } = require('../models');
require('dotenv').config();

exports.login = async (correo, contraseña) => {
  console.log(contraseña, correo);

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
            as: 'jugador', // Plural según la nueva relación
            attributes: ['id', 'club_id', 'activo'], // Incluye campos adicionales
            where: { activo: 1 }, // Solo jugadores activos
            required: false, // Permite que la relación sea opcional
            include: [
              {
                model: Club,
                as: 'club',
                attributes: ['id', 'nombre'],
              },
            ],
          },
          {
            model: PresidenteClub,
            as: 'presidente', // Plural según la nueva relación
            attributes: ['id', 'club_id', 'activo', 'delegado'], // Incluye campos adicionales
            where: { activo: 1 }, // Solo presidentes activos
            required: false, // Permite que la relación sea opcional
            include: [
              {
                model: Club,
                as: 'club',
                attributes: ['id', 'nombre'],
              },
            ],
          },
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

  // Obtener clubes donde la persona es jugador
  const clubesJugador = usuario.persona.jugadores?.map((jugador) => ({
    id: jugador.club?.id,
    nombre: jugador.club?.nombre,
  })) || [];

  // Obtener clubes donde la persona es presidente o delegado
  const clubesPresidente = usuario.persona.presidenteClubes?.map((presidente) => ({
    id: presidente.club?.id,
    nombre: presidente.club?.nombre,
    delegado: presidente.delegado === 'S', // Identifica si es delegado
  })) || [];

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
    clubesJugador: clubesJugador.length > 0 ? clubesJugador : null,
    clubesPresidente: clubesPresidente.length > 0 ? clubesPresidente : null,
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