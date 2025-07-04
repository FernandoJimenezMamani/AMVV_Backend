const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { loadEmailTemplate } = require('../utils/emailTemplate');

exports.sendTraspasoEmail = async (solicitud, destinatario) => {
    try {
        // Cargar la plantilla desde templates
        const emailHtml = loadEmailTemplate('certificadoTraspasoSolicitante', {
            club_origen_nombre: solicitud.club_origen_nombre,
            nombre_presi_club_origen: solicitud.nombre_presi_club_origen,
            apellido_presi_club_origen: solicitud.apellido_presi_club_origen,
            club_destino_nombre: solicitud.club_destino_nombre,
            nombre_presi_club_dest: solicitud.nombre_presi_club_dest,
            apellido_presi_club_dest: solicitud.apellido_presi_club_dest,
            jugador_nombre: solicitud.jugador_nombre,
            jugador_apellido: solicitud.jugador_apellido,
            jugador_genero: solicitud.jugador_genero === 'V' ? 'Varón' : solicitud.jugador_genero === 'D' ? 'Dama' : 'Desconocido',
            jugador_ci: solicitud.jugador_ci,
            jugador_fecha_nacimiento: new Date(solicitud.jugador_fecha_nacimiento).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
            nombre_campeonato: solicitud.nombre_campeonato
        });

        // Configuración del servicio de correo
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Configura tu email en variables de entorno
                pass: process.env.EMAIL_PASS
            }
        });

        // Enviar el correo
        await transporter.sendMail({
            from: `"Asociación de Voleibol" <${process.env.EMAIL_USER}>`,
            to: destinatario,
            subject: "Certificado de Transferencia",
            html: emailHtml
        });

        console.log("✅ Correo de traspaso enviado correctamente a:", destinatario);
        return { success: true, message: "Correo enviado exitosamente" };
    } catch (error) {
        console.error("⚠️ Error al enviar el correo de traspaso:", error);
        return { success: false, message: "Error al enviar el correo", error };
    }
};

exports.sendJugadorEmail = async (solicitud, destinatario) => {
    try {
        const emailHtml = loadEmailTemplate('confirmacionTraspasoJugador', {
            jugador_nombre: solicitud.jugador_nombre,
            jugador_apellido: solicitud.jugador_apellido,
            club_destino_nombre: solicitud.club_destino_nombre,
            nombre_presi_club_dest: solicitud.nombre_presi_club_dest,
            apellido_presi_club_dest: solicitud.apellido_presi_club_dest,
            nombre_campeonato: solicitud.nombre_campeonato,
            fecha_aprobacion: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"Asociación de Voleibol" <${process.env.EMAIL_USER}>`,
            to: destinatario,
            subject: "¡Bienvenido a tu Nuevo Club!",
            html: emailHtml
        });

        console.log("✅ Correo de confirmación enviado al jugador:", destinatario);
        return { success: true, message: "Correo enviado exitosamente" };
    } catch (error) {
        console.error("⚠️ Error al enviar el correo al jugador:", error);
        return { success: false, message: "Error al enviar el correo", error };
    }
};

exports.sendPresidenteEmail = async (solicitud, destinatario) => {
    try {
        const emailHtml = loadEmailTemplate('notificacionTraspasoPresidenteOrigen', {
            nombre_presi_club_origen: solicitud.nombre_presi_club_origen,
            apellido_presi_club_origen: solicitud.apellido_presi_club_origen,
            club_origen_nombre: solicitud.club_origen_nombre,
            jugador_nombre: solicitud.jugador_nombre,
            jugador_apellido: solicitud.jugador_apellido,
            jugador_ci: solicitud.jugador_ci,
            jugador_fecha_nacimiento: new Date(solicitud.jugador_fecha_nacimiento).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
            fecha_aprobacion: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"Asociación de Voleibol" <${process.env.EMAIL_USER}>`,
            to: destinatario,
            subject: "Notificación de Baja de Jugador",
            html: emailHtml
        });

        console.log("✅ Correo de notificación enviado al presidente:", destinatario);
        return { success: true, message: "Correo enviado exitosamente" };
    } catch (error) {
        console.error("⚠️ Error al enviar el correo al presidente:", error);
        return { success: false, message: "Error al enviar el correo", error };
    }
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

exports.sendBienvenidaUsuarioEmail = async (destinatario, nombre, password) => {
    try {
      const html = loadEmailTemplate('bienvenidaUsuario', {
        nombre,
        password
      });
  
      await transporter.sendMail({
        from: `"Asociación de Voleibol" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: 'Bienvenido al Sistema - Tus credenciales',
        html
      });
  
      console.log(`✅ Correo de bienvenida enviado a ${destinatario}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error al enviar correo de bienvenida:`, error);
      return { success: false, message: 'Fallo en el envío de correo', error };
    }
  };

exports.sendTraspasoRevertidoEmail = async (datos, destinatario) => {
  try {
    const emailHtml = loadEmailTemplate('certificadoTraspasoRevertido', {
      club_origen_nombre: datos.club_origen_nombre,
      nombre_presi_club_origen: datos.nombre_presi_club_origen,
      apellido_presi_club_origen: datos.apellido_presi_club_origen,
      club_destino_nombre: datos.club_destino_nombre,
      nombre_presi_club_dest: datos.nombre_presi_club_dest,
      apellido_presi_club_dest: datos.apellido_presi_club_dest,
      jugador_nombre: datos.jugador_nombre,
      jugador_apellido: datos.jugador_apellido,
      jugador_genero: datos.jugador_genero === 'V' ? 'Varón' : datos.jugador_genero === 'D' ? 'Dama' : 'Desconocido',
      jugador_ci: datos.jugador_ci,
      jugador_fecha_nacimiento: new Date(datos.jugador_fecha_nacimiento).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      nombre_campeonato: datos.nombre_campeonato
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Asociación de Voleibol" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: "Reversión de Traspaso",
      html: emailHtml
    });

    console.log("✅ Correo de reversión de traspaso enviado a:", destinatario);
    return { success: true, message: "Correo de reversión enviado exitosamente" };
  } catch (error) {
    console.error("⚠️ Error al enviar correo de reversión de traspaso:", error);
    return { success: false, message: "Error al enviar correo de reversión", error };
  }
};

exports.sendPagoInscripcionRevertidoEmail = async (data, destinatario) => {
  try {
    const html = loadEmailTemplate('pagoInscripcionRevertido', {
      PRESIDENTE_NOMBRE: data.PRESIDENTE_NOMBRE,
      EQUIPO_NOMBRE: data.EQUIPO_NOMBRE,
      CAMPEONATO_NOMBRE: data.CAMPEONATO_NOMBRE,
      MONTO: data.MONTO,
      FECHA: data.FECHA,
      REFERENCIA: data.REFERENCIA
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Asociación de Voleibol" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: "Reversión de Pago de Inscripción",
      html
    });

    console.log("✅ Correo de reversión de inscripción enviado a:", destinatario);
    return { success: true };
  } catch (error) {
    console.error("❌ Error al enviar el correo de reversión de inscripción:", error);
    return { success: false, error };
  }
};
