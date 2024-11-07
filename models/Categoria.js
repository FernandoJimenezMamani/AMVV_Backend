const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Categoria = sequelize.define('Categoria', {
  id: {
    type: DataTypes.SMALLINT,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  genero: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  division: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  edad_minima: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  edad_maxima: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  costo_traspaso: {
    type: DataTypes.DECIMAL(10, 2), // Nueva columna para el costo de traspaso
    allowNull: false,
    defaultValue: 0.00, // Un valor predeterminado si no se asigna uno
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  eliminado: {
    type: DataTypes.CHAR(1),
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'Categoria',
  timestamps: false,
});

module.exports = Categoria;
