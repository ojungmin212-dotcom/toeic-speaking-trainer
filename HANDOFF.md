# HANDOFF — TOEIC Speaking 질문 듣기 트레이너

> 다른 계정·다른 PC의 Claude Code 세션에서 이 프로젝트를 이어받기 위한 인수인계 문서.
> 작성 시점: 2026-10-09 · 갱신: 2026-10-15 (실제 시험 형식 v6, Part 1·2 v7, 다음 단계 3·4·5·7·8 완료)

---

## 1. 프로젝트 목적

영어 듣기가 약한 초보 학습자가 **운동·이동 중 이어폰만으로** 토익스피킹 질문을 반복 청취해,
질문을 듣자마자 "무엇을 묻는 질문인지"(When=시간, Where=장소, How often=빈도, Why=이유 …) 파악하는 능력을 기르는 웹앱.
모든 판단 기준은 `AGENTS.md`의 "프로젝트 목표" 한 문장이다.

- **배포 주소**: https://ojungmin212-dotcom.github.io/toeic-speaking-trainer/
- **저장소**: https://github.com/ojungmin212-dotcom/toeic-speaking-trainer (public, 브랜치 `master`, GitHub Pages source = `master /`)
- **로컬 경로**: `E:\클로드\26-08-29-1` (이전 세션들은 `C:\Users\Win\Desktop\클로드\26-08-29-1`에서 작업 — 같은 저장소)

## 2. 아키텍처 요약

빌드 도구·npm 의존성 없는 **정적 SPA (Vanilla JS ES Modules)** + 선택적 로컬 Node 서버.

```
index.html          사이트 머리(상단 바·메뉴·모바일 드로어)·하단, #app 마운트
css/style.css       전체 디자인 (흰 바탕 평면형, 진한 그린 강조, 나눔바른고딕)
fonts/              나눔바른고딕 woff2 (OFL, LICENSE.txt 포함)
js/app.js           해시 라우터 (#/study/part/5/q/seed-081 등) + 메뉴 활성 표시
js/store.js         데이터 계층 (localStorage) — UI는 반드시 여기만 통한다
js/sets-part1.js    Part 1 지문 읽기 20개 (끊어 읽기 guide 포함)
js/sets-part2.js    Part 2 사진 묘사 20개 (images/p2-XX.jpg, IL/IM/IH/AL 묘사)
js/sets-part3.js    Part 3 세트 34개 (상황 안내 + Q5·Q6·Q7, 문항마다 IL/IM/IH/AL 영·한)
js/sets-part4.js    Part 4 세트 10개 (일정표 + 질문자 안내 + Q8·Q9·Q10)
js/sets-part5.js    Part 5 Q11 40문항 (찬반·선택·장단점)
js/seed-data.js     세트를 펼쳐 SEED_QUESTIONS(212)·SEED_SETS 생성, 유형/레벨/파트, TEST_TIMING, SEED_VERSION
js/tts.js           음성 어댑터: 사전생성 mp3 → OpenAI TTS → Web Speech 폴백, 세대 토큰 취소
js/player.js        듣기 모드 시퀀스 재생기 (무음 오디오로 대기 → 화면 잠금 대응, Media Session)
js/srs.js           간이 Leitner 반복학습 가중치
js/llm.js           AI 문항 생성: Part 1 지문 · Part 3/4 세트 · Part 5, IL~AL 4레벨, JSON 스키마 구조화 출력 (server.js /api/llm, 로컬 전용)
js/content-rules.js 콘텐츠 규격 규칙 — tools/check-content.mjs와 관리 화면(AI 문항 자동 검사)이 함께 씀
js/expressions.js   AL·IH 고급 표현 사전 (강조 표시·뜻)
js/shadow.js        쉐도잉: 문장별 재생 → 따라 말할 시간 (audio/timings.json의 문장 구간 사용)
js/sync.js          기기 간 동기화 코드(gzip+base64url "TST1:")·파일 공유 — 병합 로직은 store.mergeSync
js/student-answers.js 대학생 화자 모범답변 82문항 × 4레벨 (코드 전용, localStorage에 안 넣음)
js/ui.js            공용 UI 헬퍼 (아이콘, 레벨 선택기, escapeHtml, CSV 파일 인코딩 감지)
js/views/*.js       화면: home, study(목록·상세·이전/다음), exercise(듣기 모드), listening(실전 듣기·취약 복습),
                    quiz, stats, admin(질문 관리), settings
sw.js               서비스 워커 (앱 자원 네트워크 우선, 오디오 캐시 우선 + Range 206 합성)
server.js           로컬 전용: 정적 서빙 + /api/tts, /api/llm 프록시 (.env 키 사용), 포트 8123
images/             Part 2 사진 20장 (Unsplash 무료 라이선스, CREDITS.txt)
audio/              신경망 TTS mp3 + manifest.json (키: "en|문장" / "ko|문장") + timings.json (영어 mp3의 문장별 시작·끝 초, 쉐도잉용)
tools/              export-texts.mjs(음성 대상 추출) → generate_audio.py(edge-tts 생성·정리), check-content.mjs(콘텐츠 규격 검사)
시작.bat / 음성생성.bat   로컬 실행 / 음성 일괄 생성
```

