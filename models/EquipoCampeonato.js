const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Campeonato = require('./Campeonato');
const Equipo = require('./Equipo');
const Categoria = require('./Categoria');

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
    references: {
      model: Equipo,
      key: 'id',
    }
  },
  campeonatoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Campeonato,
      key: 'id',
    }
  },
  categoria_id: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    references: {
      model: Categoria,
      key: 'id',
    }
  },
  estado: {
    type: DataTypes.STRING(30),
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

EquipoCampeonato.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
Categoria.hasMany(EquipoCampeonato, { foreignKey: 'categoria_id', as: 'categorias' });


module.exports = EquipoCampeonato;
