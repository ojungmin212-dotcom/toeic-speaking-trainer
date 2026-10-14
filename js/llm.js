// LLM Provider Adapter — AI 문항 생성 (실제 시험 형식: Part 1 지문 · Part 3/4 세트 · Part 5 의견, IL~AL 4레벨 답변)
// 키는 .env에만 있고 server.js가 /api/llm에서 Provider(anthropic/openai)를 호출한다.
// 생성 결과는 status='pending'으로 저장되어 관리 화면에서 검토·승인해야 학습에 노출된다.
// Part 2(사진 묘사)는 사진이 필요해 생성 대상에서 제외한다.
// 한 번의 요청에 세트(또는 문항) 하나만 만든다 — 응답이 잘리지 않고, 진행 상황을 보여 줄 수 있다.

import { QUESTION_TYPES, SEED_QUESTIONS, SEED_SETS } from './seed-data.js';
import { EXPRESSIONS } from './expressions.js';
import { RANGES, PART1_WORDS, MAX_SENTENCE_WORDS, PART5_IM_FRAME, checkQuestion, checkSet } from './content-rules.js';

// 생성할 수 있는 파트와 화면 표시
export const GEN_PARTS = {
  1: { label: 'Part 1 지문 읽기', unit: '지문' },
  3: { label: 'Part 3 세트 (Q5–7)', unit: '세트' },
  4: { label: 'Part 4 세트 (Q8–10)', unit: '세트' },
  5: { label: 'Part 5 의견 말하기 (Q11)', unit: '문항' },
};

const P3_TYPES = ['time', 'place', 'frequency', 'duration', 'cost', 'reason', 'preference', 'experience',
  'person', 'action', 'choice', 'opinion', 'recommend'];
const P4_TYPES = ['time', 'place', 'cost', 'person', 'action', 'duration', 'schedule', 'confirm', 'details'];
const P5_TYPES = ['agree', 'choice', 'opinion'];
const LEVELS = ['IL', 'IM', 'IH', 'AL'];

// ── JSON 스키마 (Anthropic 구조화 출력: 모든 객체 additionalProperties:false, 모든 속성 required) ──
const str = { type: 'string' };
const strArr = { type: 'array', items: str };
const obj = (properties) => ({ type: 'object', additionalProperties: false, required: Object.keys(properties), properties });
const ANSWERS = obj(Object.fromEntries(LEVELS.map((lv) => [lv, obj({ en: str, ko: str })])));
const question = (types, withType2 = true) => obj({
  questionType: { type: 'string', enum: types },
  ...(withType2 ? { questionType2: { type: 'string', enum: ['', ...types] } } : {}),
  keyExpression: str,
  questionEnglish: str,
  questionKorean: str,
  answers: ANSWERS,
});
const SCHEMAS = {
  1: obj({ genre: str, guide: str, passageKorean: str }),
  3: obj({ topic: str, introEnglish: str, introKorean: str, questions: { type: 'array', items: question(P3_TYPES) } }),
  4: obj({
    topic: str, introEnglish: str, introKorean: str,
    schedule: obj({ title: str, info: strArr, cols: strArr, rows: { type: 'array', items: strArr } }),
    questions: { type: 'array', items: question(P4_TYPES) },
  }),
  5: obj({ question: question(P5_TYPES, false) }),
};

// ── 프롬프트 ──────────────────────────────────────────────────
const range = (key, i) => `${RANGES[key][i][0]}–${RANGES[key][i][1]}`;
const levelLine = (key) => LEVELS.map((lv, i) => `${lv} ${range(key, i)}`).join(', ');

function typeList(types) {
  return types.map((t) => `${t} (${QUESTION_TYPES[t] ? QUESTION_TYPES[t].ko : t})`).join(', ');
}

// AL 답변에 쓰면 앱이 강조 표시해 주는 표현 (사전 일부를 매번 섞어서 제시)
function expressionSamples(n = 28) {
  const all = EXPRESSIONS.filter((e) => e.p && e.c !== 'grammar').map((e) => e.p[0]);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, n).map((x) => `"${x}"`).join(', ');
}

