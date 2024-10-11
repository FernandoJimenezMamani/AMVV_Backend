const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Club = require('./Club');
const Persona = require('./Persona');

const Jugador = sequelize.define('Jugador', {
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
    allowNull: true,
    references: {
      model: Club,
      key: 'id',
    }
  },
}, {
  tableName: 'Jugador',
  timestamps: false,
});


Jugador.belongsTo(Persona, {foreignKey: 'id',as: 'persona'});
Persona.hasOne(Jugador, { foreignKey: 'id',as: 'jugador'});


Jugador.belongsTo(Club, {foreignKey: 'club_id',as: 'club'});
Club.hasMany(Jugador, {foreignKey: 'club_id',as: 'jugadores'});

module.exports = Jugador;
