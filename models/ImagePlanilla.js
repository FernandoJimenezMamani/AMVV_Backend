const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Partido = require('./Partido');

const ImagePlanilla = sequelize.define('ImagePlanilla', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  partido_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Partido,
      key: 'id',
    }
  },
  partido_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'ImagePlanilla',
  timestamps: false,
});

ImagePlanilla.belongsTo(Partido, { foreignKey: 'partido_id', as: 'partido' });
Partido.hasMany(ImagePlanilla, { foreignKey: 'partido_id', as: 'Imagen' });

module.exports = ImagePlanilla;
