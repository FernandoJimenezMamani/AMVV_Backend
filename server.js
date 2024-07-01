
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

const app = express();

// Conectar a la base de datos
connectDB();

app.use(cors());
app.use(bodyParser.json());

// Importar rutas
const jugadoresRoutes = require('./routes/jugadores');
const inicioDeSesionRoutes = require('./routes/sesion');

app.use('/api/jugadores', jugadoresRoutes);
app.use('/api/sesion', inicioDeSesionRoutes);

app.get('/', (req, res) => {
  res.send('Hello rico pene!');
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});