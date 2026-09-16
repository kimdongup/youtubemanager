import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Link2, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { MediaItem, AIToolInfo } from '../../types';
import { api } from '../../services/api';

interface AIVideoLabProps {
  item: MediaItem;
  onClose: () => void;
  onSaveSuccess: (updatedItem: MediaItem) => void;
}

export const AIVideoLab: React.FC<AIVideoLabProps> = ({ item, onClose, onSaveSuccess }) => {
  const [tools, setTools] = useState<AIToolInfo[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>(item.ai_tool || 'runway-gen3');
  const [prompt, setPrompt] = useState<string>(item.ai_prompt || '');
  const [mappedVideoPath, setMappedVideoPath] = useState<string>(item.ai_mapped_video_path || '');
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.getAITools().then((res) => {
      setTools(res);
      if (!prompt && res.length > 0) {
        generatePrompt(selectedTool);
      }
    });
  }, []);

  const generatePrompt = async (toolId: string) => {
    try {
      const suggested = await api.getPromptSuggestion(item.file_name, toolId);
      setPrompt(suggested);
    } catch (err) {
      console.error(err);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await api.updateMediaAI(item.id, {
        aiTool: selectedTool,
        aiPrompt: prompt,
        mappedVideoPath: mappedVideoPath.trim() || undefined,
      });
      onSaveSuccess(updated);
      onClose();
    } catch (err) {
      alert(`저장 실패: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">사진 기반 AI 비디오 생성 & 파이프라인 랩</h2>
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

        {/* Body Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh]">
          {/* Left Column: Image Preview */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>원본 사진 레퍼런스</span>
            </label>
            <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <img
                src={api.getThumbnailUrl(item.id)}
                alt={item.file_name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* AI Tool Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">타겟 AI 비디오 생성 플랫폼</label>
              <div className="grid grid-cols-2 gap-2">
                {tools.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTool(t.id);
                      generatePrompt(t.id);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedTool === t.id
                        ? 'bg-purple-950/40 border-purple-500 text-white shadow-md'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{t.name}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{t.category}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Prompt Generator & Mapping */}
          <div className="flex flex-col gap-4">
            {/* Prompt Box */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">생성 프롬프트 가이드</label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => generatePrompt(selectedTool)}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded text-[10px] font-medium transition-colors"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>새 프롬프트</span>
                  </button>
                  <button
                    onClick={copyPrompt}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded text-[10px] font-medium transition-colors"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? '복사됨!' : '클립보드 복사'}</span>
                  </button>
                </div>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="AI 프롬프트를 입력하세요..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Video Mapping Input */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-purple-400" />
                <span>수동 생성된 AI 비디오 파일 경로 매핑</span>
              </label>
              <input
                type="text"
                value={mappedVideoPath}
                onChange={(e) => setMappedVideoPath(e.target.value)}
                placeholder="/생성된_영상_절대경로/output.mp4"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-500">
                * 외부 AI 사이트에서 생성 후 다운로드한 영상 경로를 입력하여 원본 사진과 1:1 파이프라인으로 연결합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/70">
          <span className="text-xs text-slate-500">
            외부 AI 툴(웹)에서 생성 후 본 카드에 비디오를 바인딩할 수 있습니다.
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-500/20 transition-all"
            >
              {isSaving ? '저장 중...' : 'AI 파이프라인 설정 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
