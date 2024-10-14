const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Campeonato = require('./Campeonato');
const Equipo = require('./Equipo');

class EquipoCampeonato extends Model {}

EquipoCampeonato.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  equipoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  campeonatoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  estado: {
    type: DataTypes.CHAR(1),
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'EquipoCampeonato',
  tableName: 'EquipoCampeonato',
  timestamps: false,
});

EquipoCampeonato.belongsTo(Campeonato, { foreignKey: 'campeonatoId', as: 'campeonato' });
Campeonato.hasMany(EquipoCampeonato, { foreignKey: 'campeonatoId', as: 'equipos' });

EquipoCampeonato.belongsTo(Equipo, { foreignKey: 'equipoId', as: 'equipo' });
Equipo.hasMany(EquipoCampeonato, { foreignKey: 'equipoId', as: 'campeonato' });

module.exports = EquipoCampeonato;
