const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { connectToDatabase } = require('./dbConfig');

let mainWindow;
let ingresoWindow;

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
            label: 'File',
            submenu: [
                {
                    label: 'Ingreso de Cheques',
                    click: () => {
                        createIngresoWindow();
                    }
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createIngresoWindow() {
    ingresoWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });
    
    ingresoWindow.loadFile('IngresoCheque.html');
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

ipcMain.handle('get-empresas', async () => {
    // Aquí deberías obtener las empresas de tu base de datos
    return [
        { id: 'empresa1', nombre: 'Empresa 1' },
        { id: 'empresa2', nombre: 'Empresa 2' }
    ];
});

ipcMain.handle('load-cheques', async (event) => {
    const result = await dialog.showOpenDialog(ingresoWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const cheques = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        return cheques;
    }
    return null;
});

ipcMain.handle('update-cheques', async (event, cheques, empresa) => {
    try {
        const sql = await connectToDatabase(empresa);

        for (const cheque of cheques) {
            const [nroCheque, nuevoValor] = cheque;
            
            await sql.query`
                UPDATE Cheque
                SET nroCheque = ${nuevoValor}
                WHERE id = ${nroCheque}
            `;
        }

        await sql.close();
        return { success: true };
    } catch (err) {
        console.error('Error al actualizar cheques:', err);
        throw err;
    }
});