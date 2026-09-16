# YouTube Manager Agent Guidance

이 파일은 저장소 전체에 적용되는 Codex / AGY / Claude AI 에이전트 및 개발자를 위한 기본 작업 지침서이다. 버전, 브랜치와 현재 진행 상태처럼 자주 바뀌는 정보는 이 파일에 직접 복사하지 않고 `docs/SESSION.md`와 `docs/TODO.md`에서 관리한다.

---

## 1. 작업 시작 절차

1. 작업 시작 시 반드시 `readme.md`, `docs/PROJECT_PLAN.md`, `docs/SESSION.md`, `docs/TODO.md`를 먼저 순서대로 확인한다.
2. Git 상태와 최근 커밋 이력을 확인하고, 사용자의 미커밋 변경 사항이나 로컬 환경 설정 파일(`settings.json`, `.env` 등)을 보존한다.
3. 주요 설계 이유가 필요한 경우 `docs/DECISIONS.md`, 기술적 세부 구현 사항은 `docs/PROJECT_PLAN.md`, 알려진 제약 조건은 `docs/KNOWN_ISSUES.md`를 참조한다.
4. 빌드, 검증 및 AI 작업 흐름은 `docs/AI_WORKFLOW.md` 기준을 엄격히 준수한다.
5. 이전 작업 이력 및 계획 변경 사항은 `docs/history.md`를 통해 추적한다.

---

## 2. 협업 및 코드 수정 원칙

- **분석 요청 시 수정 금지**: 사용자가 코드 검토, 문제 진단, 원인 파악 또는 대화를 요청한 경우 파일을 임의로 수정하지 않는다.
- **사전 승인 원칙**: 대규모 아키텍처 변경이나 파일 구조 변경 시, 기존 실행 흐름과 영향도를 먼저 분석하고 수정 계획을 설명한 후 사용자의 explicit 승인 하에 진행한다.
- **최소 범위 변경**: 요청받은 범위에 필요한 최소한의 변경만 수행하며, 기존 작동 기능, 사용자 설정, 미커밋 코드를 훼손하지 않는다.
- **사실에 입각한 진단**: 확실히 검증되지 않은 추측을 사실로 기록하지 않으며, 실제 재현되지 않은 현상을 단정적으로 버그로 정의하지 않는다.
- **실물 테스트 구분**: 실제 YouTube API 연동 테스트나 실기 환경 테스트처럼 AI가 직접 수행 불가능한 검증은 "성공"이라 단정 짓지 않고 "미확인 실기 검증 필요 항목"으로 밝힌다.
- **관련 없는 리팩터링 금지**: 요청 작업 범위와 무관한 임의 코드 스타일 변경, 신규 패키지 추가, 빌드 방식 변경을 병행하지 않는다.

---

## 3. 핵심 아키텍처 및 불변 조건 (Invariants)

- **메모리 최적화 우선순위 (Memory Safety First)**:
  - 파일 바이너리 데이터를 UI/IPC 통신 파이프라인으로 직접 전달하지 않는다. 항상 OS 파일 경로(Path) 참조 방식으로 처리한다.
  - 대용량 비디오/사진 디코딩 시 전체 파일 로딩을 엄격히 금지하며, FFmpeg Sidecar 프로세스를 통한 키프레임 스트리밍 디코딩을 유지한다.
- **Tauri + Rust 기반 백엔드 준수**:
  - 시스템 파일 Access, SQLite WAL DB 핸들링, Resumable Chunk HTTP 스트리밍은 Rust 백엔드 레벨에서 처리한다.
- **YouTube API Resumable Protocol**:
  - 비디오 업로드 시 YouTube Data API v3의 Resumable Upload 표준을 준수하며, Chunk Size는 최소 8MB 단위 스트림으로 고정한다.
- **UI 메모리 격리 (Virtualization)**:
  - 갤러리/그리드 UI는 수만 개 미디어 항목 렌더링 시 반드시 가상 스크롤(Virtual List)을 적용하여 DOM 노드 수 및 메모리 사용량을 고정한다.

---

## 4. 사용자 데이터 및 보안 규칙

- 사용자의 `settings.json`, API 키(`client_secret.json`, OAuth 토큰), 런타임 테스트 파일을 절대 덮어쓰거나 Git 저장소에 추적(Track)하지 않는다.
- OAuth Client Secret 및 Refresh Token은 OS 전용 Secure Storage(Keychain, Credential Manager) 또는 암호화된 로컬 파일에 보관한다.
- 불필요한 임시 썸네일 캐시는 세션 종료 또는 가비지 컬렉션 주기에 맞춰 안전하게 삭제한다.

---

## 5. 검증 및 테스트 가이드

- **빌드 검증**: Rust 백엔드 코드 변경 후 `cargo check` 및 `cargo build --release`로 컴파일 오류 유무를 확인한다.
- **프론트엔드 검증**: TypeScript 타입 체크 및 린트를 위해 `npm run check` 또는 `tsc --noEmit`을 실행한다.
- **메모리 누수 검증**: 대용량 파일 탐색 시 RAM 사용량이 100MB 이상 급증하지 않는지 상시 모니터링한다.

---

## 6. Git, 문서화 및 이력 관리

- **단일 목적 커밋**: 한 번의 수정 작업에는 한 가지 목적만 담는다.
- **사용자 승인 필수 항목**: Git commit, merge, tag, push, external publish 등은 사용자의 명시적 지시가 있을 때만 진행한다.
- **문서 동기화**: 기능 또는 구조가 변경될 때마다 관련 문서(`docs/PROJECT_PLAN.md`, `docs/SESSION.md`, `docs/TODO.md`)를 즉시 업데이트한다.
- **히스토리 기록**: 대규모 계획 수립(`implementation_plan`) 및 결과 검증(`walkthrough`) 내역은 반드시 `docs/history.md`에 순차적으로 누적 작성한다.
