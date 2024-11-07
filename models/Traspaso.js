const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Jugador = require('./Jugador');
const Club = require('./Club');

const Traspaso = sequelize.define('Traspaso', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  jugador_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Jugador,
      key: 'id',
    }
  },
  club_origen_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Club,
      key: 'id',
    }
  },
  club_destino_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Club,
      key: 'id',
    }
  },
  fecha_solicitud: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fecha_actualizacion: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  estado_solicitud: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'PENDIENTE',
  },
  aprobado_por_jugador: {
    type: DataTypes.CHAR(1),
    allowNull: false,
    defaultValue: 'P', // 'S' para aprobado, 'N' para no aprobado
  },
  aprobado_por_club: {
    type: DataTypes.CHAR(1),
    allowNull: false,
    defaultValue: 'P', // 'S' para aprobado, 'N' para no aprobado
  },
  costo_traspaso: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
}, {
  tableName: 'Traspaso',
  timestamps: false,
});

// Relaciones entre Traspaso y Club
Traspaso.belongsTo(Club, { foreignKey: 'club_origen_id', as: 'clubOrigen' });
Club.hasMany(Traspaso, { foreignKey: 'club_origen_id', as: 'traspasosOrigen' });

Traspaso.belongsTo(Club, { foreignKey: 'club_destino_id', as: 'clubDestino' });
Club.hasMany(Traspaso, { foreignKey: 'club_destino_id', as: 'traspasosDestino' });

// Relación entre Traspaso y Jugador
Traspaso.belongsTo(Jugador, { foreignKey: 'jugador_id', as: 'jugador' });
Jugador.hasMany(Traspaso, { foreignKey: 'jugador_id', as: 'traspasosJugador' });

module.exports = Traspaso;
