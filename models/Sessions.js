const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Sessions = sequelize.define('Sessions', {
  sid: {
    type: DataTypes.STRING(36),
    primaryKey: true,
  },
  expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'Sessions',
  timestamps: true,
});

module.exports = Sessions;
