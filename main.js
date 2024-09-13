const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { connectToDatabase } = require('./dbConfig');

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
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
                    label: 'Load Cheques',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
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
                            mainWindow.webContents.send('cheques-loaded', cheques);
                        }
                    }
                },
                {
                    label: 'Save Cheques',
                    click: async () => {
                        mainWindow.webContents.send('save-cheques');
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