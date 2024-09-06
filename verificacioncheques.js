const mysql = require('mysql');
const express = require('express');
const fileUpload = require('express-fileupload'); // Para manejar subida de archivos
const xlsx = require('xlsx'); // Para leer archivos Excel
const app = express();

// Habilitar fileUpload para que podamos recibir archivos en las peticiones
app.use(fileUpload());

// Configurar conexión con la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'nombre_basedatos'
});

connection.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos');
});

// Ruta para obtener la lista de empresas
app.get('/getEmpresas', (req, res) => {
    const query = 'SELECT id, nombre FROM Empresas';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error ejecutando la consulta:', error);
            return res.status(500).send('Error obteniendo las empresas');
        }
        res.json(results);  // Devuelve las empresas en formato JSON
    });
});

// Ruta para validar y actualizar los datos del Excel
app.post('/validarYActualizar', (req, res) => {
    if (!req.files || !req.body.empresaId) {
        return res.status(400).send({ success: false, message: 'Archivo y empresa son requeridos' });
    }

    const file = req.files.file;
    const empresaId = req.body.empresaId;

    // Leer el archivo Excel
    const workbook = xlsx.read(file.data, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Validar que haya al menos 2 filas
    if (rows.length < 2) {
        return res.status(400).send({ success: false, message: 'El archivo debe tener al menos 2 filas' });
    }

    const fila1 = rows[0]; // Primera fila
    const fila2 = rows[1]; // Segunda fila

    // Validar que ambas filas sean números enteros
    if (!fila1.every(Number.isInteger) || !fila2.every(Number.isInteger)) {
        return res.status(400).send({ success: false, message: 'Ambas filas deben contener enteros' });
    }

    // Verificar que la primera fila coincida con los datos en la base de datos
    const querySelect = 'SELECT columna1, columna2 FROM Cheques WHERE empresaId = ?';
    connection.query(querySelect, [empresaId], (error, results) => {
        if (error) {
            console.error('Error ejecutando el SELECT:', error);
            return res.status(500).send({ success: false, message: 'Error verificando los datos en la base de datos' });
        }

        const datosBD = results[0];

        if (datosBD.columna1 !== fila1[0] || datosBD.columna2 !== fila1[1]) {
            return res.status(400).send({ success: false, message: 'Los datos no coinciden con los almacenados en la base de datos' });
        }

        // Si los datos son válidos, proceder con el UPDATE
        const queryUpdate = 'UPDATE Cheques SET columna1 = ?, columna2 = ? WHERE empresaId = ?';
        connection.query(queryUpdate, [fila2[0], fila2[1], empresaId], (error, results) => {
            if (error) {
                console.error('Error ejecutando el UPDATE:', error);
                return res.status(500).send({ success: false, message: 'Error actualizando los datos' });
            }

            res.send({ success: true, message: 'Datos actualizados correctamente' });
        });
    });
});

// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});
