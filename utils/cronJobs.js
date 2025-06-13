const cron = require('node-cron');
const { actualizarEstadosCampeonatos } = require('../services/cronService');
const { broadcastCampeonatoEstadoUpdate } = require('./websocket');

function iniciarTareasProgramadas() {
  cron.schedule('* * * * *', async () => {
    console.log('⏰ Ejecutando tarea de actualización de estados...');

    const cambios = await actualizarEstadosCampeonatos();
    console.log('📋 Estados actualizados:', cambios);

    if (cambios.length > 0) {
      console.log('📡 Enviando actualización a clientes WebSocket...');
      broadcastCampeonatoEstadoUpdate(cambios); // Notifica a todos los clientes conectados
    } else {
      console.log('✅ No hubo cambios en estados de campeonatos.');
    }
  });
}

module.exports = { iniciarTareasProgramadas };
