const sql = require('mssql');

const dbConfigs = {
    empresa1: {
        user: 'userEmpresa',
        password: 'cheque',
        server: 'localhost',
        database: 'ChequesEmpresa1',
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true,
        },
        port: 1433,
    },
    empresa2: {
        user: 'userEmpresa',
        password: 'cheque',
        server: 'localhost',
        database: 'ChequesEmpresa2',
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true,
        },
        port: 1433,
    }
};

async function connectToDatabase(empresa) {
    if (!dbConfigs[empresa]) {
        throw new Error('Empresa no válida');
    }

    try {
        await sql.connect(dbConfigs[empresa]);
        console.log(`Conectado a la base de datos de ${empresa} correctamente`);
        return sql;
    } catch (err) {
        if (err.code === 'ELOGIN') {
            console.error('Error de login: Verifica tu usuario y contraseña.');
        } else {
            console.error(`Error al conectar a la base de datos de ${empresa}:`, err);
        }
        throw err;
    }
}

module.exports = { connectToDatabase };