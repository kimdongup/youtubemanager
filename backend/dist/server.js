"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const index_js_1 = require("./config/index.js");
const database_js_1 = require("./db/database.js");
const api_js_1 = __importDefault(require("./routes/api.js"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize SQLite schema
(0, database_js_1.initDatabase)();
// Mount API routes
app.use('/api', api_js_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
// Robust frontend dist directory resolver
function resolveFrontendDist() {
    // 1. Explicit Environment Variable (passed from Electron main process)
    if (process.env.FRONTEND_DIST && fs_1.default.existsSync(process.env.FRONTEND_DIST)) {
        return process.env.FRONTEND_DIST;
    }
    // 2. Candidate paths
    const candidates = [
        process.env.RESOURCES_PATH ? path_1.default.join(process.env.RESOURCES_PATH, 'frontend', 'dist') : null,
        path_1.default.resolve(__dirname, '../../frontend/dist'),
        path_1.default.resolve(__dirname, '../frontend/dist'),
        path_1.default.resolve(__dirname, '../../../frontend/dist'),
        path_1.default.resolve(process.cwd(), 'frontend/dist'),
        path_1.default.resolve(process.cwd(), '../frontend/dist'),
        path_1.default.resolve(process.cwd(), '../../frontend/dist'),
    ].filter(Boolean);
    for (const candidate of candidates) {
        if (fs_1.default.existsSync(candidate) && fs_1.default.existsSync(path_1.default.join(candidate, 'index.html'))) {
            return candidate;
        }
    }
    return null;
}
const frontendDist = resolveFrontendDist();
if (frontendDist) {
    console.log(`📦 Serving static frontend from: ${frontendDist}`);
    app.use(express_1.default.static(frontendDist));
    // SPA Catch-all route (excluding API and health)
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path === '/health') {
            return next();
        }
        res.sendFile(path_1.default.join(frontendDist, 'index.html'));
    });
}
else {
    console.warn('⚠️ frontend/dist directory not found. Running in API-only mode.');
}
app.listen(index_js_1.CONFIG.PORT, () => {
    console.log(`=======================================================`);
    console.log(` 🚀 YouTube Manager Core Backend Server Started!`);
    console.log(` 🌐 Listening on: http://localhost:${index_js_1.CONFIG.PORT}`);
    console.log(` 📦 SQLite WAL Database: ${index_js_1.CONFIG.DB_PATH}`);
    console.log(` 🖼️ Thumbnail Cache: ${index_js_1.CONFIG.THUMBNAIL_CACHE_DIR}`);
    console.log(` ✂️ Exports Directory: ${index_js_1.CONFIG.EXPORTS_DIR}`);
    console.log(`=======================================================`);
});
