const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Lugar = sequelize.define('Lugar', {
  id: {
    type: DataTypes.TINYINT,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  longitud: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },
  latitud: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },
  eliminado: {
    type: DataTypes.CHAR(1),
    allowNull: true,
  },
}, {
  tableName: 'Lugar',
  timestamps: false,
});

module.exports = Lugar;
