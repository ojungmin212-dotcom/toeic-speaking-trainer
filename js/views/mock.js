// 모의고사 — 실제 시험 화면처럼: 안내문 화면 → 문항 화면(Question N of 11) → 준비/응답 타이머 → 다음 문항
// 흐름은 시험 그대로 자동으로 넘어가고, NEXT 버튼으로 지금 단계(안내 음성·타이머)를 건너뛸 수 있다.
// 시험이 끝나면 결과 화면에서 모범답변(목표 레벨·답변 화자)과 비교한다. 문항은 자체 제작 연습 문항이다.
import * as store from '../store.js';
import * as tts from '../tts.js';
import { TEST_TIMING, REPEATED_QNO, PART4_READING_SECONDS } from '../seed-data.js';
import { MOCK_DIRECTIONS, MOCK_CUES } from '../mock-data.js';
import {
  escapeHtml, scheduleHtml, qNoBadge, toast, levelPickerHtml, bindLevelPicker, personaPickerHtml, personaLabel, guideHtml,
} from '../ui.js';
import { backBar } from './study.js';
import { timerHtml } from '../timer.js';

// 검증용: 타이머 배율 (1 = 실제 시간)
export const _test = { scale: 1 };

const SCOPES = {
  full: { label: '전체 11문항', desc: 'Q1–11 · 실제 시험과 같은 순서 (약 25분)', parts: [1, 2, 3, 4, 5] },
  p12: { label: 'Part 1·2', desc: '지문 읽기 + 사진 묘사 (Q1–4)', parts: [1, 2] },
  p3: { label: 'Part 3', desc: '듣고 질문에 답하기 (Q5–7)', parts: [3] },
  p4: { label: 'Part 4', desc: '제공된 정보로 답하기 (Q8–10)', parts: [4] },
  p5: { label: 'Part 5', desc: '의견 제시하기 (Q11)', parts: [5] },
};

let run = null;        // 진행 중인 시험
let lastResult = null; // 마지막으로 끝낸 시험 { questions, scope }
let volume = 1;        // 화면 이동 후에도 유지

export function stopMock() {
  if (run) { run.stop(); run = null; }
  document.body.classList.remove('exam-mode');
}

// ── 시험 구성 ──────────────────────────────────────────────────
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

// 같은 qNo(번호)별로 하나씩 — Part 1은 Q1·Q2, Part 2는 Q3·Q4
function pickByQNo(part, qNos) {
  const pool = store.getQuestions({ part });
  const out = [];
  for (const no of qNos) {
    const cand = pool.filter((q) => q.qNo === no && !out.includes(q));
    const q = pickOne(cand.length ? cand : pool.filter((x) => !out.includes(x)));
    if (q) out.push(q);
  }
  return out;
}

// 세트(상황 안내·일정표 + 3문항) 하나
function pickSet(part) {
  const bySet = new Map();
  for (const q of store.getQuestions({ part })) {
    if (!q.setId) continue;
    if (!bySet.has(q.setId)) bySet.set(q.setId, []);
    bySet.get(q.setId).push(q);
  }
  const full = [...bySet.values()].filter((a) => a.length >= 3 && store.getSet(a[0].setId));
  const g = pickOne(full);
  return g ? g.sort((a, b) => (a.qNo || 0) - (b.qNo || 0)).slice(0, 3) : [];
}

export function buildTest(scopeKey) {
  const scope = SCOPES[scopeKey] || SCOPES.full;
  const stages = [{ type: 'start', scope: scopeKey }];
  const questions = [];
  for (const part of scope.parts) {
    const qs = part === 1 ? pickByQNo(1, [1, 2])
      : part === 2 ? pickByQNo(2, [3, 4])
      : part === 5 ? [pickOne(store.getQuestions({ part: 5 }))].filter(Boolean)
      : pickSet(part);
    if (!qs.length) continue;
    stages.push({ type: 'directions', part });
    if (part === 4) stages.push({ type: 'info', set: store.getSet(qs[0].setId), first: qs[0] });
    for (const q of qs) stages.push({ type: 'q', q });
    questions.push(...qs);
  }
  stages.push({ type: 'end' });
  return { stages, questions };
}

// ── 시험 실행기 ────────────────────────────────────────────────
const ABORT = Symbol('abort');

