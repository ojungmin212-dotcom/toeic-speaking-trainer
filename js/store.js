// 데이터 계층 — UI는 반드시 이 모듈을 통해서만 데이터에 접근한다.
// 현재 구현은 localStorage. 추후 DB 교체 시 이 파일만 바꾸면 된다.

import { SEED_QUESTIONS, SEED_VERSION } from './seed-data.js';
import { applyAnswer } from './srs.js';

const K = {
  questions: 'tst.questions.v1',
  progress: 'tst.progress.v1',
  daily: 'tst.daily.v1',
  settings: 'tst.settings.v1',
  seedVersion: 'tst.seedVersion',
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── 초기화 ─────────────────────────────────────────────────────
let questions = [];
let progress = {};   // { [questionId]: Progress }
let daily = {};      // { 'YYYY-MM-DD': {listened, correct, incorrect, studySeconds} }
let settings = {};

export const DEFAULT_SETTINGS = {
  ttsProvider: 'webspeech',      // webspeech | openai
  voiceGender: 'female',         // female | male
  voiceEnName: '',               // 사용자가 고른 특정 영어 음성 (빈 값이면 자동)
  voiceKoName: '',
  rate: 0.92,                    // 자연스러운 시험 안내 속도
  thinkSeconds: 4,               // 질문 후 생각 시간
  gapSeconds: 1.2,               // 다음 문제 전 간격
  playQuestionKo: true,          // 운동 모드 단계 ON/OFF
  playAnswerEn: true,
  playAnswerKo: true,
  repeatQuestion: false,         // 영어 질문 2회 반복
  beginnerMode: true,            // 핵심 의문사 강조
  beepAfterQuestion: true,       // 시험처럼 질문 후 신호음(삐)
  useGeneratedAudio: true,       // 사전 생성 신경망 음성 우선 사용
};

// part/difficulty가 문자열로 저장된 데이터(CSV 가져오기 등)를 숫자로 정규화
function normalize(q) {
  return { ...q, part: Number(q.part) || 3, difficulty: Number(q.difficulty) || 1 };
}

export function init() {
  questions = load(K.questions, null);
  if (Array.isArray(questions)) questions = questions.map(normalize);
  if (!questions) {
    questions = SEED_QUESTIONS.map((q) => ({ ...q }));
    save(K.questions, questions);
    save(K.seedVersion, SEED_VERSION);
  } else {
    // 시드가 늘어나면 기존 사용자 데이터에 새 문항만 병합 (사용자 추가/수정분은 보존)
    const storedVersion = load(K.seedVersion, 1);
    if (storedVersion < SEED_VERSION) {
      const have = new Set(questions.map((q) => q.id));
      for (const sq of SEED_QUESTIONS) {
        if (!have.has(sq.id)) questions.push({ ...sq });
      }
      save(K.questions, questions);
      save(K.seedVersion, SEED_VERSION);
    }
  }
  progress = load(K.progress, {});
  daily = load(K.daily, {});
  settings = { ...DEFAULT_SETTINGS, ...load(K.settings, {}) };
}

// ── 질문 CRUD ──────────────────────────────────────────────────
export function getQuestions({ part, type, status = 'approved', includePending = false } = {}) {
  return questions.filter((q) =>
    (includePending || (q.status || 'approved') === status) &&
    (part == null || q.part === part) &&
    (type == null || q.questionType === type)
  );
}
export function getAllQuestions() { return questions.slice(); }
export function getQuestion(id) { return questions.find((q) => q.id === id) || null; }

export function addQuestion(data) {
  const id = data.id || 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const item = {
    id, part: Number(data.part) || 3,
    questionType: data.questionType || 'action',
    difficulty: Number(data.difficulty) || 1,
    keyExpression: data.keyExpression || '',
    questionEnglish: data.questionEnglish || '',
    questionKorean: data.questionKorean || '',
    answerEnglish: data.answerEnglish || '',
    answerKorean: data.answerKorean || '',
    questionAudioUrl: data.questionAudioUrl || null,
    answerAudioUrl: data.answerAudioUrl || null,
    status: data.status || 'approved',
  };
  questions.push(item);
  save(K.questions, questions);
  return item;
}

export function updateQuestion(id, patch) {
  const i = questions.findIndex((q) => q.id === id);
  if (i < 0) return null;
  questions[i] = normalize({ ...questions[i], ...patch, id });
  save(K.questions, questions);
  return questions[i];
}

export function deleteQuestion(id) {
  questions = questions.filter((q) => q.id !== id);
  delete progress[id];
  save(K.questions, questions);
  save(K.progress, progress);
}

export function resetToSeed() {
  questions = SEED_QUESTIONS.map((q) => ({ ...q }));
  save(K.questions, questions);
}

// ── 학습 기록 ──────────────────────────────────────────────────
export function getProgress(id) {
  return progress[id] || {
    correctCount: 0, incorrectCount: 0, favorite: false,
    box: 0, lastStudiedAt: null, nextReviewAt: 0, listenCount: 0,
  };
}

function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function bumpDaily(patch) {
  const key = todayKey();
  const cur = daily[key] || { listened: 0, correct: 0, incorrect: 0, studySeconds: 0 };
  daily[key] = {
    listened: cur.listened + (patch.listened || 0),
    correct: cur.correct + (patch.correct || 0),
    incorrect: cur.incorrect + (patch.incorrect || 0),
    studySeconds: cur.studySeconds + (patch.studySeconds || 0),
  };
  save(K.daily, daily);
}

export function recordListen(id) {
  const p = getProgress(id);
  progress[id] = { ...p, listenCount: (p.listenCount || 0) + 1 };
  save(K.progress, progress);
  bumpDaily({ listened: 1 });
}

export function recordAnswer(id, correct) {
  progress[id] = applyAnswer(getProgress(id), correct);
  save(K.progress, progress);
  bumpDaily(correct ? { correct: 1 } : { incorrect: 1 });
}

export function toggleFavorite(id) {
  const p = getProgress(id);
  progress[id] = { ...p, favorite: !p.favorite };
  save(K.progress, progress);
  return progress[id].favorite;
}

export function addStudySeconds(seconds) {
  bumpDaily({ studySeconds: Math.round(seconds) });
}

// ── 통계 ───────────────────────────────────────────────────────
export function getToday() {
  return daily[todayKey()] || { listened: 0, correct: 0, incorrect: 0, studySeconds: 0 };
}
export function getDailyAll() { return { ...daily }; }

export function getTotals() {
  let listened = 0, correct = 0, incorrect = 0, studySeconds = 0;
  for (const d of Object.values(daily)) {
    listened += d.listened; correct += d.correct; incorrect += d.incorrect; studySeconds += d.studySeconds;
  }
  return { listened, correct, incorrect, studySeconds };
}

export function getStreak() {
  const DAY = 86400000;
  let streak = 0;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  let t = d.getTime();
  const keyOf = (ms) => {
    const x = new Date(ms);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  };
  // 오늘 학습이 없으면 어제부터 계산
  if (!daily[keyOf(t)]) t -= DAY; else { streak = 1; t -= DAY; }
  while (daily[keyOf(t)]) { streak += 1; t -= DAY; }
  return streak;
}

export function accuracyBy(groupFn) {
  const acc = {}; // { group: {correct, incorrect} }
  for (const q of getQuestions()) {
    const p = getProgress(q.id);
    const g = groupFn(q);
    if (!acc[g]) acc[g] = { correct: 0, incorrect: 0 };
    acc[g].correct += p.correctCount;
    acc[g].incorrect += p.incorrectCount;
  }
  const out = {};
  for (const [g, v] of Object.entries(acc)) {
    const total = v.correct + v.incorrect;
    out[g] = { ...v, total, rate: total ? Math.round((v.correct / total) * 100) : null };
  }
  return out;
}

// 취약 유형: 시도 3회 이상 & 정답률 낮은 순
export function getWeakTypes(threshold = 80) {
  const byType = accuracyBy((q) => q.questionType);
  return Object.entries(byType)
    .filter(([, v]) => v.total >= 3 && v.rate != null && v.rate < threshold)
    .sort((a, b) => a[1].rate - b[1].rate)
    .map(([type, v]) => ({ type, ...v }));
}

// 취약/오답 질문: 오답이 있고 정답률 낮은 순
export function getWeakQuestions() {
  return getQuestions()
    .map((q) => ({ q, p: getProgress(q.id) }))
    .filter(({ p }) => p.incorrectCount > 0)
    .sort((a, b) => {
      const ra = a.p.correctCount / (a.p.correctCount + a.p.incorrectCount);
      const rb = b.p.correctCount / (b.p.correctCount + b.p.incorrectCount);
      return ra - rb;
    })
    .map(({ q }) => q);
}

export function getFavorites() {
  return getQuestions().filter((q) => getProgress(q.id).favorite);
}

export function getDueQuestions(now = Date.now()) {
  return getQuestions().filter((q) => {
    const p = getProgress(q.id);
    return p.lastStudiedAt && (p.nextReviewAt || 0) <= now;
  });
}

// ── 설정 ───────────────────────────────────────────────────────
export function getSettings() { return { ...settings }; }
export function saveSettings(patch) {
  settings = { ...settings, ...patch };
  save(K.settings, settings);
  return settings;
}

// ── Import / Export ────────────────────────────────────────────
const CSV_FIELDS = ['id', 'part', 'questionType', 'difficulty', 'keyExpression',
  'questionEnglish', 'questionKorean', 'answerEnglish', 'answerKorean', 'status'];

export function exportJSON() {
  return JSON.stringify({ questions, progress, daily, exportedAt: new Date().toISOString() }, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!Array.isArray(data.questions)) throw new Error('questions 배열이 없습니다.');
  questions = data.questions.map(normalize);
  if (data.progress) progress = data.progress;
  if (data.daily) daily = data.daily;
  save(K.questions, questions); save(K.progress, progress); save(K.daily, daily);
  return questions.length;
}

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function exportCSV() {
  const rows = [CSV_FIELDS.join(',')];
  for (const q of questions) rows.push(CSV_FIELDS.map((f) => csvEscape(q[f])).join(','));
  return rows.join('\n');
}

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQ = false;
      else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x !== '')) rows.push(row);
  return rows;
}

export function importCSV(text) {
  const rows = parseCSV(text.trim());
  if (rows.length < 2) throw new Error('데이터 행이 없습니다.');
  const header = rows[0].map((h) => h.trim());
  let count = 0;
  for (const r of rows.slice(1)) {
    const obj = {};
    header.forEach((h, i) => { obj[h] = r[i]; });
    if (!obj.questionEnglish) continue;
    const existing = obj.id && getQuestion(obj.id);
    if (existing) updateQuestion(obj.id, obj);
    else addQuestion(obj);
    count++;
  }
  return count;
}
