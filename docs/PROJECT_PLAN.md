# 대용량 미디어 관리 및 유튜브 자동 업로드 프로그램 기획서

## 1. 개요 및 목적
본 프로젝트는 특정 폴더 내에 존재하는 수천~수십만 개 이상의 대용량 영상(4K/8K, 수십 GB~수백 GB) 및 고화질 사진 파일들을 메모리 사용량을 최소화하면서 효율적으로 탐색·인덱싱·관리하고, 수동/자동 검토 과정을 거쳐 유튜브(YouTube) 플랫폼에 원활하게 업로드할 수 있는 데스크톱 애플리케이션을 구축하는 것을 목적으로 합니다.

---

## 2. 핵심 기술적 요구사항 및 해결 방안

### 2.1 메모리 사용 최적화 (Memory-Efficient Architecture)
- **문제점**: 대용량 동영상/사진 파일을 애플리케이션 메모리(RAM)에 direct로 로딩할 경우 `OutOfMemory` 오류 또는 성능 저하 발생.
- **해결책**:
  1. **Zero-Copy & File Path Reference**: UI 및 IPC(Inter-Process Communication) 경계에서 비디오/사진 데이터 바이너리를 직접 전달하지 않고 파일 경로(Path)만을 전달.
  2. **Stream-based Chunked Handling**: 파일 전체를 메모리에 올리지 않고 8MB~16MB 단위 스트림 뷰어를 사용하여 필요 부분만 인클루드.
  3. **Virtual Scrolling (가상 스크롤)**: UI 렌더링 시 수만 개의 항목이 있더라도 뷰포트(Viewport)에 보이는 20~30개의 DOM 요소만 렌더링.
  4. **Thumbnail LRU Cache & Automatic Eviction**: 썸네일 이미지는 디스크 메모리 맵 방식으로 저장하고, 메모리 내 썸네일 캐시는 LRU(Least Recently Used) 알고리즘으로 자동 해제.

### 2.2 대용량 파일 핸들링 (Large File Handling)
- **미디어 메타데이터 & 썸네일 추출**:
  - **FFmpeg CLI Native Sidecar Protocol**: 프로세스 격리형 FFmpeg 바이너리를 실행하여 하드웨어 가속(macOS `videotoolbox`, Windows `NVENC/QuickSync`)을 활용.
  - 영상 전체를 디코딩하지 않고 키프레임(Keyframe) 단위 fast-seek로 1프레임만 스트리밍 추출하여 썸네일 생성.
- **고속 파일 인덱싱 & 디스크 I/O**:
  - **SQLite WAL (Write-Ahead Logging) Mode**: 디렉토리 스캔 결과를 SQLite 내장 DB에 저장하여 memory footprint를 수십 MB 수준으로 고정하면서 빠른 검색/필터링 지원.
  - **XXHash / Blake3 Fast Hashing**: 중복 파일 검사 시 파일 전체가 아닌 Header + Tail + Size 조합의 초고속 Hashing 적용.

### 2.3 유튜브 업로드 최적화 (YouTube Upload Pipeline)
- **YouTube Data API v3 - Resumable Upload Protocol**:
  - 네트워크 단절이나 대용량 파일 업로드 실패에 대응할 수 있도록 Resumable Upload 세션을 생성.
  - HTTP `PUT` 요청 시 `Content-Range` 헤더와 함께 8MB~16MB Chunk 단위로 스트리밍 송신. 업로드 중 RAM 사용량 50MB 미만 유지.
  - 업로드 재개(Resume) 및 진행률(Progress) 실시간 피드백 제공.

### 2.4 미디어 큐레이션 및 승인/기각 파이프라인 (Media Curation Pipeline)
- **검토 상태 트리거**: 수많은 타일/그리드 파일들에 대해 일괄 또는 개별 검토 수행.
  - `Approved` (승인): 유튜브 업로드 후보 대기열로 이동.
  - `Rejected` (기각): 업로드 목록에서 제외 및 사유 기록.
  - `Pending` (대기): 최초 스캔 상태.
- **태깅 & 메타데이터 프리셋**: 카테고리, 공개범위(공개/일부공개/비공개), 플레이리스트, 태그 템플릿을 승인 시점에 즉시 할당.

### 2.5 사진 → AI 비디오 생성 및 변환 파이프라인 (Image to AI Video Pipeline)
- **사진 베이스 판단**: 미디어 타입이 사진(JPG, PNG, HEIC 등)일 경우, 이를 직접 업로드할 것인지 AI 동영상으로 전환 생성할 것인지 결정.
- **AI 플랫폼 지정 & 프롬프트 할당**:
  - 적용할 외부 AI 비디오 서비스 선택: `Runway Gen-2/Gen-3`, `Luma Dream Machine`, `Kling AI`, `Sora`, `Stable Video Diffusion` 등.
  - 이미지에서 생성할 카메라 무빙 및 프롬프트 가이드 생성.
