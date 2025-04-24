const WebSocket = require('ws');

const clients = new Map();

const broadcastPositionsUpdate = () => {
  console.log("📡 Enviando actualización de posiciones a clientes WebSocket...");
  
  clients.forEach((ws, clientId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "tabla_posiciones_actualizada", message: "Tabla de posiciones actualizada" }));
    }
  });
};

const broadcastPartidoUpdate = (partido_id) => {
  const message = JSON.stringify({
    type: 'actualizacion_resultado', 
    partido_id,
  });
  
  clients.forEach((ws,client) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
};

const broadcastCampeonatoEstadoUpdate = (cambios) => {
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "estado_campeonato_actualizado",
        cambios
      }));
    }
  });
};

const broadcastRegistroPagoInscripcion = () => {
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "pago_registro_inscripcion"
      }));
    }
  });
};

const sendToClient = (clientId, message) => {
  const client = clients.get(clientId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
};

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    const clientId = Date.now();
    clients.set(clientId, ws);

    console.log(`🟢 Cliente WebSocket conectado: ${clientId}`);
    ws.send(JSON.stringify({ message: "Conexión exitosa", clientId }));

    ws.on("message", (message) => {
      try {
        const parsed = JSON.parse(message);
        console.log(`📨 Mensaje recibido de ${clientId}:`, parsed);
      } catch (err) {
        console.error(`❌ Error al parsear mensaje de ${clientId}:`, err);
      }
    });

    ws.on("close", () => {
      console.log(`🔌 Cliente ${clientId} desconectado.`);
      clients.delete(clientId);
    });

    ws.on("error", (err) => {
      console.error(`⚠️ Error WebSocket en cliente ${clientId}:`, err);
    });
  });
};

module.exports = { clients, broadcastPositionsUpdate, broadcastPartidoUpdate ,broadcastCampeonatoEstadoUpdate,broadcastRegistroPagoInscripcion,
  sendToClient,
  setupWebSocket, };
