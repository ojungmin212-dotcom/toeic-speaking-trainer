// 데이터 계층 — UI는 반드시 이 모듈을 통해서만 데이터에 접근한다.
// 현재 구현은 localStorage. 추후 DB 교체 시 이 파일만 바꾸면 된다.

import { SEED_QUESTIONS, SEED_SETS, SEED_VERSION, LEVEL_ORDER, TASK_PARTS } from './seed-data.js';
import { applyAnswer } from './srs.js';
import { STUDENT_ANSWERS } from './student-answers.js';

const K = {
  questions: 'tst.questions.v1',
  progress: 'tst.progress.v1',
  daily: 'tst.daily.v1',
  settings: 'tst.settings.v1',
  seedVersion: 'tst.seedVersion',
  deletedSeeds: 'tst.deletedSeedIds', // 사용자가 지운 시드가 업데이트 때 부활하지 않도록
  userSets: 'tst.userSets.v1',        // AI 생성·사용자 세트 (Part 3 상황 안내 · Part 4 일정표)
  deviceId: 'tst.deviceId',           // 기기 간 동기화에서 이 기기의 학습 횟수를 따로 세기 위한 id
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
let userSets = {};   // { [setId]: Set } — 시드 세트(SEED_SETS)와 같은 모양, id는 'us-…'
let deviceId = '';

// ── 기기별 횟수 (서버 없는 동기화용) ─────────────────────────────
// 두 기기의 기록을 합칠 때 같은 학습을 두 번 세지 않도록, 횟수를 기기별로 따로 세고 화면에는 합계를 보여 준다.
// 합칠 때는 기기별로 큰 값을 취한다 → 몇 번을 어느 방향으로 합쳐도 결과가 같다.
// 이 기능 이전의 횟수는 'legacy' 몫 (백업 복원으로 두 기기가 같은 옛 기록을 가져도 한 번만 센다).
// progress[id].dev = { [기기]: { c: 정답, i: 오답, l: 듣기 } } · daily[날짜].dev = { [기기]: { listened, correct, incorrect, studySeconds } }
const DEV_KEY = /^(legacy|d[a-z0-9]{6,16})$/;
const P_COUNTS = { c: 'correctCount', i: 'incorrectCount', l: 'listenCount' };
const D_COUNTS = ['listened', 'correct', 'incorrect', 'studySeconds'];
const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0);

function loadDeviceId() {
  let id = '';
  try { id = localStorage.getItem(K.deviceId) || ''; } catch {}
  if (!/^d[a-z0-9]{6,16}$/.test(id)) {
    id = 'd' + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 8);
    try { localStorage.setItem(K.deviceId, id); } catch {}
  }
  return id;
}

// 기기별 횟수 표 (없으면 기존 합계를 legacy 몫으로)
function devOf(rec, fields) {
  if (rec && rec.dev && typeof rec.dev === 'object') return rec.dev;
  const legacy = {};
  for (const [k, f] of fields) legacy[k] = num(rec && rec[f]);
  return Object.values(legacy).some(Boolean) ? { legacy } : {};
}
const P_FIELDS = Object.entries(P_COUNTS);
const D_FIELDS = D_COUNTS.map((f) => [f, f]);

function sumDev(dev, key) {
  return Object.values(dev).reduce((sum, v) => sum + num(v && v[key]), 0);
}
function withProgressTotals(rec, dev) {
  const out = { ...rec, dev };
  for (const [k, f] of P_FIELDS) out[f] = sumDev(dev, k);
  return out;
}
function withDailyTotals(dev) {
  const out = { dev };
  for (const f of D_COUNTS) out[f] = sumDev(dev, f);
  return out;
}
// 이 기기 몫에 더한 새 기기별 표
function bumpDev(dev, patch) {
  const next = { ...dev };
  const mine = { ...(next[deviceId] || {}) };
  for (const [k, v] of Object.entries(patch)) mine[k] = num(mine[k]) + v;
  next[deviceId] = mine;
  return next;
}
// 두 기기별 표 합치기 — 기기·항목마다 큰 값
function maxDev(a, b) {
  const out = {};
  for (const src of [a, b]) {
    for (const [key, v] of Object.entries(src || {})) {
      if (!DEV_KEY.test(key) || !v || typeof v !== 'object') continue;
      const cur = out[key] || (out[key] = {});
      for (const [f, n] of Object.entries(v)) {
        if (/^[a-zA-Z]{1,16}$/.test(f)) cur[f] = Math.max(num(cur[f]), num(n));
      }
    }
  }
  return out;
}

