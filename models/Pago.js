const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Pago = sequelize.define('Pago', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  monto: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  referencia: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  tipo_pago: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'Pago',
  timestamps: false,
});

module.exports = Pago;