- **수동 추가 및 매핑 연결**: 생성된 AI 영상 파일을 사용자가 수동으로 프로젝트 폴더에 추가하면, 원본 사진 카드와 1:1 하이퍼링크 연결 및 AI 세대 버전 관리.

### 2.6 동영상 구간 지정 및 슬라이싱 (Trimming & Range Selection)
- **In / Out Timecode 편집**: 선택된 동영상의 시작 지점(Start Timecode, 예: `00:01:15`)과 종료 지점(End Timecode, 예: `00:03:45`) 지정.
- **FFmpeg Stream Copy (무손실 고속 편집)**:
  - 재인코딩(Re-encoding) 과정 없이 비디오/오디오 코덱 스트림을 그대로 복사하여 수 초 만에 무손실 구간 잘라내기 수행 (`ffmpeg -ss [start] -to [end] -c copy`). CPU/메모리 부하 극소화.

### 2.7 자체 자동 증분 인덱싱 엔진 (Differential Indexing Engine)
- **최초 타일 스캔 & 썸네일 파이프라인**:
  - 지정 폴더 등록 시 전체 파일을 스캔하여 썸네일 그리드 타일 및 DB 인덱스 일괄 구축.
- **실시간 파일시스템 감지 (FS Watcher)**:
  - Rust `notify` crate를 통해 로컬 폴더의 파일 **생성(Create), 수정(Modify), 삭제(Remove), 이름변경(Rename)** 이벤트를 비동기 감지.
- **차분 갱신 (Incremental Rescan & Sync)**:
  - 변경이 감지된 특정 파일만 차분(Delta)으로 썸네일을 재추출하거나 DB 인덱스를 수정/삭제. 전체 재스캔 없이 100ms 이내 실시간 갱신.

---

## 3. 참조 프로젝트 분석 및 기술 스택 선정

인터넷 검색 및 유사 프로젝트(Immich, Auto-Editor, Media-Uploader, Rust/Tauri 기반 대용량 미디어 처리 아키텍처) 참조 결과:

| 구분 | 추천 선정 기술 | 선택 사유 및 비교 분석 |
| :--- | :--- | :--- |
| **Desktop Platform** | **Tauri 2.0 (Rust + Web)** | Electron(RAM 300MB~1GB 사용)에 비해 **Tauri는 RAM 30~50MB 수준**으로 극도의 메모리 효율을 보임. |
| **Backend & Core** | **Rust** | Zero-cost abstractions, 메모리 안전성, C++ 수준의 파일 I/O, `notify` FS Watcher 및 비동기 파이프라인 성능. |
| **Frontend UI** | **React 18 + TypeScript + TailwindCSS** | 사용자 친화적 UI 구성 및 컴포넌트 생태계 활용. |
| **Media Engine** | **FFmpeg CLI (Sidecar Process)** | FFmpeg 라이브러리를 직접 메모리에 바인딩하기보다 독립 사이드카 프로세스로 실행하여 메모리 누수 격리 및 Stream Copy 지원. |
| **Local Database** | **SQLite (via Rusqlite / WAL mode)** | 외부 DB 서버 필요 없이 단일 파일 DB로 대용량 미디어 목록 인덱싱 및 빠른 쿼리 지원. |
| **Virtualization** | **TanStack Virtual (react-window)** | 수만 개의 사진/영상 카드가 존재해도 렌더링 성능 및 메모리 점유율을 일정하게 유지. |
| **API Client** | **reqwest (Rust Async HTTP)** | Resumable chunk streaming 업로드 처리를 위해 Rust 비동기 I/O 기반 HTTP 클라이언트 사용. |

---

## 4. vling.net 벤치마크 및 본 서비스 포지셔닝 분석

### 4.1 vling.net 플랫폼 분석
- **주요 기능**: 유튜버 탐색/검색, 마케팅 캠페인 관리, 경쟁 채널 데이터 분석, 엔터프라이즈 마케팅 매칭 SaaS.
- **주요 목적**: 대외적 데이터 분석, 인플루언서 마케팅 자동화 및 채널 통계 조회 (B2B / 광고주 / 마케터 중심).

### 4.2 본 애플리케이션의 차별화 포지셔닝
- **서비스 포지션**: **"내 채널 콘텐츠 제작·큐레이션·대용량 로컬 미디어 파이프라인 파워툴 (Local-First Content Curation & Lifecycle Power-Tool)"**
- **차별점**:
  - vling.net이 외부 채널 분석 및 마케터용 플랫폼이라면, 본 앱은 **유튜버 개인 및 크리에이터 팀 내부의 대용량 로컬 파일 큐레이션, 썸네일 자동 생성, 승인/기각 검토, 사진→AI 영상 변환, 구간 편집(Trimming), 직접 유튜브 Resumable 업로드**에 집중하는 **실무 생산성 로컬 대시보드**임.

---

## 5. 최적화된 화면 구성 계획 (UI/UX Layout)

