export type MediaStatus = 'pending' | 'approved' | 'rejected';
export type MediaType = 'video' | 'image';

export interface MediaItem {
  id: string;
  file_path: string;
  file_name: string;
  file_type: MediaType;
  file_size: number;
  duration?: number;
  width?: number;
  height?: number;
  status: MediaStatus;
  thumbnail_path?: string;
  in_point?: number;
  out_point?: number;
  ai_tool?: string;
  ai_prompt?: string;
  ai_mapped_video_path?: string;
  youtube_video_id?: string;
  upload_status?: 'queued' | 'uploading' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface UploadQueueItem {
  id: string;
  media_id: string;
  title: string;
  description: string;
  tags: string;
  category_id: string;
  privacy_status: 'public' | 'unlisted' | 'private';
  scheduled_at?: string;
  upload_status: 'queued' | 'uploading' | 'completed' | 'failed';
  upload_progress: number;
  youtube_video_id?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
