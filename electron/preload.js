const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.sendSync('window-is-maximized'),
  onMaximizedChanged: (callback) => {
    ipcRenderer.on('window-maximized-changed', (_, isMaximized) => callback(isMaximized))
  }
})
