import Database from 'better-sqlite3';
import { CONFIG } from '../config/index.js';
import { MediaItem, UploadQueueItem, MediaStatus, MediaType } from '../types/index.js';

export { MediaItem, UploadQueueItem, MediaStatus, MediaType };

// Open SQLite database with Write-Ahead Logging (WAL) for high concurrency
export const db = new Database(CONFIG.DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      file_path TEXT UNIQUE NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      duration REAL,
      width INTEGER,
      height INTEGER,
      status TEXT DEFAULT 'pending',
      thumbnail_path TEXT,
      in_point REAL,
      out_point REAL,
      ai_tool TEXT,
      ai_prompt TEXT,
      ai_mapped_video_path TEXT,
      youtube_video_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_media_status ON media_items(status);
    CREATE INDEX IF NOT EXISTS idx_media_file_type ON media_items(file_type);
    CREATE INDEX IF NOT EXISTS idx_media_created ON media_items(created_at);

    CREATE TABLE IF NOT EXISTS upload_queue (
      id TEXT PRIMARY KEY,
      media_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      category_id TEXT DEFAULT '22',
      privacy_status TEXT DEFAULT 'unlisted',
      scheduled_at TEXT,
      upload_status TEXT DEFAULT 'queued',
      upload_progress REAL DEFAULT 0.0,
      youtube_video_id TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_upload_queue_lookup ON upload_queue(media_id, upload_status, youtube_video_id);
    CREATE INDEX IF NOT EXISTS idx_upload_queue_status ON upload_queue(upload_status);

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  try {
    db.exec(`ALTER TABLE media_items ADD COLUMN youtube_video_id TEXT;`);
  } catch {
    // Column already exists
  }

  // Structural Migration: Sync any completed youtube_video_id from upload_queue to media_items
  try {
    db.exec(`
      UPDATE media_items 
      SET youtube_video_id = (
        SELECT q.youtube_video_id 
        FROM upload_queue q 
        WHERE q.media_id = media_items.id AND q.upload_status = 'completed' AND q.youtube_video_id IS NOT NULL 
        LIMIT 1
      )
      WHERE (youtube_video_id IS NULL OR youtube_video_id = '')
        AND id IN (
          SELECT media_id FROM upload_queue WHERE upload_status = 'completed' AND youtube_video_id IS NOT NULL
        );
    `);
  } catch (err) {
    console.error('Migration error syncing youtube_video_id:', err);
  }
}

export const dbService = {
  // Media items
  getMediaItems(filterStatus?: string, filterType?: string, search?: string): MediaItem[] {
    return this.getAllMediaItems(filterStatus, filterType, search);
  },

  getAllMediaItems(filterStatus?: string, filterType?: string, search?: string): MediaItem[] {
    let query = `
      SELECT m.*,
        COALESCE(m.youtube_video_id, (
          SELECT q.youtube_video_id 
          FROM upload_queue q 
          WHERE q.media_id = m.id AND q.upload_status = 'completed' AND q.youtube_video_id IS NOT NULL 
          LIMIT 1
        )) AS youtube_video_id,
        (
          SELECT q.upload_status 
          FROM upload_queue q 
          WHERE q.media_id = m.id 
          ORDER BY q.created_at DESC 
          LIMIT 1
        ) AS upload_status
      FROM media_items m 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filterStatus && filterStatus !== 'all') {
      query += ` AND m.status = ?`;
      params.push(filterStatus);
    }

    if (filterType && filterType !== 'all') {
      query += ` AND m.file_type = ?`;
      params.push(filterType);
    }

    if (search && search.trim() !== '') {
      query += ` AND m.file_name LIKE ?`;
      params.push(`%${search.trim()}%`);
    }

    query += ` ORDER BY m.created_at DESC`;
    return db.prepare(query).all(...params) as MediaItem[];
  },

  getMediaItemById(id: string): MediaItem | undefined {
    return db.prepare(`
      SELECT m.*,
        COALESCE(m.youtube_video_id, (
          SELECT q.youtube_video_id 
          FROM upload_queue q 
          WHERE q.media_id = m.id AND q.upload_status = 'completed' AND q.youtube_video_id IS NOT NULL 
          LIMIT 1
        )) AS youtube_video_id,
        (
          SELECT q.upload_status 
          FROM upload_queue q 
          WHERE q.media_id = m.id 
          ORDER BY q.created_at DESC 
          LIMIT 1
        ) AS upload_status
      FROM media_items m 
      WHERE m.id = ?
    `).get(id) as MediaItem | undefined;
  },

  getMediaItemByPath(filePath: string): MediaItem | undefined {
    return db.prepare(`SELECT * FROM media_items WHERE file_path = ?`).get(filePath) as MediaItem | undefined;
  },

  upsertMediaItem(item: Partial<MediaItem> & { id: string; file_path: string; file_name: string; file_type: 'video' | 'image'; file_size: number }) {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO media_items (
        id, file_path, file_name, file_type, file_size, duration, width, height,
        status, thumbnail_path, in_point, out_point, ai_tool, ai_prompt, ai_mapped_video_path,
        youtube_video_id, created_at, updated_at
      ) VALUES (
        @id, @file_path, @file_name, @file_type, @file_size, @duration, @width, @height,
        COALESCE(@status, 'pending'), @thumbnail_path, @in_point, @out_point, @ai_tool, @ai_prompt, @ai_mapped_video_path,
        @youtube_video_id, @created_at, @updated_at
      )
      ON CONFLICT(file_path) DO UPDATE SET
        file_size = excluded.file_size,
        duration = COALESCE(excluded.duration, media_items.duration),
        width = COALESCE(excluded.width, media_items.width),
        height = COALESCE(excluded.height, media_items.height),
        thumbnail_path = COALESCE(excluded.thumbnail_path, media_items.thumbnail_path),
        youtube_video_id = COALESCE(excluded.youtube_video_id, media_items.youtube_video_id),
        updated_at = excluded.updated_at
    `);

    return stmt.run({
      id: item.id,
      file_path: item.file_path,
      file_name: item.file_name,
      file_type: item.file_type,
      file_size: item.file_size,
      duration: item.duration || null,
      width: item.width || null,
      height: item.height || null,
      status: item.status || 'pending',
      thumbnail_path: item.thumbnail_path || null,
      in_point: item.in_point || null,
      out_point: item.out_point || null,
      ai_tool: item.ai_tool || null,
      ai_prompt: item.ai_prompt || null,
      ai_mapped_video_path: item.ai_mapped_video_path || null,
      youtube_video_id: item.youtube_video_id || null,
      created_at: item.created_at || now,
      updated_at: now
    });
  },

  updateMediaStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
    const now = new Date().toISOString();
    return db.prepare(`
      UPDATE media_items 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).run(status, now, id);
  },

  updateTrimPoints(id: string, inPoint: number, outPoint: number) {
    const now = new Date().toISOString();
    return db.prepare(`
      UPDATE media_items 
      SET in_point = ?, out_point = ?, updated_at = ?
      WHERE id = ?
    `).run(inPoint, outPoint, now, id);
  },

  updateMediaTrimming(id: string, inPoint: number, outPoint: number) {
    return this.updateTrimPoints(id, inPoint, outPoint);
  },

  updateAIMapping(id: string, aiTool?: string, aiPrompt?: string, aiMappedVideoPath?: string) {
    const now = new Date().toISOString();
    return db.prepare(`
      UPDATE media_items 
      SET ai_tool = COALESCE(?, ai_tool), ai_prompt = COALESCE(?, ai_prompt), ai_mapped_video_path = COALESCE(?, ai_mapped_video_path), updated_at = ?
      WHERE id = ?
    `).run(aiTool || null, aiPrompt || null, aiMappedVideoPath || null, now, id);
  },

  updateMediaAIVideo(id: string, aiTool?: string, aiPrompt?: string, aiMappedVideoPath?: string) {
    return this.updateAIMapping(id, aiTool, aiPrompt, aiMappedVideoPath);
  },

  deleteMediaItem(id: string) {
    return db.prepare(`DELETE FROM media_items WHERE id = ?`).run(id);
  },

  deleteMediaItemByPath(filePath: string) {
    return db.prepare(`DELETE FROM media_items WHERE file_path = ?`).run(filePath);
  },

  // Upload Queue
  enqueueUpload(item: Omit<UploadQueueItem, 'upload_progress' | 'upload_status' | 'created_at' | 'updated_at'>) {
    const now = new Date().toISOString();
    return db.prepare(`
      INSERT INTO upload_queue (
        id, media_id, title, description, tags, category_id, privacy_status, scheduled_at,
        upload_status, upload_progress, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0.0, ?, ?)
    `).run(
      item.id, item.media_id, item.title, item.description, item.tags, item.category_id,
      item.privacy_status, item.scheduled_at || null, now, now
    );
  },

  // Returns active items only (queued, uploading, failed) - completed items are removed from active queue
  getUploadQueue(includeCompleted = false): (UploadQueueItem & { file_name: string; file_path: string; thumbnail_path?: string })[] {
    let sql = `
      SELECT q.*, m.file_name, m.file_path, m.thumbnail_path 
      FROM upload_queue q
      JOIN media_items m ON q.media_id = m.id
    `;
    if (!includeCompleted) {
      sql += ` WHERE q.upload_status != 'completed' `;
    }
    sql += ` ORDER BY q.created_at DESC`;
    return db.prepare(sql).all() as any[];
  },

  updateUploadProgress(id: string, progress: number, status: 'queued' | 'uploading' | 'completed' | 'failed', videoId?: string, error?: string) {
    const now = new Date().toISOString();
    
    // If completed and videoId present, also mark the media_items entry with youtube_video_id
    if (status === 'completed' && videoId) {
      const queueItem = db.prepare(`SELECT media_id FROM upload_queue WHERE id = ?`).get(id) as { media_id: string } | undefined;
      if (queueItem?.media_id) {
        db.prepare(`UPDATE media_items SET youtube_video_id = ?, updated_at = ? WHERE id = ?`).run(videoId, now, queueItem.media_id);
      }
    }

    return db.prepare(`
      UPDATE upload_queue 
      SET upload_progress = ?, upload_status = ?, youtube_video_id = COALESCE(?, youtube_video_id), error_message = ?, updated_at = ?
      WHERE id = ?
    `).run(progress, status, videoId || null, error || null, now, id);
  },

  deleteQueueItem(id: string) {
    return db.prepare(`DELETE FROM upload_queue WHERE id = ?`).run(id);
  },

  // Settings
  getSetting(key: string): string | null {
    const row = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(key) as { value: string } | undefined;
    return row ? row.value : null;
  },

  setSetting(key: string, value: string) {
    return db.prepare(`
      INSERT INTO app_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
  },

  // Stats
  getStats() {
    const total = (db.prepare(`SELECT COUNT(*) as count FROM media_items`).get() as any).count;
    const pending = (db.prepare(`SELECT COUNT(*) as count FROM media_items WHERE status = 'pending'`).get() as any).count;
    const approved = (db.prepare(`SELECT COUNT(*) as count FROM media_items WHERE status = 'approved'`).get() as any).count;
    const rejected = (db.prepare(`SELECT COUNT(*) as count FROM media_items WHERE status = 'rejected'`).get() as any).count;
    const videos = (db.prepare(`SELECT COUNT(*) as count FROM media_items WHERE file_type = 'video'`).get() as any).count;
    const images = (db.prepare(`SELECT COUNT(*) as count FROM media_items WHERE file_type = 'image'`).get() as any).count;
    const queueActive = (db.prepare(`SELECT COUNT(*) as count FROM upload_queue WHERE upload_status != 'completed'`).get() as any).count;
    const uploaded = (db.prepare(`SELECT COUNT(DISTINCT media_id) as count FROM upload_queue WHERE upload_status = 'completed'`).get() as any).count;

    return {
      mediaStats: { total, pending, approved, rejected, videos, images, uploaded },
      queueStats: { active: queueActive, completed: uploaded }
    };
  }
};
