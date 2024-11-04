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
   
    
    const configPath = path.join(__dirname, './fileConfigUpdater/empresas.json');
    const data = fs.readFileSync(configPath, 'utf-8');
    var additional = JSON.parse(data);
    // Aquí deberías obtener las empresas de tu base de datos
    return additional;
       
});

ipcMain.handle('check-table-exists', async (event, empresaId) => {
    let connection;
    try {
        // Conectar a la base de datos con el ID de la empresa
        connection = await connectToDatabase(empresaId);
        const result = await connection.request()
            .input('empresaId', sql.NVarChar, empresaId)
            .query(`
                SELECT name 
                FROM sys.databases 
                WHERE name =  @empresaId
            `);
        
        // Si el resultado tiene filas, la tabla existe
        return result.recordset.length > 0;
    } catch (error) {
        console.error(`Error al verificar la existencia de la tabla: ${error.message}`);
        throw new Error('Error en la verificación de la tabla de la empresa');
    } finally {
        if (connection) {
            await connection.close();
        }
    }
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
        const cheques = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        logger.info('Cargando archivo de cheques:', filePath);

        // Validar estructura del archivo
        if (cheques.length === 0) {
            logger.error('El archivo está vacío');
            throw new Error('El archivo está vacío');
        }

        // Verificar las columnas necesarias
        if (!cheques[0].hasOwnProperty('ID Cheque') || !cheques[0].hasOwnProperty('Nro Definitivo')) {
            logger.error('El archivo no tiene el formato esperado');
            throw new Error('El archivo debe contener las columnas "ID Cheque" y "Nro Definitivo"');
        }

        // Mapear los datos
        const mappedCheques = cheques.map(row => ({

            codEmpresa: row['Empresa'] || '',
            idCheque: parseInt(row['ID Cheque'], 10),
            nroDefinitivo: row['Nro Definitivo'].toString(),
            codEmpresa:(row[0]),
            idCheque: parseInt(row[2], 10),       // Columna ID Cheque convertida a int
            nroDefinitivo: String(row[9])   // Columna Nro Definitivo convertida a int

        }));

        logger.info(`Se cargaron ${mappedCheques.length} cheques del archivo`);
        return mappedCheques;

    } catch (error) {
        logger.error('Error al cargar el archivo de cheques:', error);
        throw error;
    }
});
ipcMain.handle('verify-cheques', async (event, chequeIds, empresaId) => {
    let connection;
    try {
        // Conectarse a la base de datos con el ID de la empresa
        connection = await connectToDatabase(empresaId);
        
        // Verificar cada ID de cheque
        const results = [];
        for (const idCheque of chequeIds) {
            const result = await connection.request()
                .input('idCheque', sql.Int, idCheque)
                .input('empresaId', sql.VarChar(4), empresaId)
                .query(`
                    USE ${empresaId};
                    SELECT chp_ID, chp_NroCheq
                    FROM dbo.ChequesP 
                    WHERE chp_ID = @idCheque 
                    AND chpemp_Codigo = @empresaId
                `);
            
            results.push({
                idCheque: idCheque,
                exists: result.recordset.length > 0,
                numeroCheque: result.recordset[0]?.chp_NroCheq || null
            });
        }

        logger.info(`Verificación de cheques completada. Total verificados: ${results.length}`);
        return results;

    } catch (error) {
        logger.error(`Error al verificar cheques: ${error.message}`);
        throw new Error(`Error al verificar cheques: ${error.message}`);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

ipcMain.handle('update-cheques', async (event, cheques, empresaId) => {
    let connection;
    let chequesOK = 0 ;
    let chequesNoProcesados = 0;
    let listaNoProcesados = [];
    try {

        logger.info(`Iniciando actualización de cheques para la empresa: ${empresaId}`);
        connection = await connectToDatabase(empresaId);

        for (const {codEmpresa, idCheque, nroDefinitivo } of cheques) {
            if (codEmpresa != empresaId){
                listaNoProcesados.push({'idCheque':idCheque,'descripcion':'La empresa seleccionada no se corresponde con la del Excel'});
                chequesNoProcesados ++;
                logger.error(`El codigo de empresa del excel: ${codEmpresa}, no se corresponde con la seleccionada: ${empresaId}`);
                return
            }
            if (nroDefinitivo == null || nroDefinitivo == ''){
                listaNoProcesados.push({'idCheque':idCheque,'descripcion':'Nro Definitivo en excel esta vacio'});
                chequesNoProcesados ++;
                logger.error(`El numero que quiere actualizar esta vacio`);                
                return
            }
            logger.info(`Actualizando cheque ID: ${idCheque}, Nro Definitivo: ${nroDefinitivo}`);
            try {
                const result = await connection.request()
                    .input('nuevoValor', sql.NVarChar(50), nroDefinitivo)  // Manejo de int
                    .input('nroCheque', sql.Int, idCheque)        // Manejo de int
                    .query(`
                        USE ${empresaId};
                        UPDATE dbo.ChequesP
                        SET chp_NroCheq = @nuevoValor
                        WHERE chp_ID = @nroCheque
                    `);
                
                // Verificar si la consulta no afectó ninguna fila
                if (result.rowsAffected[0] === 0) {
                    listaNoProcesados.push({'idCheque':idCheque,'descripcion':'Cheque no pudo ser actualizado, verifique que exista en la base de datos.'});
                    chequesNoProcesados++;
                    const notFoundMsg = `Cheque con ID ${idCheque} no encontrado.`;
                    logger.info(notFoundMsg);
                } else {
                    chequesOK++;
                    logger.info(`Cheque ${idCheque} actualizado correctamente.`);
                }
            } catch (queryError) {
                chequesNoProcesados++;
                const queryErrorMsg = `Error en la consulta SQL al actualizar cheque ID ${idCheque}: ${queryError.message}`;
                listaNoProcesados.push({'idCheque':idCheque,'descripcion':`${queryError.message}`});
                logger.error(queryErrorMsg);
                //throw new Error(queryErrorMsg); // Relanzar el error para manejarlo fuera del bloque try
            }
        }

        logger.info(`Actualización de cheques completada para la empresa: ${empresaId}`);
        return { success: true, procesadosOK: chequesOK , conError:chequesNoProcesados,listaNoProcesados:listaNoProcesados };
    } catch (error) {
        const errorMsg = `Error en la actualización de cheques: ${error.message}`;
        logger.error(errorMsg); // Detalle del error en consola
        return { success: false, error: errorMsg,listaNoProcesados:listaNoProcesados }; // Devolver el error para el frontend
    } finally {
        if (connection) {
            try {
                await connection.close();
                logger.info('Conexión a la base de datos cerrada');
            } catch (closeError) {
                logger.error(`Error al cerrar la conexión: ${closeError.message}`);
            }
        }
    }
});
