const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Club = require('./Club');

const Pago = sequelize.define('Pago', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  concepto: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  monto: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  club_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Club,
      key: 'id',
    }
  },
}, {
  tableName: 'Pago',
  timestamps: false,
});

Pago.belongsTo(Club, { foreignKey: 'club_id', as: 'Club' });

module.exports = Pago;
