const path = require('path')
const fs = require('fs')

const electronPkgDir = path.join(__dirname, '..', 'node_modules', 'electron')
const electronPkgJson = path.join(electronPkgDir, 'package.json')
const electronPkgJsonBackup = path.join(electronPkgDir, 'package.json.bak')

if (fs.existsSync(electronPkgJson) && !fs.existsSync(electronPkgJsonBackup)) {
  fs.renameSync(electronPkgJson, electronPkgJsonBackup)
}

const { app, BrowserWindow, ipcMain } = require('electron')

if (fs.existsSync(electronPkgJsonBackup)) {
  fs.renameSync(electronPkgJsonBackup, electronPkgJson)
}

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      webSecurity: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  ipcMain.on('window-minimize', () => mainWindow.minimize())
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })
  ipcMain.on('window-close', () => mainWindow.close())
  ipcMain.on('window-is-maximized', (event) => {
    event.returnValue = mainWindow.isMaximized()
  })

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized-changed', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized-changed', false)
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
