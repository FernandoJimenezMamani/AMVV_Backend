const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Partido = require('./Partido');

const ResultadoVisitante = sequelize.define('ResultadoVisitante', {
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
  tableName: 'ResultadoVisitante',
  timestamps: false,
});

ResultadoVisitante.belongsTo(Partido, { foreignKey: 'partido_id', as: 'partido' });
Partido.hasMany(ResultadoVisitante, { foreignKey: 'partido_id', as: 'resultadoVisitante' });

module.exports = ResultadoVisitante;
