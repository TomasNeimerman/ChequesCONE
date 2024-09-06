const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getEmpresas: () => ipcRenderer.invoke('get-empresas'),
    updateCheques: (cheques, idEmpresa) => ipcRenderer.invoke('update-cheques', cheques, idEmpresa),
});