export const DEFAULT_SETTINGS = {
  ttsProvider: 'webspeech',      // webspeech | openai
  voiceGender: 'female',         // female | male
  voiceEnName: '',               // 사용자가 고른 특정 영어 음성 (빈 값이면 자동)
  voiceKoName: '',
  rate: 0.92,                    // 자연스러운 시험 안내 속도
  thinkSeconds: 4,               // 질문 후 생각 시간 (0 = 실전: 문항별 실제 준비·응답 시간)
  gapSeconds: 1.2,               // 다음 문제 전 간격
  playQuestionKo: true,          // 듣기 모드 단계 ON/OFF
  playAnswerEn: true,
  playAnswerKo: true,
  repeatQuestion: false,         // 영어 질문 2회 반복
  beginnerMode: true,            // 핵심 의문사 강조
  beepAfterQuestion: true,       // 시험처럼 질문 후 신호음(삐)
  playSetIntro: true,            // 세트 첫 질문 전에 상황 안내(Part 3)·질문자 안내(Part 4) 재생
  shadowing: false,              // 쉐도잉: 모범답변·지문을 문장마다 끊어 들려주고 따라 말할 시간
  useGeneratedAudio: true,       // 사전 생성 신경망 음성 우선 사용
  targetLevel: 'IL',             // 목표 레벨 — 모범답변을 이 레벨로 보여주고 재생 (IL/IM/IH/AL)
  mockShowText: true,            // 모의고사: Part 3·4 질문 글자 표시 (끄면 듣기만으로)
  mockShowKo: true,              // 모의고사: 안내문 한글 해석 표시
  persona: 'worker',             // 답변 화자 — worker 직장인 | student 대학생 (대학생 답변이 있는 문항만 바뀜)
};

// 레벨별 답변 정리: { IM: {en, ko}, ... } 형태만 남긴다 (IL은 answerEnglish/answerKorean)
function cleanLevelAnswers(la) {
  const out = {};
  if (!la || typeof la !== 'object') return out;
  for (const lv of LEVEL_ORDER) {
    if (lv === 'IL') continue;
    const v = la[lv];
    if (v && typeof v.en === 'string' && v.en.trim()) {
      out[lv] = { en: v.en.trim(), ko: typeof v.ko === 'string' ? v.ko.trim() : '' };
    }
  }
  return out;
}

// part/difficulty가 문자열로 저장된 데이터(CSV 가져오기 등)를 숫자로 정규화
// setId/qNo: 실제 시험 세트 소속(시드 문항만) · questionType2: 두 가지를 묶어 묻는 질문의 둘째 유형
function normalize(q) {
  return {
    ...q,
    part: Number(q.part) || 3,
    difficulty: Number(q.difficulty) || 1,
    setId: typeof q.setId === 'string' && (SEED_SETS[q.setId] || userSets[q.setId]) ? q.setId : '',
    qNo: Number(q.qNo) || null,
    questionType2: typeof q.questionType2 === 'string' && q.questionType2 !== q.questionType ? q.questionType2 : '',
    levelAnswers: cleanLevelAnswers(q.levelAnswers),
  };
}

// 세트 정보 (Part 3 상황 안내 · Part 4 일정표) — 시드 세트는 코드에만 있고 localStorage에는 저장하지 않는다.
// AI로 생성한 세트는 userSets(tst.userSets.v1)에 저장한다.
export function getSet(setId) {
  return (setId && (SEED_SETS[setId] || userSets[setId])) || null;
}

