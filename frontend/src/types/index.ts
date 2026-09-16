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

export interface AIToolInfo {
  id: string;
  name: string;
  category: string;
  recommendedPrompts: string[];
}

export interface UploadQueueItem {
  id: string;
  media_id: string;
  file_name: string;
  file_path: string;
  thumbnail_path?: string;
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

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  isConnected: boolean;
}

export interface ChannelProfile {
  channelId: string;
  title: string;
  description: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
}

export interface StatsResponse {
  mediaStats: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    videos: number;
    images: number;
  };
  channelStats: any;
  googleConfig?: GoogleConfig;
  lastScannedDir: string | null;
}
