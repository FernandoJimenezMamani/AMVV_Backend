const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, // Utiliza variables de entorno para mayor seguridad
    pass: process.env.EMAIL_PASS,
  }
});

/**
 * Enviar un correo electrónico
 * @param {string} to - Dirección de correo del destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} text - Contenido en texto plano
 * @param {string} [html] - Contenido en HTML (opcional)
 * @returns {Promise<void>}
 */
const sendEmail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html // Opcional: puedes enviar un correo en formato HTML
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo enviado a ${to}: ${info.response}`);
    return info;
  } catch (error) {
    console.error(`❌ Error enviando correo a ${to}:`, error);
    throw error;
  }
};

module.exports = { sendEmail };
