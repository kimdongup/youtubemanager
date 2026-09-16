import { spawn, execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { CONFIG } from '../config/index.js';

const execFileAsync = promisify(execFile);

export interface MediaMetadata {
  duration?: number;
  width?: number;
  height?: number;
}

export const ffmpegService = {
  async getMetadata(filePath: string): Promise<MediaMetadata> {
    try {
      const { stdout } = await execFileAsync(CONFIG.FFPROBE_PATH, [
        '-v', 'error',
        '-show_entries', 'stream=width,height,duration:format=duration',
        '-of', 'json',
        filePath
      ]);

      const data = JSON.parse(stdout);
      let duration: number | undefined;
      let width: number | undefined;
      let height: number | undefined;

      if (data.format && data.format.duration) {
        duration = parseFloat(data.format.duration);
      }

      if (data.streams && data.streams.length > 0) {
        for (const stream of data.streams) {
          if (stream.width && stream.height) {
            width = stream.width;
            height = stream.height;
          }
          if (!duration && stream.duration) {
            duration = parseFloat(stream.duration);
          }
        }
      }

      return { duration, width, height };
    } catch (error) {
      // Fallback if ffprobe fails
      return {};
    }
  },

  async extractVideoThumbnail(videoPath: string, itemId: string, seekSec: number = 1): Promise<string> {
    const thumbFileName = `${itemId}.jpg`;
    const outputPath = path.join(CONFIG.THUMBNAIL_CACHE_DIR, thumbFileName);

    if (fs.existsSync(outputPath)) {
      return outputPath;
    }

    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-ss', seekSec.toString(),
        '-i', videoPath,
        '-vframes', '1',
        '-vf', 'scale=480:-1',
        '-q:v', '3',
        outputPath
      ];

      const proc = spawn(CONFIG.FFMPEG_PATH, args);
      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve(outputPath);
        } else {
          // If seeking failed, try from 00:00:00
          const fallbackProc = spawn(CONFIG.FFMPEG_PATH, [
            '-y',
            '-ss', '0',
            '-i', videoPath,
            '-vframes', '1',
            '-vf', 'scale=480:-1',
            '-q:v', '3',
            outputPath
          ]);
          fallbackProc.on('close', (fCode) => {
            if (fCode === 0 && fs.existsSync(outputPath)) {
              resolve(outputPath);
            } else {
              reject(new Error(`Failed to extract thumbnail from video ${videoPath}`));
            }
          });
        }
      });
      proc.on('error', reject);
    });
  },

  async extractImageThumbnail(imagePath: string, itemId: string): Promise<string> {
    const thumbFileName = `${itemId}.jpg`;
    const outputPath = path.join(CONFIG.THUMBNAIL_CACHE_DIR, thumbFileName);

    if (fs.existsSync(outputPath)) {
      return outputPath;
    }

    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-i', imagePath,
        '-vf', 'scale=480:-1',
        '-q:v', '3',
        outputPath
      ];

      const proc = spawn(CONFIG.FFMPEG_PATH, args);
      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve(outputPath);
        } else {
          reject(new Error(`Failed to generate thumbnail for image ${imagePath}`));
        }
      });
      proc.on('error', reject);
    });
  },

  /**
   * High-speed lossless trimming using FFmpeg Stream Copy
   */
  async trimVideo(inputPath: string, inPointSec: number, outPointSec: number, outputFileName?: string): Promise<string> {
    const ext = path.extname(inputPath) || '.mp4';
    const baseName = path.basename(inputPath, ext);
    const finalFileName = outputFileName || `${baseName}_trimmed_${Math.floor(inPointSec)}s_${Math.floor(outPointSec)}s${ext}`;
    const outputPath = path.join(CONFIG.EXPORTS_DIR, finalFileName);

    return new Promise((resolve, reject) => {
      const duration = outPointSec - inPointSec;
      const args = [
        '-y',
        '-ss', inPointSec.toString(),
        '-i', inputPath,
        '-t', duration.toString(),
        '-c', 'copy', // Stream Copy: Zero re-encoding, extremely fast & low RAM
        outputPath
      ];

      const proc = spawn(CONFIG.FFMPEG_PATH, args);
      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve(outputPath);
        } else {
          reject(new Error(`Failed to trim video ${inputPath}`));
        }
      });
      proc.on('error', reject);
    });
  }
};
