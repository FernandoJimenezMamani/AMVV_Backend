const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const connectDB = require('./config/db');
const sequelize = require('./config/sequelize'); // Importamos la configuración de Sequelize

const app = express();

// Conectar a la base de datos
connectDB();

// Sincronizar la base de datos con Sequelize
sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

const store = new SequelizeStore({
  db: sequelize,
});

app.use(session({
  secret: 'tu_secreto_de_sesion',
  store: store,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000, // 30 minutos
  },
}));

// Sincronizar la base de datos de sesiones
store.sync();

// Configurar CORS
app.use(cors({
  origin: 'http://localhost:3000', // Permitir solicitudes desde este origen
  credentials: true // Permitir el envío de cookies y credenciales
}));

app.use(bodyParser.json());

// Importar rutas
const jugadoresRoutes = require('./routes/jugadores');
const inicioDeSesionRoutes = require('./routes/sesion');
const campeonatoRoutes = require('./routes/Campeonatos');

app.use('/api/jugadores', jugadoresRoutes);
app.use('/api/sesion', inicioDeSesionRoutes);
app.use('/api/Campeonatos', campeonatoRoutes);

app.get('/', (req, res) => {
  res.send('Hello rico pene!');
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
