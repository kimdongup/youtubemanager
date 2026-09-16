const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let backendProcess = null;

const PORT = 5001;
const APP_URL = `http://localhost:${PORT}`;

function getBackendServerPath() {
  const candidates = [
    path.join(process.resourcesPath || '', 'backend', 'dist', 'server.bundle.cjs'),
    path.join(process.resourcesPath || '', 'backend', 'dist', 'server.js'),
    path.join(__dirname, '..', 'backend', 'dist', 'server.bundle.cjs'),
    path.join(__dirname, '..', 'backend', 'dist', 'server.js'),
    path.join(app.getAppPath(), 'backend', 'dist', 'server.bundle.cjs'),
    path.join(process.cwd(), 'backend', 'dist', 'server.bundle.cjs'),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return path.join(__dirname, '..', 'backend', 'dist', 'server.bundle.cjs');
}

function getFrontendDistPath() {
  const candidates = [
    path.join(process.resourcesPath || '', 'frontend', 'dist'),
    path.join(__dirname, '..', 'frontend', 'dist'),
    path.join(app.getAppPath(), 'frontend', 'dist'),
    path.join(process.cwd(), 'frontend', 'dist'),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c) && fs.existsSync(path.join(c, 'index.html'))) {
      return c;
    }
  }
  return path.join(__dirname, '..', 'frontend', 'dist');
}

function startBackend() {
  const backendPath = getBackendServerPath();
  const frontendDist = getFrontendDistPath();

  console.log('[Desktop Main] Launching embedded backend server:', backendPath);
  console.log('[Desktop Main] Targeting frontend dist:', frontendDist);

  const cwd = fs.existsSync(backendPath) ? path.dirname(backendPath) : process.cwd();
  const nodeBinary = process.execPath;

  backendProcess = spawn(nodeBinary, [backendPath], {
    cwd,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: `${PORT}`,
      NODE_ENV: 'production',
      RESOURCES_PATH: process.resourcesPath || '',
      FRONTEND_DIST: frontendDist
    },
    stdio: 'inherit'
  });

  backendProcess.on('error', (err) => {
    console.error('[Desktop Main] Backend spawn error:', err);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`[Desktop Main] Backend process exited with code ${code}, signal ${signal}`);
  });
}

function waitForServer(onReady, maxAttempts = 60) {
  let attempts = 0;

  const check = () => {
    attempts++;
    const req = http.get(`${APP_URL}/health`, (res) => {
      if (res.statusCode === 200) {
        console.log('[Desktop Main] Backend server is healthy!');
        onReady();
      } else if (attempts < maxAttempts) {
        setTimeout(check, 200);
      }
    });

    req.on('error', () => {
      if (attempts < maxAttempts) {
        setTimeout(check, 200);
      } else {
        console.warn('[Desktop Main] Max attempts reached, attempting to load URL anyway...');
        onReady();
      }
    });
  };

  check();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: 'YouTube Manager Pro',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#020617',
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Splash loading screen while backend initializes
  const loadingHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #020617;
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            user-select: none;
            -webkit-app-region: drag;
          }
          .spinner {
            width: 44px;
            height: 44px;
            border: 3.5px solid rgba(239, 68, 68, 0.2);
            border-top-color: #ef4444;
            border-radius: 50%;
            animation: spin 0.75s linear infinite;
            margin-bottom: 18px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          h2 { margin: 0; font-size: 17px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
          p { margin: 8px 0 0 0; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
        <h2>YouTube Manager Pro</h2>
        <p>로컬 제로메모리 엔진 구동 중...</p>
      </body>
    </html>
  `;
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHtml)}`);

  // Wait for the embedded backend server to be healthy, then load the real UI
  waitForServer(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(APP_URL).catch((err) => {
        console.error('[Desktop Main] Failed to load main URL, fallback to local file:', err);
        const frontendDist = getFrontendDistPath();
        const localIndex = path.join(frontendDist, 'index.html');
        if (fs.existsSync(localIndex)) {
          mainWindow.loadFile(localIndex);
        }
      });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch {}
  }
});