const USER_SET_ID = /^us-[a-z0-9-]+$/;
const strArr = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string').map((x) => x.trim()) : []);
// 사용자 세트 검증 — 백업·동기화로 들어온 데이터도 같은 수준으로 정리 (화면에 그대로 그려지므로)
function cleanSet(raw) {
  if (!raw || typeof raw !== 'object' || !USER_SET_ID.test(String(raw.id))) return null;
  const part = Number(raw.part);
  if (part !== 3 && part !== 4) return null;
  const set = {
    id: String(raw.id), part,
    topic: typeof raw.topic === 'string' ? raw.topic.trim() : '',
    introEnglish: typeof raw.introEnglish === 'string' ? raw.introEnglish.trim() : '',
    introKorean: typeof raw.introKorean === 'string' ? raw.introKorean.trim() : '',
    schedule: null,
  };
  const sch = raw.schedule;
  if (part === 4 && sch && typeof sch === 'object') {
    const cols = strArr(sch.cols);
    const rows = Array.isArray(sch.rows)
      ? sch.rows.filter(Array.isArray).map((r) => cols.map((_, i) => (typeof r[i] === 'string' ? r[i].trim() : '')))
      : [];
    if (cols.length && rows.length) {
      set.schedule = { title: typeof sch.title === 'string' ? sch.title.trim() : '', info: strArr(sch.info), cols, rows };
    }
  }
  return set.introEnglish ? set : null;
}
function cleanSets(obj) {
  const out = {};
  for (const v of Object.values(obj && typeof obj === 'object' ? obj : {})) {
    const s = cleanSet(v);
    if (s) out[s.id] = s;
  }
  return out;
}

// 새 사용자 세트 저장 → 저장된 세트 (id 자동 부여). 문항은 addQuestion({ setId, qNo, ... })로 따로 넣는다.
export function addSet(data) {
  const id = 'us-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const set = cleanSet({ ...data, id });
  if (!set) throw new Error('세트 정보가 올바르지 않습니다 (상황 안내·일정표 확인).');
  userSets[id] = set;
  save(K.userSets, userSets);
  return set;
}

// 문항이 하나도 남지 않은 사용자 세트 정리
function pruneUserSets() {
  const used = new Set(questions.map((q) => q.setId).filter(Boolean));
  let changed = false;
  for (const id of Object.keys(userSets)) {
    if (!used.has(id)) { delete userSets[id]; changed = true; }
  }
  if (changed) save(K.userSets, userSets);
}

// 시드 문항 id 판별 — 현재 시드 + 실제 시험 형식 이전의 옛 시드(seed-###)
const SEED_IDS = new Set(SEED_QUESTIONS.map((q) => q.id));
const SEED_ORDER = new Map(SEED_QUESTIONS.map((q, i) => [q.id, i]));
function isSeedId(id) {
  return SEED_IDS.has(id) || /^seed-\d+$/.test(String(id)) || /^p[1-5]-\d+(-q\d+)?$/.test(String(id));
}

// 대학생 페르소나 답변이 있는 문항인지 (시드 Part 3·5 중 직장 맥락이 있던 문항 — js/student-answers.js)
export function hasStudentAnswer(q) {
  return !!(q && STUDENT_ANSWERS[q.id]);
}

// 문항의 해당 레벨 모범답변. 그 레벨 답변이 없으면 아래 레벨로 내려가며 찾는다 (최종 IL).
// 답변 화자가 대학생이고 대학생 답변이 있는 문항이면 그 답변을 쓴다 (4레벨 모두 있음).
// 반환: { en, ko, level, persona } — level은 실제로 보여주는 레벨
export function getAnswer(q, level, persona = settings.persona) {
  const want = LEVEL_ORDER.includes(level) ? level : 'IL';
  const st = persona === 'student' && STUDENT_ANSWERS[q.id];
  if (st && st[want]) return { en: st[want][0], ko: st[want][1], level: want, persona: 'student' };
  for (let i = LEVEL_ORDER.indexOf(want); i > 0; i--) {
    const lv = LEVEL_ORDER[i];
    const v = q.levelAnswers && q.levelAnswers[lv];
    if (v && v.en) return { en: v.en, ko: v.ko || '', level: lv };
  }
  return { en: q.answerEnglish || '', ko: q.answerKorean || '', level: 'IL' };
}

