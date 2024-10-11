const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Campeonato = require('./Campeonato');
const Equipo = require('./Equipo');
const Lugar = require('./Lugar');

const Partido = sequelize.define('Partido', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  campeonato_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Campeonato,
      key: 'id',
    }
  },
  equipo_local_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Equipo,
      key: 'id',
    }
  },
  equipo_visitante_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Equipo,
      key: 'id',
    }
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lugar_id: {
    type: DataTypes.TINYINT,
    allowNull: true,
    references: {
      model: Lugar,
      key: 'id',
    }
  },
  estado: {
    type: DataTypes.CHAR(1),
    allowNull: true,
  },
  walkover: {
    type: DataTypes.CHAR(1),
    allowNull: true,
  },
}, {
  tableName: 'Partido',
  timestamps: false,
});

Partido.belongsTo(Equipo, { foreignKey: 'equipo_local_id', as: 'equipolocal' });
Equipo.hasMany(Partido, { foreignKey: 'equipo_local_id', as: 'equipo1' });

Partido.belongsTo(Equipo, { foreignKey: 'equipo_visitante_id', as: 'equipovisitante' });
Equipo.hasMany(Partido, { foreignKey: 'equipo_visitante_id', as: 'equipo2' });

Partido.belongsTo(Campeonato, { foreignKey: 'campeonato_id', as: 'campeonato' });
Campeonato.hasMany(Partido, { foreignKey: 'campeonato_id', as: 'campeonato' });

Partido.belongsTo(Lugar, { foreignKey: 'lugar_id', as: 'lugar' });
Lugar.hasMany(Partido, { foreignKey: 'lugar_id', as: 'lugar' });

module.exports = Partido;
