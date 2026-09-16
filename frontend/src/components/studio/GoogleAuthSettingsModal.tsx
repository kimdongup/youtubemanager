import React, { useState, useEffect } from 'react';
import { KeyRound, ExternalLink, ShieldCheck, Check, AlertCircle, LogOut, Copy } from 'lucide-react';
import { YoutubeIcon } from '../common/YoutubeIcon';
import { api } from '../../services/api';
import { GoogleConfig, ChannelProfile } from '../../types';

interface GoogleAuthSettingsModalProps {
  onClose: () => void;
  onAuthUpdated: () => void;
}

export const GoogleAuthSettingsModal: React.FC<GoogleAuthSettingsModalProps> = ({ onClose, onAuthUpdated }) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [config, setConfig] = useState<GoogleConfig | null>(null);
  const [channel, setChannel] = useState<ChannelProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  const REDIRECT_URI = 'http://localhost:5001/api/youtube/callback';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cfg = await api.getGoogleConfig();
      setConfig(cfg);
      setClientId(cfg.clientId);
      if (cfg.isConnected) {
        const ch = await api.getChannelProfile();
        setChannel(ch);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.saveGoogleConfig(clientId, clientSecret);
      setMessage({ type: 'success', text: 'Google OAuth 설정이 안전하게 저장되었습니다.' });
      loadData();
      onAuthUpdated();
    } catch (err) {
      setMessage({ type: 'error', text: `저장 실패: ${(err as Error).message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartOAuth = async () => {
    try {
      if (!clientId.trim()) {
        alert('아래 입력창에 Google Cloud Console에서 발급받은 Client ID를 입력해 주세요.');
        return;
      }
      
      // Auto-save any typed credentials first
      if (clientId.trim() || clientSecret.trim()) {
        await api.saveGoogleConfig(clientId.trim(), clientSecret.trim());
        await loadData();
        onAuthUpdated();
      }

      const authUrl = await api.getGoogleAuthUrl();
      // Open Google Consent Screen in a new popup/tab
      window.open(authUrl, '_blank', 'width=600,height=700');
    } catch (err) {
      alert(`인증 시작 실패: ${(err as Error).message}\n먼저 아래 폼에서 Client ID와 Client Secret을 입력 후 [설정값 저장] 버튼을 눌러주세요.`);
    }
  };

  const handleLogout = async () => {
    if (!confirm('정말 구글 계정 연동을 해제하시겠습니까?')) return;
    try {
      await api.logoutGoogle();
      setChannel(null);
      loadData();
      onAuthUpdated();
      setMessage({ type: 'success', text: '구글 계정 연동이 해제되었습니다.' });
    } catch (err) {
      alert(`로그아웃 실패: ${(err as Error).message}`);
    }
  };

  const copyRedirectUri = () => {
    navigator.clipboard.writeText(REDIRECT_URI);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Google Cloud Console & YouTube OAuth2 연동 설정</h2>
              <p className="text-xs text-slate-400">실제 YouTube 채널에 업로드하기 위한 Google API 키 관리</p>
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
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          {/* Status Message */}
          {message && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
            }`}>
              {message.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Current Connection Status Box */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {channel?.thumbnailUrl && !imgError ? (
                <img
                  src={channel.thumbnailUrl}
                  alt={channel.title}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={() => setImgError(true)}
                  className="w-10 h-10 rounded-full border border-slate-700 object-cover bg-slate-950"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-rose-700 border border-slate-700 flex items-center justify-center text-white text-sm font-bold">
                  {channel?.title ? channel.title.charAt(0).toUpperCase() : <YoutubeIcon className="w-5 h-5 text-white" />}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {channel ? channel.title : '구글 계정 미연동'}
                  </span>
                  {config?.isConnected ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                      연동 완료 (Active)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 rounded-md">
                      인증 필요
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {channel
                    ? `구독자 ${parseInt(channel.subscriberCount, 10).toLocaleString()}명 • 총 조회수 ${parseInt(channel.viewCount, 10).toLocaleString()}회`
                    : '아래에서 Client ID를 입력하고 구글 인증을 완료하세요.'}
                </p>
              </div>
            </div>

            {config?.isConnected ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-medium transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>연동 해제</span>
              </button>
            ) : (
              <button
                onClick={handleStartOAuth}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg text-xs font-bold shadow-md shadow-red-500/20 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Google 계정 로그인</span>
              </button>
            )}
          </div>

          {/* Setup Guide Info */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <div className="font-bold text-slate-200 flex items-center justify-between">
              <span>📌 Google Cloud Console 설정 방법</span>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-red-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>콘솔 바로가기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 pl-1 leading-relaxed">
              <li>Google Cloud Console에서 프로젝트 생성 후 <strong>YouTube Data API v3</strong>를 활성화합니다.</li>
              <li><strong>OAuth 동의 화면</strong> 구성 후 <strong>사용자 인증 정보 &gt; OAuth 클라이언트 ID 생성</strong>(유형: 웹 애플리케이션)을 선택합니다.</li>
              <li><strong>승인된 리디렉션 URI</strong>에 아래 주소를 복사하여 추가합니다:</li>
            </ol>
            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 mt-1">
              <code className="text-[11px] text-red-400 font-mono flex-1">{REDIRECT_URI}</code>
              <button
                onClick={copyRedirectUri}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold flex items-center gap-1"
              >
                {copiedRedirect ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRedirect ? '복사됨' : '복사'}</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveConfig} className="flex flex-col gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                Client ID (클라이언트 ID)
              </label>
              <input
                type="text"
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="000000000000-xxxxxxxx.apps.googleusercontent.com"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                Client Secret (클라이언트 보안 비밀)
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder={config?.clientSecret ? '기존 비밀값 보관 중 (변경 시 입력)' : 'GOCSPX-xxxxxxxxxxxxx'}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                * 키는 SQLite WAL DB에 로컬 전용으로 암호화/안전 보관됩니다.
              </span>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-700 transition-all shadow-sm"
              >
                {isSaving ? '저장 중...' : '설정값 저장'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-end bg-slate-950/70">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
