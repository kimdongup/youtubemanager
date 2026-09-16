import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './config/index.js';
import { initDatabase } from './db/database.js';
import apiRoutes from './routes/api.js';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize SQLite schema
initDatabase();

// Mount API routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Robust frontend dist directory resolver
function resolveFrontendDist(): string | null {
  // 1. Explicit Environment Variable (passed from Electron main process)
  if (process.env.FRONTEND_DIST && fs.existsSync(process.env.FRONTEND_DIST)) {
    return process.env.FRONTEND_DIST;
  }

  // 2. Candidate paths
  const candidates = [
    process.env.RESOURCES_PATH ? path.join(process.env.RESOURCES_PATH, 'frontend', 'dist') : null,
    path.resolve(__dirname, '../../frontend/dist'),
    path.resolve(__dirname, '../frontend/dist'),
    path.resolve(__dirname, '../../../frontend/dist'),
    path.resolve(process.cwd(), 'frontend/dist'),
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(process.cwd(), '../../frontend/dist'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }
  return null;
}

const frontendDist = resolveFrontendDist();
if (frontendDist) {
  console.log(`📦 Serving static frontend from: ${frontendDist}`);
  app.use(express.static(frontendDist));

  // SPA Catch-all route (excluding API and health)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  console.warn('⚠️ frontend/dist directory not found. Running in API-only mode.');
}

app.listen(CONFIG.PORT, () => {
  console.log(`=======================================================`);
  console.log(` 🚀 YouTube Manager Core Backend Server Started!`);
  console.log(` 🌐 Listening on: http://localhost:${CONFIG.PORT}`);
  console.log(` 📦 SQLite WAL Database: ${CONFIG.DB_PATH}`);
  console.log(` 🖼️ Thumbnail Cache: ${CONFIG.THUMBNAIL_CACHE_DIR}`);
  console.log(` ✂️ Exports Directory: ${CONFIG.EXPORTS_DIR}`);
  console.log(`=======================================================`);
});
