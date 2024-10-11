const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Jugador = require('./Jugador');
const Equipo = require('./Equipo');

const Traspaso = sequelize.define('Traspaso', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  jugador_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Jugador,
      key: 'id',
    }
  },
  equipo_origen_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Equipo,
      key: 'id',
    }
  },
  equipo_destino_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Equipo,
      key: 'id',
    }
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  monto: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
  },
}, {
  tableName: 'Traspaso',
  timestamps: false,
});

Traspaso.belongsTo(Equipo, { foreignKey: 'equipo_origen_id', as: 'equipoOrigen' });
Equipo.hasMany(Traspaso, { foreignKey: 'equipo_origen_id', as: 'traspasosOrigen' });

Traspaso.belongsTo(Equipo, { foreignKey: 'equipo_destino_id', as: 'equipoDestino' });
Equipo.hasMany(Traspaso, { foreignKey: 'equipo_destino_id', as: 'traspasosDestino' });

Traspaso.belongsTo(Jugador, { foreignKey: 'jugador_id', as: 'jugador' });
Jugador.hasMany(Traspaso, { foreignKey: 'jugador_id', as: 'traspasosJugador' });

module.exports = Traspaso;
