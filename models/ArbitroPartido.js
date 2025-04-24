const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Persona = require('./Persona');
const Partido = require('./Partido');
const Arbitro = require('./Arbitro');

  const ArbitroPartido = sequelize.define('ArbitroPartido', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    arbitro_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Arbitro', 
        key: 'id',
      }
    },
    partido_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Partido', 
        key: 'id',
      }
    },
  }, {
    tableName: 'Arbitro_Partido',
    timestamps: false,
  });


    ArbitroPartido.belongsTo(Persona, { foreignKey: 'arbitro_id', as: 'arbitro' });
    Persona.hasMany(ArbitroPartido, { foreignKey: 'arbitro_id', as: 'partidosArbitrados' });

    ArbitroPartido.belongsTo(Partido, { foreignKey: 'partido_id', as: 'partido' });
    Partido.hasMany(ArbitroPartido, { foreignKey: 'partido_id', as: 'arbitros' });
  
  module.exports = ArbitroPartido;

