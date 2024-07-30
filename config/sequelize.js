// config/sequelize.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('AMVV_DB', 'sa', 'Univalle', {
  host: 'localhost',
  dialect: 'mssql',
  dialectOptions: {
    options: {
      encrypt: true, // Use this if you're on Windows Azure
      trustServerCertificate: true // Change to true if working locally
    }
  }
});

module.exports = sequelize;