**데이터 흐름**: 시드(sets-part3/4/5 → seed-data) → `store.init()`이 localStorage에 병합(SEED_VERSION 비교, 시드에서 빠진 문항 제거) →
세트 정보(상황 안내·일정표)는 localStorage에 넣지 않고 `store.getSet(setId)`로 코드에서 읽음 →
화면은 `store.getQuestions/getAnswer(q, level)` 등으로만 접근 → 학습 기록(progress/daily)도 localStorage.
**음성**: `tts.speak(text, lang)` → manifest에서 `lang|text` 키로 mp3 찾기 → 없거나 재생 실패 시 다음 Provider.

## 3. 진행 상황

### 완료 (배포됨)
- 핵심 모드: 듣기 모드(자동 시퀀스·신호음·생각/답변 시간 최대 60초), 실전 듣기, 질문 유형 퀴즈, 취약 질문 복습(SRS), 학습 통계, 질문 관리(CRUD·CSV/JSON·AI 생성 검토 흐름), 설정
- 콘텐츠 (v6, 2026-10-14 전면 교체): **실제 시험과 같은 구성**의 자체 제작 172문항, 문항마다 IL/IM/IH/AL 4레벨 모범답변(영·한)
  - Part 3: 세트 34개 = 상황 안내 + Q5(두 가지 묶음 질문) + Q6 + Q7(30초형) → 102문항
  - Part 4: 세트 10개 = 일정표 + 질문자 안내 + Q8(사실 두 가지) + Q9(잘못된 정보 정정) + Q10(두 번 들려줌, 여러 항목 안내) → 30문항
  - Part 5: 40문항 = 찬반 16 · 둘 중 선택 8 · 보기 중 선택 8 · 장단점 8 ("Use specific reasons and examples…")
  - 옛 단문 문항(seed-001~170)은 v6 병합 때 제거되고 그 문항별 기록도 정리됨 (날짜별 학습량·연속일·설정·사용자 추가 문항은 유지)
- Part 1·2 (v7, 2026-10-15): 지문 읽기 20(모범 낭독 + 끊어 읽기·강세 가이드) · 사진 묘사 20(Unsplash 사진, 4레벨 묘사).
  듣기 모드에서 Part 1은 모범 낭독 → 따라 읽을 시간 → 해석, Part 2는 사진 표시 → 지시문 → 묘사할 시간 → 모범 묘사.
  퀴즈·실전 듣기·전체 학습은 질문 파트(3~5)만 사용 (TASK_PARTS)
- 실제 시험 형식 지원 UI: 목록의 세트 머리(상황 안내 🔊), 상세의 일정표 표·상황 안내 카드·Q번호/응답 시간, 두 유형 배지(시간 + 장소)·두 핵심 표현 강조,
  듣기 모드의 세트 순서 재생(안내 → Q5→Q6→Q7)·Q10 두 번 재생·생각 시간 '실전'(문항별 준비/응답 시간), 퀴즈의 두 가지 유형 처리
