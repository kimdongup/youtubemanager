import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import chokidar, { FSWatcher } from 'chokidar';
import { dbService } from '../db/database.js';
import { ffmpegService } from './ffmpeg.js';

// Comprehensive Video Extensions (including broadcast, mobile, professional camera formats)
const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.mov', '.mkv', '.avi', '.webm', '.m4v', '.wmv', '.flv',
  '.ts', '.mts', '.m2ts', '.3gp', '.3g2', '.mpg', '.mpeg', '.m2v',
  '.vob', '.ogv', '.rmvb', '.rm', '.asf', '.divx', '.f4v', '.qt', '.mpe', '.mpv'
]);

// Comprehensive Image Extensions (including raw, avif, tiff, mobile formats)
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.heic', '.heif',
  '.avif', '.tiff', '.tif', '.svg', '.ico', '.raw', '.dng', '.cr2',
  '.cr3', '.nef', '.arw', '.jfif', '.pjpeg', '.pjp', '.psd'
]);

let watcher: FSWatcher | null = null;
let isScanning = false;

function generateId(filePath: string): string {
  return crypto.createHash('md5').update(filePath).digest('hex').substring(0, 16);
}

// Concurrency worker helper (executes tasks with a fixed concurrency limit)
async function runConcurrent<T>(items: T[], limit: number, iteratorFn: (item: T) => Promise<void>): Promise<void> {
  const executing: Promise<void>[] = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    executing.push(p);

    if (limit <= items.length) {
      const clean = () => {
        const idx = executing.indexOf(p);
        if (idx !== -1) executing.splice(idx, 1);
      };
      p.then(clean).catch(clean);

      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  await Promise.all(executing);
}

export const scannerService = {
  isScanningInProgress() {
    return isScanning;
  },

  async scanSingleFile(filePath: string, forceRefresh = false) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const isVideo = VIDEO_EXTENSIONS.has(ext);
      const isImage = IMAGE_EXTENSIONS.has(ext);

      if (!isVideo && !isImage) return;

      const stat = await fs.promises.stat(filePath);
      if (!stat.isFile()) return;

      const id = generateId(filePath);
      const file_name = path.basename(filePath);
      const file_type = isVideo ? 'video' : 'image';
      const file_size = stat.size;

      // ⚡ Fast Cache Skip: If item already exists with thumbnail and matching file size, skip expensive FFmpeg
      if (!forceRefresh) {
        const existing = dbService.getMediaItemById(id);
        if (existing && existing.thumbnail_path && fs.existsSync(existing.thumbnail_path) && existing.file_size === file_size) {
          return id;
        }
      }

      // Extract thumbnail and metadata
      let thumbnail_path: string | undefined;
      let duration: number | undefined;
      let width: number | undefined;
      let height: number | undefined;

      try {
        if (isVideo) {
          const meta = await ffmpegService.getMetadata(filePath);
          duration = meta.duration;
          width = meta.width;
          height = meta.height;
          thumbnail_path = await ffmpegService.extractVideoThumbnail(filePath, id, 1);
        } else {
          thumbnail_path = await ffmpegService.extractImageThumbnail(filePath, id);
        }
      } catch (err) {
        console.warn(`[Scanner] Thumbnail extraction warning for ${filePath}:`, (err as Error).message);
      }

      dbService.upsertMediaItem({
        id,
        file_path: filePath,
        file_name,
        file_type,
        file_size,
        duration,
        width,
        height,
        thumbnail_path,
      });

      return id;
    } catch (error) {
      console.error(`[Scanner] Failed to process file ${filePath}:`, error);
    }
  },

  async scanDirectory(dirPath: string, onProgress?: (scanned: number, total: number) => void): Promise<{ count: number; totalFilesFound: number; skippedNonMedia: number }> {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }

    isScanning = true;
    dbService.setSetting('last_scanned_dir', dirPath);

    const mediaFiles: string[] = [];
    let totalFilesSeen = 0;
    let skippedCount = 0;

    async function walk(currentDir: string) {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          // Skip hidden and node_modules
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await walk(fullPath);
          }
        } else if (entry.isFile()) {
          totalFilesSeen++;
          // Filter out macOS resource fork hidden files (e.g. ._IMG_0001.JPG, .DS_Store)
          if (entry.name.startsWith('.')) {
            skippedCount++;
            continue;
          }

          const ext = path.extname(entry.name).toLowerCase();
          if (VIDEO_EXTENSIONS.has(ext) || IMAGE_EXTENSIONS.has(ext)) {
            mediaFiles.push(fullPath);
          } else {
            skippedCount++;
          }
        }
      }
    }

    try {
      await walk(dirPath);

      console.log(`[Scanner] Total files in folder: ${totalFilesSeen}, Media files to index: ${mediaFiles.length}, Skipped: ${skippedCount}`);

      let processed = 0;
      const CONCURRENCY_LIMIT = 6; // 6 simultaneous FFmpeg workers for maximum CPU efficiency

      await runConcurrent(mediaFiles, CONCURRENCY_LIMIT, async (filePath) => {
        await scannerService.scanSingleFile(filePath);
        processed++;
        if (onProgress && (processed % 5 === 0 || processed === mediaFiles.length)) {
          onProgress(processed, mediaFiles.length);
        }
      });

      // Start automatic differential watcher for real-time delta indexing
      scannerService.startWatching(dirPath);

      return { count: processed, totalFilesFound: totalFilesSeen, skippedNonMedia: skippedCount };
    } finally {
      isScanning = false;
    }
  },

  startWatching(dirPath: string) {
    if (watcher) {
      watcher.close();
    }

    console.log(`[Differential Watcher] Watching folder for real-time changes: ${dirPath}`);
    watcher = chokidar.watch(dirPath, {
      ignored: /(^|[\/\\])\..|node_modules/,
      persistent: true,
      ignoreInitial: true,
      depth: 10,
    });

    watcher.on('add', async (filePath: string) => {
      console.log(`[Differential Watcher] File added: ${filePath}`);
      await scannerService.scanSingleFile(filePath);
    });

    watcher.on('change', async (filePath: string) => {
      console.log(`[Differential Watcher] File modified: ${filePath}`);
      await scannerService.scanSingleFile(filePath, true);
    });

    watcher.on('unlink', (filePath: string) => {
      console.log(`[Differential Watcher] File removed: ${filePath}`);
      dbService.deleteMediaItemByPath(filePath);
    });
  },

  stopWatching() {
    if (watcher) {
      watcher.close();
      watcher = null;
    }
  }
};
