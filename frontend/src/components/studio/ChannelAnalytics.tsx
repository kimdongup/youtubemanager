import React, { useState } from 'react';
import { StatsResponse } from '../../types';
import { TrendingUp, Users, Eye, Video, BarChart3, ArrowUpRight } from 'lucide-react';

interface ChannelAnalyticsProps {
  stats: StatsResponse | null;
}

export const ChannelAnalytics: React.FC<ChannelAnalyticsProps> = ({ stats }) => {
  const [imgError, setImgError] = useState(false);
  const channel = stats?.channelStats || {};
  const channelTitle = channel.title || channel.channelName || 'My Creator Studio Channel';
  const subCount = channel.subscriberCount ? parseInt(channel.subscriberCount.toString(), 10) : 142800;
  const viewCount = channel.viewCount ? parseInt(channel.viewCount.toString(), 10) : (channel.totalViews || 28450300);
  const videoCount = channel.videoCount ? parseInt(channel.videoCount.toString(), 10) : 384;
  const isRealConnected = !!(stats?.googleConfig?.isConnected && channel.title);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-red-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {channel.thumbnailUrl && !imgError ? (
            <img
              src={channel.thumbnailUrl}
              alt={channelTitle}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setImgError(true)}
              className="w-14 h-14 rounded-2xl border-2 border-red-500/40 shadow-lg object-cover bg-slate-950"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl border-2 border-red-500/40 shadow-lg bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white text-lg font-bold">
              {channelTitle.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                isRealConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {isRealConnected ? '실시간 YouTube 채널 연동 중' : 'vling.net 벤치마크 내 채널 스튜디오 (데모)'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1.5">{channelTitle}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              대용량 로컬 파일 큐레이션 파이프라인과 유튜브 실시간 채널 퍼포먼스 모니터링
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">채널 성장 지수</div>
            <div className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> 상위 4.2%
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Subscribers */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>구독자 수</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-extrabold text-white mt-2 font-mono">
            {subCount.toLocaleString()}명
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> 실시간 YouTube Data
          </div>
        </div>

        {/* Card 2: Total Views */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>누적 조회수</span>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-extrabold text-white mt-2 font-mono">
            {(viewCount / 10000).toFixed(1)}만 회
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> {viewCount.toLocaleString()} 회
          </div>
        </div>

        {/* Card 3: Avg Views */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>영상당 평균 조회수</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-white mt-2 font-mono">
            {(viewCount / Math.max(1, videoCount)).toFixed(0)} 회
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            참여율 (Engagement): <span className="text-purple-400 font-bold">6.8%</span>
          </div>
        </div>

        {/* Card 4: Total Videos & Velocity */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>게시된 동영상</span>
            <Video className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-extrabold text-white mt-2 font-mono">
            {videoCount.toLocaleString()} 개
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            업로드 빈도: <span className="text-emerald-400 font-semibold">3.2 videos/week</span>
          </div>
        </div>
      </div>
    </div>
  );
};