- 음성: edge-tts 신경망 음성 mp3 (영어 여 Aria / 남 Guy, 한국어 SunHi), 파일명에 텍스트 해시
- 모바일/PWA: 홈 화면 설치, 오프라인 캐시, 화면 잠금 재생 대응, 이어폰 컨트롤
- 파트·레벨별 학습: 목표 레벨 선택, 상세의 레벨 탭 비교, 이전/다음 이동(버튼·스와이프·상단 ‹ ›)
- 디자인: 온라인 강의 사이트형 평면 디자인 + 나눔바른고딕, 강조색 진한 그린 (빨강 없음)

- 쉐도잉 (2026-10-15): 상세 화면 '문장별 따라 말하기' 버튼, 듣기 모드 '쉐도잉' 토글. 모범답변(Part 1은 지문)을 문장 단위로
  신경망 mp3 구간 재생(`#t=start,end` + timeupdate 정지) → 문장 길이 × 1.3 + 0.8초 따라 말할 시간. timings가 없으면 브라우저 음성으로 문장별 폴백
- AL 포인트: IH·AL 답변의 고급 표현 색 강조 + 뜻 목록, IH ↔ AL 나란히 비교 (모든 AL 답변에 사전 표현 2개 이상 — 검사기 확인)
- AI 생성 확장: 세트 단위(상황 안내·일정표 + 3문항) + 4레벨 답변, 기존 주제 중복 회피, 생성 결과에 자동 규격 검사 메모,
  세트 단위 승인/거부, 고치면 재검사. AI 세트는 `tst.userSets.v1`에 저장(백업·동기화 포함). 기본 모델 claude-opus-5-5,
  서버 측 대체 모델(fallbacks) 사용, 거절·길이 초과는 명확한 오류 메시지. 실제 키로는 테스트하지 못함(이 PC에 .env 없음) — 가짜 업스트림으로 요청 형태·전 흐름 검증
- 기기 간 동기화(서버 없음): 설정 → 코드 복사/파일로 보내기 → 다른 기기에서 붙여넣기·파일 합치기. 덮어쓰지 않고 병합
- 대학생 화자: 설정·학습 홈·듣기 모드의 '답변 화자' (직장인/대학생), 상세 화면에서는 비교용 토글. 직장 맥락이 있던 Part 3 42문항 + Part 5 40문항

### 진행 중
- 없음

### 다음 단계
1. **실제 휴대폰 테스트** (사용자 직접): iPhone/Android에서 화면 잠금 상태 듣기 모드 연속 재생·쉐도잉, 이어폰 버튼,
   설정 → 기기 간 동기화(코드 복사·공유 시트). 웹앱 한계로 iOS에서 간헐 중단 가능성이 남아 있음
2. **AI 생성 실제 키 테스트** (.env에 LLM_PROVIDER=anthropic, LLM_API_KEY): 생성 품질·소요 시간 확인, 프롬프트 다듬기
3. (선택) 자동 동기화가 필요해지면 서버·로그인 기반으로 — 지금은 수동 코드/파일 병합
4. ~~쉐도잉~~ · ~~AL 포인트 강조~~ · ~~대학생 화자~~ · ~~AI 세트·4레벨 생성~~ · ~~기기 간 동기화~~ → 2026-10-15 완료

## 4. 설계 결정과 이유

