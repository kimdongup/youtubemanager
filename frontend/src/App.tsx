import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { FilterSidebar } from './components/gallery/FilterSidebar';
import { MediaGrid } from './components/gallery/MediaGrid';
import { VideoTrimmer } from './components/lab/VideoTrimmer';
import { AIVideoLab } from './components/lab/AIVideoLab';
import { VideoMetadataModal } from './components/studio/VideoMetadataModal';
import { GoogleAuthSettingsModal } from './components/studio/GoogleAuthSettingsModal';
import { UploadQueue } from './components/studio/UploadQueue';
import { ChannelAnalytics } from './components/studio/ChannelAnalytics';
import { MediaItem, MediaStatus, StatsResponse, UploadQueueItem } from './types';
import { api } from './services/api';
import { Sparkles, Scissors } from 'lucide-react';
import { YoutubeIcon } from './components/common/YoutubeIcon';

export function App() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'lab' | 'studio'>('gallery');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

  // Modals state
  const [trimmerItem, setTrimmerItem] = useState<MediaItem | null>(null);
  const [aiLabItem, setAiLabItem] = useState<MediaItem | null>(null);
  const [uploadModalItem, setUploadModalItem] = useState<MediaItem | null>(null);
  const [showGoogleAuthModal, setShowGoogleAuthModal] = useState<boolean>(false);

  const fetchMedia = async () => {
    try {
      const items = await api.getMediaItems(statusFilter, typeFilter, searchTerm);
      setMediaItems(items);
      const s = await api.getStats();
      setStats(s);
    } catch (err) {
      console.error('Failed to fetch media:', err);
    }
  };

  const fetchQueue = useCallback(async () => {
    try {
      const q = await api.getUploadQueue();
      setUploadQueue(q);
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [statusFilter, typeFilter, searchTerm]);

  useEffect(() => {
    if (activeTab === 'studio') {
      fetchQueue();
    } else if (activeTab === 'gallery') {
      fetchMedia();
    }
  }, [activeTab, fetchQueue]);

  // Optimized smart polling for upload progress & stats
  useEffect(() => {
    const intervalMs = activeTab === 'studio' ? 2000 : 4000;
    const timer = setInterval(() => {
      if (activeTab === 'studio') {
        fetchQueue();
      }
      api.getStats().then(setStats).catch(() => {});
    }, intervalMs);
    return () => clearInterval(timer);
  }, [activeTab, fetchQueue]);

  const handleScan = async (dirPath: string) => {
    try {
      setIsScanning(true);
      await api.scanDirectory(dirPath);
      setTimeout(() => {
        fetchMedia();
        setIsScanning(false);
      }, 1000);
    } catch (err) {
      alert(`스캔 실패: ${(err as Error).message}`);
      setIsScanning(false);
    }
  };

  const handleStatusChange = useCallback(async (id: string, newStatus: MediaStatus) => {
    try {
      const updated = await api.updateMediaStatus(id, newStatus);
      setMediaItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      const s = await api.getStats();
      setStats(s);
    } catch (err) {
      alert(`상태 변경 실패: ${(err as Error).message}`);
    }
  }, []);

  const handleBatchApprove = useCallback(async () => {
    for (const item of mediaItems) {
      if (item.status !== 'approved') {
        await api.updateMediaStatus(item.id, 'approved');
      }
    }
    fetchMedia();
  }, [mediaItems]);

  const handleStartUpload = useCallback(async (queueId: string) => {
    try {
      await api.startUpload(queueId);
      fetchQueue();
    } catch (err) {
      alert(`업로드 시작 실패: ${(err as Error).message}`);
    }
  }, [fetchQueue]);

  const handleOpenTrimmer = useCallback((item: MediaItem) => setTrimmerItem(item), []);
  const handleOpenAILab = useCallback((item: MediaItem) => setAiLabItem(item), []);
  const handleOpenUploadModal = useCallback((item: MediaItem) => setUploadModalItem(item), []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        onRefresh={fetchMedia}
        onOpenGoogleAuth={() => setShowGoogleAuthModal(true)}
      />

      {/* Main Tab Views */}
      <main className="flex-1 flex overflow-hidden">
        {/* TAB 1: Local Media Gallery */}
        {activeTab === 'gallery' && (
          <div className="flex-1 flex">
            <FilterSidebar
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onScan={handleScan}
              isScanning={isScanning}
              stats={stats}
            />
            <MediaGrid
              items={mediaItems}
              onStatusChange={handleStatusChange}
              onOpenTrimmer={handleOpenTrimmer}
              onOpenAILab={handleOpenAILab}
              onOpenUploadModal={handleOpenUploadModal}
              onBatchApprove={handleBatchApprove}
            />
          </div>
        )}

        {/* TAB 2: AI Video & Trimming Lab */}
        {activeTab === 'lab' && (
          <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col gap-8">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>AI 비디오 생성 & 타임코드 편집 랩</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                사진을 기반으로 AI 비디오 프롬프트를 생성하고 매핑하거나, 동영상의 원하는 구간만 무손실(Stream Copy)로 잘라냅니다.
              </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Video Trimming shortcut */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-4">
                    <Scissors className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">무손실 동영상 구간 자르기 (Stream Copy)</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    재인코딩 없이 원본 비트스트림 그대로 1초 내에 In/Out 구간을 추출합니다. CPU와 RAM 점유율이 거의 없습니다.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500">
                  * 갤러리 탭의 비디오 카드에서 <span className="text-purple-400 font-semibold">'구간 편집'</span> 버튼을 클릭하여 실행하세요.
                </div>
              </div>

              {/* Box 2: Image to Video Lab shortcut */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">사진 기반 AI 비디오 변환 & 매핑</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    사진의 구도와 피사체에 맞춘 Runway, Luma, Kling 프롬프트를 자동 생성하고 수동 제작 영상을 1:1 바인딩합니다.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500">
                  * 갤러리 탭의 사진 카드에서 <span className="text-indigo-400 font-semibold">'AI 영상 생성'</span> 버튼을 클릭하여 실행하세요.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: YouTube Upload & Studio */}
        {activeTab === 'studio' && (
          <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col gap-8">
            {/* Channel Performance Dashboard (vling benchmark) */}
            <ChannelAnalytics stats={stats} />

            {/* Upload Queue Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <YoutubeIcon className="w-4 h-4 text-red-500" />
                    <span>유튜브 Resumable 스트림 업로드 대기열</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    8MB 고정 Chunk 단위 스트리밍으로 100GB+ 초대형 비디오도 메모리 누수 없이 안전하게 업로드합니다.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  대기열 {uploadQueue.length}개
                </span>
              </div>

              <UploadQueue queue={uploadQueue} onStartUpload={handleStartUpload} />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {trimmerItem && (
        <VideoTrimmer
          item={trimmerItem}
          onClose={() => setTrimmerItem(null)}
          onTrimSuccess={() => {
            setTrimmerItem(null);
            fetchMedia();
          }}
        />
      )}

      {aiLabItem && (
        <AIVideoLab
          item={aiLabItem}
          onClose={() => setAiLabItem(null)}
          onSaveSuccess={(updated) => {
            setMediaItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
          }}
        />
      )}

      {uploadModalItem && (
        <VideoMetadataModal
          item={uploadModalItem}
          onClose={() => setUploadModalItem(null)}
          onSuccess={() => {
            setActiveTab('studio');
            fetchQueue();
          }}
        />
      )}

      {showGoogleAuthModal && (
        <GoogleAuthSettingsModal
          onClose={() => setShowGoogleAuthModal(false)}
          onAuthUpdated={() => {
            fetchMedia();
          }}
        />
      )}
    </div>
  );
}
export default App;
