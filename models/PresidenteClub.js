const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Persona = require('./Persona');
const Club = require('./Club');

const PresidenteClub = sequelize.define('PresidenteClub', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  presidente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Persona,
        key: 'id',
      },
    },
  club_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Club,
      key: 'id',
    }
  },
  activo:{
  type: DataTypes.TINYINT,
  allowNull:true
  },
  delegado:{
    type: DataTypes.CHAR(1),
    allowNull: true
  }
}, {
  tableName: 'PresidenteClub',
  timestamps: false,
});


PresidenteClub.belongsTo(Persona, { foreignKey: 'id', as: 'persona' });  
Persona.hasMany(PresidenteClub, { foreignKey: 'presidente_id', as: 'presidente' });  

PresidenteClub.belongsTo(Club, {foreignKey: 'club_id',as: 'club'});
Club.hasMany(PresidenteClub, {foreignKey: 'club_id',as: 'presidentes'});

module.exports = PresidenteClub;
