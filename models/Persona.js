const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const PersonaRol = require('./PersonaRol');
const Rol = require('./Rol');

const Persona = sequelize.define('Persona', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  apellido: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  ci: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique:true,
  },
  genero: {  // Nuevo campo agregado
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING(255),
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
}, {
  tableName: 'Persona',
  timestamps: false,
});

Persona.associate = function(models) {
  Persona.belongsToMany(models.Rol, {
    through: models.PersonaRol,
    foreignKey: 'persona_id',
    as: 'roles'  
  });

  Persona.hasOne(models.Jugador, { 
    foreignKey: 'id', 
    as: 'jugadores' 
  });

  Persona.hasOne(models.PresidenteClub, { 
    foreignKey: 'id', 
    as: 'presidentes' 
  });
};


module.exports = Persona;
