const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let webServerProcess = null;
let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 750,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: true,
        },
    });
    mainWindow.webContents.openDevTools();

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        if (webServerProcess) {
            webServerProcess.kill();
        }
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
        if (webServerProcess) {
          webServerProcess.kill();
          webServerProcess = null;
          console.log("Opticol Web Server shutting down")
      } else {
          console.log("Opticol Web Server unable to shut down. This might be because it was either not running or an error occured.")
      }
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('startServer', (event, filePath) => {
    return new Promise((resolve) => {
        webServerProcess = spawn('node', [filePath]);

        webServerProcess.stdout.on('data', (data) => {
            event.sender.send('server-output', data.toString());
        });

        webServerProcess.stderr.on('data', (data) => {
            event.sender.send('server-output', data.toString());
        });

        webServerProcess.on('close', (code) => {
            if (code !== 0) {
                resolve({ error: `Server process exited with code ${code}` });
            } else {
                resolve({ success: 'Server process closed' });
            }
        });

        resolve({ success: 'Server started' });
    });
});

ipcMain.handle('stopServer', () => {
    return new Promise((resolve) => {
        if (webServerProcess) {
            webServerProcess.kill();
            webServerProcess = null;
            resolve({ success: 'Server stopped' });
        } else {
            resolve({ error: 'Server not running' });
        }
    });
});

ipcMain.handle('openExternal', (event, url) => {
    shell.openExternal(url);
});

ipcMain.handle('minimizeWindow', () => { // Changed to ipcMain.handle
    mainWindow.minimize();
    return { success: 'Window minimized' };
});

ipcMain.handle('maximizeWindow', () => { // Changed to ipcMain.handle
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
    return { success: 'Window maximized/unmaximized' };
});

ipcMain.handle('closeWindow', () => { // Changed to ipcMain.handle
    mainWindow.close();
    return { success: 'Window closed' };
});

// App Development Reloader
try {
  require('electron-reloader')(module)
} catch (_) {}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.