// 이 문항이 보유한 답변 레벨 목록 (IL 포함)
export function availableLevels(q) {
  return LEVEL_ORDER.filter((lv) => lv === 'IL' || (q.levelAnswers && q.levelAnswers[lv] && q.levelAnswers[lv].en));
}

// 시드 병합: 새 시드 문항 추가 + 기존 시드 문항의 내용 개선분 동기화
// (사용자가 직접 추가한 문항은 건드리지 않음, 사용자가 지운 시드는 부활 안 함.
//  시드 문항을 직접 수정한 경우에는 버전 업 시 최신 시드 내용으로 덮어써진다 — 학습 기록은 유지)
// 시드에서 빠진 문항(예: v6에서 실제 시험 형식으로 교체되며 은퇴한 seed-###)은 제거하고 그 문항의 기록도 정리한다.
// 날짜별 학습량·연속 학습일·설정은 문항과 무관하므로 그대로 유지된다.
const SYNC_FIELDS = ['questionEnglish', 'questionKorean', 'answerEnglish', 'answerKorean', 'keyExpression',
  'questionType', 'questionType2', 'setId', 'qNo', 'part', 'difficulty', 'guide', 'image', 'topic'];
function mergeSeeds({ syncContent = true } = {}) {
  const deleted = new Set(load(K.deletedSeeds, []));
  let changed = 0;

  const before = questions.length;
  questions = questions.filter((q) => {
    if (!isSeedId(q.id) || SEED_IDS.has(q.id)) return true;
    delete progress[q.id];
    return false;
  });
  changed += before - questions.length;
  const prunedTomb = [...deleted].filter((id) => SEED_IDS.has(id));
  if (prunedTomb.length !== deleted.size) save(K.deletedSeeds, prunedTomb);

  const have = new Map(questions.map((q, i) => [q.id, i]));
  for (const sq of SEED_QUESTIONS) {
    if (deleted.has(sq.id)) continue;
    if (!have.has(sq.id)) {
      questions.push(normalize({ ...sq }));
      changed++;
    } else if (syncContent) {
      const i = have.get(sq.id);
      const cur = questions[i];
      const next = normalize({ ...sq });
      if (SYNC_FIELDS.some((f) => cur[f] !== next[f]) ||
          JSON.stringify(cur.levelAnswers) !== JSON.stringify(next.levelAnswers)) {
        questions[i] = next;
        changed++;
      }
    }
  }
  // 시드 문항은 세트·문항 번호 순서(시드 순서)로, 사용자 추가 문항은 그 뒤에 기존 순서대로
  const seeds = questions.filter((q) => SEED_ORDER.has(q.id)).sort((a, b) => SEED_ORDER.get(a.id) - SEED_ORDER.get(b.id));
  questions = [...seeds, ...questions.filter((q) => !SEED_ORDER.has(q.id))];
  if (changed) { save(K.questions, questions); save(K.progress, progress); }
  save(K.seedVersion, SEED_VERSION);
  return changed;
}

export function init() {
  // 학습 기록을 먼저 읽는다 — mergeSeeds가 은퇴한 문항의 기록을 정리한 뒤 저장하기 때문
  progress = load(K.progress, {});
  daily = load(K.daily, {});
  settings = sanitizeSettings(load(K.settings, {}));
  userSets = cleanSets(load(K.userSets, {})); // 문항 정규화(setId 확인) 전에 읽는다
  deviceId = loadDeviceId();
  questions = load(K.questions, null);
  if (Array.isArray(questions)) questions = questions.map(normalize);
  if (!questions) {
    questions = SEED_QUESTIONS.map((q) => normalize({ ...q }));
    save(K.questions, questions);
    save(K.seedVersion, SEED_VERSION);
  } else if (load(K.seedVersion, 1) < SEED_VERSION) {
    mergeSeeds();
  }
}

