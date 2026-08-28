// 파트별 학습 — 파트 선택 → 질문 목록 → 상세 (음성/해석/모범답변/즐겨찾기)
import * as store from '../store.js';
import * as tts from '../tts.js';
import { PARTS, QUESTION_TYPES } from '../seed-data.js';
import { escapeHtml, typeBadge, typeLabel, highlightKey, toast } from '../ui.js';

export function renderStudyIndex(root) {
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
    ${backBar('파트별 학습')}
    <nav class="menu">${parts}</nav>
    <h3 class="section-title">유형별 보기</h3>
    <div class="chips">${types}</div>`;
}

export function renderStudyList(root, { part, type }) {
  const list = store.getQuestions({ part, type });
  const title = part ? PARTS[part].name : typeLabel(type);
  root.innerHTML = `
    ${backBar(title + ' · ' + list.length + '문항', '#/study')}
    <div class="q-list">
      ${list.map((q) => {
        const p = store.getProgress(q.id);
        return `
        <a class="q-item with-play" href="#/study/q/${q.id}">
          <div class="q-item-body">
            <div class="q-item-top">${typeBadge(q.questionType)}
              <span class="diff">${'★'.repeat(q.difficulty)}</span>
              ${p.favorite ? '<span class="fav">♥</span>' : ''}
            </div>
            <div class="q-item-en">${escapeHtml(q.questionEnglish)}</div>
            <div class="q-item-ko">${escapeHtml(q.questionKorean)}</div>
          </div>
          <button class="item-play" data-qid="${q.id}" aria-label="질문 듣기">🔊</button>
        </a>`;
      }).join('')}
    </div>`;

  // 목록에서 바로 듣기 (상세로 이동하지 않음)
  root.querySelectorAll('.item-play').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
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

  root.innerHTML = `
    ${backBar('질문 상세')}
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
        <button class="speak-btn" data-text="${escapeHtml(q.questionEnglish)}" data-lang="en-US">🔊 질문 듣기</button>
      </div>

      <div class="card">
        <div class="card-label">질문 해석</div>
        <div class="card-ko">${escapeHtml(q.questionKorean)}</div>
      </div>

      <div class="card">
        <div class="card-label">Answer</div>
        <div class="card-en">${escapeHtml(q.answerEnglish)}</div>
        <button class="speak-btn" data-text="${escapeHtml(q.answerEnglish)}" data-lang="en-US">🔊 답변 듣기</button>
      </div>

      <div class="card">
        <div class="card-label">답변 해석</div>
        <div class="card-ko">${escapeHtml(q.answerKorean)}</div>
      </div>

      <div class="detail-stats">듣기 ${p.listenCount}회 · 정답 ${p.correctCount} · 오답 ${p.incorrectCount}</div>
    </div>`;

  root.querySelectorAll('.speak-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      tts.cancel();
      tts.speak(btn.dataset.text, btn.dataset.lang);
      store.recordListen(q.id);
    });
  });

  root.querySelector('#favBtn').addEventListener('click', (e) => {
    const on = store.toggleFavorite(id);
    e.target.textContent = on ? '♥' : '♡';
    e.target.classList.toggle('on', on);
    toast(on ? '즐겨찾기에 추가했습니다' : '즐겨찾기에서 제거했습니다');
  });
}

export function backBar(title, href = '#/') {
  return `<div class="topbar"><a class="back" href="${href}">←</a><h2>${escapeHtml(title)}</h2></div>`;
}
