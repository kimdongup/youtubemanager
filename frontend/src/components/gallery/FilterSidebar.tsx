import React, { useState } from 'react';
import { Folder, Search, Filter, Video, Image, CheckCircle, Clock, XCircle, Play, RefreshCw } from 'lucide-react';
import { StatsResponse } from '../../types';

interface FilterSidebarProps {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onScan: (dirPath: string) => void;
  isScanning: boolean;
  stats: StatsResponse | null;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  searchTerm,
  setSearchTerm,
  onScan,
  isScanning,
  stats,
}) => {
  const [folderInput, setFolderInput] = useState(stats?.lastScannedDir || '/Users/mac/Pictures');

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderInput.trim()) {
      onScan(folderInput.trim());
    }
  };

  return (
    <aside className="w-72 bg-slate-900/60 border-r border-slate-800/80 p-4 flex flex-col gap-5 h-[calc(100vh-65px)] overflow-y-auto">
      {/* 1. Folder Scanner Section */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 shadow-sm">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
          <Folder className="w-4 h-4 text-amber-400" />
          <span>로컬 디렉토리 스캔 & 감지</span>
        </label>
        <form onSubmit={handleScanSubmit} className="flex flex-col gap-2">
          <input
            type="text"
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
            placeholder="/경로/입력..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isScanning}
            className="w-full flex items-center justify-center gap-2 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>실시간 스캔 중...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>폴더 스캔 & 증분 감지 시작</span>
              </>
            )}
          </button>
        </form>
        <p className="text-[10px] text-slate-500 mt-2">
          * 변경/추가된 파일은 실시간 차분 인덱싱으로 자동 갱신됩니다.
        </p>
      </div>

      {/* 2. Search Input */}
      <div>
        <label className="text-xs font-semibold text-slate-400 mb-1.5 block">파일 이름 검색</label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="VID_2026..., sample.jpg"
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
          />
        </div>
      </div>

      {/* 3. Curation Status Filter */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>승인 / 기각 큐레이션 필터</span>
        </label>
        <div className="space-y-1">
          {[
            { id: 'all', label: '전체 파일', icon: Filter, count: stats?.mediaStats.total, color: 'text-slate-400' },
            { id: 'approved', label: '🟢 승인됨 (Approved)', icon: CheckCircle, count: stats?.mediaStats.approved, color: 'text-emerald-400' },
            { id: 'pending', label: '🟡 대기중 (Pending)', icon: Clock, count: stats?.mediaStats.pending, color: 'text-amber-400' },
            { id: 'rejected', label: '🔴 기각됨 (Rejected)', icon: XCircle, count: stats?.mediaStats.rejected, color: 'text-rose-400' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                statusFilter === tab.id
                  ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <tab.icon className={`w-4 h-4 ${tab.color}`} />
                <span>{tab.label}</span>
              </div>
              {tab.count !== undefined && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-400">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Media Type Filter */}
      <div>
        <label className="text-xs font-semibold text-slate-400 mb-2 block">미디어 포맷 구분</label>
        <div className="grid grid-cols-3 gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
          {[
            { id: 'all', label: '전체' },
            { id: 'video', label: '비디오', icon: Video },
            { id: 'image', label: '사진', icon: Image },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id)}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                typeFilter === type.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type.icon && <type.icon className="w-3 h-3" />}
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
