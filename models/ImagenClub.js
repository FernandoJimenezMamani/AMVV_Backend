const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Club = require('./Club');

const ImagenClub = sequelize.define('ImagenClub', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  club_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Club,
      key: 'id',
    }
  },
  club_imagen: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'ImagenClub',
  timestamps: false,
});

ImagenClub.belongsTo(Club, { foreignKey: 'club_id', as: 'club' });
Club.hasMany(ImagenClub, { foreignKey: 'club_id', as: 'imagenClub' });  

module.exports = ImagenClub;
