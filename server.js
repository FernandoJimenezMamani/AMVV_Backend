require("dotenv").config();
const http = require("http");
const app = require("./app"); 
const { setupWebSocket } = require("./utils/websocket");
const { iniciarTareasProgramadas } = require("./utils/cronJobs");

const PORT = process.env.PORT || 5002;

const server = http.createServer(app);
setupWebSocket(server);
iniciarTareasProgramadas();

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

