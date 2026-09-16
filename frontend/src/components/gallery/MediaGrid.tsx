import React from 'react';
import { MediaItem } from '../../types';
import { MediaCard } from './MediaCard';
import { CheckCheck, Layers } from 'lucide-react';

interface MediaGridProps {
  items: MediaItem[];
  onStatusChange: (id: string, newStatus: 'pending' | 'approved' | 'rejected') => void;
  onOpenTrimmer: (item: MediaItem) => void;
  onOpenAILab: (item: MediaItem) => void;
  onOpenUploadModal: (item: MediaItem) => void;
  onBatchApprove: () => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  onStatusChange,
  onOpenTrimmer,
  onOpenAILab,
  onOpenUploadModal,
  onBatchApprove,
}) => {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-300">표시할 미디어 항목이 없습니다</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          왼쪽 사이드바에서 로컬 폴더 경로를 입력하고 '스캔 시작' 버튼을 눌러 미디어를 탐색하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-y-auto p-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-200">미디어 타일 목록</h2>
          <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded-full font-mono">
            {items.length}개
          </span>
        </div>

        <button
          onClick={onBatchApprove}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all shadow-sm"
        >
          <CheckCheck className="w-4 h-4" />
          <span>현재 필터 전체 일괄 승인</span>
        </button>
      </div>

      {/* Media Tile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onStatusChange={onStatusChange}
            onOpenTrimmer={onOpenTrimmer}
            onOpenAILab={onOpenAILab}
            onOpenUploadModal={onOpenUploadModal}
          />
        ))}
      </div>
    </div>
  );
};
