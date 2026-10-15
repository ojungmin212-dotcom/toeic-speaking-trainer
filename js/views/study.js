// 파트·레벨별 학습 — 목표 레벨 선택 → 파트/유형 선택 → 질문 목록 → 상세 (레벨별 모범답변 비교)
import * as store from '../store.js';
import * as tts from '../tts.js';
import { PARTS, QUESTION_TYPES, LEVELS } from '../seed-data.js';
import {
  escapeHtml, typeBadges, typeLabel, highlightKey, toast, qNoBadge, scheduleHtml, guideHtml, photoHtml,
  levelPickerHtml, bindLevelPicker, levelInfoHtml, personaPickerHtml, PERSONAS, wordCount, speakSeconds,
  expressionMarkupHtml, expressionListHtml,
} from '../ui.js';
import { findExpressions } from '../expressions.js';
import { shadowText } from '../shadow.js';

// 세트 번호 표시용 (p3-07 → SET 07) — AI로 만든 세트(us-…)는 번호 대신 'AI SET'
function setLabel(set) {
  const n = /^p[34]-(\d+)$/.exec(String(set.id));
  return n ? 'SET ' + n[1].padStart(2, '0') : 'AI SET';
}

// 목록의 세트 머리 — 실제 시험처럼 질문 전에 나오는 상황 안내(Part 3)·일정표 제목(Part 4)
function setHeadHtml(set) {
  const title = set.schedule ? set.schedule.title : set.introEnglish;
  return `
    <div class="set-head">
      <div class="set-head-top">
        <span class="set-no">${setLabel(set)}</span>
        <b>${escapeHtml(set.topic)}</b>
        <button class="item-play set-play" data-set="${escapeHtml(set.id)}" aria-label="상황 안내 듣기">🔊</button>
      </div>
      <div class="set-intro">${escapeHtml(title)}</div>
    </div>`;
}

// 두 가지를 묶어 묻는 질문은 힌트도 둘 다
function hintText(q) {
  return [q.questionType, q.questionType2].filter(Boolean)
    .map((t) => QUESTION_TYPES[t] && QUESTION_TYPES[t].hint).filter(Boolean).join(' · ');
}

export function renderStudyIndex(root) {
  const level = store.getSettings().targetLevel || 'IL';

  const parts = Object.entries(PARTS).map(([num, p]) => {
    const count = store.getQuestions({ part: Number(num) }).length;
    return `<a class="menu-btn" href="#/study/part/${num}">${p.name}<span class="menu-desc">${escapeHtml(p.desc)} · ${count}문항</span></a>`;
  }).join('');

  const types = Object.entries(QUESTION_TYPES).map(([key, t]) => {
    const count = store.getQuestions({ type: key }).length;
    if (!count) return '';
    return `<a class="chip" href="#/study/type/${key}">${escapeHtml(t.ko)} ${count}</a>`;
  }).join('');

  root.innerHTML = `
    ${backBar('파트·레벨별 학습')}
    <section class="card level-card">
      <div class="card-label">목표 레벨</div>
      ${levelPickerHtml(level)}
      <div id="levelInfo">${levelInfoHtml(level)}</div>
      <p class="desc small">선택한 레벨의 모범답변이 질문 상세와 듣기 모드에 적용됩니다.</p>
      <div class="card-label persona-label">답변 화자</div>
      ${personaPickerHtml(store.getSettings().persona)}
      <p class="desc small">대학생을 고르면 회사·동료·출퇴근 이야기 대신 수업·캠퍼스·아르바이트 이야기로 답한 모범답변을 들려줍니다
        (Part 3·5 중 직장 맥락이 있는 문항, 4레벨 모두).</p>
    </section>
    <h3 class="section-title">파트</h3>
    <nav class="menu">${parts}</nav>
    <h3 class="section-title">유형별 보기</h3>
    <div class="chips">${types}</div>`;

  bindLevelPicker(root, 'levelPicker', (lv) => {
    store.saveSettings({ targetLevel: lv });
    root.querySelector('#levelInfo').innerHTML = levelInfoHtml(lv);
    toast(`목표 레벨을 ${lv}로 설정했습니다`);
  });
  bindLevelPicker(root, 'personaPicker', (p) => {
    store.saveSettings({ persona: p });
    toast(`${PERSONAS[p]} 답변으로 바꿨습니다`);
  });
}

// 상세 화면 간 이동 상태 — 목록 복귀 시 마지막으로 본 문항 위치, 다음 문항에 이어서 보여줄 비교 레벨
let lastViewedId = null;
let carryLevel = null;

