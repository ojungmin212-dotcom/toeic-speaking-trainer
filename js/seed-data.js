import { PART1_PASSAGES } from './sets-part1.js';
import { PART2_PICTURES } from './sets-part2.js';
import { PART3_SETS } from './sets-part3.js';
import { PART4_SETS } from './sets-part4.js';
import { PART5_QUESTIONS } from './sets-part5.js';

// 자체 제작 연습 문항 시드 데이터 (실제 ETS 기출 아님 — 시험 구조·형식만 실제와 동일하게 맞춤)
// Part 1: 지문 읽기 Q1·Q2 / Part 2: 사진 묘사 Q3·Q4 (Unsplash 무료 라이선스 사진)
// Part 3: 상황 안내 + Q5·Q6·Q7 세트 / Part 4: 일정표 + 질문자 안내 + Q8·Q9·Q10 세트 / Part 5: Q11 단독

export const QUESTION_TYPES = {
  read:       { ko: '지문 읽기', key: 'Read the text aloud', hint: '끊어 읽기(/)와 강세(굵은 글씨)를 살려 소리 내어 읽기' },
  describe:   { ko: '사진 묘사', key: 'Describe the picture', hint: '장소 → 중심 인물 → 주변 → 배경 → 느낌 순서로 묘사' },
  time:       { ko: '시간',   key: 'When / What time',   hint: 'When = 시간' },
  place:      { ko: '장소',   key: 'Where',              hint: 'Where = 장소' },
  frequency:  { ko: '빈도',   key: 'How often',          hint: 'How often = 빈도' },
  duration:   { ko: '기간',   key: 'How long',           hint: 'How long = 기간·걸리는 시간' },
  cost:       { ko: '금액·수량', key: 'How much / How many', hint: 'How much / How many = 금액·수량' },
  reason:     { ko: '이유',   key: 'Why',                hint: 'Why = 이유' },
  preference: { ko: '선호',   key: 'What ~ like / favorite', hint: 'favorite / like = 선호' },
  experience: { ko: '경험',   key: 'Have you ever / last time', hint: 'Have you ever / the last time = 경험' },
  person:     { ko: '사람',   key: 'Who',                hint: 'Who = 사람' },
  action:     { ko: '행동',   key: 'What do you do',     hint: 'What do you do = 행동' },
  choice:     { ko: '선택',   key: 'Which / A or B',     hint: 'Which / A or B = 하나 골라 답하기' },
  opinion:    { ko: '의견/장단점', key: 'Do you think / advantages', hint: 'Do you think / advantages = 의견·장단점' },
  recommend:  { ko: '추천',   key: 'recommend / advice', hint: 'recommend = 추천과 그 이유' },
  agree:      { ko: '찬반',   key: 'Do you agree or disagree', hint: 'agree or disagree = 찬성/반대 입장 밝히기' },
  schedule:   { ko: '일정 정보', key: 'What time / Where / Who (일정표)', hint: '일정표에서 정보 찾아 답하기' },
  confirm:    { ko: '정보 정정', key: 'I heard ~. Is that right?', hint: 'I heard ~ right? = 잘못 알고 있는 정보 바로잡기' },
  details:    { ko: '세부 안내', key: 'all the details', hint: 'all the details = 해당 일정 모두 안내' },
};

// 목표 레벨 (TOEIC Speaking ACTFL 등급) — 점수 구간은 ETS 등급표 기준
// (NL 0~30 · NM 40~60 · NH 70~80 · IL 90~100 · IM1 110 · IM2 120 · IM3 130 · IH 140~150 · AL 160~170 · AM 180~190 · AH 200)
export const LEVEL_ORDER = ['IL', 'IM', 'IH', 'AL'];
export const LEVELS = {
  IL: {
    full: 'Intermediate Low', score: '90~100점',
    desc: '짧고 쉬운 문장으로 핵심만 말하기',
    guide: 'Part 2: 장소·인물·동작 (약 40단어) · 15초 질문: 한두 문장 · 30초 질문: 답 + 이유 · Part 5: 입장 + 이유 2개 (약 75단어)',
  },
  IM: {
    full: 'Intermediate Mid', score: '110~130점 (IM1~IM3)',
    desc: '이유와 세부 정보를 붙여 자연스럽게 연결하기',
    guide: 'Part 2: 옷차림·위치까지 (약 55단어) · 15초 질문: 답 + 이유 (약 20단어) · 30초 질문: 약 40단어 · Part 5: 이유 2개 + 예시 (약 90단어)',
  },
  IH: {
    full: 'Intermediate High', score: '140~150점',
    desc: '다양한 연결어와 구체적 경험으로 막힘없이 말하기',
    guide: 'Part 2: 배경·소품까지 (약 65단어) · 15초 질문: 답 + 이유 + 경험 (약 30단어) · 30초 질문: 약 55단어 · Part 5: 구체적 경험 예시 (약 120단어)',
  },
  AL: {
    full: 'Advanced Low', score: '160~170점',
    desc: '자연스러운 표현과 복문으로 설득력 있게 말하기',
    guide: 'Part 2: 분사구문·추측 표현 (약 72단어) · 15초 질문: 다양한 문장 구조 (약 40단어) · 30초 질문: 약 65단어 · Part 5: 논리적 전개 (약 140단어)',
  },
};

