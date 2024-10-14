const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

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

// Inicializar la app
const app = express();
const PORT = process.env.PORT || 5002;

// Middleware para CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

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

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Servidor funcionando correctamente!');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