// ── 질문 CRUD ──────────────────────────────────────────────────
export function getQuestions({ part, type, status = 'approved', includePending = false } = {}) {
  return questions.filter((q) =>
    (includePending || (q.status || 'approved') === status) &&
    (part == null || q.part === part) &&
    (type == null || q.questionType === type || q.questionType2 === type)
  );
}
// 질문 의도 파악 훈련(퀴즈·실전 듣기·전체 학습)용 — 질문이 없는 말하기 과제(Part 1 지문 읽기·Part 2 사진 묘사)는 제외
export function getQuestionParts() {
  return getQuestions().filter((q) => !TASK_PARTS.has(q.part));
}
export function getAllQuestions() { return questions.slice(); }
export function getQuestion(id) { return questions.find((q) => q.id === id) || null; }

export function addQuestion(data) {
  // 외부(CSV 등)에서 온 id는 안전한 문자만 허용 — DOM 속성 주입 방지
  const providedId = data.id && /^[A-Za-z0-9_-]+$/.test(String(data.id)) ? String(data.id) : null;
  const id = providedId || 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const item = {
    id, part: Number(data.part) || 3,
    questionType: data.questionType || 'action',
    questionType2: data.questionType2 || '',
    difficulty: Number(data.difficulty) || 1,
    keyExpression: data.keyExpression || '',
    questionEnglish: data.questionEnglish || '',
    questionKorean: data.questionKorean || '',
    answerEnglish: data.answerEnglish || '',
    answerKorean: data.answerKorean || '',
    questionAudioUrl: data.questionAudioUrl || null,
    answerAudioUrl: data.answerAudioUrl || null,
    status: data.status || 'approved',
    levelAnswers: cleanLevelAnswers(data.levelAnswers),
    setId: data.setId || '',
    qNo: data.qNo || null,
  };
  // Part 1 끊어 읽기 표시·지문 종류, AI 생성 문항 자동 검토 결과
  if (typeof data.guide === 'string' && data.guide.trim()) item.guide = data.guide.trim();
  if (typeof data.topic === 'string' && data.topic.trim()) item.topic = data.topic.trim();
  if (Array.isArray(data.reviewNotes)) item.reviewNotes = data.reviewNotes.filter((x) => typeof x === 'string');
  const norm = normalize(item);
  questions.push(norm);
  save(K.questions, questions);
  return norm;
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
  pruneUserSets();
  if (SEED_IDS.has(id)) {
    const deleted = load(K.deletedSeeds, []);
    if (!deleted.includes(id)) { deleted.push(id); save(K.deletedSeeds, deleted); }
  }
  save(K.questions, questions);
  save(K.progress, progress);
}

export function resetToSeed() {
  questions = SEED_QUESTIONS.map((q) => normalize({ ...q }));
  save(K.questions, questions);
  save(K.seedVersion, SEED_VERSION);
  save(K.deletedSeeds, []);
  pruneUserSets();
}

export function seedCount() { return SEED_QUESTIONS.length; }

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
  daily[key] = withDailyTotals(bumpDev(devOf(daily[key], D_FIELDS), patch));
  save(K.daily, daily);
}

export function recordListen(id) {
  const p = getProgress(id);
  progress[id] = withProgressTotals(p, bumpDev(devOf(p, P_FIELDS), { l: 1 }));
  save(K.progress, progress);
  bumpDaily({ listened: 1 });
}

export function recordAnswer(id, correct) {
  const p = getProgress(id);
  // 복습 박스·다음 복습일은 applyAnswer, 횟수는 기기별 표에서 다시 합산
  progress[id] = withProgressTotals(applyAnswer(p, correct), bumpDev(devOf(p, P_FIELDS), correct ? { c: 1 } : { i: 1 }));
  save(K.progress, progress);
  bumpDaily(correct ? { correct: 1 } : { incorrect: 1 });
}

