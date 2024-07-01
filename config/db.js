// dbconfig.js

const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Univalle',
    server: 'localhost', // e.g., 'localhost'
    database: 'AMVV_DB',
    options: {
        encrypt: true, // Usar en Azure
        trustServerCertificate: true // Cambia a true si estás trabajando localmente
    }
};

const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log('SQL Server Connected');
    } catch (err) {
        console.error(`Database connection failed: ${err.message}`);
        process.exit(1);
    }
};
 
module.exports = connectDB;
 