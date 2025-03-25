const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    startServer: (filePath) => ipcRenderer.invoke('startServer', filePath),
    stopServer: () => ipcRenderer.invoke('stopServer'),
    onServerOutput: (callback) => ipcRenderer.on('server-output', (event, data) => callback(data)),
    openExternal: (url) => ipcRenderer.invoke('openExternal', url),
    minimizeWindow: () => ipcRenderer.invoke('minimizeWindow'),
    maximizeWindow: () => ipcRenderer.invoke('maximizeWindow'),
    closeWindow: () => ipcRenderer.invoke('closeWindow'),
});