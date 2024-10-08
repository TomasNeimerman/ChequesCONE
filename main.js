const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { connectToDatabase } = require('./dbConfig');
const sql = require('mssql');
const logger = require('./logger');

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });
    
    mainWindow.loadFile('index.html');

    const template = [
        {
            label: 'Menu',
            submenu: [
                {
                    label: 'Actualizador de Cheques Propios',
                    click: () => {
                        mainWindow.webContents.send('navigate', 'IngresoCheque.html');
                    }
                },
                { type: 'separator' },                          
                { role: 'quit',label:'Salir' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

ipcMain.on('navigate', (event, url) => {
    mainWindow.loadFile(url);
});


ipcMain.handle('get-empresas', async () => {
    // Aquí deberías obtener las empresas de tu base de datos
    return [
        { id: 'SBDATIER', nombre: 'TIERRAS DEL SUR' },
        { id: 'SBDAPATA', nombre: 'PATAGONIA' },
        { id: 'SBDASURD', nombre: 'BARLOG' },
        { id: 'SBDABARS', nombre: 'BARSAT' },
        { id: 'SBDANORE', nombre: 'NORIA EXPRESS' },
        { id: 'SBDABALO', nombre: 'BARRACAS LOGISTICA' },
        { id: 'SBDATENL', nombre: 'TENLOG ' }
    ];
});

// En tu archivo main.js o donde manejes los eventos del proceso principal

ipcMain.handle('load-cheques', async (event) => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        const filePath = result.filePaths[0];
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const cheques = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        if (cheques[0][2] != "ID Cheque" || cheques[0][9] != "Nro Definitivo"){
            logger.error("El encabezado del archivo es incorrecto, verificar columna 2 o 9");
            throw Error("Encabezado incorrecto");
        }
        // Eliminar la primera fila si contiene encabezados
        if (cheques.length > 0 && typeof cheques[0][0] === 'string') {
            cheques.shift();
        }

        // Convertir las columnas a enteros
        const mappedCheques = cheques.map(row => ({
            codEmpresa:(row[0]),
            idCheque: parseInt(row[2], 10),       // Columna ID Cheque convertida a int
            nroDefinitivo: parseInt(row[9], 10)   // Columna Nro Definitivo convertida a int
        }));

        return mappedCheques;
    } catch (error) {
        logger.error('Error al cargar el archivo de cheques:', error);
        throw error;
    }
});

ipcMain.handle('update-cheques', async (event, cheques, empresaId) => {
    let connection;
    try {
        logger.info(`Iniciando actualización de cheques para la empresa: ${empresaId}`);
        connection = await connectToDatabase(empresaId);

        for (const {codEmpresa, idCheque, nroDefinitivo } of cheques) {
            if (codEmpresa != empresaId){
                logger.error(`El codigo de empresa del excel: ${codEmpresa}, no se corresponde con la seleccionada: ${empresaId}`);
                return
            }
            logger.info(`Actualizando cheque ID: ${idCheque}, Nro Definitivo: ${nroDefinitivo}`);
            try {
                const result = await connection.request()
                    .input('nuevoValor', sql.Int, nroDefinitivo)  // Manejo de int
                    .input('nroCheque', sql.Int, idCheque)        // Manejo de int
                    .query(`
                        UPDATE ChequesP
                        SET chp_NroCheq = @nuevoValor
                        WHERE chp_ID = @nroCheque
                    `);
                
                // Verificar si la consulta no afectó ninguna fila
                if (result.rowsAffected[0] === 0) {
                    const notFoundMsg = `Cheque con ID ${idCheque} no encontrado.`;
                    logger.info(notFoundMsg);
                } else {
                    logger.info(`Cheque ${idCheque} actualizado correctamente.`);
                }
            } catch (queryError) {
                const queryErrorMsg = `Error en la consulta SQL al actualizar cheque ID ${idCheque}: ${queryError.message}`;
                console.error(queryErrorMsg);
                throw new Error(queryErrorMsg); // Relanzar el error para manejarlo fuera del bloque try
            }
        }

        console.log(`Actualización de cheques completada para la empresa: ${empresaId}`);
        return { success: true, count: cheques.length };
    } catch (error) {
        const errorMsg = `Error en la actualización de cheques: ${error.message}`;
        console.error(errorMsg); // Detalle del error en consola
        return { success: false, error: errorMsg }; // Devolver el error para el frontend
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('Conexión a la base de datos cerrada');
            } catch (closeError) {
                console.error(`Error al cerrar la conexión: ${closeError.message}`);
            }
        }
    }
});
