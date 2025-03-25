const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let webServerProcess = null;
let mainWindow = null;
let filePathToWatch = './webserverFiles/webServer.js';
let publicDir = "./webserverFiles/public"; // Directory to watch
let fileWatchers = [];

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

function startWebServer(event) {
    webServerProcess = spawn('node', [filePathToWatch]);

    webServerProcess.stdout.on('data', (data) => {
        event.sender.send('server-output', data.toString());
    });

    webServerProcess.stderr.on('data', (data) => {
        event.sender.send('server-output', data.toString());
    });

    webServerProcess.on('close', (code) => {
        if (code !== 0) {
            event.sender.send('server-output', 'Server process closed');
        } else {
            event.sender.send('server-output', 'Server process closed idk');
        }
    });
}

function restartWebServer(event) {
    if (webServerProcess) {
        webServerProcess.kill();
        webServerProcess = null;
    }
    startWebServer(event);
    event.sender.send('server-output', 'Server restarted');
}

function watchFile(filePath, event) {
    let debounceTimer; // Add debounce timer

    const watcher = fs.watch(filePath, (eventType, filename) => {
        if (eventType === 'change') {
            clearTimeout(debounceTimer); // Clear previous timer
            debounceTimer = setTimeout(() => { // Set new timer
                console.log(`${filePath} changed; restarting server...`);
                event.sender.send('server-output', `${filePath} changed; restarting server...`);
                restartWebServer(event);
            }, 250); // Debounce delay (adjust as needed)
        }
    });
    fileWatchers.push(watcher);
}

function watchDirectory(dirPath, event) {
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error(`Error reading directory ${dirPath}: ${err}`);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(dirPath, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Error getting stats for ${filePath}: ${err}`);
                    return;
                }

                if (stats.isDirectory()) {
                    watchDirectory(filePath, event); // Recursive call
                } else {
                    watchFile(filePath, event);
                }
            });
        });
    });
}

ipcMain.handle('startServer', (event, filePath) => {
    return new Promise((resolve) => {
        if (webServerProcess) {
            webServerProcess.kill();
            webServerProcess = null;
        }
        startWebServer(event);
        watchFile(filePathToWatch, event); // Watch webServer.js
        watchDirectory(publicDir, event); // Watch public directory recursively
        resolve({ success: 'Server started' });
    });
});

ipcMain.handle('stopServer', () => {
    return new Promise((resolve) => {
        if (webServerProcess) {
            fileWatchers.forEach((watcher) => watcher.close());
            fileWatchers = [];
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