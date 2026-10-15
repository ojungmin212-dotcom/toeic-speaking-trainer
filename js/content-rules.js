// 콘텐츠 규격 — 시드 검사 도구(tools/check-content.mjs)와 AI 생성 문항 검토(관리 화면)가 함께 쓴다.
// 단어 수(파트·문항 번호·레벨별), IM ≤ IH ≤ AL, 한 문장 28단어 이하, 핵심 표현이 질문에 있는지,
// Part 5 IM 고정 틀, Part 4 답변 속 숫자가 일정표에 있는지, 한국어 합니다체 끝맺음,
// Part 1 끊어 읽기 표시(guide)가 지문과 같은지.
import { QUESTION_TYPES } from './seed-data.js';
import { findExpressions } from './expressions.js';

// [IL, IM, IH, AL] 단어 수 범위
export const RANGES = {
  '2-30': [[30, 45], [45, 60], [55, 70], [65, 80]],  // Part 2 Q3·Q4 사진 묘사 (응답 30초)
  '3-15': [[8, 18], [15, 25], [25, 40], [35, 55]],   // Part 3 Q5·Q6 (응답 15초)
  '3-30': [[20, 32], [35, 48], [48, 62], [60, 75]],  // Part 3 Q7 (응답 30초)
  '4-15': [[8, 16], [12, 22], [20, 32], [28, 45]],   // Part 4 Q8·Q9 (응답 15초)
  '4-30': [[25, 38], [35, 50], [45, 60], [55, 75]],  // Part 4 Q10 (응답 30초)
  '5-60': [[65, 80], [85, 100], [110, 130], [130, 155]], // Part 5 Q11 (응답 60초)
};
export const PART1_WORDS = [40, 75];
export const MAX_SENTENCE_WORDS = 28;
export const PART5_IM_FRAME = ['I have two reasons.', 'First,', 'For example,', 'Second,', 'For these reasons,'];
const LV = ['IL', 'IM', 'IH', 'AL'];

