# YouTube Manager Pro 실행 및 사용 가이드 (`docs/usage.md`)

본 문서는 **YouTube Manager Pro**의 백엔드 및 프론트엔드 서버 실행 방법, 브라우저 접속 방법, 그리고 주요 기능 활용 절차를 안내합니다.

---

## 1. 사전 요구사항

- **Node.js**: v18.0.0 이상 (현재 환경: v24.x)
- **npm**: v9.0.0 이상
- **FFmpeg**: `/usr/local/bin/ffmpeg` (설치 확인: `ffmpeg -version`)

---

## 2. 서버 실행 방법

### 방법 A: 루트 디렉토리에서 원클릭 동시 실행 (권장)

터미널을 2개 열고 아래 명령어를 각각 실행합니다.

#### 터미널 1: 백엔드 API 서버 실행 (포트 5001)
```bash
cd /Users/mac/Antigravity/youtubemanager
npm run start
```
> 백엔드 서버가 시작되며 SQLite WAL DB 및 썸네일 캐시가 초기화됩니다.

#### 터미널 2: 프론트엔드 UI 개발 서버 실행 (포트 4000)
```bash
cd /Users/mac/Antigravity/youtubemanager
npm run dev:frontend
```

---

### 방법 B: 각 디렉토리에서 개별 실행

#### 백엔드 서버 실행
```bash
cd /Users/mac/Antigravity/youtubemanager/backend
npm run start
```
- 개발 모드 (TypeScript 감지 실행): `npm run dev`

#### 프론트엔드 서버 실행
```bash
cd /Users/mac/Antigravity/youtubemanager/frontend
npm run dev
```

---

## 3. 웹 브라우저 접속 방법

서버가 실행되면 Chrome, Safari 등 웹 브라우저를 열고 아래 주소로 접속합니다.

