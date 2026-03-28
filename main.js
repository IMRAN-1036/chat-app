// Main entry point - supports both Electron desktop and standard Node.js (Railway/Render)
const path = require('path');

let electron;
try {
  electron = require('electron');
} catch (e) {
  electron = null;
}

if (!electron || !electron.app) {
  // Standard Node environment (Railway, Render, etc.) — just run the backend
  console.log("🚀 Standard Node environment detected. Running backend server...");
  require('./backend/index.js');
} else {
  const { app, BrowserWindow } = electron;
  const { fork } = require('child_process');

  let mainWindow;
  let serverProcess;

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    // Give the Express server a moment to start up
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3001');
    }, 1000);

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  function startExpress() {
    const serverPath = path.join(__dirname, 'backend', 'index.js');
    const env = { ...process.env, PORT: 3001 };

    serverProcess = fork(serverPath, [], {
      cwd: path.join(__dirname, 'backend'),
      env: env,
      stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[Backend]: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error]: ${data}`);
    });
  }

  app.whenReady().then(() => {
    startExpress();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('quit', () => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });
}
