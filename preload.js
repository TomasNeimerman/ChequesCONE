// preload.js (asegúrate de que el preload script esté configurado en el BrowserWindow)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openIngresarWindow: () => ipcRenderer.send('open-ingresar-window')
});