- 🖥️ **메인 대시보드 UI (Frontend)**: **[http://localhost:4000](http://localhost:4000)**
- ⚙️ **백엔드 REST API 상태 확인**: **[http://localhost:5001/health](http://localhost:5001/health)**
- 📊 **시스템 및 채널 통계 API**: **[http://localhost:5001/api/stats](http://localhost:5001/api/stats)**

---

## 4. 주요 기능 사용 흐름

### ① 로컬 폴더 스캔 및 자동 인덱싱
1. 브라우저에서 `http://localhost:4000`에 접속합니다.
2. 좌측 사이드바의 **'로컬 디렉토리 스캔 & 감지'** 입력창에 탐색할 Mac 폴더 경로(예: `/Users/mac/Pictures`, `/Users/mac/Movies` 등)를 입력합니다.
3. **[폴더 스캔 & 증분 감지 시작]** 버튼을 클릭합니다.
4. 백엔드에서 비디오/사진을 재귀 스캔하고 FFmpeg로 썸네일을 일괄 생성하여 타일 그리드에 표시합니다.
5. 이후 해당 폴더에 파일이 추가/수정/삭제되면 **실시간 차분 인덱싱 엔진**이 100ms 이내에 화면을 자동 갱신합니다.

### ② Mac 퀵타임(QuickTime) / 미리보기(Preview)로 원본 열기
- 타일 그리드에서 미디어 카드의 **썸네일 이미지 영역을 클릭**하면:
  - **동영상**: Mac 기본 **QuickTime Player**가 즉시 실행되어 고화질 원본 영상을 재생합니다.
  - **사진**: Mac 기본 **미리보기 (Preview)** 앱이 실행되어 원본 사진을 엽니다.

### ③ 승인 / 기각 큐레이션 (Curation)
- 타일 카드의 **[승인]** 버튼(녹색)을 누르면 `Approved` 상태로 전환되어 유튜브 업로드 후보로 분류됩니다.
- **[기각]** 버튼(빨간색)을 누르면 업로드 목록에서 제외됩니다.
- 상단 사이드바의 상태 필터를 통해 승인됨/대기중/기각됨 항목만 모아볼 수 있습니다.

### ④ 동영상 구간 무손실 편집 (Stream Copy Trimmer)
1. 동영상 카드의 **[구간 편집]** 버튼을 클릭하여 트리머 모달을 엽니다.
2. 비디오를 재생하며 원하는 시작점(In Point)과 종료점(Out Point)을 설정합니다.
3. **[구간 무손실 잘라내기]**를 누르면 FFmpeg Stream Copy(`-c copy`)로 재인코딩 없이 1~2초 만에 원본 화질 그대로 추출되어 갤러리에 추가됩니다.

### ⑤ 사진 기반 AI 비디오 생성 랩 (AI Video Lab)
1. 사진 카드의 **[AI 영상 생성]** 버튼을 클릭합니다.
2. Runway Gen-3, Luma Dream Machine, Kling AI, Sora 등 타겟 AI 플랫폼을 선택합니다.
3. 자동 생성된 카메라 무빙 프롬프트를 **[클립보드 복사]**하여 외부 AI 사이트에서 생성합니다.
4. 다운로드한 생성 영상의 파일 경로를 입력하여 원본 사진과 1:1로 매핑 저장합니다.

### ⑥ 실제 Google Cloud Console OAuth2 설정 및 계정 연동
1. 브라우저 상단 우측의 **[Google API 설정]** 버튼을 클릭합니다.
2. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)에서 프로젝트를 생성하고 **YouTube Data API v3**를 활성화합니다.
3. **사용자 인증 정보 > OAuth 2.0 클라이언트 ID** 생성 (웹 애플리케이션 유형):
   - 승인된 리디렉션 URI: `http://localhost:5001/api/youtube/callback`
4. 발급된 **Client ID**와 **Client Secret**을 모달 창에 입력하고 **[설정값 저장]**을 누릅니다.
5. **[Google 계정 로그인]**을 누르면 구글 동의 화면이 열리며, 인증 완료 시 실제 채널 정보(채널명, 구독자 수, 썸네일)가 실시간 연동됩니다.

### ⑦ 유튜브 Resumable Chunked 실제 업로드
1. 승인된(`Approved`) 미디어 카드의 **[유튜브 아이콘]**을 클릭합니다.
2. 제목, 설명, 태그, 공개 상태(일부공개/공개/비공개), 예약 일시를 입력하고 **[대기열에 추가]**를 누릅니다.
3. 상단 네비게이션의 **[🚀 유튜브 업로드 & 스튜디오]** 탭으로 이동합니다.
4. **[업로드 시작]** 버튼을 누르면 연동된 실제 구글 계정으로 **8MB 단위 스트리밍 청크** 업로드가 수행되며, 완료 시 실제 `https://youtu.be/{videoId}` 링크가 생성됩니다.

---

## 5. macOS 데스크톱 애플리케이션 빌드 및 실행

본 프로젝트는 웹 브라우저 외에도 macOS 독립 실행형 데스크톱 앱으로 구동 및 패키징할 수 있습니다.

### 데스크톱 앱 실행 (Electron Dev Mode)
```bash
# 데스크톱 의존성 설치 (최초 1회)
npm run desktop:install

# 데스크톱 앱 실행
npm run desktop:start
```

### macOS 설치 파일 (.dmg / .app) 패키징
```bash
npm run package:mac
```
> 산출물은 `dist-desktop/` 폴더에 `YouTube Manager Pro.dmg` 및 `.app` 번들로 생성됩니다.

---

## 6. 문제 해결 (Troubleshooting)

- **Q: 5001 포트가 이미 사용 중이라는 오류가 발생합니다.**
  - 터미널에서 기존 프로세스를 종료합니다:
    ```bash
    lsof -i :5001 | awk 'NR>1 {print $2}' | xargs kill -9
    ```
- **Q: 썸네일 생성이 오래 걸립니다.**
  - 첫 스캔 시 수천 개의 영상은 키프레임 추출 작업이 백그라운드에서 비동기로 수행됩니다. 한 번 생성된 썸네일은 `~/.youtubemanager/thumbnails/`에 영구 캐싱되어 이후에는 즉시 로딩됩니다.
