const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Jugador = require('./Jugador');
const Equipo = require('./Equipo');
const Campeonato = require('./Campeonato');

const JugadorEquipo = sequelize.define('JugadorEquipo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  jugador_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Jugador,
      key: 'id',
    }
  },
  equipo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Equipo,
      key: 'id',
    }
  },
  campeonato_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Campeonato,
      key: 'id',
    }
  },
}, {
  tableName: 'JugadorEquipo',
  timestamps: false,
});

// Relaciones
JugadorEquipo.belongsTo(Equipo, { foreignKey: 'equipo_id', as: 'equipo' });
Equipo.hasMany(JugadorEquipo, { foreignKey: 'equipo_id', as: 'jugadores' });

JugadorEquipo.belongsTo(Jugador, { foreignKey: 'jugador_id', as: 'jugador' });
Jugador.hasMany(JugadorEquipo, { foreignKey: 'jugador_id', as: 'equipos' });

JugadorEquipo.belongsTo(Campeonato, { foreignKey: 'campeonato_id', as: 'campeonato' });
Campeonato.hasMany(JugadorEquipo, { foreignKey: 'campeonato_id', as: 'jugadoresInscritos' });

module.exports = JugadorEquipo;
