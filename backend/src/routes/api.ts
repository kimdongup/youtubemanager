import express from 'express';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { dbService } from '../db/database.js';
import { scannerService } from '../services/scanner.js';
import { ffmpegService } from '../services/ffmpeg.js';
import { aiVideoService } from '../services/aiVideo.js';
import { youtubeService } from '../services/youtube.js';
import { CONFIG } from '../config/index.js';

const router = express.Router();

// 1. Get media items with filters
router.get('/media', (req, res) => {
  try {
    const { status, type, search } = req.query;
    const items = dbService.getMediaItems(
      status as string | undefined,
      type as string | undefined,
      search as string | undefined
    );
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 2. Scan a directory
router.post('/scan', async (req, res) => {
  try {
    const { dirPath } = req.body;
    if (!dirPath) {
      return res.status(400).json({ success: false, error: 'dirPath is required' });
    }

    if (!fs.existsSync(dirPath)) {
      return res.status(400).json({ success: false, error: 'Directory does not exist' });
    }

    // Run scan asynchronously
    scannerService.scanDirectory(dirPath).catch(err => {
      console.error('[API Scan Error]', err);
    });

    res.json({
      success: true,
      message: 'Scanning started in background with real-time differential indexing enabled.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 3. Open file in macOS native apps (QuickTime Player or Preview)
router.post('/media/:id/open', (req, res) => {
  try {
    const { id } = req.params;
    const item = dbService.getMediaItemById(id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Media item not found' });
    }

    if (!fs.existsSync(item.file_path)) {
      return res.status(404).json({ success: false, error: 'File does not exist on disk' });
    }

    const appName = item.file_type === 'video' ? 'QuickTime Player' : 'Preview';
    
    // Try opening with specified macOS app, fallback to default handler
    execFile('open', ['-a', appName, item.file_path], (err) => {
      if (err) {
        // Fallback to generic open
        execFile('open', [item.file_path], (fallbackErr) => {
          if (fallbackErr) {
            console.error('[Open in macOS App Error]', fallbackErr);
            return res.status(500).json({ success: false, error: fallbackErr.message });
          }
          res.json({ success: true, message: `Opened ${item.file_name} with default app` });
        });
      } else {
        res.json({ success: true, message: `Opened ${item.file_name} with ${appName}` });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 4. Update Curation status (approved / rejected / pending)
router.post('/media/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    dbService.updateMediaStatus(id, status);
    const updated = dbService.getMediaItemById(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 4. Video Trimming (Lossless FFmpeg Stream Copy)
router.post('/media/:id/trim', async (req, res) => {
  try {
    const { id } = req.params;
    const { inPoint, outPoint } = req.body;

    const item = dbService.getMediaItemById(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }

    if (item.file_type !== 'video') {
      return res.status(400).json({ success: false, error: 'Item is not a video' });
    }

    dbService.updateMediaTrimming(id, inPoint, outPoint);
    const outputPath = await ffmpegService.trimVideo(item.file_path, inPoint, outPoint);

    // Scan the newly created trimmed file into database
    await scannerService.scanSingleFile(outputPath);

    res.json({
      success: true,
      message: 'Video trimmed successfully without re-encoding',
      trimmedFilePath: outputPath,
      data: dbService.getMediaItemById(id)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 5. AI Video Mapping & Prompts
router.get('/ai/tools', (req, res) => {
  res.json({ success: true, data: aiVideoService.getAvailableTools() });
});

router.post('/ai/prompt-suggest', (req, res) => {
  const { fileName, toolId } = req.body;
  const prompt = aiVideoService.generatePromptSuggestion(fileName, toolId);
  res.json({ success: true, data: { prompt } });
});

router.post('/media/:id/ai', (req, res) => {
  try {
    const { id } = req.params;
    const { aiTool, aiPrompt, mappedVideoPath } = req.body;

    dbService.updateMediaAIVideo(id, aiTool, aiPrompt, mappedVideoPath);
    const updated = dbService.getMediaItemById(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 6. YouTube Upload Queue & Execution
router.post('/upload/enqueue', (req, res) => {
  try {
    const { mediaId, title, description, tags, categoryId, privacyStatus, scheduledAt } = req.body;
    const item = dbService.getMediaItemById(mediaId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }

    const queueId = `up_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    dbService.enqueueUpload({
      id: queueId,
      media_id: mediaId,
      title: title || item.file_name,
      description: description || '',
      tags: tags || '',
      category_id: categoryId || '22',
      privacy_status: privacyStatus || 'unlisted',
      scheduled_at: scheduledAt || undefined,
    });

    res.json({ success: true, message: 'Added to upload queue', queueId });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/upload/queue', (req, res) => {
  try {
    const queue = dbService.getUploadQueue();
    res.json({ success: true, data: queue });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/upload/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    youtubeService.processUploadItem(id).catch(err => {
      console.error(`[Upload Execution Error for ${id}]`, err);
    });
    res.json({ success: true, message: 'Upload started in 8MB streaming chunks' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 7. Google OAuth2 & YouTube Channel Integration
router.get('/youtube/config', (req, res) => {
  try {
    const config = youtubeService.getGoogleConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/youtube/config', (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;
    youtubeService.saveGoogleConfig(clientId, clientSecret);
    res.json({ success: true, message: 'Google OAuth configuration saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/youtube/auth-url', (req, res) => {
  try {
    const authUrl = youtubeService.getAuthUrl();
    res.json({ success: true, data: { authUrl } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/youtube/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('Authorization code is missing');
    }

    await youtubeService.handleOAuthCallback(code as string);
    // Redirect back to frontend on port 4000
    res.redirect('http://localhost:4000?google_auth=success');
  } catch (error) {
    res.status(500).send(`Authentication Failed: ${(error as Error).message}`);
  }
});

router.get('/youtube/channel', async (req, res) => {
  try {
    const channel = await youtubeService.getChannelProfile();
    res.json({ success: true, data: channel });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/youtube/logout', (req, res) => {
  try {
    youtubeService.logoutGoogle();
    res.json({ success: true, message: 'Google account disconnected' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 8. System Stats & Channel Analytics (vling.net style)
router.get('/stats', async (req, res) => {
  try {
    const stats = dbService.getStats();
    const realChannel = await youtubeService.getChannelProfile();
    const lastScannedDir = dbService.getSetting('last_scanned_dir');
    const googleConfig = youtubeService.getGoogleConfig();

    res.json({
      success: true,
      data: {
        mediaStats: stats,
        channelStats: realChannel || {
          channelName: 'My Creator Studio Channel (데모)',
          subscriberCount: 142800,
          totalViews: 28450300,
          videoCount: 384,
          recentPerformance: {
            averageViews: 45200,
            engagementRate: '6.8%',
            topCategory: 'Film & Animation / Tech',
            uploadVelocity: '3.2 videos/week'
          }
        },
        googleConfig,
        lastScannedDir
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 8. Serve Thumbnail Cache directly with high-performance immutable browser cache
router.get('/thumbnail/:id', (req, res) => {
  const { id } = req.params;
  const item = dbService.getMediaItemById(id);

  const sendOpts = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    immutable: true,
    lastModified: true
  };

  if (item && item.thumbnail_path && fs.existsSync(item.thumbnail_path)) {
    return res.sendFile(item.thumbnail_path, sendOpts);
  }

  const defaultThumb = path.join(CONFIG.THUMBNAIL_CACHE_DIR, `${id}.jpg`);
  if (fs.existsSync(defaultThumb)) {
    return res.sendFile(defaultThumb, sendOpts);
  }

  res.status(404).send('Thumbnail not found');
});

// 9. Stream media file (preview)
router.get('/media/stream/:id', (req, res) => {
  const { id } = req.params;
  const item = dbService.getMediaItemById(id);

  if (!item || !fs.existsSync(item.file_path)) {
    return res.status(404).send('File not found');
  }

  res.sendFile(item.file_path);
});

export default router;
