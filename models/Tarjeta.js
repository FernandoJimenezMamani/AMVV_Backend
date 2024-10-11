const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Partido = require('./Partido');
const Equipo = require('./Equipo');
const Jugador = require('./Jugador');

const Tarjeta = sequelize.define('Tarjeta', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  partido_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Partido,
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
  jugador_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Jugador,
      key: 'id',
    }
  },
  tipo_tarjeta: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
}, {
  tableName: 'Tarjeta',
  timestamps: false,
});

Tarjeta.belongsTo(Partido, { foreignKey: 'partido_id', as: 'Partido' });
Tarjeta.belongsTo(Equipo, { foreignKey: 'equipo_id', as: 'Equipo' });
Tarjeta.belongsTo(Jugador, { foreignKey: 'jugador_id', as: 'Jugador' });

module.exports = Tarjeta;
