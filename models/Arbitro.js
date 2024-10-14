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
    type: DataTypes.CHAR(1), // Campo para indicar si está activo o no ('S' para Sí, 'N' para No)
    allowNull: false,
    defaultValue: 'S' // Por defecto, se puede asumir que el árbitro está activo cuando se crea
  },
}, {
  tableName: 'Arbitro',
  timestamps: false,
});

// Definir las relaciones entre las tablas
Arbitro.belongsTo(Persona, { foreignKey: 'id', as: 'persona' });
Persona.hasOne(Arbitro, { foreignKey: 'id', as: 'arbitro' });

module.exports = Arbitro;
