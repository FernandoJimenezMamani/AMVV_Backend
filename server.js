
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
//Rol
const rolesRoutes = require('./routes/roles');
app.use('/api/roles', rolesRoutes);
//Jugadores
const jugadoresRoutes = require('./routes/jugadores');
app.use('/api/jugadores', jugadoresRoutes);
//Login
const inicioDeSesionRoutes = require('./routes/sesion');
app.use('/api/sesion', inicioDeSesionRoutes);
//Club
const clubRoutes = require('./routes/club');
app.use('/api/club', clubRoutes);
//Categoria
const categoriaRoutes = require('./routes/categoria');
app.use('/api/categoria', categoriaRoutes);
//Equipo
const equipoRoutes = require('./routes/equipo');
app.use('/api/equipo', equipoRoutes);


const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});