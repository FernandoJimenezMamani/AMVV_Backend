const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Persona = require('./Persona');
const Club = require('./Club');

const PresidenteClub = sequelize.define('PresidenteClub', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Persona,
      key: 'id',
    }
  },
  club_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Club,
      key: 'id',
    }
  },
}, {
  tableName: 'PresidenteClub',
  timestamps: false,
});


PresidenteClub.belongsTo(Persona, { foreignKey: 'id', as: 'persona' });  
Persona.hasOne(PresidenteClub, { foreignKey: 'id', as: 'presidente' });  

PresidenteClub.belongsTo(Club, {foreignKey: 'club_id',as: 'club'});
Club.hasMany(PresidenteClub, {foreignKey: 'club_id',as: 'presidente'});

module.exports = PresidenteClub;
