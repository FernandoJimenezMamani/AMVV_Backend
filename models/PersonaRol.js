const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const PersonaRol = sequelize.define('PersonaRol', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  persona_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Persona',
      key: 'id'
    }
  },
  rol_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Rol',
      key: 'id'
    }
  }
}, {
  tableName: 'PersonaRol',
  timestamps: false,
});

module.exports = PersonaRol;