function listBase({ part, type }) {
  if (part) return `#/study/part/${part}`;
  if (type) return `#/study/type/${encodeURIComponent(type)}`;
  return null;
}

export function renderStudyList(root, { part, type }) {
  const list = store.getQuestions({ part, type });
  const title = part ? PARTS[part].name : typeLabel(type);
  const level = store.getSettings().targetLevel || 'IL';
  const base = listBase({ part, type });
  root.innerHTML = `
    ${backBar(title + ' · ' + list.length + '문항', '#/study')}
    <a class="list-level" href="#/study">
      <span class="list-level-label">모범답변 레벨</span>
      <span><span class="lv-tag">${escapeHtml(level)}</span> <span class="list-level-change">변경 ›</span></span>
    </a>
    <div class="q-list">
      ${list.map((q, i) => {
        const p = store.getProgress(q.id);
        const set = store.getSet(q.setId);
        // 파트 목록에서는 세트가 바뀔 때마다 상황 안내 머리를 넣는다
        const head = part && set && (i === 0 || list[i - 1].setId !== q.setId) ? setHeadHtml(set) : '';
        return `${head}
        <div class="q-item with-play ${set && part ? 'in-set' : ''}" data-qid="${escapeHtml(q.id)}">
          <a class="q-item-body" href="${base}/q/${escapeHtml(q.id)}">
            <div class="q-item-top">${qNoBadge(q, { timing: false })}${typeBadges(q)}
              ${set && !part ? `<span class="q-topic">${escapeHtml(set.topic)}</span>` : ''}
              ${q.topic ? `<span class="q-topic">${escapeHtml(q.topic)}</span>` : ''}
              <span class="diff">${'★'.repeat(q.difficulty)}</span>
              ${p.favorite ? '<span class="fav">♥</span>' : ''}
            </div>
            ${q.image ? `<img class="q-thumb" src="${escapeHtml(q.image)}" alt="" loading="lazy">`
              : `<div class="q-item-en ${q.part === 1 ? 'clamp2' : ''}">${escapeHtml(q.questionEnglish)}</div>
            <div class="q-item-ko ${q.part === 1 ? 'clamp1' : ''}">${escapeHtml(q.questionKorean)}</div>`}
          </a>
          ${q.image ? '' : `<button class="item-play" data-qid="${escapeHtml(q.id)}" aria-label="${q.part === 1 ? '모범 낭독 듣기' : '질문 듣기'}">🔊</button>`}
        </div>`;
      }).join('')}
    </div>`;

  // 상세에서 여러 문항을 넘겨 본 뒤 돌아오면, 마지막으로 본 문항 위치로 스크롤
  if (lastViewedId) {
    const item = [...root.querySelectorAll('.q-item[data-qid]')].find((el) => el.dataset.qid === lastViewedId);
    if (item) {
      item.scrollIntoView({ block: 'center' });
      item.classList.add('just-viewed');
    }
    lastViewedId = null;
  }

  // 목록에서 바로 듣기 (상세로 이동하지 않음) — 세트 머리의 🔊는 상황 안내
  root.querySelectorAll('.item-play').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.set) {
        const set = store.getSet(btn.dataset.set);
        if (set) { tts.cancel(); tts.speak(set.introEnglish, 'en-US'); }
        return;
      }
      const q = store.getQuestion(btn.dataset.qid);
      if (q) {
        tts.cancel();
        tts.speak(q.questionEnglish, 'en-US');
        store.recordListen(q.id);
      }
    });
  });
}