| 결정 | 이유 |
|---|---|
| 빌드 없는 Vanilla JS + 정적 호스팅(GitHub Pages) | 설치·빌드 실패 요소 제거, 무료 영구 호스팅, 어디서나 접속 |
| localStorage + `store.js` 단일 진입점 | 개인 학습 도구라 서버 불필요. 저장소 교체 시 store.js만 바꾸면 됨 |
| 음성은 **사전 생성 mp3**(edge-tts) 우선 | 브라우저 TTS가 "로봇 같다"는 피드백. 신경망 음성 + 키 불필요 + 모든 브라우저 동일 품질 |
| mp3 파일명 = `id-구분-텍스트해시8자-성별.mp3`, manifest 키 = `lang\|정확한 문장` | 문장을 고치면 새 파일이 생겨 "옛 음성이 새 문장에 재생"되는 문제 방지. 재생성 시 기존 파일 건너뜀 |
| 실제 시험 성우 음성 복제 안 함 | 저작권·음성 초상권. 사용자 요청("100% 동일하게")은 이 이유로 거절하고 대안 제시함 |
| 취소는 **세대 토큰**(`gen++`) | 정지·스킵 후 유령 오디오, 두 음성 겹침을 근절 |
| 재생 실패 시 Provider 폴백, 3문항 연속 무음이면 자동 일시정지 | 자동재생 차단·오프라인에서 "무음 폭주" 방지 |
| 생각 시간/간격을 타이머 대신 **무음 wav 재생** | 화면 잠금 시 백그라운드 타이머 스로틀링 회피 |
| 공유 `<audio>` 엘리먼트를 첫 터치에 unlock | iOS/Android 자동재생 정책 |
| 외부 인터럽션(통화)은 일시정지로 처리 | 통화 중 문항이 무음으로 소모되는 문제 |
| SW: 앱 자원 네트워크 우선 + `no-cache`, 오디오 캐시 우선 + Range 206 합성, 오디오 캐시 분리(`tst-audio-v1`) | 배포 후 옛 화면 방지 / iOS는 audio에 항상 Range 헤더 / 앱 업데이트해도 받은 음성 유지 |
| SEED_VERSION으로 시드 증분 동기화, 삭제 시드 tombstone, 백업에 seedVersion·tombstone·settings 포함 | 기존 사용자 기록 보존하며 콘텐츠 개선 배포. 같은 버전 백업 복원 시 사용자 수정본 보존 |
| `getAnswer(q, level)`은 아래 레벨로 폴백 (AL→IH→IM→IL) | 레벨 답변이 없는 사용자 추가 문항도 동작 |
| **IM은 고정 틀 하나**, IH/AL은 5가지 구조를 섞음 | IM 학습자는 틀 하나를 외워 모든 문제에 쓰는 게 정석 / AL은 같은 틀 반복 시 채점자가 암기 답변으로 감점 |
| 레벨 점수대: IL 90~100 · IM 110~130 · IH 140~150 · AL 160~170 | 처음에 한 단계씩 높게 잘못 넣었다가 ETS 등급표로 정정함 |
| Part 4 답변은 세트 일정표와 사실(시간·장소·이름·금액·요일) 완전 일치 | 일정표 기반 정보 전달 파트라 사실 발명 금지 (check-content가 숫자 대조) |
| 세트 정보는 코드(SEED_SETS)에만, 문항은 setId·qNo로 참조 | localStorage 용량·병합 단순화, 일정표 수정이 즉시 반영 |
| 문항 id를 새 체계(p3-01-q5 등)로 교체하고 옛 seed-### 제거 | 내용이 완전히 바뀐 문항에 옛 정답/오답 기록이 붙지 않도록 |
| 실제 ETS 문장은 쓰지 않고 형식·질문 구성·응답 시간만 동일하게 | 저작권 (AGENTS.md 원칙 4) |
| Part 2 사진은 Unsplash 무료 라이선스 실사 (사용자 선택, 내려받기 전 목록 확인) | 실제 시험처럼 실사가 묘사 연습에 적합, 비용 없음. Figma AI 생성(유료)·직접 그린 SVG는 사용자가 택하지 않음 |
| 사진은 SW의 별도 캐시(tst-img-v1)에 처음 볼 때 저장 | 앱 업데이트에도 유지, 최초 설치 용량 증가 방지 |
| 상세 이전/다음은 `location.replace` | 여러 문항을 넘겨도 ← 한 번이면 목록 복귀(마지막 본 문항으로 스크롤·강조) |
| 디자인: 참고 사이트(YBM 무료강의) 레이아웃·폰트만 차용, 로고·상호·광고 배너는 미사용 | 사용자 요청 + 타사 브랜드 모방 금지 |
| 강조색 진한 그린(#1f6b47), 오답은 회색 | 사용자가 레드 → 그린 요청. 오답까지 그린이면 정답과 혼동되므로 회색으로 분리 |
| 라이트 테마 전용 | 참고 디자인이 라이트 전용 (이전 다크 테마 제거) |
| 쉐도잉은 문장마다 mp3를 따로 만들지 않고 **한 파일의 구간 재생** (edge-tts SentenceBoundary → timings.json) | 파일 수·용량 두 배 방지, 이미 캐시된 답변 mp3 재사용 |
| AI 생성은 세트(문항) 하나당 요청 1회, 스키마 강제 | 응답 잘림 방지·진행률 표시, JSON 파싱 실패 제거 |
| 콘텐츠 규칙을 `js/content-rules.js` 한곳에 | 시드 검사와 AI 문항 검토가 같은 기준을 쓰도록 |
| 동기화 횟수는 **기기별로 따로 세고 합칠 때 기기별 최댓값** (progress[id].dev, daily[날짜].dev) | 몇 번·어느 방향으로 합쳐도 두 번 세지 않음(멱등). 복습 일정은 최근에 푼 쪽, 즐겨찾기는 최근에 바꾼 쪽 |
| 동기화 이전 횟수는 공통 'legacy' 몫 → 최댓값으로 합침 | 백업 복원으로 두 기기가 같은 옛 기록을 가진 경우 중복 방지. 대신 업데이트 이전에 두 기기에서 **따로** 쌓은 옛 기록은 큰 쪽만 남는다 (의도된 절충) |
| 대학생 답변은 직장 맥락이 있는 문항만, 4레벨 모두 | 중립 답변(공원·가족 등)은 그대로 공유 — 음성·검수량 절약. 화자 설정: 3학년 경영학 전공, 가족과 거주, 지하철로 편도 약 1시간, 카페 아르바이트, 지난여름 인턴 |

## 5. 알려진 문제 · 막혔던 지점 · 실패한 접근

- **PowerShell `Get/Set-Content`가 한글 UTF-8 파일을 깨뜨림** (실제 발생해 파일 5개 재작성). 일괄 치환은 Edit 도구, sed(Git Bash), 또는 PowerShell이면 `[IO.File]::ReadAllText/WriteAllText(..., UTF8Encoding($false))`만 사용
- **포트 4173은 이 Windows에서 OS 예약** → 8123 사용
- **iOS 화면 잠금 연속 재생**: 무음 오디오 기법으로 대응했지만 실기기 검증은 안 됨 (웹앱 한계 가능성)
- **Claude 브라우저 미리보기**: 창이 뒤에 있으면 스크린샷 타임아웃·타일 반복 같은 렌더 오류, `scrollIntoView({behavior:'smooth'})`가 동작 안 함 → 앱에서는 즉시 스크롤 사용. 레이아웃 검증은 JS로 수치 측정하는 게 안정적
- **GitHub Pages 배포 직후** 일부 파일이 일시적 503 → 1~3분 후 새로고침. 배포 확인은 `curl`로 특정 문자열/파일 200을 폴링
- **참고 사이트(free.ybmclass.com)는 미리보기 브라우저에서 리다이렉트 루프** → `curl`로 HTML/CSS를 받아 분석함
- **레벨 답변 편집 파이프라인 스크립트는 저장소에 없음**: 생성·검수 때 쓴 `split/build-levels/apply-fixes/phrase-stats` 스크립트와 in/out JSON은 이전 세션의 임시 폴더(`%TEMP%\claude\...\scratchpad`)에만 있었다. 지금은 `js/level-answers.js`가 원본이다
  - 교훈: 그 검증 스크립트의 파일 패턴(`out-*.json`)이 백업(`out-*.orig.json`)까지 읽어 수정 전 데이터로 검증한 버그가 있었음 → 패턴은 정확히 지정할 것
- **"impeccable" 스킬은 이 환경에 없음** (사용자가 요청했으나 존재하지 않아 직접 디자인)
- **Workflow(멀티에이전트) 도구는 사용자가 명시적으로 요청할 때만 사용 가능**. 일반 병렬 작업은 Agent 서브에이전트로 함. 한 번은 세션 사용량 한도로 감사 에이전트 1개가 실패함
- edge-tts 7.2.8에서 서버가 403을 반환해 7.3.1로 올려 해결함 (음성 생성이 403으로 실패하면 먼저 `pip install --user -U edge-tts`)
- `audio/` 약 270MB+ — 푸시가 오래 걸릴 수 있음. 처음 듣는 답변은 기기에서 데이터를 조금 씀
- 레벨 답변 편집 스크립트가 없던 문제 → v6부터 콘텐츠는 `js/sets-part*.js`가 원본이고 `tools/check-content.mjs`로 검사
- Bash 도구에서 `git commit -F -` + heredoc이 stdin을 못 받아 멈춘 적 있음 → 커밋 메시지는 파일로 쓰고 `git commit -F 파일 < /dev/null`
- 클립보드 쓰기는 미리보기 브라우저에서 거부됨 → 동기화 '코드 복사'는 실패 시 코드를 텍스트 상자에 보여 주는 폴백이 있음(그 경로로 검증)
- 안드로이드 Chrome 공유 시트는 .json 파일을 받지 않음 → 동기화 파일은 .txt

## 6. 실행 · 테스트 · 배포

```bash
# 로컬 실행 (또는 시작.bat 더블클릭) → http://localhost:8123
node server.js

# 음성 생성 (문장 추가·수정 후) — 인터넷 필요, 기존 파일은 건너뛰고 안 쓰는 파일은 삭제
node tools/export-texts.mjs
python tools/generate_audio.py        # pip install edge-tts 필요

# 배포: master에 push하면 GitHub Pages가 1~3분 내 반영
git push
```

- Claude Code 미리보기: `.claude/launch.json`의 `trainer` 구성 (node server.js, 포트 8123)
- 사용자 추가 문항의 음성: 앱 설정 → JSON 백업 파일을 프로젝트 루트에 `questions.json`으로 저장 후 위 음성 생성 실행
- **자동 테스트 없음**. 변경 후 `AGENTS.md`의 테스트 체크리스트를 브라우저에서 확인. 이전 세션들은 미리보기 탭에서 `import('./js/store.js')` 후 JS로 시나리오를 실행해 검증함 (localStorage 스냅샷 → 테스트 → 복원)
- 확인용: 콘솔 오류 0, 모바일 375px, 배포판에서 `SEED_VERSION`·mp3 200 확인
- 필요 도구: Node 24+, Python 3 + `edge-tts`, git, (배포 계정 인증된) `gh` 또는 git 자격 증명

### 환경변수 (`.env.example` 참고, 값은 `.env`에만 — 저장소에 커밋 금지)
- `PORT`
- `TTS_PROVIDER`, `TTS_API_KEY`, `TTS_VOICE`, `TTS_MODEL` — 선택 (OpenAI TTS, 로컬 서버 전용)
- `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL` — 선택 (AI 문항 생성, 로컬 서버 전용)

> 키가 없어도 전 기능 동작. 배포판(GitHub Pages)에서는 /api/* 기능이 비활성.

## 7. 도구 · 설정 현황

- **프로젝트 MCP 설정**: 없음 (`.mcp.json` 없음)
- **세션에서 쓴 도구**: Claude 내장 브라우저(미리보기·배포 확인), Agent 서브에이전트(콘텐츠 작성·검수 병렬), Workflow(사용자 요청 시 감사 라운드), WebSearch/WebFetch(점수표 확인). Notion 커넥터는 연결돼 있었으나 미사용
- **훅**: 프로젝트 훅 없음. 사용자 전역 `~/.claude/settings.json`에 외부 도구(Orca, `C:/Users/Win/.orca/agent-hooks/claude-hook.cmd`) 훅이 거의 모든 이벤트에 걸려 있고 statusLine도 있음 — 이 프로젝트와 무관, 다른 계정에는 없음
- **커스텀 커맨드**: 없음
- **스킬**: 프로젝트 전용 스킬 없음. 사용 가능한 공용 스킬(pptx/docx 등)은 이 프로젝트에서 미사용
- **Claude 메모리** (이전 계정 로컬 전용, 다른 계정에 안 넘어감 — 내용은 이 문서와 CLAUDE.md에 반영함):
  - 배포 정보: Pages URL, master push로 재배포, /api는 정적 호스팅에서 비활성
  - Windows 함정: PowerShell 인코딩, 포트 4173 예약
- **Git**: 커밋 시 `-c user.name="ojungmin212-dotcom" -c user.email="ojungmin212@gmail.com"`으로 작성해 왔음. 원격 push에는 `ojungmin212-dotcom` 계정 권한 필요 (다른 계정에서 이어받으면 협업자 추가 또는 해당 계정 인증 필요)
