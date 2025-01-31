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

  if (!usuario) throw new Error('Correo o contraseña incorrectos');

  const isPasswordMatch = await bcrypt.compare(contraseña, usuario.contraseña);
  if (!isPasswordMatch) throw new Error('Correo o contraseña incorrectos');

  const roles = usuario.persona.roles.map((rol) => ({ id: rol.id, nombre: rol.nombre }));

  // Si hay múltiples roles y no se seleccionó uno, devuelve los roles para que el frontend lo maneje
  if (roles.length > 1 && !selectedRoleId) {
    return { requireRoleSelection: true, roles };
  }

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