export function renderStudyDetail(root, id, ctx = {}) {
  const q = store.getQuestion(id);
  if (!q) { root.innerHTML = backBar('질문을 찾을 수 없습니다', '#/study'); return; }
  const s = store.getSettings();
  const p = store.getProgress(id);
  const hint = hintText(q);
  const set = store.getSet(q.setId);
  const levels = store.availableLevels(q);
  // 상세 화면의 레벨 탭은 비교용 — 목표 레벨로 시작하되 탭 전환은 전역 설정을 바꾸지 않는다.
  // 이전/다음으로 넘어온 경우에는 보던 비교 레벨을 이어서 보여준다.
  let current = store.getAnswer(q, carryLevel || s.targetLevel).level;
  carryLevel = null;
  // 답변 화자도 상세에서는 비교용 — 설정값으로 시작하고, 탭 전환은 이 화면에만 적용
  let persona = s.persona;
  const hasStudent = store.hasStudentAnswer(q);
  lastViewedId = q.id;

  // 이동 기준 목록: 목록에서 들어왔으면 그 목록, 아니면(통계 화면 등) 같은 파트
  const nav = ctx.part || ctx.type ? ctx : { part: q.part };
  const base = listBase(nav);
  const seq = store.getQuestions(nav);
  const pos = seq.findIndex((x) => x.id === q.id);
  const prevQ = pos > 0 ? seq[pos - 1] : null;
  const nextQ = pos >= 0 && pos < seq.length - 1 ? seq[pos + 1] : null;
  const navTitle = nav.part ? PARTS[nav.part].name : typeLabel(nav.type);

  root.innerHTML = `
    <div class="topbar"><button class="back" id="detailBack">←</button><h2>질문 상세</h2>
      ${pos >= 0 ? `<span class="detail-pos">${escapeHtml(navTitle)}</span>` : ''}</div>
    ${pos >= 0 ? `
    <div class="title-view">
      <button class="btn-v" id="tPrev" aria-label="이전 질문" ${prevQ ? '' : 'disabled'}>‹</button>
      <strong>${escapeHtml(navTitle)} ${pos + 1}번 <span class="tv-count">/ ${seq.length}</span></strong>
      <button class="btn-v" id="tNext" aria-label="다음 질문" ${nextQ ? '' : 'disabled'}>›</button>
    </div>` : ''}
    <div class="detail with-bottom-nav">
      <div class="detail-meta">
        <span class="badge badge-part">Part ${q.part}</span>
        ${qNoBadge(q)}
        <button class="fav-btn ${p.favorite ? 'on' : ''}" id="favBtn">${p.favorite ? '♥' : '♡'}</button>
      </div>

      ${set && set.schedule ? `
      <div class="card">
        <div class="card-label">일정표</div>
        ${scheduleHtml(set.schedule)}
        <p class="desc small">실제 시험에서는 질문이 나오기 전에 이 일정표를 45초 동안 읽습니다.</p>
      </div>` : ''}

      ${set ? `
      <div class="card set-card">
        <div class="card-label">${set.part === 4 ? '질문자 안내' : '상황 안내'} · ${setLabel(set)} ${escapeHtml(set.topic)}</div>
        <div class="card-en">${escapeHtml(set.introEnglish)}</div>
        <div class="card-ko set-ko">${escapeHtml(set.introKorean)}</div>
        <button class="speak-btn" id="introSpeak">🔊 안내 듣기</button>
      </div>` : ''}

      ${q.part === 1 ? `
      <div class="card q-box">
        <div class="card-label">Question ${q.qNo || 1} · ${escapeHtml(q.topic || '지문 읽기')}</div>
        <div class="card-en big passage">${escapeHtml(q.questionEnglish)}</div>
        <div class="q-types">${typeBadges(q)} <span class="diff">${'★'.repeat(q.difficulty)}</span></div>
        <button class="speak-btn" id="qSpeak">🔊 모범 낭독 듣기</button>
        <button class="speak-btn ghost" id="shadowBtn">🗣 문장별 따라 읽기</button>
        <div class="shadow-now hidden" id="shadowNow"></div>
      </div>
      <div class="card">
        <div class="card-label">끊어 읽기 가이드</div>
        <div class="card-en guide">${guideHtml(q.guide || q.questionEnglish)}</div>
        <p class="desc small"><span class="pause">/</span> 에서 잠깐 쉬고, <b class="stress">굵은 단어</b>를 힘주어 읽습니다. 목록(A, B, and C)은 앞 항목을 올려 읽고 마지막 항목에서 내립니다.</p>
      </div>
      <div class="card">
        <div class="card-label">지문 해석</div>
        <div class="card-ko">${escapeHtml(q.questionKorean)}</div>
      </div>` : q.part === 2 ? `
      <div class="card q-box">
        <div class="card-label">Question ${q.qNo || 3} · 사진 묘사</div>
        ${photoHtml(q)}
        <div class="card-en">${escapeHtml(q.questionEnglish)}</div>
        <div class="card-ko set-ko">${escapeHtml(q.questionKorean)}</div>
        ${s.beginnerMode && hint ? `<div class="hint">💡 ${escapeHtml(hint)}</div>` : ''}
      </div>` : `
      <div class="card q-box">
        <div class="card-label">Question${q.qNo ? ' ' + q.qNo : ''}</div>
        <div class="card-en big">${highlightKey(q.questionEnglish, q.keyExpression, s.beginnerMode)}</div>
        <div class="q-types">${typeBadges(q)} <span class="diff">${'★'.repeat(q.difficulty)}</span></div>
        ${s.beginnerMode && hint ? `<div class="hint">💡 ${escapeHtml(hint)}</div>` : ''}
        <button class="speak-btn" id="qSpeak">🔊 질문 듣기</button>
      </div>

      <div class="card">
        <div class="card-label">질문 해석</div>
        <div class="card-ko">${escapeHtml(q.questionKorean)}</div>
      </div>`}

      ${q.part === 1 ? '' : `
      <div class="card">
        <div class="answer-head">
          <span class="card-label">Answer</span>
          ${levels.length > 1 ? levelPickerHtml(current, { id: 'ansLevel', small: true, levels }) : ''}
        </div>
        ${hasStudent ? `<div class="answer-persona"><span class="desc small">답변 화자</span>${personaPickerHtml(persona, { id: 'ansPersona' })}</div>` : ''}
        <div class="level-note" id="ansNote"></div>
        <div class="card-en answer-text" id="ansEn"></div>
        <div id="ansExpr"></div>
        <button class="speak-btn" id="aSpeak">🔊 답변 듣기</button>
        <button class="speak-btn ghost" id="shadowBtn">🗣 문장별 따라 말하기</button>
        <div class="shadow-now hidden" id="shadowNow"></div>
        ${q.levelAnswers && q.levelAnswers.IH && q.levelAnswers.AL ? '<button class="speak-btn ghost" id="cmpBtn">IH ↔ AL 비교</button>' : ''}
      </div>

      <div class="card compare hidden" id="cmpCard">
        <div class="card-label">IH ↔ AL 비교</div>
        <p class="desc small">같은 질문에 IH와 AL이 어떻게 다르게 답하는지 비교합니다. 색으로 표시한 부분이 고급 표현입니다.</p>
        <div class="cmp-grid" id="cmpGrid"></div>
      </div>

      <div class="card">
        <div class="card-label">답변 해석</div>
        <div class="card-ko answer-text" id="ansKo"></div>
      </div>`}

      <div class="detail-stats">듣기 ${p.listenCount}회${q.part <= 2 ? '' : ` · 정답 ${p.correctCount} · 오답 ${p.incorrectCount}`}</div>
    </div>
    ${pos >= 0 ? `
    <nav class="detail-nav" aria-label="질문 이동">
      <button class="nav-btn" id="dPrev" ${prevQ ? '' : 'disabled'}>← 이전</button>
      <span class="detail-nav-pos">${pos + 1} / ${seq.length}</span>
      <button class="nav-btn primary-nav" id="dNext" ${nextQ ? '' : 'disabled'}>${nextQ ? '다음 →' : '마지막 질문'}</button>
    </nav>` : ''}`;

  const $ = (sel) => root.querySelector(sel);

  function showAnswer(level) {
    if (!$('#ansNote')) return; // Part 1은 모범답변 카드가 없다 (지문 자체가 모범 낭독)
    const a = store.getAnswer(q, level, persona);
    current = a.level;
    const L = LEVELS[a.level];
    $('#ansNote').textContent = `${a.persona === 'student' ? '대학생 · ' : ''}${a.level} · ${L.score} · ${wordCount(a.en)}단어 · 원어민 속도 약 ${speakSeconds(a.en)}초`;
    // IH·AL은 고급 표현을 강조하고 뜻을 목록으로 (AL 포인트)
    const adv = a.level === 'IH' || a.level === 'AL';
    if (adv) {
      $('#ansEn').innerHTML = expressionMarkupHtml(a.en);
      const list = expressionListHtml(a.en);
      $('#ansExpr').innerHTML = list ? `<div class="expr-head">${a.level} 포인트 표현 ${findExpressions(a.en).length}개</div>${list}` : '';
    } else {
      $('#ansEn').textContent = a.en;
      $('#ansExpr').innerHTML = '';
    }
    $('#ansKo').textContent = a.ko;
  }

  // 쉐도잉 — 지금 보이는 모범답변(Part 1은 지문)을 문장마다 끊어 듣고 따라 말하기. 다시 누르면 멈춤.
  const shadowBtn = $('#shadowBtn');
  if (shadowBtn) {
    let running = false;
    const label = shadowBtn.textContent;
    shadowBtn.addEventListener('click', async () => {
      if (running) { tts.cancel(); return; }
      tts.cancel();
      const text = q.part === 1 ? q.questionEnglish : store.getAnswer(q, current, persona).en;
      const myGen = tts.generation();
      const box = $('#shadowNow');
      running = true;
      shadowBtn.textContent = '■ 그만하기';
      box.classList.remove('hidden');
      await shadowText(text, {
        alive: () => tts.generation() === myGen && root.contains(shadowBtn),
        onSentence: (i, n, sent) => {
          box.innerHTML = `<span class="p-shadow-n">${i + 1} / ${n}</span>${escapeHtml(sent.text)}`;
        },
      });
      running = false;
      shadowBtn.textContent = label;
      box.classList.add('hidden');
    });
  }

  // IH ↔ AL 나란히 비교 — 단어 수·고급 표현 수와 함께
  const renderCompare = () => {
    $('#cmpGrid').innerHTML = ['IH', 'AL'].map((lv) => {
      const v = store.getAnswer(q, lv, persona);
      return `<div class="cmp-col">
        <div class="cmp-title"><span class="lv-tag">${lv}</span> ${wordCount(v.en)}단어 · 고급 표현 ${findExpressions(v.en).length}개</div>
        <div class="card-en answer-text">${expressionMarkupHtml(v.en)}</div>
        <button class="speak-btn small-speak" data-lv="${lv}">🔊 ${lv} 듣기</button>
      </div>`;
    }).join('');
    $('#cmpGrid').querySelectorAll('[data-lv]').forEach((b) => b.addEventListener('click', () => {
      tts.cancel();
      tts.speak(store.getAnswer(q, b.dataset.lv, persona).en, 'en-US');
    }));
  };
  if ($('#cmpBtn')) {
    $('#cmpBtn').addEventListener('click', () => {
      const card = $('#cmpCard');
      const open = card.classList.toggle('hidden') === false;
      $('#cmpBtn').textContent = open ? 'IH ↔ AL 비교 닫기' : 'IH ↔ AL 비교';
      if (!open) return;
      renderCompare();
      card.scrollIntoView({ block: 'start' });
    });
  }
  showAnswer(current);

  bindLevelPicker(root, 'ansLevel', (lv) => { tts.cancel(); showAnswer(lv); });
  bindLevelPicker(root, 'ansPersona', (pv) => {
    tts.cancel();
    persona = pv;
    showAnswer(current);
    if (!$('#cmpCard').classList.contains('hidden')) renderCompare();
  });

  if (set) {
    $('#introSpeak').addEventListener('click', () => {
      tts.cancel();
      tts.speak(set.introEnglish, 'en-US');
    });
  }
  if ($('#qSpeak')) $('#qSpeak').addEventListener('click', () => {
    tts.cancel();
    tts.speak(q.questionEnglish, 'en-US');
    store.recordListen(q.id);
  });
  if ($('#aSpeak')) $('#aSpeak').addEventListener('click', () => {
    tts.cancel();
    tts.speak(store.getAnswer(q, current, persona).en, 'en-US');
  });

  // 이전/다음 질문 — 방문 기록을 쌓지 않고 교체(replace)해서, ← 한 번이면 목록으로 돌아간다
  const go = (target) => {
    if (!target) return;
    tts.cancel();
    carryLevel = current;
    location.replace(`${base}/q/${encodeURIComponent(target.id)}`);
  };
  if (pos >= 0) {
    $('#dPrev').addEventListener('click', () => go(prevQ));
    $('#dNext').addEventListener('click', () => go(nextQ));
    $('#tPrev').addEventListener('click', () => go(prevQ));
    $('#tNext').addEventListener('click', () => go(nextQ));
    // 휴대폰: 좌우로 밀어서 이동 (세로 스크롤·레벨 탭과 구분되도록 가로 이동이 충분할 때만)
    let sx = 0, sy = 0, tracking = false;
    const area = $('.detail');
    area.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1 || e.target.closest('.seg, button, textarea, input')) { tracking = false; return; }
      tracking = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    area.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 70 && Math.abs(dy) < 45) go(dx < 0 ? nextQ : prevQ);
    }, { passive: true });
  }

  // 보던 목록으로 되돌아가기 (마지막으로 본 문항 위치로 스크롤됨)
  $('#detailBack').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.hash = base;
  });

  $('#favBtn').addEventListener('click', (e) => {
    const on = store.toggleFavorite(id);
    e.target.textContent = on ? '♥' : '♡';
    e.target.classList.toggle('on', on);
    toast(on ? '즐겨찾기에 추가했습니다' : '즐겨찾기에서 제거했습니다');
  });
}

export function backBar(title, href = '#/') {
  return `<div class="topbar"><a class="back" href="${href}">←</a><h2>${escapeHtml(title)}</h2></div>`;
}
