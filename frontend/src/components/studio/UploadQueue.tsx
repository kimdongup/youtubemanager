import React from 'react';
import { UploadQueueItem } from '../../types';
import { Play, AlertCircle } from 'lucide-react';
import { YoutubeIcon } from '../common/YoutubeIcon';
import { api } from '../../services/api';

interface UploadQueueProps {
  queue: UploadQueueItem[];
  onStartUpload: (queueId: string) => void;
}

export const UploadQueue: React.FC<UploadQueueProps> = ({ queue, onStartUpload }) => {
  // Filter out completed items as requested ("업로드가 완료되면 대기열에서 사라지고")
  const activeQueue = queue.filter((item) => item.upload_status !== 'completed');

  if (activeQueue.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
        <YoutubeIcon className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h4 className="text-sm font-semibold text-slate-300">대기열에 진행 중인 업로드 작업이 없습니다</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          '로컬 갤러리'에서 승인된 미디어의 유튜브 아이콘을 클릭하여 새 업로드를 등록하세요. (완료된 작업은 자동으로 대기열에서 정리됩니다)
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {activeQueue.map((item) => (
        <div
          key={item.id}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-slate-700"
        >
          {/* Thumbnail & Title Info */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-20 h-12 rounded-lg bg-slate-950 overflow-hidden flex-shrink-0 relative border border-slate-800">
              {item.thumbnail_path ? (
                <img
                  src={api.getThumbnailUrl(item.media_id)}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <YoutubeIcon className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.file_name}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                <span className="uppercase px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono">
                  {item.privacy_status}
                </span>
                <span>카테고리: {item.category_id}</span>
              </div>
            </div>
          </div>

          {/* Upload Progress & Action */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            {/* Progress Bar for Uploading state */}
            {item.upload_status === 'uploading' && (
              <div className="flex flex-col gap-1 w-36">
                <div className="flex items-center justify-between text-[11px] text-red-400 font-bold">
                  <span>8MB Chunk 스트림 중</span>
                  <span>{item.upload_progress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-500 to-rose-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.upload_progress}%` }}
                  />
                </div>
              </div>
            )}

            {item.upload_status === 'failed' && (
              <span className="flex items-center gap-1 text-rose-400 text-xs font-semibold px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5" /> 실패 ({item.error_message})
              </span>
            )}

            {item.upload_status === 'queued' && (
              <button
                onClick={() => onStartUpload(item.id)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-md shadow-red-500/20 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>업로드 시작</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
