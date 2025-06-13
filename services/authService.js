const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario, Persona, Rol, ImagenPersona, Jugador, PresidenteClub, Club  } = require('../models');
require('dotenv').config();
const moment = require('moment'); 
const nodemailer = require('nodemailer');
const sequelize = require('../config/sequelize'); 

exports.login = async (correo, contraseña, selectedRoleId = null) => {
  try {
    const usuario = await Usuario.findOne({
      where: { correo },
      include: [
        {
          model: Persona,
          as: 'persona',
          attributes: ['nombre', 'apellido','eliminado'],
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

    if (usuario.persona.eliminado === 'S') {
      throw new Error('Este usuario ha sido desactivado y no puede iniciar sesión.');
    }

    const ahora = new Date(Date.now() - 4 * 60 * 60 * 1000); // Resta 4 horas

    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > ahora) {
      throw new Error('Cuenta bloqueada temporalmente. Intente nuevamente en unos minutos.');
    }


    const isPasswordMatch = await bcrypt.compare(contraseña, usuario.contraseña);

    if (!isPasswordMatch) {
      usuario.intentosFallidos += 1;

      if (usuario.intentosFallidos >= 3) {
        usuario.bloqueadoHasta = sequelize.literal("DATEADD(MINUTE, 3, GETDATE())");


        usuario.intentosFallidos = 0; 
        await usuario.save();

        // Enviar correo de alerta
        // Esto se ejecuta "en segundo plano", sin bloquear el flujo
        enviarCorreoAlerta(usuario.correo, usuario.persona.nombre)
        .then(() => console.log('Correo de alerta enviado'))
        .catch((err) => console.error('Error al enviar correo de alerta:', err));


        throw new Error('Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente.');
      }

      await usuario.save();
      throw new Error('Correo o contraseña incorrectos');
    }

    // Login exitoso
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta = null;
    await usuario.save();

    const roles = usuario.persona.roles.map((rol) => ({ id: rol.id, nombre: rol.nombre }));

    if (roles.length > 1 && !selectedRoleId) {
      return { requireRoleSelection: true, roles };
    }

    const selectedRole = roles.find((rol) => rol.id === parseInt(selectedRoleId, 10)) || roles[0];

    if (!selectedRole) throw new Error('El rol seleccionado no es válido');

    const payload = {
      id: usuario.id,
      correo: usuario.correo,
      rol: selectedRole,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || '1h',
    });

    return { token, user: payload };
  } catch (error) {
    console.log(error);
    throw error;
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

async function enviarCorreoAlerta(destinatario, nombre) {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // o el servicio que uses
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Asociacion Municipal de Voleibol Vinto" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: '⚠️ Alerta de intento de acceso a tu cuenta',
    html: `
      <p>Hola ${nombre},</p>
      <p>Detectamos múltiples intentos fallidos de inicio de sesión en tu cuenta.</p>
      <p>Si no fuiste tú, te recomendamos cambiar tu contraseña lo antes posible.</p>
      <p><b>Tu cuenta ha sido bloqueada temporalmente por seguridad.</b></p>
      <p>Atentamente,<br/>El equipo de seguridad</p>
    `,
  });
}