// Part 3 Q7: 보기 세 개를 주는 형식 ("Which of the following … ? A, B, or C? Why?") — 질문 속 보기 세 개를 뽑는다
export function optionsOf(text) {
  const m = /([^,.?!:;]{2,70}),\s*([^,.?!:;]{2,70}),?\s+or\s+([^,.?!:;]{2,70})\?/i.exec(String(text || ''));
  return m ? [m[1], m[2], m[3]].map((x) => x.trim()) : null;
}
const STOP = new Set(['the', 'and', 'for', 'with', 'your', 'some', 'lots', 'good', 'more', 'most', 'very', 'than']);
const stemsOf = (opt) => (opt.toLowerCase().match(/[a-z']{4,}/g) || []).filter((w) => !STOP.has(w)).map((w) => w.slice(0, 5));

export const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
export const sentences = (s) => String(s || '').split(/(?<=[.?!])\s+(?=[A-Z"'])/);

// 문항 번호 → 단어 수 범위 키 (번호 없는 사용자 문항은 파트 기준)
export function rangeKey(q) {
  const long = q.qNo === 7 || q.qNo === 10 || q.part === 2;
  return `${q.part}-${long ? 30 : q.part === 5 ? 60 : 15}`;
}

// 한 문항 검사 → { errors: [...], warns: [...] } (메시지에 id는 붙이지 않는다)
// set: Part 3·4 세트 (Part 4는 일정표로 숫자 확인)
export function checkQuestion(q, set = null) {
  const errors = [];
  const warns = [];
  const la = q.levelAnswers || {};
  for (const t of [q.questionType, q.questionType2].filter(Boolean)) {
    if (!QUESTION_TYPES[t]) errors.push(`알 수 없는 유형 ${t}`);
  }
  // 핵심 표현이 질문 문장에 그대로 있어야 강조 표시가 된다
  for (const k of String(q.keyExpression || '').split('/').map((x) => x.trim()).filter(Boolean)) {
    if (!q.questionEnglish.toLowerCase().includes(k.toLowerCase())) errors.push(`핵심 표현 "${k}"이 질문에 없음`);
  }
  // Part 1: 지문 길이, 끊어 읽기 표시를 지우면 지문과 같아야 함 (레벨 답변 없음)
  if (q.part === 1) {
    const n = words(q.questionEnglish);
    if (n < PART1_WORDS[0] || n > PART1_WORDS[1]) errors.push(`지문 ${n}단어 (규격 ${PART1_WORDS[0]}~${PART1_WORDS[1]})`);
    if (!q.questionKorean) errors.push('지문 해석 없음');
    const plain = String(q.guide || '').split('**').join('').split(' / ').join(' ');
    if (plain !== q.questionEnglish) errors.push(`끊어 읽기 표시가 지문과 다름: "${plain.slice(0, 60)}…"`);
    return { errors, warns };
  }
  const range = RANGES[rangeKey(q)];
  if (!range) return { errors, warns };
  const answers = [q.answerEnglish, la.IM && la.IM.en, la.IH && la.IH.en, la.AL && la.AL.en];
  const kos = [q.answerKorean, ...['IM', 'IH', 'AL'].map((lv) => la[lv] && la[lv].ko)];
  const counts = answers.map(words);
  answers.forEach((a, i) => {
    if (!a) { errors.push(`${LV[i]} 답변 없음`); return; }
    const [lo, hi] = range[i];
    if (counts[i] < lo || counts[i] > hi) errors.push(`${LV[i]} ${counts[i]}단어 (규격 ${lo}~${hi})`);
    for (const s of sentences(a)) {
      if (words(s) > MAX_SENTENCE_WORDS) errors.push(`${LV[i]} 한 문장 ${words(s)}단어: "${s.slice(0, 50)}…"`);
    }
    if (a !== a.trim() || /\s{2,}/.test(a)) errors.push(`${LV[i]} 공백 이상`);
    if (!kos[i]) errors.push(`${LV[i]} 한국어 해석 없음`);
    else if (!/(다|요|오)[.!]?["'”]?$|까\?$/.test(kos[i].trim())) warns.push(`${LV[i]} 한국어 끝맺음 확인: "…${kos[i].slice(-12)}"`);
  });
  // Part 3 Q7(30초): 실제 시험처럼 보기 세 개를 주고 이유를 묻는다. 답변은 그중 하나를 골라 이유를 말한다.
  if (q.part === 3 && q.qNo === 7) {
    const opts = optionsOf(q.questionEnglish);
    if (!opts) errors.push('Q7은 보기 세 개를 주는 형식이어야 함 ("… A, B, or C? Why?")');
    if (!/\bwhy\b/i.test(q.questionEnglish)) errors.push('Q7 질문에 Why(이유 요청)가 없음');
    if (opts) {
      const stems = opts.map(stemsOf);
      answers.forEach((a, i) => {
        if (!a) return;
        const low = a.toLowerCase();
        if (!stems.some((st) => st.some((w) => low.includes(w)))) warns.push(`${LV[i]} 답변에 고른 보기가 드러나지 않음 (보기: ${opts.join(' / ')})`);
      });
    }
  }
  // AL 포인트: AL 답변에는 강조할 고급 표현이 2개 이상 있어야 한다 (js/expressions.js에 없으면 사전에 추가)
  if (answers[3] && findExpressions(answers[3]).length < 2) {
    const msg = `AL 고급 표현 ${findExpressions(answers[3]).length}개 (2개 이상 권장)`;
    // 시드는 오류(사전 보강 필요), 사용자·AI 문항은 사전에 없는 좋은 표현일 수 있어 경고
    (/^p[1-5]-/.test(q.id || '') ? errors : warns).push(msg);
  }
  if (counts.every(Boolean) && !(counts[1] <= counts[2] && counts[2] <= counts[3])) {
    errors.push(`IM ≤ IH ≤ AL 위반 (${counts.slice(1).join(' / ')})`);
  }
  if (q.part === 5) {
    const im = answers[1] || '';
    for (const m of PART5_IM_FRAME) if (!im.includes(m)) errors.push(`IM 고정 틀 누락: "${m}"`);
  }
  // Part 4: 답변의 숫자(시간·날짜·금액·호실)는 일정표나 질문에 있어야 한다
  if (q.part === 4 && set && set.schedule) {
    const src = JSON.stringify(set.schedule) + ' ' + q.questionEnglish;
    answers.forEach((a, i) => {
      for (const num of String(a || '').match(/\d+(:\d+)?/g) || []) {
        if (!src.includes(num)) errors.push(`${LV[i]} 숫자 "${num}"이 일정표에 없음`);
      }
    });
  }
  return { errors, warns };
}

// 세트 구성 검사: Part 3 = Q5·6·7, Part 4 = Q8·9·10
export function checkSet(set, questions) {
  const errors = [];
  const nos = questions.map((q) => q.qNo).join(',');
  const want = set.part === 3 ? '5,6,7' : '8,9,10';
  if (nos !== want) errors.push(`세트 문항 번호 ${nos} (기대 ${want})`);
  if (!set.introEnglish || !set.introKorean) errors.push('상황 안내 없음');
  if (set.part === 4 && !(set.schedule && set.schedule.rows && set.schedule.rows.length)) errors.push('일정표 없음');
  return errors;
}
