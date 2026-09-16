import { MediaItem, MediaStatus, AIToolInfo, UploadQueueItem, StatsResponse, GoogleConfig, ChannelProfile } from '../types';

const API_BASE = '/api';

export const api = {
  async getMediaItems(status?: string, type?: string, search?: string): Promise<MediaItem[]> {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (type && type !== 'all') params.append('type', type);
    if (search && search.trim()) params.append('search', search.trim());

    const res = await fetch(`${API_BASE}/media?${params.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async scanDirectory(dirPath: string): Promise<void> {
    const res = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dirPath }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
  },

  async openInSystemApp(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/media/${id}/open`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
  },

  async updateMediaStatus(id: string, status: MediaStatus): Promise<MediaItem> {
    const res = await fetch(`${API_BASE}/media/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async trimVideo(id: string, inPoint: number, outPoint: number): Promise<{ trimmedFilePath: string; data: MediaItem }> {
    const res = await fetch(`${API_BASE}/media/${id}/trim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inPoint, outPoint }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json;
  },

  async getAITools(): Promise<AIToolInfo[]> {
    const res = await fetch(`${API_BASE}/ai/tools`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async getPromptSuggestion(fileName: string, toolId: string): Promise<string> {
    const res = await fetch(`${API_BASE}/ai/prompt-suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, toolId }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data.prompt;
  },

  async updateMediaAI(id: string, data: { aiTool?: string; aiPrompt?: string; mappedVideoPath?: string }): Promise<MediaItem> {
    const res = await fetch(`${API_BASE}/media/${id}/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async enqueueUpload(data: {
    mediaId: string;
    title: string;
    description: string;
    tags: string;
    categoryId: string;
    privacyStatus: 'public' | 'unlisted' | 'private';
    scheduledAt?: string;
  }): Promise<string> {
    const res = await fetch(`${API_BASE}/upload/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.queueId;
  },

  async getUploadQueue(): Promise<UploadQueueItem[]> {
    const res = await fetch(`${API_BASE}/upload/queue`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async startUpload(queueId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/upload/${queueId}/start`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
  },

  async getStats(): Promise<StatsResponse> {
    const res = await fetch(`${API_BASE}/stats`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async getGoogleConfig(): Promise<GoogleConfig> {
    const res = await fetch(`${API_BASE}/youtube/config`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async saveGoogleConfig(clientId: string, clientSecret: string): Promise<void> {
    const res = await fetch(`${API_BASE}/youtube/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
  },

  async getGoogleAuthUrl(): Promise<string> {
    const res = await fetch(`${API_BASE}/youtube/auth-url`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data.authUrl;
  },

  async getChannelProfile(): Promise<ChannelProfile | null> {
    const res = await fetch(`${API_BASE}/youtube/channel`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async logoutGoogle(): Promise<void> {
    const res = await fetch(`${API_BASE}/youtube/logout`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
  },

  getThumbnailUrl(id: string): string {
    return `${API_BASE}/thumbnail/${id}`;
  },

  getMediaStreamUrl(id: string): string {
    return `${API_BASE}/media/stream/${id}`;
  }
};
