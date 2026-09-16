"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ffmpegService = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const index_js_1 = require("../config/index.js");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
exports.ffmpegService = {
    async getMetadata(filePath) {
        try {
            const { stdout } = await execFileAsync(index_js_1.CONFIG.FFPROBE_PATH, [
                '-v', 'error',
                '-show_entries', 'stream=width,height,duration:format=duration',
                '-of', 'json',
                filePath
            ]);
            const data = JSON.parse(stdout);
            let duration;
            let width;
            let height;
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
        }
        catch (error) {
            // Fallback if ffprobe fails
            return {};
        }
    },
    async extractVideoThumbnail(videoPath, itemId, seekSec = 1) {
        const thumbFileName = `${itemId}.jpg`;
        const outputPath = path_1.default.join(index_js_1.CONFIG.THUMBNAIL_CACHE_DIR, thumbFileName);
        if (fs_1.default.existsSync(outputPath)) {
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
            const proc = (0, child_process_1.spawn)(index_js_1.CONFIG.FFMPEG_PATH, args);
            proc.on('close', (code) => {
                if (code === 0 && fs_1.default.existsSync(outputPath)) {
                    resolve(outputPath);
                }
                else {
                    // If seeking failed, try from 00:00:00
                    const fallbackProc = (0, child_process_1.spawn)(index_js_1.CONFIG.FFMPEG_PATH, [
                        '-y',
                        '-ss', '0',
                        '-i', videoPath,
                        '-vframes', '1',
                        '-vf', 'scale=480:-1',
                        '-q:v', '3',
                        outputPath
                    ]);
                    fallbackProc.on('close', (fCode) => {
                        if (fCode === 0 && fs_1.default.existsSync(outputPath)) {
                            resolve(outputPath);
                        }
                        else {
                            reject(new Error(`Failed to extract thumbnail from video ${videoPath}`));
                        }
                    });
                }
            });
            proc.on('error', reject);
        });
    },
    async extractImageThumbnail(imagePath, itemId) {
        const thumbFileName = `${itemId}.jpg`;
        const outputPath = path_1.default.join(index_js_1.CONFIG.THUMBNAIL_CACHE_DIR, thumbFileName);
        if (fs_1.default.existsSync(outputPath)) {
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
            const proc = (0, child_process_1.spawn)(index_js_1.CONFIG.FFMPEG_PATH, args);
            proc.on('close', (code) => {
                if (code === 0 && fs_1.default.existsSync(outputPath)) {
                    resolve(outputPath);
                }
                else {
                    reject(new Error(`Failed to generate thumbnail for image ${imagePath}`));
                }
            });
            proc.on('error', reject);
        });
    },
    /**
     * High-speed lossless trimming using FFmpeg Stream Copy
     */
    async trimVideo(inputPath, inPointSec, outPointSec, outputFileName) {
        const ext = path_1.default.extname(inputPath) || '.mp4';
        const baseName = path_1.default.basename(inputPath, ext);
        const finalFileName = outputFileName || `${baseName}_trimmed_${Math.floor(inPointSec)}s_${Math.floor(outPointSec)}s${ext}`;
        const outputPath = path_1.default.join(index_js_1.CONFIG.EXPORTS_DIR, finalFileName);
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
            const proc = (0, child_process_1.spawn)(index_js_1.CONFIG.FFMPEG_PATH, args);
            proc.on('close', (code) => {
                if (code === 0 && fs_1.default.existsSync(outputPath)) {
                    resolve(outputPath);
                }
                else {
                    reject(new Error(`Failed to trim video ${inputPath}`));
                }
            });
            proc.on('error', reject);
        });
    }
};
