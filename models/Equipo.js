const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Club = require('./Club');
const Categoria = require('./Categoria');

class Equipo extends Model {}

Equipo.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(255),
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
  categoria_id: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    references: {
      model: Categoria,
      key: 'id',
    }
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  eliminado: {
    type: DataTypes.CHAR(1),
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Equipo',
  tableName: 'Equipo',
  timestamps: false,
});

Equipo.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
Categoria.hasMany(Equipo, { foreignKey: 'categoria_id', as: 'equipos' });


Equipo.belongsTo(Club, { foreignKey: 'club_id', as: 'club' });
Club.hasMany(Equipo, { foreignKey: 'club_id', as: 'equipos' });

module.exports = Equipo;
