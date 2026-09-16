# Development TODO List (`docs/TODO.md`)

## 1. 초기 문서 및 환경 구축 (Completed)
- [x] 대용량 파일 핸들링 & 메모리 최적화 기획서 작성 (`docs/PROJECT_PLAN.md`)
- [x] DX-Manager 참조 대규모 에이전트 지침서 생성 (`agents.md`)
- [x] AI 토큰/비용 최대로 아끼는 설정 문서 생성 (`docs/agents_token_efficient.md`)
- [x] 메인 목차 연동 문서 작성 (`readme.md`)
- [x] implementation_plan과 walkthrough 누적 이력 파일 작성 (`docs/history.md`)

---

## 2. 코딩 및 풀스택 시스템 구현 (Completed)
- [x] **백엔드 코어 구축**: Express + TypeScript + SQLite WAL 모드 스키마 및 쿼리
- [x] **FFmpeg Native Engine**: 키프레임 썸네일 스트리밍 추출 & 무손실 Stream Copy 구간 편집
- [x] **Differential Indexing Engine**: `chokidar` 기반 폴더 실시간 파일 변경 감지 및 차분 갱신
- [x] **YouTube Resumable Uploader**: 8MB Chunk Stream 업로드 & vling.net 벤치마크 채널 분석 통계
- [x] **3대 탭 프론트엔드 UI**: Vite + React 18 + TailwindCSS 다크 모드 대시보드
  - 📁 로컬 미디어 갤러리 타일 뷰 (승인/기각/대기 큐레이션)
  - 🧪 AI 비디오 & 타임코드 편집 랩 (In/Out Trimmer, Runway/Luma/Kling 프롬프트 가이드)
  - 🚀 유튜브 업로드 & 내 채널 스튜디오 (대기열 및 실시간 진행률)

---

## 3. 실제 Google 연동 및 데스크톱 패키징 (Completed)
- [x] **실제 Google Cloud Console OAuth2 키 설정 UI (`GoogleAuthSettingsModal`)**
- [x] **실제 YouTube Data API v3 8MB Resumable 실물 업로드 및 채널 연동**
- [x] **독립 실행형 macOS 데스크톱 패키징 빌드 파이프라인 (`desktop/`, `npm run package:mac`)**
