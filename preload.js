const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getEmpresas: () => ipcRenderer.invoke('get-empresas'),
    loadCheques: () => ipcRenderer.invoke('load-cheques'),
    updateCheques: (cheques, empresa) => ipcRenderer.invoke('update-cheques', cheques, empresa),
});