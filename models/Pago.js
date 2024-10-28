const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Traspaso = require('./Traspaso'); // Importa el modelo de Traspaso si es necesario
const EquipoCampeonato = require('./EquipoCampeonato'); // Importa el modelo de Equipo si es necesario

const Pago = sequelize.define('Pago', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  monto: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  referencia: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  tipo_pago: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  traspaso_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Traspaso, // Nombre de la tabla referenciada
      key: 'id', // Clave primaria de la tabla referenciada
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  },
  EquipoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: EquipoCampeonato, // Nombre de la tabla referenciada
      key: 'id', // Clave primaria de la tabla referenciada
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'Pago',
  timestamps: false,
});

module.exports = Pago;
