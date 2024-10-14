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

Rol.associate = function(models) {
  Rol.belongsToMany(models.Persona, {
    through: models.PersonaRol,
    foreignKey: 'rol_id',
    as: 'personas'  
  });
};


module.exports = Rol;
