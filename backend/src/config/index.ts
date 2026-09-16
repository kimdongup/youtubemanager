import path from 'path';
import fs from 'fs';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const APP_DATA_DIR = path.join(os.homedir(), '.youtubemanager');
if (!fs.existsSync(APP_DATA_DIR)) {
  fs.mkdirSync(APP_DATA_DIR, { recursive: true });
}

const THUMBNAIL_CACHE_DIR = path.join(APP_DATA_DIR, 'thumbnails');
if (!fs.existsSync(THUMBNAIL_CACHE_DIR)) {
  fs.mkdirSync(THUMBNAIL_CACHE_DIR, { recursive: true });
}

const EXPORTS_DIR = path.join(APP_DATA_DIR, 'exports');
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5001,
  APP_DATA_DIR,
  DB_PATH: path.join(APP_DATA_DIR, 'youtubemanager.db'),
  THUMBNAIL_CACHE_DIR,
  EXPORTS_DIR,
  FFMPEG_PATH: process.env.FFMPEG_PATH || '/usr/local/bin/ffmpeg',
  FFPROBE_PATH: process.env.FFPROBE_PATH || '/usr/local/bin/ffprobe',
  CHUNK_SIZE_BYTES: 8 * 1024 * 1024, // 8MB Chunk for YouTube Resumable Upload
};