// 형식 예시 — 자체 제작 시드 세트 하나를 출력 모양 그대로 보여 준다 (주제·문장은 재사용 금지)
function answersOf(q) {
  return {
    IL: { en: q.answerEnglish, ko: q.answerKorean },
    ...Object.fromEntries(['IM', 'IH', 'AL'].map((lv) => [lv, q.levelAnswers[lv]])),
  };
}
function exampleFor(part) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  if (part === 1) {
    const q = pick(SEED_QUESTIONS.filter((x) => x.part === 1));
    return { genre: q.topic, guide: q.guide, passageKorean: q.questionKorean };
  }
  if (part === 5) {
    const q = pick(SEED_QUESTIONS.filter((x) => x.part === 5));
    return { question: { questionType: q.questionType, keyExpression: q.keyExpression,
      questionEnglish: q.questionEnglish, questionKorean: q.questionKorean, answers: answersOf(q) } };
  }
  const set = pick(Object.values(SEED_SETS).filter((s) => s.part === part));
  const qs = SEED_QUESTIONS.filter((q) => q.setId === set.id);
  return {
    topic: set.topic, introEnglish: set.introEnglish, introKorean: set.introKorean,
    ...(part === 4 ? { schedule: set.schedule } : {}),
    questions: qs.map((q) => ({ questionType: q.questionType, questionType2: q.questionType2, keyExpression: q.keyExpression,
      questionEnglish: q.questionEnglish, questionKorean: q.questionKorean, answers: answersOf(q) })),
  };
}

const COMMON = `You write original practice material for a TOEIC Speaking trainer used by Korean learners whose English listening is weak.
Never copy or closely paraphrase real ETS test questions. Write new content that only follows the official test format.
Use plain, everyday vocabulary. Every English sentence must have at most ${MAX_SENTENCE_WORDS} words.
All Korean fields must be natural polite Korean in 합니다체 (e.g. "~합니다", "~입니까?").`;

const ANSWER_RULES = (key, extra = '') => `Model answers — write four levels for every question (word counts are strict):
- ${levelLine(key)} words. The same question must satisfy IM ≤ IH ≤ AL in word count.
- IL: short, simple sentences a beginner can say. Answer every part of the question.
- IM: clear and complete, a little more detail.
- IH: natural and fluent, with a concrete personal detail or example.
- AL: rich and natural, and use at least two advanced expressions such as ${expressionSamples()}.
- Every level must answer all parts of the question (both parts of a two-part question).
${extra}`;

function buildPrompt(part, { hint, avoid }) {
  const avoidText = avoid.length ? `\nDo NOT reuse any of these existing topics/items:\n- ${avoid.slice(0, 80).join('\n- ')}\n` : '';
  const hintText = hint ? `\nTopic requested by the user (use it): ${hint}\n` : '';
  const example = `Example of the exact output shape (from our own material — do not reuse its topic or sentences):\n${JSON.stringify(exampleFor(part))}`;

  if (part === 1) {
    return `${COMMON}

Task: write ONE new TOEIC Speaking Part 1 "Read a text aloud" passage (Questions 1–2).
- Kind of text: announcement, advertisement, radio broadcast, recorded phone message, tour guide, speaker introduction, news, etc. "genre" = that kind in short Korean (e.g. "공항 탑승 안내").
- ${PART1_WORDS[0]}–${PART1_WORDS[1]} words, 4–6 sentences. Include a list of three items ("A, B, and C"), a number or time, and a proper noun — these are the reading points of the real test.
- "guide": the passage with reading marks: " / " (space, slash, space) where the reader should pause briefly, and **word** around the stressed words (1–2 per chunk). Removing every " / " (replace with a single space) and every "**" must give exactly the passage text.
- "passageKorean": natural Korean translation of the passage.
${hintText}${avoidText}
${example}`;
  }

  if (part === 3) {
    return `${COMMON}

Task: write ONE new TOEIC Speaking Part 3 set (Questions 5, 6, 7) about one everyday topic.
- "topic": the topic in short Korean (e.g. "공원"). "introEnglish": the situation read before Q5, like "Imagine that a British marketing firm is doing research in your country. You have agreed to participate in a telephone interview about ~." or "Imagine that you are talking on the telephone with a friend about ~." "introKorean": its Korean translation.
- "questions" must contain exactly three items in order: Q5, Q6, Q7.
  - Q5 (15-second answer): usually asks TWO things at once in one sentence, e.g. "How often do you ~, and who do you usually ~ with?" Set questionType and questionType2 for the two parts.
  - Q6 (15-second answer): one short question, or a short question plus "Why?".
  - Q7 (30-second answer): asks for an opinion, a choice, or a recommendation with reasons (may offer options such as "A, B, or C").
- questionType / questionType2 (second part of a two-part question, else ""): ${typeList(P3_TYPES)}.
- keyExpression: the question words a learner must catch, copied exactly from the question; for two-part questions join both with " / " (e.g. "How often / who").
${ANSWER_RULES('3-15', `- Word counts above are for Q5 and Q6. Q7 uses: ${levelLine('3-30')} words.
- Answer as an ordinary adult in Korea talking about real daily life. If you say "two reasons", give exactly two.`)}
${hintText}${avoidText}
${example}`;
  }

  if (part === 4) {
    return `${COMMON}

Task: write ONE new TOEIC Speaking Part 4 set (Questions 8, 9, 10): a schedule and three questions from a person who does not have it.
- "topic": short Korean name of the event (e.g. "마케팅 워크숍"). "introEnglish": what the caller says before Q8, e.g. "Hi, I'm attending the ~ next week, but I can't find my schedule. Could you answer a few questions for me?" "introKorean": its translation.
- "schedule": a realistic agenda/itinerary/class timetable. "title" (event name), "info" (1–3 lines such as date, place, fee), "cols" (2–3 column names, e.g. ["Time", "Session", "Speaker"]), "rows" (5–8 rows, each with exactly one string per column; use "" for an empty cell). Use digits for times like "9:30 – 10:30 A.M.". Include one session that appears twice with the same person or kind, so Q10 can ask about "all the ~". Mark one item as canceled or moved if you like.
- "questions" must contain exactly three items in order: Q8, Q9, Q10.
  - Q8 (15-second answer): asks two facts at once (e.g. "What date is ~, and where will it be held?"). Set questionType and questionType2.
  - Q9 (15-second answer): "I heard that ~. Is that right?" with WRONG information; the answer politely corrects it with the right fact from the schedule (questionType "confirm").
  - Q10 (30-second answer): "Could you tell me about all the ~?" — the answer covers every matching row with its time and details (questionType "details").
- questionType / questionType2: ${typeList(P4_TYPES)}.
- keyExpression: the question words a learner must catch, copied exactly from the question; two parts joined with " / ".
${ANSWER_RULES('4-15', `- Word counts above are for Q8 and Q9. Q10 uses: ${levelLine('4-30')} words.
- Answers use ONLY facts from the schedule — never invent times, places, names, prices, or days. Any number written with digits in an answer (times like 9:30, room numbers, prices) must appear in the schedule.
- All four levels must give the same facts; higher levels only phrase them more naturally.`)}
${hintText}${avoidText}
${example}`;
  }

  // Part 5
  return `${COMMON}

Task: write ONE new TOEIC Speaking Part 5 "Express an opinion" question (Question 11) with model answers.
- Question forms (pick one; questionType in brackets):
  [agree] "Do you agree or disagree with the following statement? <statement> Use specific reasons and examples to support your answer."
  [choice] "Which is better/more important ~: A or B? Use specific reasons and examples to support your answer."
  [opinion] "What are the advantages of ~?" / "In your opinion, what is the most important ~?" + "Use specific reasons and examples to support your answer."
- Topics: work, school, technology, community, lifestyle — something a beginner can talk about.
- keyExpression: the key question words copied exactly from the question (e.g. "agree or disagree", "Which", "advantages").
${ANSWER_RULES('5-60', `- Give exactly two reasons at every level, each supported by a short specific example. Never add a third reason.
- IM must use this fixed frame in this order: ${PART5_IM_FRAME.map((x) => `"${x}"`).join(' … ')} (state your opinion first, then the frame).
- IH and AL: do not use the IM frame; mix different structures and linking words, and do not repeat the same linker within one answer.`)}
${hintText}${avoidText}
${example}`;
}

