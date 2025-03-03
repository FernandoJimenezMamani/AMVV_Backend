const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const cron = require("node-cron");
const { actualizarEstadosCampeonatos, monitorearJugadoresParticipacion } = require("./services/cronService");
const {clients, broadcastPositionsUpdate } = require('./utils/websocket');

// Importar rutas
const userRoutes = require('./routes/authRoutes');
const campeonatoRoutes = require('./routes/campeonatoRoutes');
const categoriasRoutes = require('./routes/categoriaRoutes');
const clubesRoutes = require('./routes/clubRoutes');
const authRoutes = require('./routes/authRoutes');
const equipoRoutes = require('./routes/equipoRoutes');
const jugadorRoutes = require('./routes/jugadorRoutes');
const lugarRoutes = require('./routes/lugarRoutes');
const partidoRoutes = require('./routes/partidoRoutes');
const personaRoutes = require('./routes/personaRoutes');
const rolesRoutes = require('./routes/rolRoutes');
const presidenteRoutes = require('./routes/presidenteClubRoutes');
const arbitroRoutes = require('./routes/arbitroRoutes'); 
const traspasoRoutes = require('./routes/traspasoRoutes'); 
const pagosRoutes = require('./routes/pagoRoutes'); 
const reporteRoutes = require('./routes/reporteRoutes'); 

// Inicializar la app
const app = express();
const PORT = process.env.PORT || 5002;

// Middleware para CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const broadcastMessage = (message) => {
  console.log("Enviando mensaje a clientes WebSocket:", message);

  clients.forEach((ws, clientId) => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log(`Enviando mensaje a cliente ${clientId}...`);
      ws.send(JSON.stringify(message));
    } else {
      console.log(`Cliente ${clientId} no está en estado OPEN, no se envió el mensaje.`);
    }
  });
};


// Configurar tarea para ejecutar cada minuto
cron.schedule("* * * * *", async () => {
  console.log("Ejecutando tarea de actualización de estados...");
  
  const cambios = await actualizarEstadosCampeonatos();
  console.log("Estados actualizados:", cambios); 

  if (cambios.length > 0) {
    console.log(`Enviando mensaje a ${clients.size} clientes conectados...`);
    broadcastMessage({
      type: "actualizacion_estados",
      cambios,
    });
    console.log("Broadcast de cambios realizado:", cambios);
  } else {
    console.log("No hubo cambios en estados de campeonatos.");
  }
});

cron.schedule("* * * * *", async () => {
  console.log("⏳ Ejecutando tarea: Monitoreo de jugadores y participaciones...");
  await monitorearJugadoresParticipacion();
});

wss.on('connection', (ws) => {
  console.log('Cliente WebSocket conectado');
  
  // Asigna un ID único al cliente
  const clientId = Date.now();
  clients.set(clientId, ws);
  console.log(`Cliente conectado con ID: ${clientId}`);

  // Notifica al cliente que la conexión fue exitosa
  ws.send(JSON.stringify({ message: 'Conexión exitosa', clientId }));

  // Escuchar mensajes del cliente
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log(`Mensaje recibido del cliente ${clientId}:`, parsedMessage);
    } catch (error) {
      console.error(`Error procesando mensaje del cliente ${clientId}:`, message, error);
    }
  });

  // Manejar desconexión del cliente
  ws.on('close', (code, reason) => {
    console.log(`Cliente ${clientId} desconectado. Código: ${code}, Razón: ${reason || 'Sin razón proporcionada'}`);
    clients.delete(clientId);
  });

  // Manejar errores de WebSocket
  ws.on('error', (error) => {
    console.error(`Error en WebSocket del cliente ${clientId}:`, error);
  });

  // Log para monitorear el número de clientes conectados
  console.log(`Total de clientes conectados: ${clients.size}`);
});


// Función para enviar mensajes específicos
const sendToClient = (clientId, message) => {
  const client = clients.get(clientId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
};



// Middleware para parsear JSON
app.use(express.json());

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'mi_secreto',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' },
}));

// Rutas
app.use('/api/sesion', userRoutes);
app.use('/api/campeonatos', campeonatoRoutes);
app.use('/api/categoria', categoriasRoutes);
app.use('/api/club', clubesRoutes);
app.use('/api/sesion', authRoutes);
app.use('/api/equipo', equipoRoutes);
app.use('/api/jugador', jugadorRoutes);
app.use('/api/lugar', lugarRoutes);
app.use('/api/partidos', partidoRoutes);
app.use('/api/persona', personaRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/presidente_club', presidenteRoutes);
app.use('/api/arbitro', arbitroRoutes); // Usa la ruta
app.use('/api/traspaso', traspasoRoutes); // Usa la ruta
app.use('/api/pagos', pagosRoutes); 
app.use('/api/reportes', reporteRoutes); 

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Servidor funcionando correctamente!');
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports.sendToClient = sendToClient;
module.exports.clients = clients;
