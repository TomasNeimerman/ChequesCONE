const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sql = require('mssql');
const dbConfig = require('./dbConfig');

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    mainWindow.loadFile('index.html');
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

// Función para obtener las empresas desde la base de datos
ipcMain.handle('get-empresas', async (event) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query('SELECT id, nombre FROM Empresa');
        return result.recordset;
    } catch (err) {
        console.error('Error al obtener empresas:', err);
        throw err;
    } finally {
        await sql.close();
    }
});

// Función para actualizar cheques
ipcMain.handle('update-cheques', async (event, cheques, idEmpresa) => {
    try {
        await sql.connect(dbConfig);
        // Aquí deberías implementar la lógica para actualizar los cheques
        // Por ejemplo:
        for (const cheque of cheques) {
            await sql.query`INSERT INTO Cheques (NroCheque, IdEmpresa) VALUES (${cheque.nroCheque}, ${idEmpresa})`;
        }
        return { success: true };
    } catch (err) {
        console.error('Error al actualizar cheques:', err);
        throw err;
    } finally {
        await sql.close();
    }
});