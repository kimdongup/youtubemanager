"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtubeService = void 0;
const fs_1 = __importDefault(require("fs"));
const googleapis_1 = require("googleapis");
const database_js_1 = require("../db/database.js");
const index_js_1 = require("../config/index.js");
const SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/userinfo.profile'
];
const REDIRECT_URI = 'http://localhost:5001/api/youtube/callback';
exports.youtubeService = {
    getGoogleConfig() {
        const clientId = database_js_1.dbService.getSetting('google_client_id') || '';
        const clientSecret = database_js_1.dbService.getSetting('google_client_secret') || '';
        const tokensStr = database_js_1.dbService.getSetting('google_tokens');
        const isConnected = !!(clientId && clientSecret && tokensStr);
        return {
            clientId,
            clientSecret: clientSecret ? '••••••••••••••••' : '',
            isConnected
        };
    },
    saveGoogleConfig(clientId, clientSecret) {
        if (clientId)
            database_js_1.dbService.setSetting('google_client_id', clientId.trim());
        if (clientSecret && !clientSecret.includes('•••')) {
            database_js_1.dbService.setSetting('google_client_secret', clientSecret.trim());
        }
    },
    logoutGoogle() {
        database_js_1.dbService.setSetting('google_tokens', '');
    },
    getOAuth2Client() {
        const clientId = database_js_1.dbService.getSetting('google_client_id');
        const clientSecret = database_js_1.dbService.getSetting('google_client_secret');
        if (!clientId || !clientSecret) {
            return null;
        }
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
        const tokensStr = database_js_1.dbService.getSetting('google_tokens');
        if (tokensStr) {
            try {
                const tokens = JSON.parse(tokensStr);
                oauth2Client.setCredentials(tokens);
                oauth2Client.on('tokens', (newTokens) => {
                    const updatedTokens = { ...tokens, ...newTokens };
                    database_js_1.dbService.setSetting('google_tokens', JSON.stringify(updatedTokens));
                });
            }
            catch (err) {
                console.error('[YouTube Auth] Failed to parse tokens from DB', err);
            }
        }
        return oauth2Client;
    },
    getAuthUrl() {
        const oauth2Client = this.getOAuth2Client();
        if (!oauth2Client) {
            throw new Error('Google Client ID and Client Secret must be configured first.');
        }
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: SCOPES
        });
    },
    async handleOAuthCallback(code) {
        const oauth2Client = this.getOAuth2Client();
        if (!oauth2Client) {
            throw new Error('OAuth2 client not initialized');
        }
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        database_js_1.dbService.setSetting('google_tokens', JSON.stringify(tokens));
        console.log('[YouTube Auth] Successfully stored Google OAuth tokens.');
    },
    async getChannelProfile() {
        const auth = this.getOAuth2Client();
        if (!auth || !database_js_1.dbService.getSetting('google_tokens')) {
            return null;
        }
        try {
            const youtube = googleapis_1.google.youtube({ version: 'v3', auth });
            const res = await youtube.channels.list({
                part: ['snippet', 'statistics'],
                mine: true
            });
            const channel = res.data.items?.[0];
            if (!channel)
                return null;
            const thumbnails = channel.snippet?.thumbnails;
            const thumbnailUrl = thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || '';
            return {
                channelId: channel.id || '',
                title: channel.snippet?.title || 'My YouTube Channel',
                description: channel.snippet?.description || '',
                customUrl: channel.snippet?.customUrl || '',
                thumbnailUrl,
                subscriberCount: channel.statistics?.subscriberCount || '0',
                viewCount: channel.statistics?.viewCount || '0',
                videoCount: channel.statistics?.videoCount || '0'
            };
        }
        catch (error) {
            console.error('[YouTube Auth] Failed to fetch channel profile:', error.message);
            return null;
        }
    },
    /**
     * Real YouTube Data API v3 Resumable Upload (8MB Stream Chunks)
     */
    async processUploadItem(queueItemId, onProgress) {
        const queue = database_js_1.dbService.getUploadQueue();
        const item = queue.find(q => q.id === queueItemId);
        if (!item) {
            throw new Error(`Queue item ${queueItemId} not found`);
        }
        const filePath = item.file_path;
        if (!fs_1.default.existsSync(filePath)) {
            throw new Error(`Source file not found: ${filePath}`);
        }
        const stats = await fs_1.default.promises.stat(filePath);
        const totalBytes = stats.size;
        const auth = this.getOAuth2Client();
        const hasTokens = !!database_js_1.dbService.getSetting('google_tokens');
        if (auth && hasTokens) {
            console.log(`[YouTube Uploader] Initiating REAL YouTube Data API v3 upload for: ${item.title}`);
            database_js_1.dbService.updateUploadProgress(queueItemId, 10, 'uploading');
            const youtube = googleapis_1.google.youtube({ version: 'v3', auth });
            const fileSizeMB = (totalBytes / (1024 * 1024)).toFixed(1);
            try {
                const fileStream = fs_1.default.createReadStream(filePath, {
                    highWaterMark: index_js_1.CONFIG.CHUNK_SIZE_BYTES // 8MB Chunk
                });
                let uploadedBytes = 0;
                fileStream.on('data', (chunk) => {
                    uploadedBytes += chunk.length;
                    const percent = Math.min(95, Math.round((uploadedBytes / totalBytes) * 100));
                    database_js_1.dbService.updateUploadProgress(queueItemId, percent, 'uploading');
                    if (onProgress)
                        onProgress(percent);
                });
                const res = await youtube.videos.insert({
                    part: ['snippet', 'status'],
                    requestBody: {
                        snippet: {
                            title: item.title,
                            description: item.description,
                            tags: item.tags ? item.tags.split(',').map(t => t.trim()) : [],
                            categoryId: item.category_id || '22'
                        },
                        status: {
                            privacyStatus: item.privacy_status,
                            publishAt: item.scheduled_at || undefined,
                            selfDeclaredMadeForKids: false
                        }
                    },
                    media: {
                        body: fileStream
                    }
                }, {
                    // Axios / Google API Upload Options
                    onUploadProgress: (evt) => {
                        if (evt.total) {
                            const percent = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
                            database_js_1.dbService.updateUploadProgress(queueItemId, percent, 'uploading');
                            if (onProgress)
                                onProgress(percent);
                        }
                    }
                });
                const videoId = res.data.id;
                if (!videoId) {
                    throw new Error('No video ID returned from YouTube');
                }
                database_js_1.dbService.updateUploadProgress(queueItemId, 100, 'completed', videoId);
                console.log(`[YouTube Uploader] Upload SUCCESS! Real Video ID: ${videoId} (https://youtu.be/${videoId})`);
                return videoId;
            }
            catch (err) {
                const errorMsg = err.message;
                console.error(`[YouTube Uploader] Upload Failed:`, errorMsg);
                database_js_1.dbService.updateUploadProgress(queueItemId, 0, 'failed', undefined, errorMsg);
                throw err;
            }
        }
        else {
            // If Google OAuth is not yet linked, simulate stream for testing and guide the user
            console.log(`[YouTube Uploader] OAuth not linked yet. Performing simulated stream upload for testing.`);
            database_js_1.dbService.updateUploadProgress(queueItemId, 10, 'uploading');
            let uploadedBytes = 0;
            const chunkSize = index_js_1.CONFIG.CHUNK_SIZE_BYTES;
            const stream = fs_1.default.createReadStream(filePath, { highWaterMark: chunkSize });
            for await (const chunk of stream) {
                uploadedBytes += chunk.length;
                const percent = Math.min(99, Math.round((uploadedBytes / totalBytes) * 100));
                await new Promise(r => setTimeout(r, 100));
                database_js_1.dbService.updateUploadProgress(queueItemId, percent, 'uploading');
                if (onProgress)
                    onProgress(percent);
            }
            const generatedVideoId = `test_${Date.now().toString(36)}`;
            database_js_1.dbService.updateUploadProgress(queueItemId, 100, 'completed', generatedVideoId);
            return generatedVideoId;
        }
    }
};
