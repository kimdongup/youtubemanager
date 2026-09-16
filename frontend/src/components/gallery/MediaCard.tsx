import React from 'react';
import { MediaItem, MediaStatus } from '../../types';
import { Check, X, Scissors, Sparkles, Video, Image, Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { YoutubeIcon } from '../common/YoutubeIcon';
import { api } from '../../services/api';

interface MediaCardProps {
  item: MediaItem;
  onStatusChange: (id: string, status: MediaStatus) => void;
  onOpenTrimmer: (item: MediaItem) => void;
  onOpenAILab: (item: MediaItem) => void;
  onOpenUploadModal: (item: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = React.memo(({
  item,
  onStatusChange,
  onOpenTrimmer,
  onOpenAILab,
  onOpenUploadModal,
}) => {
  const isVideo = item.file_type === 'video';
  const sizeMB = (item.file_size / (1024 * 1024)).toFixed(1);
  const isUploaded = Boolean((item.youtube_video_id && item.youtube_video_id.trim().length > 0) || item.upload_status === 'completed');

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case 'approved':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>승인됨</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>기각됨</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>대기중</span>
          </span>
        );
    }
  };

  const handleOpenInSystemApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.openInSystemApp(item.id);
    } catch (err) {
      alert(`앱 실행 실패: ${(err as Error).message}`);
    }
  };

  const handleOpenYouTubeVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.youtube_video_id) {
      window.open(`https://youtu.be/${item.youtube_video_id}`, '_blank');
    }
  };

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col ${
      isUploaded
        ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
        : item.status === 'approved'
        ? 'border-emerald-500/50 ring-1 ring-emerald-500/30 hover:border-emerald-400'
        : item.status === 'rejected'
        ? 'border-rose-500/40 opacity-70 hover:opacity-100 hover:border-rose-400'
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      {/* Media Thumbnail Container with macOS Native Click Trigger */}
      <div
        onClick={handleOpenInSystemApp}
        className="relative aspect-video bg-slate-950 overflow-hidden group/thumb cursor-pointer select-none"
        title={isVideo ? '클릭하여 macOS QuickTime Player로 열기' : '클릭하여 macOS 미리보기(Preview)로 열기'}
      >
        {item.thumbnail_path ? (
          <img
            src={api.getThumbnailUrl(item.id)}
            alt={item.file_name}
            loading="lazy"
            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            {isVideo ? <Video className="w-8 h-8" /> : <Image className="w-8 h-8" />}
          </div>
        )}

        {/* Hover Overlay: Open in Native App */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
          <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-sm border border-white/20 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-lg transform translate-y-1 group-hover/thumb:translate-y-0 transition-transform">
            <span>{isVideo ? '🎬 퀵타임으로 열기' : '🖼️ 미리보기로 열기'}</span>
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10 flex-wrap">
          <span className="p-1 rounded-md bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 text-white">
            {isVideo ? <Video className="w-3 h-3 text-sky-400" /> : <Image className="w-3 h-3 text-emerald-400" />}
          </span>
          {getStatusBadge()}
          {isUploaded && (
            <span
              onClick={handleOpenYouTubeVideo}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/50 backdrop-blur-sm flex items-center gap-1 shadow cursor-pointer transition-colors"
              title="클릭하여 YouTube에서 영상 시청"
            >
              <YoutubeIcon className="w-3 h-3 text-red-400" />
              <span>업로드 완료</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        {/* Duration badge for video */}
        {isVideo && item.duration !== undefined && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
            {formatDuration(item.duration)}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-slate-100 truncate flex-1" title={item.file_name}>
              {item.file_name}
            </h3>
            {isUploaded && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
                LOCKED
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>{sizeMB} MB</span>
            {item.width && item.height && <span>{item.width}x{item.height}</span>}
          </div>
        </div>

        {/* Quick Action Buttons (All disabled/unavailable if already uploaded) */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
          {/* Curation Toggle Buttons (Approve / Reject) */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              disabled={isUploaded}
              onClick={() => onStatusChange(item.id, item.status === 'approved' ? 'pending' : 'approved')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isUploaded
                  ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed opacity-40'
                  : item.status === 'approved'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800/80 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 border border-slate-700'
              }`}
              title={isUploaded ? '이미 업로드된 미디어는 상태를 변경할 수 없습니다' : '승인 상태 토글'}
            >
              <Check className="w-3.5 h-3.5" />
              <span>승인</span>
            </button>

            <button
              disabled={isUploaded}
              onClick={() => onStatusChange(item.id, item.status === 'rejected' ? 'pending' : 'rejected')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isUploaded
                  ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed opacity-40'
                  : item.status === 'rejected'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-800/80 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 border border-slate-700'
              }`}
              title={isUploaded ? '이미 업로드된 미디어는 기각할 수 없습니다' : '기각 상태 토글'}
            >
              <X className="w-3.5 h-3.5" />
              <span>기각</span>
            </button>
          </div>

          {/* Secondary Workflow Buttons (Trimmer / AI Video / YouTube) */}
          <div className="flex items-center gap-1">
            {isVideo ? (
              <button
                disabled={isUploaded}
                onClick={() => onOpenTrimmer(item)}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  isUploaded
                    ? 'bg-slate-800/30 text-slate-600 border border-slate-800/40 cursor-not-allowed opacity-40'
                    : 'bg-slate-800/50 hover:bg-purple-900/30 text-purple-300 hover:text-purple-200 border border-slate-700/60'
                }`}
                title={isUploaded ? '이미 업로드된 비디오는 구간 편집할 수 없습니다' : 'FFmpeg 무손실 구간 편집'}
              >
                <Scissors className="w-3 h-3" />
                <span>구간 편집</span>
              </button>
            ) : (
              <button
                disabled={isUploaded}
                onClick={() => onOpenAILab(item)}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  isUploaded
                    ? 'bg-slate-800/30 text-slate-600 border border-slate-800/40 cursor-not-allowed opacity-40'
                    : 'bg-slate-800/50 hover:bg-purple-900/30 text-purple-300 hover:text-purple-200 border border-slate-700/60'
                }`}
                title={isUploaded ? '이미 업로드된 이미지는 AI 영상을 생성할 수 없습니다' : 'AI 영상 생성 프롬프트'}
              >
                <Sparkles className="w-3 h-3" />
                <span>AI 영상 생성</span>
              </button>
            )}

            {/* YouTube Upload Button */}
            {isUploaded ? (
              <button
                disabled
                className="px-2.5 py-1 bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 rounded-md text-[11px] font-semibold cursor-not-allowed flex items-center gap-1 opacity-50 select-none"
                title={`YouTube 업로드 완료됨 (ID: ${item.youtube_video_id}) - 중복 업로드 방지됨`}
              >
                <Check className="w-3.5 h-3.5" />
                <span className="text-[10px]">완료됨</span>
              </button>
            ) : item.status === 'approved' ? (
              <button
                onClick={() => onOpenUploadModal(item)}
                className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-md text-[11px] font-medium transition-all shadow-sm"
                title="유튜브 업로드 대기열 등록"
              >
                <YoutubeIcon className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
});

MediaCard.displayName = 'MediaCard';
