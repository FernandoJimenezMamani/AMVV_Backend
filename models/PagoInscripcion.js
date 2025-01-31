const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Pago = require('./Pago');
const EquipoCampeonato = require('./EquipoCampeonato');

const PagoInscripcion = sequelize.define('PagoInscripcion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Pago,
      key: 'id',
    }
  },
  EquipoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: EquipoCampeonato,
      key: 'id',
    }
  },
}, {
  tableName: 'PagoInscripcion',
  timestamps: false,
});

// Relación 1 a 1 entre Pago y PagoInscripcion
PagoInscripcion.belongsTo(Pago, { foreignKey: 'id', as: 'pago' });
Pago.hasOne(PagoInscripcion, { foreignKey: 'id', as: 'pagoInscripcion' });

// Relación 1 a 1 entre PagoInscripcion y EquipoCampeonato
PagoInscripcion.belongsTo(EquipoCampeonato, { foreignKey: 'EquipoId', as: 'equipoCampeonato' });
EquipoCampeonato.hasOne(PagoInscripcion, { foreignKey: 'EquipoId', as: 'pagoInscripcion' });

module.exports = PagoInscripcion;
