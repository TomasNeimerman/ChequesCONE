const sql = require('mssql');

const dbConfig = {
    user: 'sa',
    password: '12345678',
    server: 'localhost',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    port: 1433,
};

async function connectToDatabase() {
    try {
        await sql.connect(dbConfig);
        console.log('Conectado a la base de datos correctamente');
        return sql;
    } catch (err) {
        if (err.code === 'ELOGIN') {
            console.error('Error de login: Verifica tu usuario y contraseña.');
        } else {
            console.error('Error al conectar a la base de datos:', err);
        }
        throw err;
    }
}

module.exports = { connectToDatabase };