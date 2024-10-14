const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Persona = require('./Persona'); // Importar Persona
const Rol = require('./Rol'); // Importar Rol

const PersonaRol = sequelize.define('PersonaRol', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  persona_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Persona,
      key: 'id'
    }
  },
  rol_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Rol,
      key: 'id'
    }
  }
}, {
  tableName: 'PersonaRol',
  timestamps: false,
});

// Definir la relación inversa con Persona y Rol
PersonaRol.associate = function(models) {
  PersonaRol.belongsTo(models.Persona, { foreignKey: 'persona_id', as: 'persona' });
  PersonaRol.belongsTo(models.Rol, { foreignKey: 'rol_id', as: 'rol' });
};

module.exports = PersonaRol;
