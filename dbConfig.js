module.exports = {
    user: 'userEmpresa',
    password: 'cheque',
    server: 'localhost',
    database: 'Cheques',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    port: 1433  // Asegúrate de que este sea el puerto correcto
};