// 파트·레벨별 학습 — 목표 레벨 선택 → 파트/유형 선택 → 질문 목록 → 상세 (레벨별 모범답변 비교)
import * as store from '../store.js';
import * as tts from '../tts.js';
import { PARTS, QUESTION_TYPES, LEVELS } from '../seed-data.js';
import {
  escapeHtml, typeBadge, typeLabel, highlightKey, toast,
  levelPickerHtml, bindLevelPicker, levelInfoHtml, wordCount, speakSeconds,
} from '../ui.js';

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
}

export function renderStudyList(root, { part, type }) {
  const list = store.getQuestions({ part, type });
  const title = part ? PARTS[part].name : typeLabel(type);
  const level = store.getSettings().targetLevel || 'IL';
  root.innerHTML = `
    ${backBar(title + ' · ' + list.length + '문항', '#/study')}
    <a class="list-level" href="#/study">
      <span class="list-level-label">모범답변 레벨</span>
      <span><span class="lv-tag">${escapeHtml(level)}</span> <span class="list-level-change">변경 ›</span></span>
    </a>
    <div class="q-list">
      ${list.map((q) => {
        const p = store.getProgress(q.id);
        return `
        <div class="q-item with-play">
          <a class="q-item-body" href="#/study/q/${escapeHtml(q.id)}">
            <div class="q-item-top">${typeBadge(q.questionType)}
              <span class="diff">${'★'.repeat(q.difficulty)}</span>
              ${p.favorite ? '<span class="fav">♥</span>' : ''}
            </div>
            <div class="q-item-en">${escapeHtml(q.questionEnglish)}</div>
            <div class="q-item-ko">${escapeHtml(q.questionKorean)}</div>
          </a>
          <button class="item-play" data-qid="${escapeHtml(q.id)}" aria-label="질문 듣기">🔊</button>
        </div>`;
      }).join('')}
    </div>`;

  // 목록에서 바로 듣기 (상세로 이동하지 않음)
  root.querySelectorAll('.item-play').forEach((btn) => {
    btn.addEventListener('click', () => {
      const q = store.getQuestion(btn.dataset.qid);
      if (q) {
        tts.cancel();
        tts.speak(q.questionEnglish, 'en-US');
        store.recordListen(q.id);
      }
    });
  });
}

export function renderStudyDetail(root, id) {
  const q = store.getQuestion(id);
  if (!q) { root.innerHTML = backBar('질문을 찾을 수 없습니다', '#/study'); return; }
  const s = store.getSettings();
  const p = store.getProgress(id);
  const typeInfo = QUESTION_TYPES[q.questionType];
  const levels = store.availableLevels(q);
  // 상세 화면의 레벨 탭은 비교용 — 목표 레벨로 시작하되 탭 전환은 전역 설정을 바꾸지 않는다
  let current = store.getAnswer(q, s.targetLevel).level;

  root.innerHTML = `
    <div class="topbar"><button class="back" id="detailBack">←</button><h2>질문 상세</h2></div>
    <div class="detail">
      <div class="detail-meta">
        ${typeBadge(q.questionType)}
        <span class="badge badge-part">Part ${q.part}</span>
        <span class="diff">${'★'.repeat(q.difficulty)}</span>
        <button class="fav-btn ${p.favorite ? 'on' : ''}" id="favBtn">${p.favorite ? '♥' : '♡'}</button>
      </div>

      <div class="card">
        <div class="card-label">Question</div>
        <div class="card-en big">${highlightKey(q.questionEnglish, q.keyExpression, s.beginnerMode)}</div>
        ${s.beginnerMode && typeInfo ? `<div class="hint">💡 ${escapeHtml(typeInfo.hint)}</div>` : ''}
        <button class="speak-btn" id="qSpeak">🔊 질문 듣기</button>
      </div>

      <div class="card">
        <div class="card-label">질문 해석</div>
        <div class="card-ko">${escapeHtml(q.questionKorean)}</div>
      </div>

      <div class="card">
        <div class="answer-head">
          <span class="card-label">Answer</span>
          ${levels.length > 1 ? levelPickerHtml(current, { id: 'ansLevel', small: true, levels }) : ''}
        </div>
        <div class="level-note" id="ansNote"></div>
        <div class="card-en answer-text" id="ansEn"></div>
        <button class="speak-btn" id="aSpeak">🔊 답변 듣기</button>
        ${q.part === 4 ? '<p class="desc small">Part 4는 실제 시험에서 화면의 일정표를 보고 답합니다. 이 답변은 가상의 일정표를 기준으로 한 예시입니다.</p>' : ''}
      </div>

      <div class="card">
        <div class="card-label">답변 해석</div>
        <div class="card-ko answer-text" id="ansKo"></div>
      </div>

      <div class="detail-stats">듣기 ${p.listenCount}회 · 정답 ${p.correctCount} · 오답 ${p.incorrectCount}</div>
    </div>`;

  const $ = (sel) => root.querySelector(sel);

  function showAnswer(level) {
    const a = store.getAnswer(q, level);
    current = a.level;
    const L = LEVELS[a.level];
    $('#ansNote').textContent = `${a.level} · ${L.score} · ${wordCount(a.en)}단어 · 원어민 속도 약 ${speakSeconds(a.en)}초`;
    $('#ansEn').textContent = a.en;
    $('#ansKo').textContent = a.ko;
  }
  showAnswer(current);

  bindLevelPicker(root, 'ansLevel', (lv) => { tts.cancel(); showAnswer(lv); });

  $('#qSpeak').addEventListener('click', () => {
    tts.cancel();
    tts.speak(q.questionEnglish, 'en-US');
    store.recordListen(q.id);
  });
  $('#aSpeak').addEventListener('click', () => {
    tts.cancel();
    tts.speak(store.getAnswer(q, current).en, 'en-US');
  });

  // 보던 목록(파트/유형, 스크롤 위치)으로 되돌아가기
  $('#detailBack').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.hash = '#/study';
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
