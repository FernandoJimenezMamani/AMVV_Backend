const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Persona = require('./Persona');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Persona,
      key: 'id',
    }
  },
  contraseña: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  correo: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
  intentosFallidos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  bloqueadoHasta: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'Usuario',
  timestamps: false,
});

Usuario.belongsTo(Persona, { foreignKey: 'id', as: 'persona' });
Persona.hasOne(Usuario, { foreignKey: 'id', as: 'usuario' });

module.exports = Usuario;