애플리케이션은 **3대 메인 탭(Main Navigation)**으로 구성되어 크리에이터의 미디어 큐레이션부터 유튜브 업로드까지의 흐름을 최적화합니다.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] YouTube Manager Pro   │ [📁 로컬 미디어 갤러리] [🧪 AI & 편집 랩] [🚀 유튜브 업로드]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────┐ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📁 폴더 & 필터 트리    │ │ 🖼️ 미디어 그리드 (Virtual Scroll Tile View)             │ │
│ │ - 전체 파일 (12,450)    │ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │ │
│ │ - 🟢 승인됨 (142)      │ │ │ [Thumbnail│ │ [Thumbnail│ │ [Thumbnail│ │ [Thumbnail│     │ │
│ │ - 🔴 기각됨 (35)       │ │ │  VID_001]│ │  IMG_002]│ │  VID_003]│ │  IMG_004]│     │ │
│ │ - 🟡 대기중 (12,273)   │ │ │ [승인/기각]│ │ [AI변환] │ │ [구간편집]│ │ [대기]    │     │ │
│ │                        │ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │ │
│ │ 🏷️ 미디어 타입          │ └─────────────────────────────────────────────────────────┘ │
│ │ - 📹 비디오 (8,100)    │ ┌─────────────────────────────────────────────────────────┐ │
│ │ - 🖼️ 사진 (4,350)      │ │ 🔍 선택된 미디어 상세 패널 (In/Out Trimmer & Metadata)  │ │
│ └────────────────────────┘ └─────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Main Tab 1: 📁 로컬 미디어 갤러리 (Tile & Curation View)
- **왼쪽 사이드바**: 디렉토리 트리, 승인/기각/대기 상태 필터, 사진/동영상 분류 필터.
- **메인 영역 (타일 그리드)**:
  - 가상 스크롤(Virtual List) 기반 타일 뷰.
  - 타일 카드 액션: 승인(`Green`), 기각(`Red`), 구간 편집(`Trimmer`), AI 비디오 변환 설정.
  - 자체 증분 인덱싱 엔진과 연동되어 파일 추가/삭제 시 자동 타일 갱신.
- **하단 상세 패널**: 선택된 미디어의 비트레이트, 해상도, 프레임레이트, 용량 메타데이터 표시.

### 5.2 Main Tab 2: 🧪 AI 비디오 & 타임코드 편집 랩 (AI & Trimming Lab)
- **동영상 구간 지정 (Trimmer)**:
  - 비디오 플레이어 타임라인에서 In/Out 핀 세팅.
  - FFmpeg Stream Copy 버튼 클릭 시 무손실 추출 영상 즉시 생성.
- **사진 → AI 비디오 변환기**:
  - 선택한 사진에 대해 생성할 AI 모델(Runway, Luma, Kling 등) 태그 지정 및 프롬프트 메모.
  - 완공된 AI 영상 파일 수동 드래그-앤-드롭 추가 시 원본 사진과 파이프라인 자동 바인딩.

### 5.3 Main Tab 3: 🚀 유튜브 업로드 & 내 채널 스튜디오 (Upload & Studio)
- **업로드 대기열 (Approved Queue)**:
  - '승인됨(Approved)' 상태의 미디어 카드들이 자동 등록됨.
  - 제목, 설명, 태그, 카테고리, 공개여부(공개/일부공개/비공개), 예약 게시 일시 설정.
- **Resumable Uploader**:
  - 8MB Chunk Stream 업로드 진행률(ProgressBar) 및 네트워크 연결 재개 기능.
- **유튜브 내 채널 현황 (Channel Studio View)**:
  - 최근 업로드된 비디오의 조회수, 좋아요, 댓글 및 업로드 상태 모니터링 (vling.net의 내 채널 분석 일부 벤치마킹 요소 반영).

---

## 6. 단계별 개발 로드맵

1. **1단계: 파일 스캐너, SQLite 인덱서 & 증분 인덱싱 엔진 구축**
   - 로컬 폴더 감지, 재귀적 스캔, SQLite WAL 데이터베이스 연동 및 `notify` FS Watcher 연동.
2. **2단계: FFmpeg Sidecar 썸네일, Trimming & 메타데이터 추출기 구현**
   - 메모리 안전 비동기 파이프라인으로 썸네일 가공 및 무손실 구간 잘라내기(Stream Copy) 구현.
3. **3단계: 승인/기각 타일 갤러리 UI & AI 비디오 라벨링 구현**
   - React + TanStack Virtual 기반 타일 뷰, 승인/기각 토글, 사진-to-AI 영상 연결 인터페이스 구축.
4. **4단계: YouTube OAuth2 인증 & Resumable Uploader 개발**
   - Google OAuth2 로그인 및 8MB Chunk Stream 업로드 연동.
5. **5단계: 유튜브 내 채널 대시보드 & 배치 프로세서 통합**
   - 업로드 대기열 배치 처리 및 내 채널 모니터링 뷰 완성.
