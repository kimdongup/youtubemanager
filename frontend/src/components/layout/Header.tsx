import React from 'react';
import { Layers, Sparkles, FolderSync, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { YoutubeIcon } from '../common/YoutubeIcon';
import { StatsResponse } from '../../types';

interface HeaderProps {
  activeTab: 'gallery' | 'lab' | 'studio';
  setActiveTab: (tab: 'gallery' | 'lab' | 'studio') => void;
  stats: StatsResponse | null;
  onRefresh: () => void;
  onOpenGoogleAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, stats, onRefresh, onOpenGoogleAuth }) => {
  return (
    <header
      className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-xl select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Brand Logo & Title (with extra left padding for macOS traffic lights in desktop) */}
      <div className="flex items-center gap-3.5 pl-14 sm:pl-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/20 ring-1 ring-red-400/30">
          <YoutubeIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight">YouTube Manager Pro</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
              Zero-Memory Engine
            </span>
          </div>
          <p className="text-xs text-slate-400">대용량 미디어 큐레이션 & 유튜브 스마트 업로더</p>
        </div>
      </div>

      {/* 3 Main Navigation Tabs */}
      <nav
        className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 shadow-inner"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'gallery'
              ? 'bg-slate-800 text-white shadow-md border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-400" />
          <span>📁 로컬 갤러리</span>
          {stats && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-700 text-slate-300">
              {stats.mediaStats.total}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('lab')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'lab'
              ? 'bg-slate-800 text-white shadow-md border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>🧪 AI 비디오 & 트리밍 랩</span>
        </button>

        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'studio'
              ? 'bg-slate-800 text-white shadow-md border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <YoutubeIcon className="w-4 h-4 text-red-500" />
          <span>🚀 유튜브 업로드 & 스튜디오</span>
          {stats && stats.mediaStats.approved > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {stats.mediaStats.approved} 승인됨
            </span>
          )}
        </button>
      </nav>

      {/* Quick Status Stats & Google Auth & Refresh */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Google OAuth Status Button */}
        <button
          onClick={onOpenGoogleAuth}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            stats?.googleConfig?.isConnected
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/30'
              : 'bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/30'
          }`}
          title="Google Cloud Console OAuth2 키 설정 및 로그인"
        >
          <span className={`w-2 h-2 rounded-full ${stats?.googleConfig?.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <span>{stats?.googleConfig?.isConnected ? 'YouTube 연동됨' : 'Google API 설정'}</span>
        </button>

        {stats && (
          <div className="hidden xl:flex items-center gap-3 text-xs bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>승인 {stats.mediaStats.approved}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>대기 {stats.mediaStats.pending}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-rose-400">
              <XCircle className="w-3.5 h-3.5" />
              <span>기각 {stats.mediaStats.rejected}</span>
            </div>
          </div>
        )}

        <button
          onClick={onRefresh}
          className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-all"
          title="새로고침"
        >
          <FolderSync className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
