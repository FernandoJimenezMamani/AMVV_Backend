const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Persona = require('./Persona');

const Arbitro = sequelize.define('Arbitro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Persona,
      key: 'id',
    }
  },
  activo: {
    type: DataTypes.TINYINT, 
    allowNull: true,
  },
}, {
  tableName: 'Arbitro',
  timestamps: false,
});

// Definir las relaciones entre las tablas
Arbitro.belongsTo(Persona, { foreignKey: 'id', as: 'persona' });
Persona.hasOne(Arbitro, { foreignKey: 'id', as: 'arbitro' });

module.exports = Arbitro;
