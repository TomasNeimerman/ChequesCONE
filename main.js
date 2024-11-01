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
ipcMain.handle('check-table-exists', async (event, empresa) => {
    let connection
    try {
        connection = await connectToDatabase(empresaId);
        const result = await connection.request()
        .input('empresaId', sql.NVarChar, empresa.idCheque)  // Manejo de int
                // Manejo de int
        .query(`
        SELECT * 
        FROM information_schema.tables 
        WHERE table_name = @empresaId
        `);
        return result
    } finally{
        if (connection) {
            await connection.close();
        }
    }
})

ipcMain.handle('get-empresas', async () => {
   
    
    const configPath = path.join(__dirname, '../fileConfigUpdater/empresas.json');
    const data = fs.readFileSync(configPath, 'utf-8');
    var additional = JSON.parse(data);
    // Aquí deberías obtener las empresas de tu base de datos
    return additional;
       
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
            nroDefinitivo: String(row[9])   // Columna Nro Definitivo convertida a int
        }));

        return mappedCheques;
    } catch (error) {
        logger.error('Error al cargar el archivo de cheques:', error);
        throw error;
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
