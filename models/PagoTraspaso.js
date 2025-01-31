const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Pago = require('./Pago');
const Traspaso = require('./Traspaso');

const PagoTraspaso = sequelize.define('PagoTraspaso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Pago,
      key: 'id',
    }
  },
  traspaso_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Traspaso,
      key: 'id',
    }
  },
}, {
  tableName: 'PagoTraspaso',
  timestamps: false,
});

// Relación 1 a 1 entre Pago y PagoTraspaso
PagoTraspaso.belongsTo(Pago, { foreignKey: 'id', as: 'pago' });
Pago.hasOne(PagoTraspaso, { foreignKey: 'id', as: 'pagoTraspaso' });

// Relación 1 a 1 entre PagoTraspaso y Traspaso
PagoTraspaso.belongsTo(Traspaso, { foreignKey: 'traspaso_id', as: 'traspaso' });
Traspaso.hasOne(PagoTraspaso, { foreignKey: 'traspaso_id', as: 'pagoTraspaso' });

module.exports = PagoTraspaso;
