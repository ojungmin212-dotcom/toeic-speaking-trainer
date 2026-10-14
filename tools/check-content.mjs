// 시드 콘텐츠 규격 검사 — 문항을 추가·수정한 뒤 실행: node tools/check-content.mjs
// 단어 수(파트·문항 번호·레벨별), IM ≤ IH ≤ AL, 한 문장 28단어 이하, 핵심 표현이 질문에 있는지,
// Part 5 IM 고정 틀, Part 4 답변 속 숫자가 일정표에 있는지, 한국어 합니다체 끝맺음,
// Part 1 끊어 읽기 표시(guide)가 지문과 같은지, Part 2 사진 파일이 있는지 확인한다.
import fs from 'node:fs';
import { SEED_QUESTIONS, SEED_SETS, QUESTION_TYPES } from '../js/seed-data.js';
import { findExpressions } from '../js/expressions.js';

// [IL, IM, IH, AL] 단어 수 범위
const RANGES = {
  '2-30': [[30, 45], [45, 60], [55, 70], [65, 80]],  // Part 2 Q3·Q4 사진 묘사 (응답 30초)
  '3-15': [[8, 18], [15, 25], [25, 40], [35, 55]],   // Part 3 Q5·Q6 (응답 15초)
  '3-30': [[20, 32], [35, 48], [48, 62], [60, 75]],  // Part 3 Q7 (응답 30초)
  '4-15': [[8, 16], [12, 22], [20, 32], [28, 45]],   // Part 4 Q8·Q9 (응답 15초)
  '4-30': [[25, 38], [35, 50], [45, 60], [55, 75]],  // Part 4 Q10 (응답 30초)
  '5-60': [[65, 80], [85, 100], [110, 130], [130, 155]], // Part 5 Q11 (응답 60초)
};
const LV = ['IL', 'IM', 'IH', 'AL'];
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const sentences = (s) => String(s || '').split(/(?<=[.?!])\s+(?=[A-Z"'])/);

const errors = [];
const warns = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const warn = (id, msg) => warns.push(`${id}: ${msg}`);

const ids = new Set();
for (const q of SEED_QUESTIONS) {
  if (ids.has(q.id)) err(q.id, '중복 id');
  ids.add(q.id);
  for (const t of [q.questionType, q.questionType2].filter(Boolean)) {
    if (!QUESTION_TYPES[t]) err(q.id, `알 수 없는 유형 ${t}`);
  }
  // 핵심 표현이 질문 문장에 그대로 있어야 강조 표시가 된다
  for (const k of q.keyExpression.split('/').map((x) => x.trim()).filter(Boolean)) {
    if (!q.questionEnglish.toLowerCase().includes(k.toLowerCase())) err(q.id, `핵심 표현 "${k}"이 질문에 없음`);
  }
  // Part 1: 지문 길이, 끊어 읽기 표시를 지우면 지문과 같아야 함 (레벨 답변 없음)
  if (q.part === 1) {
    const n = words(q.questionEnglish);
    if (n < 40 || n > 75) err(q.id, `지문 ${n}단어 (규격 40~75)`);
    if (!q.questionKorean) err(q.id, '지문 해석 없음');
    const plain = String(q.guide || '').split('**').join('').split(' / ').join(' ');
    if (plain !== q.questionEnglish) err(q.id, `끊어 읽기 표시가 지문과 다름: "${plain.slice(0, 60)}…"`);
    continue;
  }
  if (q.part === 2 && !fs.existsSync(new URL('../' + q.image, import.meta.url))) err(q.id, `사진 파일 없음 ${q.image}`);
  const key = `${q.part}-${q.qNo === 7 || q.qNo === 10 || q.part === 2 ? 30 : q.part === 5 ? 60 : 15}`;
  const answers = [
    q.answerEnglish, q.levelAnswers.IM && q.levelAnswers.IM.en,
    q.levelAnswers.IH && q.levelAnswers.IH.en, q.levelAnswers.AL && q.levelAnswers.AL.en,
  ];
  const kos = [q.answerKorean, ...['IM', 'IH', 'AL'].map((lv) => q.levelAnswers[lv] && q.levelAnswers[lv].ko)];
  const counts = answers.map(words);
  answers.forEach((a, i) => {
    if (!a) { err(q.id, `${LV[i]} 답변 없음`); return; }
    const [lo, hi] = RANGES[key][i];
    if (counts[i] < lo || counts[i] > hi) err(q.id, `${LV[i]} ${counts[i]}단어 (규격 ${lo}~${hi})`);
    for (const s of sentences(a)) if (words(s) > 28) err(q.id, `${LV[i]} 한 문장 ${words(s)}단어: "${s.slice(0, 50)}…"`);
    if (a !== a.trim() || /\s{2,}/.test(a)) err(q.id, `${LV[i]} 공백 이상`);
    if (!kos[i]) err(q.id, `${LV[i]} 한국어 해석 없음`);
    else if (!/(다|요|오)[.!]?["'”]?$|까\?$/.test(kos[i].trim())) warn(q.id, `${LV[i]} 한국어 끝맺음 확인: "…${kos[i].slice(-12)}"`);
  });
  // AL 포인트: AL 답변에는 강조할 고급 표현이 2개 이상 있어야 한다 (js/expressions.js에 없으면 사전에 추가)
  if (answers[3] && findExpressions(answers[3]).length < 2) err(q.id, `AL 고급 표현 ${findExpressions(answers[3]).length}개 (2개 이상 필요)`);
  if (!(counts[1] <= counts[2] && counts[2] <= counts[3])) err(q.id, `IM ≤ IH ≤ AL 위반 (${counts.slice(1).join(' / ')})`);
  if (q.part === 5) {
    const im = answers[1] || '';
    for (const m of ['I have two reasons.', 'First,', 'For example,', 'Second,', 'For these reasons,']) {
      if (!im.includes(m)) err(q.id, `IM 고정 틀 누락: "${m}"`);
    }
  }
  // Part 4: 답변의 숫자(시간·날짜·금액·호실)는 일정표나 질문에 있어야 한다
  if (q.part === 4) {
    const set = SEED_SETS[q.setId];
    const src = JSON.stringify(set.schedule) + ' ' + q.questionEnglish;
    answers.forEach((a, i) => {
      for (const num of String(a || '').match(/\d+(:\d+)?/g) || []) {
        if (!src.includes(num)) err(q.id, `${LV[i]} 숫자 "${num}"이 일정표에 없음`);
      }
    });
  }
}

// 세트 구성: Part 3 = Q5·6·7, Part 4 = Q8·9·10
for (const [id, s] of Object.entries(SEED_SETS)) {
  const nos = SEED_QUESTIONS.filter((q) => q.setId === id).map((q) => q.qNo).join(',');
  const want = s.part === 3 ? '5,6,7' : '8,9,10';
  if (nos !== want) err(id, `세트 문항 번호 ${nos} (기대 ${want})`);
  if (!s.introEnglish || !s.introKorean) err(id, '상황 안내 없음');
  if (s.part === 4 && !(s.schedule && s.schedule.rows && s.schedule.rows.length)) err(id, '일정표 없음');
}

// IH·AL에서 같은 연결어가 너무 자주 반복되는지 (Part 5)
const LINKERS = ['On top of that', 'All things considered', 'To begin with', "What's more", 'Above all', 'In addition',
  'Moreover', 'Furthermore', 'On the other hand', 'For instance', 'Overall', 'In conclusion', 'That is why', "That's why",
  'To sum up', 'Besides', 'Not only that', 'Most importantly', 'In my case', 'Personally'];
const p5 = SEED_QUESTIONS.filter((q) => q.part === 5);
for (const lv of ['IH', 'AL']) {
  const freq = LINKERS.map((l) => [l, p5.filter((q) => (q.levelAnswers[lv].en || '').includes(l)).length])
    .filter(([, n]) => n > Math.max(4, Math.ceil(p5.length * 0.2)));
  for (const [l, n] of freq) warn('Part5-' + lv, `"${l}" ${n}회 사용 — 표현 다양화 권장`);
}

const byPart = (p) => SEED_QUESTIONS.filter((q) => q.part === p).length;
console.log(`문항 ${SEED_QUESTIONS.length}개 (${[1, 2, 3, 4, 5].map((p) => `Part ${p}: ${byPart(p)}`).join(' · ')}), 세트 ${Object.keys(SEED_SETS).length}개`);
for (const w of warns) console.log('경고 ' + w);
for (const e of errors) console.log('오류 ' + e);
console.log(errors.length ? `오류 ${errors.length}건` : '오류 없음');
process.exitCode = errors.length ? 1 : 0;
