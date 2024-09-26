const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { connectToDatabase } = require('./dbConfig');

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
            label: 'File',
            submenu: [
                {
                    label: 'Ingreso de Cheques',
                    click: () => {
                        mainWindow.webContents.send('navigate', 'IngresoCheque.html');
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

ipcMain.on('navigate', (event, url) => {
    mainWindow.loadFile(url);
});


ipcMain.handle('get-empresas', async () => {
    // Aquí deberías obtener las empresas de tu base de datos
    return [
        { id: 'SBDATIER', nombre: 'Tierras del sur' },
        { id: 'SBDAPATA', nombre: 'Patagonia' },
        { id: 'SBDASURD', nombre: 'Barlog' },
        { id: 'SBDABARS', nombre: 'BARSAT'},
        { id: 'SBDANORE', nombre: 'Noria Express'},
        { id: 'SBDABALO', nombre: 'Barracas Logistica'},
        { id: 'SBDATENL', nombre: 'TENLOG ' }
    ];
});

ipcMain.handle('load-cheques', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, { // Cambié ingresoWindow a mainWindow
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

ipcMain.handle('update-cheques', async (event, cheques, empresaId) => {
    try {
        const sql = await connectToDatabase(empresaId);

        for (const cheque of cheques) {
            const [nroCheque, nuevoValor] = cheque;
            console.log(empresaId);
            
            // Utilizando consulta parametrizada sin sql.raw
            await sql.query`
                UPDATE ${empresaId}.dbo.ChequesP
                SET chp_NroCheq = @nuevoValor
                WHERE chp_ID = @nroCheque
            `;
        }

        await sql.close();
        return { success: true };
    } catch (err) {
        console.error('Error al actualizar cheques:', err);
        throw err;
    }
});
