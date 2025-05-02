const express = require("express");
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();

// Rutas
const userRoutes = require("./routes/authRoutes");
const campeonatoRoutes = require("./routes/campeonatoRoutes");
const categoriasRoutes = require("./routes/categoriaRoutes");
const clubesRoutes = require("./routes/clubRoutes");
const authRoutes = require("./routes/authRoutes");
const equipoRoutes = require("./routes/equipoRoutes");
const jugadorRoutes = require("./routes/jugadorRoutes");
const lugarRoutes = require("./routes/lugarRoutes");
const partidoRoutes = require("./routes/partidoRoutes");
const personaRoutes = require("./routes/personaRoutes");
const rolesRoutes = require("./routes/rolRoutes");
const presidenteRoutes = require("./routes/presidenteClubRoutes");
const arbitroRoutes = require("./routes/arbitroRoutes");
const traspasoRoutes = require("./routes/traspasoRoutes");
const pagosRoutes = require("./routes/pagoRoutes");
const reporteRoutes = require("./routes/reporteRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET ,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV },
  })
);

// Rutas
app.use("/api/sesion", userRoutes);
app.use("/api/campeonatos", campeonatoRoutes);
app.use("/api/categoria", categoriasRoutes);
app.use("/api/club", clubesRoutes);
app.use("/api/sesion", authRoutes);
app.use("/api/equipo", equipoRoutes);
app.use("/api/jugador", jugadorRoutes);
app.use("/api/lugar", lugarRoutes);
app.use("/api/partidos", partidoRoutes);
app.use("/api/persona", personaRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/presidente_club", presidenteRoutes);
app.use("/api/arbitro", arbitroRoutes);
app.use("/api/traspaso", traspasoRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/notification", notificationRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("¡Servidor funcionando correctamente!");
});

module.exports = app;
