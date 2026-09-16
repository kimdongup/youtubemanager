import React, { useState, useRef } from 'react';
import { Scissors, Play, Pause, Sparkles } from 'lucide-react';
import { MediaItem } from '../../types';
import { api } from '../../services/api';

interface VideoTrimmerProps {
  item: MediaItem;
  onClose: () => void;
  onTrimSuccess: (trimmedItem: MediaItem) => void;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({ item, onClose, onTrimSuccess }) => {
  const [inPoint, setInPoint] = useState<number>(item.in_point || 0);
  const [outPoint, setOutPoint] = useState<number>(item.out_point || (item.duration ? Math.min(item.duration, 60) : 10));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const duration = item.duration || 100;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.currentTime >= outPoint) {
        videoRef.current.currentTime = inPoint;
      }
    }
  };

  const setInToCurrent = () => {
    if (videoRef.current) {
      const t = Math.floor(videoRef.current.currentTime * 10) / 10;
      setInPoint(t);
      if (t >= outPoint) setOutPoint(Math.min(duration, t + 5));
    }
  };

  const setOutToCurrent = () => {
    if (videoRef.current) {
      const t = Math.floor(videoRef.current.currentTime * 10) / 10;
      setOutPoint(t);
      if (t <= inPoint) setInPoint(Math.max(0, t - 5));
    }
  };

  const handleExecuteTrim = async () => {
    try {
      setIsProcessing(true);
      setMessage('FFmpeg 무손실 Stream Copy 추출 진행 중...');
      const res = await api.trimVideo(item.id, inPoint, outPoint);
      setMessage('성공적으로 추출되었습니다!');
      setTimeout(() => {
        onTrimSuccess(res.data);
      }, 1000);
    } catch (err) {
      setMessage(`오류: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">동영상 구간 무손실 편집 (Stream Copy Trimmer)</h2>
              <p className="text-xs text-slate-400 truncate max-w-md">{item.file_name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Video Player Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center max-h-[420px]">
          <video
            ref={videoRef}
            src={api.getMediaStreamUrl(item.id)}
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-contain"
          />

          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 flex items-center justify-center text-white transition-transform hover:scale-110"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5 fill-current" />}
          </button>

          {/* Current Time Display */}
          <div className="absolute bottom-3 left-4 px-2.5 py-1 rounded bg-black/80 text-white font-mono text-xs border border-slate-800">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Timeline & Range Controls */}
        <div className="p-6 flex flex-col gap-5 bg-slate-950/60 border-t border-slate-800">
          {/* Visual Range Indicator */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="text-purple-400 font-bold">시작: {formatTime(inPoint)}</span>
              <span className="text-slate-300 font-bold">구간 길이: {formatTime(Math.max(0, outPoint - inPoint))}</span>
              <span className="text-purple-400 font-bold">종료: {formatTime(outPoint)}</span>
            </div>

            {/* Slider Bars */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-12">In Point:</span>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={inPoint}
                  onChange={(e) => setInPoint(Math.min(parseFloat(e.target.value), outPoint - 0.5))}
                  className="flex-1 accent-purple-500"
                />
                <button
                  onClick={setInToCurrent}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-purple-300 rounded border border-slate-700"
                >
                  현재 위치로 시작점 설정
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-12">Out Point:</span>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={outPoint}
                  onChange={(e) => setOutPoint(Math.max(parseFloat(e.target.value), inPoint + 0.5))}
                  className="flex-1 accent-purple-500"
                />
                <button
                  onClick={setOutToCurrent}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-purple-300 rounded border border-slate-700"
                >
                  현재 위치로 종료점 설정
                </button>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-purple-300 text-center font-medium">
              {message}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>재인코딩 없이 1~2초 내 무손실 고속 추출됩니다.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={handleExecuteTrim}
                disabled={isProcessing}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-500/20 transition-all"
              >
                <Scissors className="w-4 h-4" />
                <span>{isProcessing ? '추출 진행 중...' : '구간 무손실 잘라내기'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