const ICONS = {
  close: '<path d="M5 5l14 14M19 5L5 19"/>',
  volume: '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  back: '<path d="M20 12H5M11 6l-6 6 6 6"/>',
  next: '<path d="M4 12h15M13 6l6 6-6 6"/>',
};
const svg = (n) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

class MockRun {
  constructor(root, built, scopeKey) {
    this.root = root;
    this.stages = built.stages;
    this.questions = built.questions;
    this.scopeKey = scopeKey;
    this.alive = true;
    this.stepId = 0;
    this.skipResolve = null;
    this.timer = null;
    this.startedAt = null;
    this.settings = store.getSettings();
    this.mount();
  }

  $(sel) { return this.root.querySelector(sel); }

  mount() {
    this.root.innerHTML = `
      <div class="exam" id="exam">
        <header class="ex-head">
          <div class="ex-brand" id="exBrand">Speaking Trainer</div>
          <h1 class="ex-title" id="exTitle"></h1>
          <div class="ex-btns">
            <button class="ex-btn" data-act="close" aria-label="CLOSE"><span>CLOSE</span>${svg('close')}</button>
            <button class="ex-btn" data-act="volume" aria-label="VOLUME"><span>VOLUME</span>${svg('volume')}</button>
            <button class="ex-btn is-off" data-act="back" aria-label="BACK" aria-disabled="true"><span>BACK</span>${svg('back')}</button>
            <button class="ex-btn" data-act="next" aria-label="NEXT"><span>NEXT</span>${svg('next')}</button>
          </div>
        </header>
        <div class="ex-vol hidden" id="exVol">
          <span>Volume</span>
          <input type="range" min="0" max="100" step="5" value="${Math.round(volume * 100)}" aria-label="음량">
          <b id="exVolNum">${Math.round(volume * 100)}</b>
        </div>
        <section class="ex-body" id="exBody"></section>
      </div>`;
    tts.setVolume(volume);
    this.root.onclick = (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'next') this.skip();
      else if (act === 'back') toast('시험 중에는 이전 문제로 돌아갈 수 없습니다');
      else if (act === 'volume') this.$('#exVol').classList.toggle('hidden');
      else if (act === 'close') {
        if (confirm('시험을 끝내고 나갈까요? (진행 내용은 저장되지 않습니다)')) { location.hash = '#/mock'; }
      } else if (act === 'sound') tts.beep();
    };
    this.$('#exVol input').addEventListener('input', (e) => {
      volume = Number(e.target.value) / 100;
      tts.setVolume(volume);
      this.$('#exVolNum').textContent = e.target.value;
    });
  }

  // 화면 바꾸기: title이 있으면 헤더에 "Question N of 11", 없으면 브랜드 로고
  screen({ title = '', cream = false, html }) {
    this.$('#exTitle').textContent = title;
    this.$('#exBrand').classList.toggle('hidden', !!title);
    this.$('#exTitle').classList.toggle('hidden', !title);
    const body = this.$('#exBody');
    body.className = 'ex-body' + (cream ? ' is-cream' : '');
    body.innerHTML = html;
    this.$('#exVol').classList.add('hidden');
  }

  // 지금 단계(안내 음성·타이머) 건너뛰기
  skip() {
    if (!this.skipResolve) return;
    const r = this.skipResolve;
    this.skipResolve = null;
    this.stepId++;
    clearInterval(this.timer);
    tts.cancel();
    r('skip');
  }

  stop() {
    if (!this.alive) return;
    this.alive = false;
    this.stepId++;
    clearInterval(this.timer);
    tts.cancel();
    this.root.onclick = null;
    if (this.startedAt) {
      store.addStudySeconds((Date.now() - this.startedAt) / 1000);
      this.startedAt = null;
    }
    if (this.skipResolve) { const r = this.skipResolve; this.skipResolve = null; r('abort'); }
  }

  // 건너뛸 수 있는 한 단계
  async step(fn) {
    if (!this.alive) throw ABORT;
    this.stepId++;
    const skipped = new Promise((r) => { this.skipResolve = r; });
    await Promise.race([Promise.resolve().then(fn), skipped]);
    this.skipResolve = null;
    if (!this.alive) throw ABORT;
  }

  narrate(text) { return this.step(() => tts.speak(text, 'en-US')); }
  pause(ms) { return this.step(() => new Promise((r) => setTimeout(r, ms * _test.scale))); }
  hold() { return this.step(() => new Promise(() => {})); } // NEXT를 누를 때까지

  countdown(seconds, label) {
    return this.step(() => new Promise((resolve) => {
      const id = this.stepId;
      const slot = this.$('#exTimer');
      const end = Date.now() + seconds * 1000 * _test.scale;
      const draw = () => {
        const left = Math.max(0, Math.ceil((end - Date.now()) / 1000 / _test.scale - 0.001));
        if (slot) slot.innerHTML = timerHtml(label, left);
        return left;
      };
      draw();
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (id !== this.stepId || !this.alive) { clearInterval(this.timer); return; }
        if (draw() <= 0) { clearInterval(this.timer); resolve(); }
      }, 100);
    }));
  }

  async beep() { await this.step(() => tts.beep()); }

  // 준비 → (신호음) → 응답
  async prepAndRespond(qNo, cue) {
    const t = TEST_TIMING[qNo] || TEST_TIMING[11];
    if (cue && t.prep >= 30) await this.narrate(MOCK_CUES.prepare);
    await this.countdown(t.prep, 'PREPARATION TIME');
    if (cue) await this.narrate(MOCK_CUES[cue]);
    await this.beep();
    await this.countdown(t.response, 'RESPONSE TIME');
  }

  async start() {
    this.startedAt = Date.now();
    try {
      for (const st of this.stages) await this.runStage(st);
    } catch (e) {
      if (e !== ABORT) throw e;
    }
  }

  async runStage(st) {
    const s = this.settings;
    if (st.type === 'start') {
      const sc = SCOPES[st.scope] || SCOPES.full;
      this.screen({
        cream: true,
        html: `<div class="ex-content">
          <h2 class="ex-h">TOEIC Speaking Practice Test</h2>
          <p class="ex-dir"><b>Directions :</b> ${sc.parts.includes(1) && sc.parts.length > 1 ? 'This practice test has 11 questions in 5 parts.' : 'This practice session has ' + sc.parts.length + ' part(s).'}
            Each question screen shows a preparation time and a response time. Begin speaking right after you hear the beep. Click NEXT at any time to skip ahead.</p>
          <p class="ex-dir">Make sure your volume is on.</p>
          <p class="ex-center"><button class="ex-small-btn" data-act="sound">Sound check</button></p>
          <p class="ex-dir ex-note">All questions are original practice items, not actual test questions. Click NEXT to begin.</p>
        </div>`,
      });
      await this.hold();
    } else if (st.type === 'directions') {
      const d = MOCK_DIRECTIONS[st.part];
      this.screen({
        cream: true,
        html: `<div class="ex-content">
          <h2 class="ex-h">${escapeHtml(d.title)}</h2>
          <p class="ex-dir"><b>Directions :</b> ${escapeHtml(d.en)}</p>
          ${s.mockShowKo ? `<p class="ex-dir-ko">${escapeHtml(d.ko)}</p>` : ''}
        </div>`,
      });
      await this.narrate(d.en);
      await this.pause(900);
    } else if (st.type === 'info') {
      this.screen({
        title: 'Questions 8–10 of 11',
        html: `<div class="ex-content">${scheduleHtml(st.set.schedule)}<div class="ex-timer-slot" id="exTimer"></div></div>`,
      });
      await this.narrate(st.set.introEnglish);
      await this.countdown(PART4_READING_SECONDS, 'PREPARATION TIME');
    } else if (st.type === 'q') {
      await this.runQuestion(st.q);
    } else if (st.type === 'end') {
      lastResult = { questions: this.questions, scope: this.scopeKey };
      this.screen({
        cream: true,
        html: `<div class="ex-content"><h2 class="ex-h">End of the Test</h2>
          <p class="ex-dir">This is the end of the speaking test. Click NEXT to see the model answers.</p></div>`,
      });
      await this.hold();
      this.stop();
      location.hash = '#/mock/result';
    }
  }

  async runQuestion(q) {
    const s = this.settings;
    const set = store.getSet(q.setId);
    const showText = q.part <= 2 || q.part === 5 || s.mockShowText !== false; // Part 3·4 질문 글자는 끌 수 있다
    const title = `Question ${q.qNo} of 11`;
    const hiddenBox = '<p class="ex-hidden">🎧 Listen to the question carefully.</p>';
    let inner;
    if (q.part === 1) {
      inner = `<div class="ex-passage">${escapeHtml(q.questionEnglish)}</div>`;
    } else if (q.part === 2) {
      const c = q.credit;
      inner = `<figure class="ex-photo-wrap"><img class="ex-photo" src="${escapeHtml(q.image)}" alt="Describe this picture">${
        c ? `<figcaption>Photo: ${escapeHtml(c.name)} / Unsplash</figcaption>` : ''}</figure>`;
    } else if (q.part === 3) {
      inner = showText
        ? `<p class="ex-intro">${escapeHtml(set ? set.introEnglish : '')}</p><p class="ex-question">${escapeHtml(q.questionEnglish)}</p>`
        : hiddenBox;
    } else if (q.part === 4) {
      inner = scheduleHtml(set && set.schedule) + (showText ? `<p class="ex-question">${escapeHtml(q.questionEnglish)}</p>` : hiddenBox);
    } else {
      inner = `<p class="ex-question is-left">${escapeHtml(q.questionEnglish)}</p>`;
    }
    this.screen({ title, html: `<div class="ex-content">${inner}<div class="ex-timer-slot" id="exTimer"></div></div>` });

    if (q.part === 1) await this.prepAndRespond(q.qNo, 'readAloud');
    else if (q.part === 2) await this.prepAndRespond(q.qNo, 'speak');
    else if (q.part === 5) await this.prepAndRespond(q.qNo, 'speak');
    else {
      // Part 3·4: (세트 첫 문항이면 상황 안내) → 질문 음성(Q10은 두 번) → 짧은 준비 → 신호음 → 응답
      if (q.part === 3 && q.qNo === 5 && set) await this.narrate(set.introEnglish);
      await this.narrate(q.questionEnglish);
      if (REPEATED_QNO.has(q.qNo)) {
        await this.pause(600);
        await this.narrate(q.questionEnglish);
      }
      await this.prepAndRespond(q.qNo, null);
    }
    store.recordListen(q.id);
    this.$('#exTimer').innerHTML = '';
    await this.pause(1000);
  }
}

