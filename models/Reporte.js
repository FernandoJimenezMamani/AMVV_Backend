const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Campeonato = require('./Campeonato');

const Reporte = sequelize.define('Reporte', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  campeonato_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Campeonato,
      key: 'id',
    }
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  tableName: 'Reporte',
  timestamps: false,
});

Reporte.belongsTo(Campeonato, { foreignKey: 'campeonato_id', as: 'campeonato' });
Campeonato.hasMany(Reporte, { foreignKey: 'campeonato_id', as: 'reporte' });

module.exports = Reporte;
