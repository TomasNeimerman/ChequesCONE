const fs = require('fs');
const path = require('path');
const sql = require('mssql');
let db;
/**
 * Function to load the database configuration from a properties file.
 * @returns {Object} config - Database connection configuration.
 */
function loadConfig() {
    const configPath = path.join(__dirname, './dbConfig.properties');
    const data = fs.readFileSync(configPath, 'utf-8');
    
    const config = {};

    // Parse properties file and store values in config object
    data.split('\n').forEach(line => {
        const trimmedLine = line.trim();  // Trim spaces around the line
        if (trimmedLine && trimmedLine.includes('=')) {  // Ensure line is not empty and contains '='
            const [key, value] = trimmedLine.split('=');
            if (key && value) {
                config[key.trim()] = value.trim();  // Ensure key and value are not undefined
            }
        }
    });

    return config;
}

// Load config from external file
const config = loadConfig();

const dbConfig = {
    user: config.user,
    password: config.password,
    server: config.server,
    port: parseInt(config.port),  // Port as integer
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
        console.log('Configuración de conexión:', JSON.stringify(dbConfig, null, 2));

        const pool = await new sql.ConnectionPool(dbConfig).connect();
        console.log(`Conectado exitosamente a la base de datos ${empresaId}`);
        return pool;
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        throw err;
    }
}

module.exports = { connectToDatabase };