export const PARTS = {
  1: { name: 'Part 1', desc: '지문 읽기 (Q1–2) — 준비 45초 · 읽기 45초' },
  2: { name: 'Part 2', desc: '사진 묘사하기 (Q3–4) — 준비 45초 · 응답 30초' },
  3: { name: 'Part 3', desc: '듣고 질문에 답하기 (Q5–7) — 상황 안내 + 질문 3개 · 응답 15·15·30초' },
  4: { name: 'Part 4', desc: '제공된 정보로 답하기 (Q8–10) — 일정표 보고 답하기 · 응답 15·15·30초' },
  5: { name: 'Part 5', desc: '의견 제시하기 (Q11) — 준비 45초 · 응답 60초' },
};

// 실제 시험의 문항별 준비/응답 시간 (초). Part 4는 질문 전에 일정표를 45초 동안 읽는다.
export const TEST_TIMING = {
  1: { prep: 45, response: 45 }, 2: { prep: 45, response: 45 },
  3: { prep: 45, response: 30 }, 4: { prep: 45, response: 30 },
  5: { prep: 3, response: 15 }, 6: { prep: 3, response: 15 }, 7: { prep: 3, response: 30 },
  8: { prep: 3, response: 15 }, 9: { prep: 3, response: 15 }, 10: { prep: 3, response: 30 },
  11: { prep: 45, response: 60 },
};
export const PART4_READING_SECONDS = 45;
// 질문이 아니라 말하기 과제인 파트 — 질문 유형 퀴즈·실전 듣기(의도 파악)에서는 제외한다
export const TASK_PARTS = new Set([1, 2]);
// Part 2 지시문 (실제 시험처럼 모든 사진에 같은 지시)
export const PART2_DIRECTIONS = ['Describe the picture on your screen in as much detail as you can.', '화면의 사진을 최대한 자세히 묘사하십시오.'];
// 실제 시험에서 두 번 들려주는 질문
export const REPEATED_QNO = new Set([10]);

function toQuestion(src, part, setId, id) {
  const la = {};
  for (const lv of ['IM', 'IH', 'AL']) if (src[lv]) la[lv] = { en: src[lv][0], ko: src[lv][1] };
  return {
    id, part, setId, qNo: src.no,
    questionType: src.t[0], questionType2: src.t[1] || '',
    difficulty: src.d || 2,
    keyExpression: src.key || '',
    questionEnglish: src.q[0], questionKorean: src.q[1],
    answerEnglish: src.IL[0], answerKorean: src.IL[1],
    levelAnswers: la,
    questionAudioUrl: null, answerAudioUrl: null,
    status: 'approved',
    // Part 1: 끊어 읽기 표시·지문 종류 / Part 2: 사진·작가·장면 이름
    ...(src.guide ? { guide: src.guide, topic: src.genre || '' } : {}),
    ...(src.image ? { image: src.image, credit: src.credit || null, topic: src.topic || '' } : {}),
  };
}

// 세트 정보 (상황 안내·일정표) — 문항은 setId로 참조한다. 시드 전용이라 localStorage에 복사하지 않는다.
export const SEED_SETS = {};
export const SEED_QUESTIONS = [];

// Part 1: 지문 = 질문 겸 모범 낭독 (레벨 구분 없음)
for (const x of PART1_PASSAGES) SEED_QUESTIONS.push(toQuestion({ ...x, t: ['read'], IL: x.q }, 1, '', x.id));
// Part 2: 지시문은 공통, 레벨별 묘사 답변
for (const x of PART2_PICTURES) SEED_QUESTIONS.push(toQuestion({ ...x, t: ['describe'], q: PART2_DIRECTIONS }, 2, '', x.id));

for (const [part, sets] of [[3, PART3_SETS], [4, PART4_SETS]]) {
  for (const s of sets) {
    SEED_SETS[s.id] = {
      id: s.id, part, topic: s.topic,
      introEnglish: s.intro[0], introKorean: s.intro[1],
      schedule: s.schedule || null,
    };
    for (const x of s.qs) SEED_QUESTIONS.push(toQuestion(x, part, s.id, `${s.id}-q${x.no}`));
  }
}
for (const x of PART5_QUESTIONS) SEED_QUESTIONS.push(toQuestion({ ...x, no: 11 }, 5, '', x.id));

// 시드 데이터 버전 — 올리면 기존 사용자에게 새 문항 추가 + 시드 문항 내용 개선분이 자동 반영된다 (store.js)
// v3: Part 5 모범답변을 60초 IL 수준(입장→이유2개+예시→마무리)으로 전면 확장
// v4: 전 문항에 IM/IH/AL 레벨별 모범답변 추가
// v5: 레벨별 답변 검수 반영 (오류 75건 수정, 반복 템플릿 제거·Part 5 구조 다양화 194건)
// v6: 실제 시험 형식으로 전면 교체 — Part 3·4 세트(상황 안내·일정표·Q5~10), Part 5 실제 문형. 옛 seed-### 문항은 제거
// v7: Part 1(지문 읽기 20) · Part 2(사진 묘사 20) 추가
export const SEED_VERSION = 8;
