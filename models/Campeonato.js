const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Campeonato extends Model {}

Campeonato.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  fecha_inicio_campeonato: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_fin_campeonato: {
    type: DataTypes.DATE,
    allowNull: true,
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
  fecha_inicio_transaccion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_fin_transaccion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  estado: {
    type: DataTypes.TINYINT,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'Campeonato',
  tableName: 'Campeonato',
  timestamps: false,
});


module.exports = Campeonato;
