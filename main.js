const electron = require('electron');
const path = require('path');
const { fork } = require('child_process');

if (!electron || !electron.app) {
  // Render.com is running `node main.js`, so we skip Electron and just run the backend.
  console.log("🚀 Standard Node environment detected (Electron app is undefined). Running Backend exclusively...");
  require('./backend/index.js');
} else {
  const { app, BrowserWindow } = electron;

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

  // Since React uses an Express backend at localhost:2000, 
  // we first start the server, then load the URL.
  
  // We'll give the Express server a moment to start up
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:2000');
  }, 1000); // 1 second buffer

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startExpress() {
  const serverPath = path.join(__dirname, 'backend', 'index.js');
  // Pass env vars safely
  const env = { ...process.env, PORT: 2000 }; 
  
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
} // End of conditional block
