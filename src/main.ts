import { app, BrowserWindow } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      webSecurity: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../src/renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null!;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
