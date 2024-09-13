const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    updateCheques: (cheques, empresa) => ipcRenderer.invoke('update-cheques', cheques, empresa),
    onSaveCheques: (callback) => ipcRenderer.on('save-cheques', callback),
    onChequesLoaded: (callback) => ipcRenderer.on('cheques-loaded', (event, cheques) => callback(cheques)),
});