export function toggleFavorite(id) {
  const p = getProgress(id);
  progress[id] = { ...p, favorite: !p.favorite, favoriteAt: Date.now() }; // 합칠 때 나중에 바꾼 쪽을 따른다
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
  // 실제 활동(청취/응답)이 있는 날만 학습일로 인정
  const active = (key) => {
    const v = daily[key];
    return v && (v.listened + v.correct + v.incorrect > 0);
  };
  // 오늘 학습이 없으면 어제부터 계산
  if (!active(keyOf(t))) t -= DAY; else { streak = 1; t -= DAY; }
  while (active(keyOf(t))) { streak += 1; t -= DAY; }
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

// 취약/오답 질문: 오답이 있고 아직 연속 정답으로 졸업하지 못한 문제 (box 2 이상이면 졸업)
export function getWeakQuestions() {
  return getQuestions()
    .map((q) => ({ q, p: getProgress(q.id) }))
    .filter(({ p }) => p.incorrectCount > 0 && (p.box || 0) < 2)
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
  settings = sanitizeSettings({ ...settings, ...patch });
  save(K.settings, settings);
  return settings;
}

// 외부 입력(백업 복원 등)으로 들어온 설정값 검증 — 화면에 그대로 출력되는 값은 허용 목록만
function sanitizeSettings(s) {
  const out = { ...DEFAULT_SETTINGS, ...s };
  if (!LEVEL_ORDER.includes(out.targetLevel)) out.targetLevel = 'IL';
  if (!['female', 'male'].includes(out.voiceGender)) out.voiceGender = 'female';
  if (!['webspeech', 'openai'].includes(out.ttsProvider)) out.ttsProvider = 'webspeech';
  if (!['worker', 'student'].includes(out.persona)) out.persona = 'worker';
  return out;
}

// ── Import / Export ────────────────────────────────────────────
const CSV_FIELDS = ['id', 'part', 'questionType', 'questionType2', 'difficulty', 'keyExpression',
  'questionEnglish', 'questionKorean', 'answerEnglish', 'answerKorean', 'status', 'setId', 'qNo'];
// 레벨별 답변 열: answerEnglishIM, answerKoreanIM, answerEnglishIH, ...
const LEVEL_CSV_FIELDS = LEVEL_ORDER.filter((lv) => lv !== 'IL')
  .flatMap((lv) => ['answerEnglish' + lv, 'answerKorean' + lv]);

export function exportJSON() {
  return JSON.stringify({
    questions, progress, daily,
    settings,
    userSets, // AI 생성 세트의 상황 안내·일정표 (문항의 setId가 가리킴)
    deletedSeedIds: load(K.deletedSeeds, []), // 새 기기 복원 시 삭제한 시드가 부활하지 않도록
    seedVersion: SEED_VERSION,
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!Array.isArray(data.questions)) throw new Error('questions 배열이 없습니다.');
  const prog = data.progress && typeof data.progress === 'object' ? { ...data.progress } : {};
  // 세트를 먼저 들여야 문항 정규화에서 setId가 유지된다
  userSets = cleanSets(data.userSets);
  save(K.userSets, userSets);

  // 백업 문항도 addQuestion과 같은 수준으로 검증 (필수 필드, id 형식 — DOM 주입 방지)
  const cleaned = [];
  for (const raw of data.questions) {
    if (!raw || typeof raw.questionEnglish !== 'string' || !raw.questionEnglish.trim()) continue;
    let id = typeof raw.id === 'string' && /^[A-Za-z0-9_-]+$/.test(raw.id) ? raw.id : null;
    if (!id) {
      id = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6) + '-' + cleaned.length;
      if (raw.id && prog[raw.id]) { prog[id] = prog[raw.id]; delete prog[raw.id]; }
    }
    cleaned.push(normalize({ ...raw, id, status: raw.status === 'pending' ? 'pending' : 'approved' }));
  }

  questions = cleaned;
  progress = prog;
  daily = data.daily && typeof data.daily === 'object' ? data.daily : {};
  if (Array.isArray(data.deletedSeedIds)) save(K.deletedSeeds, data.deletedSeedIds.filter((x) => typeof x === 'string'));
  if (data.settings && typeof data.settings === 'object') {
    settings = sanitizeSettings(data.settings);
    save(K.settings, settings);
  }
  save(K.questions, questions); save(K.progress, progress); save(K.daily, daily);
  // 오래된 백업을 복원해도 이후 추가된 시드 문항이 사라지지 않도록 병합 (tombstone 존중).
  // 현재 버전에서 만든 백업이면 사용자가 고친 시드 문항 내용을 덮어쓰지 않고 누락 문항만 추가한다.
  const backupVersion = Number(data.seedVersion) || 0;
  mergeSeeds({ syncContent: backupVersion < SEED_VERSION });
  pruneUserSets();
  return questions.length;
}

// ── 기기 간 동기화 (서버 없이 코드·파일로) ─────────────────────────
// 내보내기: 학습 기록 + 직접 추가·AI 생성 문항과 세트 + 지운 시드 목록. 설정과 시드 문항 내용은 기기마다 그대로 둔다.
export function exportSync() {
  return {
    app: 'tst-sync', v: 1, deviceId, exportedAt: new Date().toISOString(),
    seedVersion: SEED_VERSION,
    questions: questions.filter((q) => !isSeedId(q.id)),
    userSets,
    deletedSeedIds: load(K.deletedSeeds, []),
    progress, daily,
  };
}

function cleanProgress(rec) {
  if (!rec || typeof rec !== 'object') return null;
  const out = {
    favorite: rec.favorite === true,
    box: Math.min(5, Math.max(0, Math.floor(num(rec.box)))),
    lastStudiedAt: num(rec.lastStudiedAt) || null,
    nextReviewAt: num(rec.nextReviewAt),
  };
  if (num(rec.favoriteAt)) out.favoriteAt = num(rec.favoriteAt);
  return withProgressTotals(out, maxDev(devOf(rec, P_FIELDS), {}));
}

// 한 문항 기록 합치기: 횟수는 기기별 최댓값, 복습 일정은 더 최근에 푼 쪽, 즐겨찾기는 더 최근에 바꾼 쪽
function mergeProgress(a, b) {
  const la = num(a.lastStudiedAt), lb = num(b.lastStudiedAt);
  const base = lb > la ? { ...a, box: b.box, lastStudiedAt: b.lastStudiedAt, nextReviewAt: b.nextReviewAt } : { ...a };
  // 같은 시각이면 양쪽이 같은 결과가 되도록 더 이른 복습 쪽으로
  if (la === lb) {
    base.box = Math.min(num(a.box), num(b.box));
    base.nextReviewAt = Math.min(num(a.nextReviewAt), num(b.nextReviewAt));
  }
  const fa = num(a.favoriteAt), fb = num(b.favoriteAt);
  base.favorite = fa || fb ? (fb > fa ? b.favorite === true : a.favorite === true) : (a.favorite === true || b.favorite === true);
  if (fa || fb) base.favoriteAt = Math.max(fa, fb);
  return withProgressTotals(base, maxDev(devOf(a, P_FIELDS), devOf(b, P_FIELDS)));
}

// 다른 기기의 기록을 덮어쓰지 않고 합친다. data: exportSync() 또는 JSON 백업(exportJSON) 형식
// 반환: { questions: 새로 들어온 문항 수, progress: 합친 문항 기록 수, days: 합친 날짜 수 }
export function mergeSync(data) {
  if (!data || typeof data !== 'object' || (!data.progress && !Array.isArray(data.questions))) {
    throw new Error('동기화 데이터가 아닙니다.');
  }
  // 세트 먼저 (문항 정규화에서 setId가 유지되도록) — 같은 id면 이 기기 것을 유지
  userSets = { ...cleanSets(data.userSets), ...userSets };

  // 다른 기기에서 지운 시드는 여기서도 지운다
  const deleted = new Set(load(K.deletedSeeds, []));
  for (const id of Array.isArray(data.deletedSeedIds) ? data.deletedSeedIds : []) {
    if (SEED_IDS.has(id)) deleted.add(id);
  }
  questions = questions.filter((q) => { if (!deleted.has(q.id)) return true; delete progress[q.id]; return false; });
  save(K.deletedSeeds, [...deleted]);

  // 직접 추가·AI 생성 문항: 이 기기에 없는 것만 추가 (같은 id면 이 기기 것 유지)
  const have = new Set(questions.map((q) => q.id));
  let addedQ = 0;
  for (const raw of Array.isArray(data.questions) ? data.questions : []) {
    if (!raw || typeof raw.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(raw.id) || isSeedId(raw.id) || have.has(raw.id)) continue;
    if (typeof raw.questionEnglish !== 'string' || !raw.questionEnglish.trim()) continue;
    const q = normalize({ ...raw, status: raw.status === 'pending' ? 'pending' : 'approved' });
    if (Array.isArray(q.reviewNotes)) q.reviewNotes = q.reviewNotes.filter((x) => typeof x === 'string');
    questions.push(q);
    have.add(q.id);
    addedQ++;
  }

  // 문항별 학습 기록
  let mergedP = 0;
  for (const [id, raw] of Object.entries(data.progress && typeof data.progress === 'object' ? data.progress : {})) {
    if (!have.has(id)) continue;
    const rec = cleanProgress(raw);
    if (!rec) continue;
    progress[id] = progress[id] ? mergeProgress(progress[id], rec) : rec;
    mergedP++;
  }

  // 날짜별 학습량 (연속 학습일·통계)
  let mergedD = 0;
  for (const [day, raw] of Object.entries(data.daily && typeof data.daily === 'object' ? data.daily : {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !raw || typeof raw !== 'object') continue;
    daily[day] = withDailyTotals(maxDev(devOf(daily[day], D_FIELDS), devOf(raw, D_FIELDS)));
    mergedD++;
  }

  pruneUserSets();
  save(K.userSets, userSets);
  save(K.questions, questions); save(K.progress, progress); save(K.daily, daily);
  return { questions: addedQ, progress: mergedP, days: mergedD };
}

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function exportCSV() {
  const rows = [[...CSV_FIELDS, ...LEVEL_CSV_FIELDS].join(',')];
  for (const q of questions) {
    const base = CSV_FIELDS.map((f) => csvEscape(q[f]));
    const lv = LEVEL_CSV_FIELDS.map((f) => {
      const level = f.slice(-2);
      const v = q.levelAnswers && q.levelAnswers[level];
      return csvEscape(v ? (f.startsWith('answerEnglish') ? v.en : v.ko) : '');
    });
    rows.push([...base, ...lv].join(','));
  }
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
    // 행이 헤더보다 짧으면 없는 칸은 건너뛴다 (기존 값을 undefined로 덮지 않도록)
    header.forEach((h, i) => { if (r[i] !== undefined) obj[h] = r[i]; });
    if (!obj.questionEnglish || !String(obj.questionEnglish).trim()) continue;
    // status 열이 있을 때만 정규화 — 열이 없는 CSV로 기존 pending이 소리 없이 승인되지 않도록
    if (header.includes('status')) obj.status = obj.status === 'pending' ? 'pending' : 'approved';
    else delete obj.status;
    // 대상 문항 결정: id 일치 → 없으면 같은 영어 질문 (재가져오기 시 전체 복제 방지)
    const target = (obj.id && getQuestion(obj.id)) ||
      questions.find((q) => (q.questionEnglish || '').trim() === String(obj.questionEnglish).trim()) || null;

    // 레벨별 답변 열 → levelAnswers. 파일에 없는 열은 기존 값을 유지한다.
    if (LEVEL_CSV_FIELDS.some((f) => header.includes(f))) {
      const la = { ...((target && target.levelAnswers) || {}) };
      for (const lv of LEVEL_ORDER.filter((x) => x !== 'IL')) {
        const hasEn = header.includes('answerEnglish' + lv);
        const hasKo = header.includes('answerKorean' + lv);
        const en = String(obj['answerEnglish' + lv] ?? '').trim();
        const ko = String(obj['answerKorean' + lv] ?? '').trim();
        const cur = la[lv] || { en: '', ko: '' };
        const next = { en: hasEn ? en : cur.en, ko: hasKo ? ko : cur.ko };
        if (next.en) la[lv] = next; else delete la[lv];
        delete obj['answerEnglish' + lv]; delete obj['answerKorean' + lv];
      }
      obj.levelAnswers = la;
    }

    if (target) updateQuestion(target.id, { ...obj, id: target.id });
    else addQuestion(obj);
    count++;
  }
  return count;
}
