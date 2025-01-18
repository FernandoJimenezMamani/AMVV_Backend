const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Club = require('./Club');
const Persona = require('./Persona');

const Jugador = sequelize.define('Jugador', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true, 
    autoIncrement: true,
  },
  jugador_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Persona,
      key: 'id',
    },
  },
  club_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Club,
      key: 'id',
    }
  },
  activo:{
  type: DataTypes.TINYINT,
  allowNull:true
  },
}, {
  tableName: 'Jugador',
  timestamps: false,
});


Jugador.belongsTo(Persona, {foreignKey: 'id',as: 'persona'});
Persona.hasMany(Jugador, { foreignKey: 'jugador_id',as: 'jugador'});


Jugador.belongsTo(Club, {foreignKey: 'club_id',as: 'club'});
Club.hasMany(Jugador, {foreignKey: 'club_id',as: 'jugadores'});

module.exports = Jugador;