// ── 화면: 시작(설정) ──────────────────────────────────────────
export function renderMockSetup(root) {
  stopMock();
  const s = store.getSettings();
  const toggle = (key, label, on) =>
    `<label class="setting-row"><span>${label}</span><input type="checkbox" data-key="${key}" ${on ? 'checked' : ''}></label>`;
  root.innerHTML = `
    ${backBar('모의고사 (실제 시험 화면)')}
    <p class="desc">실제 토익스피킹 시험 화면처럼 안내문 → 문제 → 준비 시간 → 신호음 → 응답 시간이 자동으로 진행됩니다.<br>
      소리 내어 직접 말해 보고, 끝난 뒤 모범답변과 비교하세요. 문항은 자체 제작 연습 문항입니다.</p>

    <h3 class="section-title">시험 시작</h3>
    <nav class="menu">
      ${Object.entries(SCOPES).map(([k, sc], i) =>
        `<a class="menu-btn ${i === 0 ? 'primary' : ''}" href="#/mock/run/${k}">${sc.label}<span class="menu-desc">${escapeHtml(sc.desc)}</span></a>`).join('')}
    </nav>

    <h3 class="section-title">화면 설정</h3>
    <div class="card">
      ${toggle('mockShowText', 'Part 3·4 질문 글자 표시 (끄면 듣기만으로 답하기)', s.mockShowText !== false)}
      ${toggle('mockShowKo', '안내문 한글 해석 표시', s.mockShowKo !== false)}
      <p class="desc small">시험이 시작되면 화면 오른쪽 위 NEXT 버튼으로 지금 단계를 건너뛸 수 있습니다.
        소리가 나지 않으면 시작 화면의 Sound check 버튼으로 확인하세요.</p>
    </div>`;
  root.querySelectorAll('input[type=checkbox][data-key]').forEach((cb) => {
    cb.addEventListener('change', () => { store.saveSettings({ [cb.dataset.key]: cb.checked }); toast('저장했습니다'); });
  });
}

