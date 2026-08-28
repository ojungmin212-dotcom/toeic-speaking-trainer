# TOEIC Speaking 질문 듣기 트레이너 — 구현 계획

## 0. 시험 구조 확인 (요구사항 대비 검토)

현행 TOEIC Speaking 시험 구성 (총 11문항, 약 20분):

| 시험 파트 | 문항 | 과제 | 본 프로그램에서의 활용 |
|---|---|---|---|
| Part 1 | Q1–2 | 지문 읽기 (Read a text aloud) | 듣기 훈련 대상 아님 (제외) |
| Part 2 | Q3–4 | 사진 묘사 (Describe a picture) | 듣기 훈련 대상 아님 (제외) |
| Part 3 | Q5–7 | 듣고 질문에 답하기 (Respond to questions) | **핵심 훈련 대상** — Wh-의문문 패턴 인식 |
| Part 4 | Q8–10 | 제공된 정보를 사용하여 답하기 | **훈련 대상** — 일정/정보 확인 질문 |
| Part 5 | Q11 | 의견 제시하기 (Express an opinion) | **훈련 대상** — 의견/장단점/선택 질문 |

**결정 사항**:
- "질문을 듣고 의도를 파악하는 훈련"이 목표이므로 음성 질문이 존재하는 Part 3, 4, 5만 데이터베이스에 포함한다.
- Part 1(음독), 2(사진묘사)는 듣기 질문이 아니므로 제외한다. (요구사항의 "사진" 태그는 Part 2 대비용이었으나, 듣기 훈련 목적에 맞지 않아 MVP에서 제외)
- 실제 ETS 기출 문장은 사용하지 않고, 시험의 질문 구조·난이도를 참고한 자체 제작 연습 문항만 사용한다.
- 실제 시험 음성·특정 화자의 목소리는 복제하지 않는다. TTS는 중립적·명확한 안내 스타일을 목표로 한다.

## 1. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프론트엔드 | Vanilla JS (ES Modules) + HTML + CSS | 빌드/의존성 없음 → 최고 안정성, 어디서나 실행 |
| 서버 | `server.js` (Node 내장 http, 의존성 0) | 정적 파일 서빙 + TTS/LLM API 프록시 (.env 키 보호) |
| 데이터 저장 | localStorage (저장 계층 `store.js`로 추상화) | 개인 학습 도구에 충분, 추후 DB 교체 용이 |
| TTS | Provider Adapter — 기본: Web Speech API (키 불필요) / 선택: OpenAI TTS | 키 없이 즉시 동작, 교체 가능 |
| LLM | Provider Adapter — OpenAI / Anthropic (server 프록시 경유) | 키는 .env에만 저장 |
| 모바일 | Responsive + PWA (manifest + service worker) | 휴대폰 한 손 조작, 홈 화면 설치 |

## 2. 폴더 구조

```
/
├── index.html              SPA 진입점
├── server.js               정적 서빙 + /api/tts, /api/llm 프록시 (의존성 0)
├── manifest.webmanifest    PWA 매니페스트
├── sw.js                   서비스 워커 (정적 자원 캐시)
├── .env.example            환경변수 예시
├── AGENTS.md               개발 원칙
├── css/style.css           전체 스타일 (모바일 우선)
└── js/
    ├── app.js              라우터 + 앱 초기화
    ├── store.js            데이터 계층 (질문 CRUD + 학습 기록, localStorage)
    ├── seed-data.js        연습용 시드 질문 (자체 제작, 170 문항, SEED_VERSION으로 증분 배포)
    ├── tts.js              TTS Provider Adapter (webspeech / openai)
    ├── llm.js              LLM Provider Adapter (openai / anthropic)
    ├── srs.js              간이 Spaced Repetition (Leitner 박스)
    ├── player.js           운동 모드 시퀀스 재생기
    ├── ui.js               공용 UI 헬퍼
    └── views/
        ├── home.js         메인 화면
        ├── study.js        파트별 학습 (목록/상세)
        ├── exercise.js     운동 모드
        ├── listening.js    실전 듣기 모드
        ├── quiz.js         질문 유형 퀴즈
        ├── stats.js        학습 통계
        ├── admin.js        질문 관리 + AI 생성
        └── settings.js     설정 (음성/재생 옵션)
```

## 3. 데이터 모델

```js
Question {
  id: string
  part: 3 | 4 | 5                 // TOEIC Speaking 파트
  questionType: string            // time|place|frequency|reason|preference|
                                  // experience|person|action|choice|opinion|schedule
  difficulty: 1 | 2 | 3
  questionEnglish: string
  questionKorean: string
  answerEnglish: string           // 초보자용 짧은 모범답변
  answerKorean: string
  keyExpression: string           // 핵심 의문 표현 e.g. "How often"
  questionAudioUrl: string|null   // 사전 생성 음성 (선택; 기본은 실시간 TTS)
  answerAudioUrl: string|null
  status: 'approved'|'pending'    // AI 생성분은 pending → 검토 → approved
}

Progress (질문별, store에서 분리 관리) {
  correctCount, incorrectCount,
  favorite: boolean,
  box: 0..5,                      // Leitner 박스
  lastStudiedAt, nextReviewAt,
  listenCount                     // 반복 청취 횟수
}

DailyLog { date, listened, correct, incorrect, studySeconds }
```

