const WebSocket = require('ws');

const clients = new Map();

const broadcastPositionsUpdate = () => {
  console.log("📡 Enviando actualización de posiciones a clientes WebSocket...");
  
  clients.forEach((ws, clientId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "actualizacion_estados", message: "Tabla de posiciones actualizada" }));
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

module.exports = { clients, broadcastPositionsUpdate, broadcastPartidoUpdate  };
