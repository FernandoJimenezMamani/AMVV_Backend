const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const JugadorEquipo = require('./JugadorEquipo');
const EquipoCampeonato = require('./EquipoCampeonato');

const Participacion = sequelize.define('Participacion', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  jugador_equipo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: JugadorEquipo,
      key: 'id',
    }
  },
  equipo_campeonato_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: EquipoCampeonato,
      key: 'id',
    }
  }
}, {
  tableName: 'Participacion',
  timestamps: false,
});

Participacion.belongsTo(JugadorEquipo, { foreignKey: 'jugador_equipo_id', as: 'jugadorEquipo' });
JugadorEquipo.hasMany(Participacion, { foreignKey: 'jugador_equipo_id', as: 'participaciones' });

Participacion.belongsTo(EquipoCampeonato, { foreignKey: 'equipo_campeonato_id', as: 'equipoCampeonato' });
EquipoCampeonato.hasMany(Participacion, { foreignKey: 'equipo_campeonato_id', as: 'participaciones' });

module.exports = Participacion;
