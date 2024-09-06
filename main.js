// main.js (archivo principal de tu aplicación Electron)

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    mainWindow.loadFile('index.html'); // Carga tu archivo HTML principal
}

app.whenReady().then(() => {
    createMainWindow();

    // Event listener for the button
    const { ipcMain } = require('electron');
    ipcMain.on('open-ingresar-window', (event) => {
        createIngresarWindow();
    });

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
