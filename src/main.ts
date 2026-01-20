import { app, BrowserWindow, globalShortcut, Menu, ipcMain, shell } from 'electron';
import * as path from 'path';
import { store, AppState } from './store';

// Enable hot reload in development
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: require(path.join(__dirname, '../node_modules/electron'))
  });
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Load saved window bounds if available
  const bounds = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width: bounds?.width || 1400,
    height: bounds?.height || 900,
    x: bounds?.x,
    y: bounds?.y,
    minWidth: 800,
    minHeight: 600,

    // FRAMELESS CONFIGURATION
    frame: false,           // Remove native window chrome
    titleBarStyle: 'hidden', // macOS: preserve traffic lights
    titleBarOverlay: {      // Windows: overlay controls
      color: '#0f0f0f',
      symbolColor: '#ffffff',
      height: 44
    },

    // Appearance
    backgroundColor: '#0f0f0f',
    show: false, // Prevent white flash

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      sandbox: false, // Required for webview in some cases, though discouraged if possible. Strategy said false.
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Graceful show after ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Save window bounds on resize/move
  const saveBounds = () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      store.set('windowBounds', bounds);
    }
  };
  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);

  // In development, load from webpack dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../src/renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerGlobalShortcuts() {
  const shortcuts = [
    { accelerator: 'CommandOrControl+T', channel: 'shortcut:new-tab' },
    { accelerator: 'CommandOrControl+W', channel: 'shortcut:close-tab' },
    { accelerator: 'CommandOrControl+Tab', channel: 'shortcut:next-tab' },
    { accelerator: 'CommandOrControl+Shift+Tab', channel: 'shortcut:prev-tab' },
    { accelerator: 'CommandOrControl+1', channel: 'shortcut:tab-1' },
    { accelerator: 'CommandOrControl+2', channel: 'shortcut:tab-2' },
    { accelerator: 'CommandOrControl+3', channel: 'shortcut:tab-3' },
    { accelerator: 'CommandOrControl+4', channel: 'shortcut:tab-4' },
    { accelerator: 'CommandOrControl+9', channel: 'shortcut:tab-last' },
  ];

  shortcuts.forEach(({ accelerator, channel }) => {
    globalShortcut.register(accelerator, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel);
      }
    });
  });
}

// Security Hardening
app.on('web-contents-created', (event, contents) => {
  // Secure all webviews
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    // Strip preload scripts from webviews
    delete webPreferences.preload;

    // Enforce security
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    // webPreferences.enableRemoteModule = false; // Deprecated/removed in newer Electron, default false
    webPreferences.allowRunningInsecureContent = false;

    // Optional: Allowlist URLs
    const allowedHosts = [
      'chatgpt.com',
      'claude.ai',
      'gemini.google.com',
      'perplexity.ai',
      'chat.deepseek.com',
      'github.com', // Useful for auth sometimes
      'google.com'  // Useful for auth
    ];

    // Simple check - in production you might want more robust URL parsing/validation
    try {
      const url = new URL(params.src);
      // We allow if the hostname ends with one of the allowed hosts
      // But for a general browser we might want to be more permissive or strictly controlled.
      // The strategy lists specific hosts.
      const isAllowed = allowedHosts.some(host => url.hostname.endsWith(host));

      if (!isAllowed) {
        console.warn(`Blocked webview to: ${params.src}`);
        // event.preventDefault(); // Uncomment to strictly enforce
      }
    } catch (e) {
      console.error('Invalid URL in webview:', params.src);
      event.preventDefault();
    }
  });

  // Block new window creation
  contents.setWindowOpenHandler(({ url }) => {
    // Open external URLs in system browser
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

app.whenReady().then(() => {
  // Remove Application Menu
  Menu.setApplicationMenu(null);
  createWindow();
  registerGlobalShortcuts();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
// Save state from renderer
ipcMain.handle('store:save', (event, state: Partial<AppState>) => {
  Object.entries(state).forEach(([key, value]) => {
    store.set(key as keyof AppState, value);
  });
  return true;
});

// Load state to renderer
ipcMain.handle('store:load', () => {
  return store.store; // Returns entire state object
});

// Window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());
