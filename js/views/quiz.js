// 질문 유형 퀴즈 — 음성을 듣고 "무엇을 묻는 질문인가?" 4지선다
import * as store from '../store.js';
import * as tts from '../tts.js';
import { pickWeighted } from '../srs.js';
import { QUESTION_TYPES } from '../seed-data.js';
import { escapeHtml, typeLabel, highlightKey, toast } from '../ui.js';
import { backBar } from './study.js';

let sessionStart = null;

export function stopQuiz() {
  tts.cancel();
  if (sessionStart) {
    store.addStudySeconds((Date.now() - sessionStart) / 1000);
    sessionStart = null;
  }
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 의미가 겹쳐 정답을 알아도 헷갈리는 유형끼리는 같은 문제의 보기로 내지 않는다
// (예: "Which do you prefer...?"는 선호로도 선택으로도 읽힘)
const CONFUSABLE = {
  preference: ['choice', 'opinion'],
  choice: ['preference', 'opinion'],
  opinion: ['choice', 'preference'],
  time: ['schedule'],
  schedule: ['time', 'place', 'person'],
  place: ['schedule'],
  person: ['schedule'],
};

export function renderQuiz(root) {
  stopQuiz();
  const pool = store.getQuestions();
  if (!pool.length) {
    root.innerHTML = `${backBar('질문 유형 퀴즈')}<p class="desc">질문이 없습니다.<br>질문 관리에서 문항을 추가하거나 설정에서 기본 문제로 초기화해 주세요.</p>`;
    return;
  }
  const weakTypes = new Set(store.getWeakTypes().map((w) => w.type));
  const playlist = pickWeighted(pool, store.getProgress, weakTypes, Math.min(pool.length, 15));
  let index = 0;
  let score = { ok: 0, no: 0 };
  sessionStart = Date.now();

  root.innerHTML = `
    ${backBar('질문 유형 퀴즈')}
    <div class="player">
      <div class="player-count" id="qCount"></div>
      <div class="player-step">이 질문은 무엇을 묻고 있나요?<br><span class="step-sub">What is this question asking about?</span></div>
      <button class="big-play small" id="qPlay" aria-label="다시 듣기">🔊</button>
      <div class="quiz-options" id="qOptions"></div>
      <div class="player-text" id="qResult"></div>
      <div class="player-nav">
        <div class="quiz-score" id="qScore">정답 0 · 오답 0</div>
        <button class="nav-btn hidden" id="qNext">다음 →</button>
      </div>
    </div>`;

  const $ = (sel) => root.querySelector(sel);

  function playCurrent() {
    tts.cancel();
    const q = playlist[index];
    tts.speak(q.questionEnglish, 'en-US');
    store.recordListen(q.id);
  }

  function buildOptions(q) {
    const banned = new Set([q.questionType, ...(CONFUSABLE[q.questionType] || [])]);
    const others = shuffle(Object.keys(QUESTION_TYPES).filter((t) => !banned.has(t))).slice(0, 3);
    return shuffle([q.questionType, ...others]);
  }

  function show() {
    const q = playlist[index];
    $('#qCount').textContent = `QUESTION ${index + 1} / ${playlist.length}`;
    $('#qResult').innerHTML = '';
    $('#qNext').classList.add('hidden');
    const opts = buildOptions(q);
    $('#qOptions').innerHTML = opts.map((t) =>
      `<button class="quiz-opt" data-type="${t}">${escapeHtml(typeLabel(t))}</button>`).join('');
    $('#qOptions').querySelectorAll('.quiz-opt').forEach((btn) => {
      btn.addEventListener('click', () => answer(btn));
    });
    playCurrent();
  }

  function answer(btn) {
    const q = playlist[index];
    const chosen = btn.dataset.type;
    const correct = chosen === q.questionType;
    store.recordAnswer(q.id, correct);
    score[correct ? 'ok' : 'no'] += 1;
    $('#qScore').textContent = `정답 ${score.ok} · 오답 ${score.no}`;

    $('#qOptions').querySelectorAll('.quiz-opt').forEach((b) => {
      b.disabled = true;
      if (b.dataset.type === q.questionType) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    const s = store.getSettings();
    $('#qResult').innerHTML = `
      <div class="quiz-verdict ${correct ? 'ok' : 'no'}">${correct ? '정답입니다' : '오답 — 취약 목록에 저장했습니다'}</div>
      <div class="p-en">${highlightKey(q.questionEnglish, q.keyExpression, s.beginnerMode)}</div>
      <div class="p-ko">${escapeHtml(q.questionKorean)}</div>
      <div class="p-meta"><span class="key-expr">${escapeHtml(q.keyExpression)} = ${escapeHtml(typeLabel(q.questionType))}</span></div>`;
    $('#qNext').classList.remove('hidden');
  }

  function next() {
    if (index + 1 >= playlist.length) {
      tts.cancel();
      const total = score.ok + score.no;
      const rate = total ? Math.round((score.ok / total) * 100) : 0;
      root.querySelector('.player').innerHTML = `
        <div class="player-step">퀴즈 완료</div>
        <div class="stat-cards">
          <div class="stat-card"><div class="stat-num">${score.ok}/${total}</div><div class="stat-label">정답</div></div>
          <div class="stat-card"><div class="stat-num">${rate}%</div><div class="stat-label">정답률</div></div>
        </div>
        <div class="player-nav">
          <button class="nav-btn" id="qRetry">다시 하기</button>
          <a class="nav-btn" href="#/review">취약 복습 →</a>
        </div>`;
      root.querySelector('#qRetry').addEventListener('click', () => renderQuiz(root));
      toast('결과가 통계에 반영되었습니다');
      return;
    }
    index += 1;
    show();
  }

  $('#qPlay').addEventListener('click', playCurrent);
  $('#qNext').addEventListener('click', next);
  show();
}
