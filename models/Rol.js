const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const PersonaRol = require('./PersonaRol');

const Rol = sequelize.define('Rol', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'Rol',
  timestamps: false,
});

// Asociaciones
Rol.associate = function(models) {
  Rol.belongsToMany(models.Persona, {
    through: models.PersonaRol, // Relación a través de PersonaRol
    foreignKey: 'rol_id',
    otherKey: 'persona_id', // Esto especifica el otro campo en la tabla intermedia
    as: 'personas' // Alias para obtener las personas relacionadas con el rol
  });
};

module.exports = Rol;
