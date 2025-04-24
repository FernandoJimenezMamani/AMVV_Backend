const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Partido = require('./Partido');

const ResultadoLocal = sequelize.define('ResultadoLocal', {
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
  set1: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  set2: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  set3: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  resultado: {
    type: DataTypes.CHAR(1),
    allowNull: true,
  },
  walkover: {
    type: DataTypes.CHAR(10),
    allowNull: true,
  },
}, {
  tableName: 'ResultadoLocal',
  timestamps: false,
});

ResultadoLocal.belongsTo(Partido, { foreignKey: 'partido_id', as: 'partido' });
Partido.hasMany(ResultadoLocal, { foreignKey: 'partido_id', as: 'resultadoLocal' });

module.exports = ResultadoLocal;
