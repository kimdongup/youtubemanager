# YouTube Manager 프로젝트 메인 문서 (`readme.md`)

수많은 대용량 영상 및 사진 파일을 메모리 효율적으로 관리하고 유튜브에 손쉽게 업로드하는 데스크톱 프로그램 프로젝트입니다.

본 파일(`readme.md`)은 메인 연동 인덱스 문서로, 프로젝트 관련 제반 `.md` 설정 및 기획 문서들의 위치 링크와 역할을 종합 안내합니다.

---

## 📁 파일 및 문서 구조 연동 목차

### 1. 루트 디렉토리 문서 (`/`)

- 📄 **[readme.md](file:///Users/mac/Antigravity/youtubemanager/readme.md)**: (본 파일) 메인 문서 인덱스 및 위치 연동 전담.
- 📄 **[agents.md](file:///Users/mac/Antigravity/youtubemanager/agents.md)**: 저장소 전체에 적용되는 Codex / AGY / Claude 표준 에이전트 작업 지침서 (`DX-Manager` 참조 대규모 베이스 설정).

---

### 2. 문서 전용 폴더 (`docs/`)

- 📘 **[docs/PROJECT_PLAN.md](file:///Users/mac/Antigravity/youtubemanager/docs/PROJECT_PLAN.md)**: 프로그램 기획서 (Tauri 2.0 + Rust, FFmpeg sidecar, SQLite WAL, YouTube Resumable Upload 등 대용량 미디어 핸들링 및 메모리 최소화 아키텍처 명세).
- 📖 **[docs/usage.md](file:///Users/mac/Antigravity/youtubemanager/docs/usage.md)**: **서버 실행 방법, 브라우저 접속 방법 및 상세 사용 가이드**.
- ⚡ **[docs/agents_token_efficient.md](file:///Users/mac/Antigravity/youtubemanager/docs/agents_token_efficient.md)**: `agents.md` 기반 **AI 사용량(토큰/비용)을 최대로 아끼기 위한 기술적 최적화 설정 문서**.
- 📜 **[docs/history.md](file:///Users/mac/Antigravity/youtubemanager/docs/history.md)**: 프롬프트 전달마다 생성되는 `implementation_plan`과 `walkthrough` 기록을 차례대로 누적해 모아보는 이력 관리 문서.
- 🛠️ **[docs/AI_WORKFLOW.md](file:///Users/mac/Antigravity/youtubemanager/docs/AI_WORKFLOW.md)**: 빌드, 검증 및 테스트 절차 가이드.
- 📌 **[docs/SESSION.md](file:///Users/mac/Antigravity/youtubemanager/docs/SESSION.md)**: 세션 상태 및 진행 현황.
- 📋 **[docs/TODO.md](file:///Users/mac/Antigravity/youtubemanager/docs/TODO.md)**: 구현 로드맵 및 기능 개발 태스크 리스트.
