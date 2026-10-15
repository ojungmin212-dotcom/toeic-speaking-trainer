// 시드 콘텐츠 규격 검사 — 문항을 추가·수정한 뒤 실행: node tools/check-content.mjs
// 단어 수(파트·문항 번호·레벨별), IM ≤ IH ≤ AL, 한 문장 28단어 이하, 핵심 표현이 질문에 있는지,
// Part 5 IM 고정 틀, Part 4 답변 속 숫자가 일정표에 있는지, 한국어 합니다체 끝맺음,
// Part 1 끊어 읽기 표시(guide)가 지문과 같은지, Part 2 사진 파일이 있는지 확인한다.
import fs from 'node:fs';
import { SEED_QUESTIONS, SEED_SETS } from '../js/seed-data.js';
import { checkQuestion, checkSet } from '../js/content-rules.js';
import { STUDENT_ANSWERS } from '../js/student-answers.js';

const errors = [];
const warns = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const warn = (id, msg) => warns.push(`${id}: ${msg}`);

// 문항별 규칙은 js/content-rules.js (관리 화면의 AI 생성 문항 검토와 같은 기준)
const ids = new Set();
for (const q of SEED_QUESTIONS) {
  if (ids.has(q.id)) err(q.id, '중복 id');
  ids.add(q.id);
  const r = checkQuestion(q, SEED_SETS[q.setId]);
  r.errors.forEach((m) => err(q.id, m));
  r.warns.forEach((m) => warn(q.id, m));
  if (q.part === 2 && !fs.existsSync(new URL('../' + q.image, import.meta.url))) err(q.id, `사진 파일 없음 ${q.image}`);
}

// 대학생 페르소나 답변: 같은 문항 규격(단어 수·문장 길이·IM 틀·AL 표현·일정표 숫자)을 그대로 적용
const WORK = /\b(office|overtime|coworkers?|co-workers?|colleagues?|my boss|my company|our company|salary|business trip|workplace|after work|before work|at work)\b/i;
for (const [id, a] of Object.entries(STUDENT_ANSWERS)) {
  const q = SEED_QUESTIONS.find((x) => x.id === id);
  if (!q) { err(id, '대학생 답변: 그런 문항 없음'); continue; }
  const lvs = ['IL', 'IM', 'IH', 'AL'];
  const missing = lvs.filter((lv) => !Array.isArray(a[lv]) || !a[lv][0] || !a[lv][1]);
  if (missing.length) { err(id, `대학생 답변 레벨 누락 ${missing.join(',')}`); continue; }
  const q2 = {
    ...q, answerEnglish: a.IL[0], answerKorean: a.IL[1],
    levelAnswers: Object.fromEntries(['IM', 'IH', 'AL'].map((lv) => [lv, { en: a[lv][0], ko: a[lv][1] }])),
  };
  const r = checkQuestion(q2, SEED_SETS[q.setId]);
  r.errors.forEach((m) => err(id, '대학생 ' + m));
  r.warns.forEach((m) => warn(id, '대학생 ' + m));
  for (const lv of lvs) {
    const m = WORK.exec(a[lv][0]);
    // 질문 자체에 있는 말(예: overtime, coworker)은 답할 때 쓸 수밖에 없으니 제외
    if (m && !q.questionEnglish.toLowerCase().includes(m[0].toLowerCase())) warn(id, `대학생 ${lv}에 직장인 표현 "${m[0]}"`);
  }
}

for (const [id, s] of Object.entries(SEED_SETS)) {
  checkSet(s, SEED_QUESTIONS.filter((q) => q.setId === id)).forEach((m) => err(id, m));
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
console.log(`대학생 답변 ${Object.keys(STUDENT_ANSWERS).length}문항`);
console.log(`문항 ${SEED_QUESTIONS.length}개 (${[1, 2, 3, 4, 5].map((p) => `Part ${p}: ${byPart(p)}`).join(' · ')}), 세트 ${Object.keys(SEED_SETS).length}개`);
for (const w of warns) console.log('경고 ' + w);
for (const e of errors) console.log('오류 ' + e);
console.log(errors.length ? `오류 ${errors.length}건` : '오류 없음');
process.exitCode = errors.length ? 1 : 0;
