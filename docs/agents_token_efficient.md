# AI Token-Efficient Agent Configuration (AI 사용량 극소화 전용 지침)

이 문서는 `agents.md`의 표준 규칙 및 불변 조건을 기반으로 하되, **AI 모델의 토큰(Token) 소모량 및 API 사용 비용을 극단적으로 아끼기 위한 기술적 최적화 가이드라인**을 제공한다.

---

## 1. 토큰 절약을 위한 5대 핵심 기술 전략

```
┌─────────────────────────────────────────────────────────────┐
│                 AI Token Budget Optimization                │
├──────────────────────────────┬──────────────────────────────┤
│ 1. Context Slicing           │ Exact line range read only   │
│ 2. Diff-Only Edits           │ No full-file regurgitation   │
│ 3. Shell Log Filtering       │ Grep/Tail before feeding log │
│ 4. Zero-Fluff Communication  │ Bullet points & concise text │
│ 5. Lazy File Exploration     │ Targeted search via grep/fd  │
└──────────────────────────────┴──────────────────────────────┘
```

### Strategy 1: Targeted Context Reading (컨텍스트 슬라이싱)
- **금지**: 전체 파일(`view_file`)이나 대량의 코드 라인을 한 번에 Context Window로 읽어오는 행위.
- **적용**:
  - `grep_search` 또는 `find_by_name`으로 타겟 함수/클래스 위치를 먼저 식별.
  - `view_file` 호출 시 반드시 `StartLine`과 `EndLine`을 명시하여 타겟 영역(최대 50~100줄 내외)만 슬라이스해서 로딩.
  - `node_modules`, `target/`, `.git`, `dist/` 등 자동 생성 폴더 절대 스캔 금지.

### Strategy 2: Diff-Oriented Code Generation (최소 델타 출력)
- **금지**: 수정된 파일 전체를 다시 출력하거나 수백 줄의 코드를 응답으로 복사하는 행위.
- **적용**:
  - 기존 파일 수정 시 `replace_file_content` 도구를 사용하여 정확히 변경되는 치환 구문만 최소 토큰으로 수정.
  - 프롬프트 답변 작성 시 코드 전체 대신 변경된 핵심 메서드/함수 블록만 명시.

### Strategy 3: Command & Log Stream Filtering (로그 토큰 필터링)
- **금지**: 긴 빌드 로그, 린트 결과, 테스트 출력 전체를 AI 프롬프트에 그대로 유입시키는 행위.
- **적용**:
  - 터미널 명령 실행 시 `grep`, `head`, `tail` 등을 조합하여 실패/에러 라인만 조작 추출.
  - 예시: `cargo check 2>&1 | grep -i "error"` 또는 `npm run check | tail -n 20`

### Strategy 4: Concise & Direct Response Protocol (축약형 대화)
- **금지**: 서론/본론/결론 형태의 장황한 해설, 불필요한 친절 인사말, 의례적인 중복 요약.
- **적용**:
  - 결과보고는 핵심 수치, 변경 파일 링크([file_name](file:///path)), 다음 액션 아이템만 불릿 포인트(Bullet Points)로 전달.
  - 문제 발생 시 에러원인(1줄) -> 수정내용(1줄) -> 검증결과(1줄) 형식 유지.

### Strategy 5: Lazy Artifact & History Management (지연 기록 방식)
- **금지**: 매 사소한 변경마다 무거운 신규 문서 생성.
- **적용**:
  - implementation_plan과 walkthrough 내역은 신규 파일 양산 대신 `docs/history.md` 단일 파일 하단에 콤팩트한 Markdown 테이블/블록 형태로 축약 덧붙이기(Append).

---

## 2. Token-Efficient Agent Behavior Rules (에이전트 행동 지침)

1. **검색 최소화 규칙**: 동일 파일이나 동일 구성을 1회 이상 중복 탐색하지 말고, 이전 결과를 지식 컨텍스트로 재활용한다.
2. **서브에이전트(Subagent) 호출 제약**: 단일 작업 해결이 가능한 경우 서브에이전트를 생성하지 않는다. 병렬 탐색이 필수적인 경우에만 limited prompt로 호출한다.
3. **불필요한 Plan 생략**: 단일 줄 수정, 문구 변경, 간단한 파일 추가 등 단순 작업에는 planning mode 생략 후 직관 수행.
4. **인라인 기술 메모**: 긴 설계 문서 작성 대신 코드 내 간결한 JSDoc/Docstring 주석으로 기술 의도를 대체하여 토큰 중복 방지.

---

## 3. 베이스 agents.md와의 기능 비교

| 구분 | 표준 `agents.md` | 토큰 최적화 `docs/agents_token_efficient.md` |
| :--- | :--- | :--- |
| **목적** | 프로젝트 개발 표준 규칙 및 완벽성 보장 | AI 토큰 비용 최대로 아끼며 빠른 집행 |
| **코드 수정** | 상세 가이드 및 설계 설명 포함 | Diff 전용 슬라이스 수정만 집행 |
| **파일 읽기** | 맥락 파악을 위한 범위 탐색 허용 | Exact Line Slice (`StartLine`/`EndLine`) 강제 |
| **로그 수집** | 전체 오류 로그 상세 분석 | `grep`/`tail` 필터링 로그만 수집 |
| **이력 관리** | 문맥 중심 상세 기록 | `docs/history.md` 하단 단일 축약 누적 |