질문 유형 ↔ 한국어 태그 매핑: time=시간, place=장소, frequency=빈도, reason=이유,
preference=선호, experience=경험, person=사람, action=행동, choice=선택,
opinion=의견(장단점 포함), schedule=일정/정보확인.

## 4. 화면 구조와 사용자 흐름

```
홈 ──┬─ 운동 모드      : 재생목록 선택 → 자동 시퀀스 재생 (화면 안 봐도 됨)
     ├─ 실전 듣기      : 음성만 듣기 → [질문 확인] → 원문+해석+유형 → 알았음/몰랐음
     ├─ 파트별 학습     : 파트 선택 → 질문 목록 → 상세 (음성/해석/모범답변/즐겨찾기)
     ├─ 질문 유형 퀴즈  : 음성 듣기 → 유형 4지선다 → 즉시 정답 → 오답은 취약 목록에
     ├─ 취약 질문 복습  : 오답·복습 예정 질문만 모아 실전 듣기 방식으로
     ├─ 학습 통계       : 오늘/누적/파트별/유형별 정답률, 취약 의문사, 연속 학습일
     ├─ 질문 관리       : CRUD, 일괄 생성(AI), 검토/승인, CSV·JSON Import/Export
     └─ 설정           : 음성(남/여), 속도, 생각 시간, 재생 단계 ON/OFF, 초보자 모드
```

**운동 모드 시퀀스** (각 단계 설정에서 ON/OFF):
영어 질문 → 생각 시간(3–5초, 조절 가능) → 한국어 해석 → 영어 모범답변 → 한국어 답변 해석 → 다음 질문 자동 재생.
재생 목록: 전체 / 파트별 / 틀린 문제만 / 즐겨찾기만 / 복습 예정만.

## 5. TTS / LLM 어댑터 설계

```
tts.js  →  speak(text, {lang, voice, rate})  // 호출부는 Provider를 모름
   ├─ WebSpeechProvider   : 브라우저 내장, 키 불필요 (기본값)
   └─ OpenAITTSProvider   : POST /api/tts → server.js가 .env 키로 호출

llm.js  →  generateQuestions(part, type, count)
   ├─ POST /api/llm → server.js가 .env의 LLM_PROVIDER/KEY/MODEL로 호출
   └─ 응답은 JSON 스키마 검증 후 status='pending'으로 저장 (검토→승인 필수)
```

API 키는 소스코드·localStorage에 저장하지 않는다. `.env` → server.js만 읽는다.
Web Speech API만 사용할 경우 서버 없이 정적 호스팅만으로도 전 기능 동작.

## 6. SRS (반복학습) 규칙

- Leitner 박스 0–5, 복습 간격: [0일, 1일, 3일, 7일, 14일, 30일]
- 정답 → box +1 (최대 5), 오답 → box 0 (즉시 재출제 대상)
- 출제 우선순위: ① nextReviewAt 지난 문제 ② 오답률 높은 문제 ③ 취약 유형 가중치 ④ 오래 안 본 문제

## 7. 구현 Phase

- **Phase 1**: 프로젝트 구조, 시드 DB(유형별 10문항+), 질문 목록/상세, 영·한 표시 — ✅
- **Phase 2**: TTS 어댑터, 음성 재생, 운동 모드(자동 시퀀스/자동 다음) — ✅
- **Phase 3**: 실전 듣기, 질문 유형 퀴즈, 정오답 기록, 취약 질문 저장, SRS — ✅
- **Phase 4**: 학습 통계, 질문 관리(CRUD/Import/Export), LLM 일괄 생성+승인 흐름 — ✅
- **Phase 5**: PWA(manifest/sw), Media Session(잠금화면 컨트롤), 모바일 UX 마감 — ✅

각 Phase 완료 시 브라우저에서 동작 확인 후 다음 Phase 진행.

## 8. 알려진 제약 (정직한 한계)

- Web Speech TTS는 브라우저·OS에 따라 목소리 품질이 다르다. iOS Safari는 화면 잠금 시
  speechSynthesis가 중단될 수 있다 → 잠금화면 재생이 꼭 필요하면 OpenAI TTS로 사전 생성한
  오디오 파일 재생 방식(Phase 5 이후 확장)이 필요하다. Media Session API로 가능한 범위까지 지원.
- localStorage는 브라우저 데이터 삭제 시 사라진다 → JSON Export로 백업 기능 제공.
