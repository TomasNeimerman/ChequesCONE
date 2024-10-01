const sql = require('mssql');
let db;
const config = {
    user: 'sa',
    password: '12345678',
    server: 'localhost', // Actualizado según el error
    database: db,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function connectToDatabase(empresaId) {
    try {
        
        db = empresaId;

        console.log(`Intentando conectar a la base de datos: ${empresaId}`);
        console.log('Configuración de conexión:', JSON.stringify(config, null, 2));

        const pool = await new sql.ConnectionPool(config).connect();
        console.log(`Conectado exitosamente a la base de datos ${empresaId}`);
        return pool;
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        throw err;
    }
}

module.exports = { connectToDatabase };