// ── 화면: 시험 진행 ───────────────────────────────────────────
export function renderMockRun(root, scopeKey) {
  stopMock();
  const key = SCOPES[scopeKey] ? scopeKey : 'full';
  const built = buildTest(key);
  if (built.questions.length === 0) {
    root.innerHTML = `${backBar('모의고사', '#/mock')}<p class="desc">시험에 쓸 문항이 없습니다.</p>`;
    return;
  }
  document.body.classList.add('exam-mode');
  run = new MockRun(root, built, key);
  run.start();
}

// ── 화면: 결과 (모범답변 비교) ────────────────────────────────
export function renderMockResult(root) {
  stopMock();
  if (!lastResult) {
    root.innerHTML = `${backBar('모의고사 결과', '#/mock')}<p class="desc">아직 끝낸 모의고사가 없습니다.</p>
      <a class="menu-btn primary" href="#/mock">모의고사 시작<span class="menu-desc">실제 시험 화면으로 연습</span></a>`;
    return;
  }
  const { questions } = lastResult;

  const draw = () => {
    const s = store.getSettings();
    let lastSetId = null;
    const cards = questions.map((q) => {
      const set = store.getSet(q.setId);
      let head = '';
      if (set && set.id !== lastSetId) {
        lastSetId = set.id;
        head = `<div class="card mr-set"><div class="card-label">${set.part === 4 ? '질문자 안내' : '상황 안내'} · ${escapeHtml(set.topic)}</div>
          <div class="card-en">${escapeHtml(set.introEnglish)}</div><div class="card-ko">${escapeHtml(set.introKorean)}</div>
          ${set.schedule ? scheduleHtml(set.schedule) : ''}</div>`;
      }
      const a = store.getAnswer(q, s.targetLevel);
      const body = q.part === 1
        ? `<div class="passage guide">${q.guide ? guideHtml(q.guide) : escapeHtml(q.questionEnglish)}</div>
           <div class="card-ko">${escapeHtml(q.questionKorean)}</div>`
        : `${q.part === 2 ? `<img class="mr-photo" src="${escapeHtml(q.image)}" alt="" loading="lazy">` : `<div class="card-en">${escapeHtml(q.questionEnglish)}</div><div class="card-ko">${escapeHtml(q.questionKorean)}</div>`}
           <div class="mr-ans"><span class="lv-tag">${escapeHtml(a.level)}</span>${personaLabel(a) ? ` <span class="mr-persona">${escapeHtml(personaLabel(a))}</span>` : ''}
             <div class="card-en answer-text">${escapeHtml(a.en)}</div><div class="card-ko">${escapeHtml(a.ko)}</div></div>`;
      return `${head}<div class="card mr-q" data-id="${escapeHtml(q.id)}">
        <div class="q-item-top">${qNoBadge(q, { timing: false })}</div>
        ${body}
        <div class="btn-row">
          ${q.part === 2 ? '' : `<button class="sub-btn small-btn" data-act="q">🔊 ${q.part === 1 ? '모범 낭독' : '질문'}</button>`}
          ${q.part === 1 ? '' : '<button class="sub-btn small-btn" data-act="a">🔊 모범답변</button>'}
          <a class="sub-btn small-btn" href="#/study/part/${q.part}/q/${escapeHtml(q.id)}">자세히 ›</a>
        </div></div>`;
    }).join('');

    root.innerHTML = `
      ${backBar('모의고사 결과', '#/mock')}
      <p class="desc">수고하셨습니다. 아래 모범답변과 내 답변을 비교해 보세요. 레벨과 답변 화자를 바꿔 볼 수 있습니다.</p>
      <div class="card level-card">
        <div class="card-label">모범답변 레벨</div>
        ${levelPickerHtml(s.targetLevel || 'IL', { id: 'mrLevel' })}
        <div class="card-label persona-label">답변 화자</div>
        ${personaPickerHtml(s.persona, { id: 'mrPersona' })}
      </div>
      ${cards}
      <div class="btn-row"><a class="sub-btn primary-btn" href="#/mock">한 번 더 풀기</a></div>`;
    bindLevelPicker(root, 'mrLevel', (lv) => { store.saveSettings({ targetLevel: lv }); draw(); });
    bindLevelPicker(root, 'mrPersona', (p) => { store.saveSettings({ persona: p }); draw(); });
  };
  draw();

  root.onclick = (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const q = store.getQuestion(b.closest('.mr-q').dataset.id);
    if (!q) return;
    tts.cancel();
    if (b.dataset.act === 'q') tts.speak(q.questionEnglish, 'en-US');
    else tts.speak(store.getAnswer(q, store.getSettings().targetLevel).en, 'en-US');
  };
}
