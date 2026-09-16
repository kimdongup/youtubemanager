import React, { useState } from 'react';
import { Tag, Eye, Calendar, FileText, Check } from 'lucide-react';
import { YoutubeIcon } from '../common/YoutubeIcon';
import { MediaItem } from '../../types';
import { api } from '../../services/api';

interface VideoMetadataModalProps {
  item: MediaItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const VideoMetadataModal: React.FC<VideoMetadataModalProps> = ({ item, onClose, onSuccess }) => {
  const [title, setTitle] = useState(item.file_name.replace(/\.[^/.]+$/, ''));
  const [description, setDescription] = useState('Uploaded via YouTube Manager Pro\n\n#YouTubeManager #Automation');
  const [tags, setTags] = useState('youtube, 4k, video, photography');
  const [categoryId, setCategoryId] = useState('22');
  const [privacyStatus, setPrivacyStatus] = useState<'public' | 'unlisted' | 'private'>('unlisted');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.enqueueUpload({
        mediaId: item.id,
        title,
        description,
        tags,
        categoryId,
        privacyStatus,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(`업로드 등록 실패: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <YoutubeIcon className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">유튜브 업로드 메타데이터 설정</h2>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>영상 제목 (Title)</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 block">영상 설명 (Description)</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>태그 (쉼표로 구분)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="vlog, travel, tech, 4k"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Privacy & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>공개 상태 (Privacy)</span>
              </label>
              <select
                value={privacyStatus}
                onChange={(e) => setPrivacyStatus(e.target.value as any)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              >
                <option value="unlisted">일부 공개 (Unlisted - 권장)</option>
                <option value="private">비공개 (Private)</option>
                <option value="public">전체 공개 (Public)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">카테고리 (Category)</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              >
                <option value="22">피플 & 블로그 (People & Blogs)</option>
                <option value="1">영화 & 애니메이션 (Film & Animation)</option>
                <option value="28">과학 & 기술 (Science & Tech)</option>
                <option value="10">음악 (Music)</option>
                <option value="20">게임 (Gaming)</option>
              </select>
            </div>
          </div>

          {/* Scheduled Date/Time (Optional) */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>예약 게시 일시 (선택 사항)</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? '대기열 등록 중...' : '업로드 대기열에 추가'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
