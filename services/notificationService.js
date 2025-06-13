const { Expo } = require('expo-server-sdk');
const { Usuario } = require('../models');
const expo = new Expo();

exports.sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // Obtener el usuario y su token push
    const usuario = await Usuario.findByPk(userId, {
      attributes: ['id', 'push_token']
    });

    if (!usuario || !usuario.push_token) {
      console.log(`Usuario ${userId} no tiene token push registrado`);
      return;
    }

    // Verificar que el token es válido
    if (!Expo.isExpoPushToken(usuario.push_token)) {
      console.log(`Token push ${usuario.push_token} no es un token Expo válido`);
      return;
    }

    // Crear el mensaje
    const messages = [{
      to: usuario.push_token,
      sound: 'default',
      title,
      body,
      data
    }];

    // Enviar la notificación
    const chunks = expo.chunkPushNotifications(messages);
    
    for (const chunk of chunks) {
      try {
        const receipts = await expo.sendPushNotificationsAsync(chunk);
        console.log('Notificaciones enviadas:', receipts);
      } catch (error) {
        console.error('Error al enviar notificaciones:', error);
      }
    }
  } catch (error) {
    console.error('Error en sendPushNotification:', error);
  }
};