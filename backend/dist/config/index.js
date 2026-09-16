"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const APP_DATA_DIR = path_1.default.join(os_1.default.homedir(), '.youtubemanager');
if (!fs_1.default.existsSync(APP_DATA_DIR)) {
    fs_1.default.mkdirSync(APP_DATA_DIR, { recursive: true });
}
const THUMBNAIL_CACHE_DIR = path_1.default.join(APP_DATA_DIR, 'thumbnails');
if (!fs_1.default.existsSync(THUMBNAIL_CACHE_DIR)) {
    fs_1.default.mkdirSync(THUMBNAIL_CACHE_DIR, { recursive: true });
}
const EXPORTS_DIR = path_1.default.join(APP_DATA_DIR, 'exports');
if (!fs_1.default.existsSync(EXPORTS_DIR)) {
    fs_1.default.mkdirSync(EXPORTS_DIR, { recursive: true });
}
exports.CONFIG = {
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5001,
    APP_DATA_DIR,
    DB_PATH: path_1.default.join(APP_DATA_DIR, 'youtubemanager.db'),
    THUMBNAIL_CACHE_DIR,
    EXPORTS_DIR,
    FFMPEG_PATH: process.env.FFMPEG_PATH || '/usr/local/bin/ffmpeg',
    FFPROBE_PATH: process.env.FFPROBE_PATH || '/usr/local/bin/ffprobe',
    CHUNK_SIZE_BYTES: 8 * 1024 * 1024, // 8MB Chunk for YouTube Resumable Upload
};
