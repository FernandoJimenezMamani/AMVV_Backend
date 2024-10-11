const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Persona = require('./Persona');

const ImagenPersona = sequelize.define('ImagenPersona', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Persona,
      key: 'id',
    }
  },
  persona_imagen: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'ImagenPersona',
  timestamps: false,
});

ImagenPersona.belongsTo(Persona, { foreignKey: 'persona_id', as: 'persona' });
Persona.hasMany(ImagenPersona, { foreignKey: 'persona_id', as: 'imagenes' });

module.exports = ImagenPersona;