// ── 호출 ─────────────────────────────────────────────────────
async function callLlm(prompt, schema) {
  let res;
  try {
    res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, schema }),
    });
  } catch {
    throw new Error('AI 서버에 연결하지 못했습니다. PC에서 시작.bat(node server.js)으로 실행 중인지 확인해 주세요.');
  }
  if (!res.ok) {
    if (res.status === 404 || res.status === 405 || res.status === 501) {
      throw new Error('AI 생성은 PC에서 시작.bat으로 실행할 때만 사용할 수 있습니다 (.env에 LLM 키 필요). 배포된 웹 주소에서는 동작하지 않습니다.');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'LLM 서버 오류: ' + res.status);
  }
  const data = await res.json();
  return parseJson(data.text || '');
}

// 구조화 출력이면 그대로 JSON, 아니면(OpenAI 등) 코드펜스 제거 후 가장 바깥 { … } 추출
export function parseJson(text) {
  const t = String(text).trim().replace(/^```(json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(t); } catch {}
  const start = t.indexOf('{'), end = t.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI 응답에서 JSON을 찾지 못했습니다.');
  try { return JSON.parse(t.slice(start, end + 1)); } catch { throw new Error('AI 응답 JSON을 읽지 못했습니다. 다시 시도해 주세요.'); }
}

// ── 응답 → 앱 문항 ───────────────────────────────────────────
const s = (v) => (typeof v === 'string' ? v.trim().replace(/\s{2,}/g, ' ') : '');
const okType = (t, types) => (types.includes(t) ? t : '');

function levelFields(answers) {
  const a = answers || {};
  const lv = (k) => ({ en: s(a[k] && a[k].en), ko: s(a[k] && a[k].ko) });
  const levelAnswers = {};
  for (const k of ['IM', 'IH', 'AL']) if (lv(k).en) levelAnswers[k] = lv(k);
  return { answerEnglish: lv('IL').en, answerKorean: lv('IL').ko, levelAnswers };
}

function reviewNotes(q, set) {
  const r = checkQuestion(q, set);
  return [...r.errors, ...r.warns.map((w) => '확인: ' + w)];
}

// 응답 하나 → { set|null, questions[], topic } (문항은 status 'pending', reviewNotes = 자동 검사 결과)
export function toUnit(part, data) {
  if (part === 1) {
    const guide = s(data.guide);
    const passage = guide.split('**').join('').split(' / ').join(' ').trim();
    if (!passage) throw new Error('AI 응답에 지문이 없습니다.');
    const q = {
      part: 1, qNo: 1, questionType: 'read', difficulty: 1, keyExpression: '',
      topic: s(data.genre), guide,
      questionEnglish: passage, questionKorean: s(data.passageKorean),
      answerEnglish: passage, answerKorean: s(data.passageKorean),
      levelAnswers: {}, status: 'pending',
    };
    q.reviewNotes = reviewNotes(q);
    return { set: null, questions: [q], topic: q.topic + ' — ' + passage.split(/\s+/).slice(0, 8).join(' ') };
  }

  if (part === 5) {
    const x = data.question || {};
    const q = {
      part: 5, qNo: 11, questionType: okType(x.questionType, P5_TYPES) || 'opinion', questionType2: '',
      difficulty: 2, keyExpression: s(x.keyExpression),
      questionEnglish: s(x.questionEnglish), questionKorean: s(x.questionKorean),
      ...levelFields(x.answers), status: 'pending',
    };
    if (!q.questionEnglish) throw new Error('AI 응답에 질문이 없습니다.');
    q.reviewNotes = reviewNotes(q);
    return { set: null, questions: [q], topic: q.questionEnglish.replace(/ Use specific reasons.*$/, '') };
  }

  // Part 3 · 4 세트
  const types = part === 3 ? P3_TYPES : P4_TYPES;
  const set = {
    part, topic: s(data.topic), introEnglish: s(data.introEnglish), introKorean: s(data.introKorean),
    schedule: part === 4 && data.schedule ? {
      title: s(data.schedule.title),
      info: (data.schedule.info || []).map(s).filter(Boolean),
      cols: (data.schedule.cols || []).map(s),
      rows: (data.schedule.rows || []).map((r) => (Array.isArray(r) ? r.map(s) : [])),
    } : null,
  };
  const raw = Array.isArray(data.questions) ? data.questions.slice(0, 3) : [];
  if (raw.length < 3) throw new Error('AI 응답의 세트 문항이 3개가 아닙니다. 다시 시도해 주세요.');
  const first = part === 3 ? 5 : 8;
  const questions = raw.map((x, i) => {
    const qNo = first + i;
    const t1 = okType(x.questionType, types) || (part === 4 ? (qNo === 9 ? 'confirm' : qNo === 10 ? 'details' : 'time') : 'opinion');
    const t2 = okType(x.questionType2, types);
    return {
      part, qNo, questionType: t1, questionType2: t2 !== t1 ? t2 : '',
      difficulty: qNo === 7 || qNo === 10 ? 3 : 2, keyExpression: s(x.keyExpression),
      questionEnglish: s(x.questionEnglish), questionKorean: s(x.questionKorean),
      ...levelFields(x.answers), status: 'pending',
    };
  });
  const setErrors = checkSet(set, questions);
  questions.forEach((q, i) => {
    q.reviewNotes = [...(i === 0 ? setErrors.map((e) => '세트: ' + e) : []), ...reviewNotes(q, set)];
  });
  return { set, questions, topic: set.topic + (set.schedule ? ' — ' + set.schedule.title : '') };
}

// count개를 하나씩 생성. avoid: 이미 있는 주제(중복 방지) / onProgress(done, total)
// 반환: { units: [...], failed: [메시지] } — 일부가 실패해도 성공한 것은 돌려준다
export async function generate({ part, count = 1, hint = '', avoid = [], onProgress = () => {} }) {
  part = Number(part);
  if (!SCHEMAS[part]) throw new Error('이 파트는 AI 생성을 지원하지 않습니다.');
  const units = [];
  const failed = [];
  const seen = [...avoid];
  for (let i = 0; i < count; i++) {
    onProgress(i, count);
    try {
      const data = await callLlm(buildPrompt(part, { hint, avoid: seen }), SCHEMAS[part]);
      const unit = toUnit(part, data);
      units.push(unit);
      seen.unshift(unit.topic);
    } catch (e) {
      failed.push(e.message);
      // 서버 미설정·연결 실패는 반복해도 같으니 바로 중단
      if (/PC에서|연결하지/.test(e.message)) break;
    }
  }
  onProgress(count, count);
  if (!units.length && failed.length) throw new Error(failed[0]);
  return { units, failed };
}
