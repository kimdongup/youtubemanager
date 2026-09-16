# AI Workflows & Verification Guide (`docs/AI_WORKFLOW.md`)

본 문서는 AI 에이전트와 개발자가 본 프로젝트에서 작업을 수행할 때 따라야 할 빌드, 검증 및 워크플로우 절차를 다룹니다.

---

## 1. 개발 및 빌드 검증 절차

### 1.1 Rust 백엔드 검증 (Tauri Core)
```bash
# 타입 및 컴파일 오류 즉시 체크 (속도 우선)
cargo check

# 릴리스 컴파일 검증
cargo build --release
```

### 1.2 프론트엔드 검증 (React UI)
```bash
# TypeScript 타입 검증 (noEmit)
npm run check

# Linter 검증
npm run lint
```

---

## 2. 대용량 미디어 & 메모리 검증 테스트

1. **메모리 프로파일링**:
   - 앱 구동 후 10,000개 이상의 미디어 파일 스캔 시 RSS(Resident Set Size) RAM 사용량이 100MB 이하인지 점검.
2. **FFmpeg Sidecar 타임아웃 테스트**:
   - 손상된 비디오 파일 스캔 시 Sidecar 프로세스가 고스트(Ghost) 프로세스로 남지 않고 안전하게 킬(Kill)되는지 확인.
3. **Chunk Upload 단절 재개 테스트**:
   - 네트워크 연결 해제 후 YouTube Resumable Upload의 Offset 재개(Resume) 처리 동작 검증.

---

## 3. AI 토큰 최적화 워크플로우 가이드

1. 파일 조율 시 전체 읽기를 지양하고 `grep_search`로 exact location 발견 후 `StartLine`/`EndLine` 옵션으로 소부분만 로딩.
2. 대용량 터미널 출력은 `grep` 또는 `tail`을 통해 필터링 후 확인.
3. 모든 작업 수행 내역은 `docs/history.md`에 단일 엔트리로 누적 요약 작성.
