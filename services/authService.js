const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario, Persona, Rol, ImagenPersona, Jugador, PresidenteClub, Club } = require('../models');
require('dotenv').config();

exports.login = async (correo, contraseña, selectedRoleId = null) => {
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
            attributes: ['id', 'nombre'],
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

  if (!usuario) throw new Error('Correo o contraseña incorrectos');

  const isPasswordMatch = await bcrypt.compare(contraseña, usuario.contraseña);
  if (!isPasswordMatch) throw new Error('Correo o contraseña incorrectos');

  const roles = usuario.persona.roles.map((rol) => ({ id: rol.id, nombre: rol.nombre }));

  // Si hay múltiples roles y no se seleccionó uno, devuelve los roles para que el frontend lo maneje
  if (roles.length > 1 && !selectedRoleId) {
    return { requireRoleSelection: true, roles };
  }

  // Obtener datos del club donde es jugador (si tiene rol de jugador)
  const clubJugador = usuario.persona.jugador ? usuario.persona.jugador.club : null;

  // Obtener datos del club donde es presidente (si tiene rol de presidente)
  const clubPresidente = usuario.persona.presidente ? usuario.persona.presidente.club : null;

  // Verificamos si hay imágenes asociadas
  const imagen = usuario.persona.imagenes.length > 0 ? usuario.persona.imagenes[0].persona_imagen : null;

  // Validar el rol seleccionado o usar el único rol disponible
  const selectedRole = roles.find((rol) => rol.id === parseInt(selectedRoleId, 10)) || roles[0];

  if (!selectedRole) {
    throw new Error('El rol seleccionado no es válido');
  }

  // Crear el payload con el rol seleccionado
  const payload = {
    id: usuario.id,
    correo: usuario.correo,
    nombre: usuario.persona.nombre,
    apellido: usuario.persona.apellido,
    fecha_nacimiento: usuario.persona.fecha_nacimiento,
    ci: usuario.persona.ci,
    direccion: usuario.persona.direccion,
    clubJugador: clubJugador ? { id: clubJugador.id, nombre: clubJugador.nombre } : null,
    clubPresidente: clubPresidente ? { id: clubPresidente.id, nombre: clubPresidente.nombre } : null,
    imagen: usuario.persona.imagenes[0]?.persona_imagen || null,
    rol: selectedRole,
  };

  // Generar el token JWT
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION || '1h',
  });

  return { token, user: payload };
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
