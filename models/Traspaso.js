const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Jugador = require('./Jugador');
const Club = require('./Club');
const Campeonato = require('./Campeonato');
const PresidenteClub = require('./PresidenteClub');

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
  estado_jugador: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'PENDIENTE',
  },
  estado_club_origen: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'PENDIENTE',
  },
  estado_deuda: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'PENDIENTE',
  },
  eliminado: {
    type: DataTypes.CHAR(1),
    allowNull: false,
    defaultValue: 'N',
  },
  campeonato_id:{
    type:DataTypes.INTEGER,
    allowNull:false,
    references: {
      model: Campeonato,
      key: 'id',
    }
  },
  estado_club_receptor: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  tipo_solicitud: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  presidente_club_id_origen:{
    type:DataTypes.INTEGER,
    allowNull:false,
    references: {
      model: PresidenteClub,
      key: 'id',
    }
  },
  presidente_club_id_destino:{
    type:DataTypes.INTEGER,
    allowNull:false,
    references: {
      model: PresidenteClub,
      key: 'id',
    }
  }
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

Traspaso.belongsTo(PresidenteClub, { foreignKey: 'presidente_club_id_origen', as: 'presidenteOrigen' });
PresidenteClub.hasMany(Traspaso, { foreignKey: 'presidente_club_id_origen', as: 'traspasosComoOrigen' });

Traspaso.belongsTo(PresidenteClub, { foreignKey: 'presidente_club_id_destino', as: 'presidenteDestino' });
PresidenteClub.hasMany(Traspaso, { foreignKey: 'presidente_club_id_destino', as: 'traspasosComoDestino' });

Traspaso.belongsTo(Campeonato, { foreignKey: 'campeonato_id', as: 'campeonato' });
Campeonato.hasMany(Traspaso, { foreignKey: 'campeonato_id', as: 'traspasos' });


module.exports = Traspaso;
