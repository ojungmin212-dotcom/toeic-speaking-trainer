// 실전 듣기 모드 — 화면에 정답/번역을 먼저 보여주지 않는다.
// 음성만 듣고 의미를 판단 → [질문 확인] → 원문+해석+유형 → 알았음/몰랐음 기록
// 취약 질문 복습(#/review)도 같은 화면을 오답/복습 예정 풀로 사용한다.
import * as store from '../store.js';
import * as tts from '../tts.js';
import { pickWeighted } from '../srs.js';
import { QUESTION_TYPES } from '../seed-data.js';
import { escapeHtml, typeBadge, highlightKey, toast } from '../ui.js';
import { backBar } from './study.js';

let sessionStart = null;

export function stopListening() {
  tts.cancel();
  if (sessionStart) {
    store.addStudySeconds((Date.now() - sessionStart) / 1000);
    sessionStart = null;
  }
}

export function renderListening(root, { mode = 'all' } = {}) {
  stopListening();
  let pool;
  let title;
  if (mode === 'review') {
    const weak = store.getWeakQuestions();
    const due = store.getDueQuestions();
    const merged = [...new Map([...weak, ...due].map((q) => [q.id, q])).values()];
    pool = merged;
    title = '취약 질문 복습';
    if (!pool.length) {
      root.innerHTML = `${backBar(title)}<p class="desc">아직 복습할 질문이 없습니다.<br>퀴즈나 실전 듣기에서 학습을 시작해 보세요. 🎉</p>`;
      return;
    }
  } else {
    pool = store.getQuestions();
    title = '실전 듣기';
  }

  const weakTypes = new Set(store.getWeakTypes().map((w) => w.type));
  const playlist = pickWeighted(pool, store.getProgress, weakTypes, Math.min(pool.length, 20));
  let index = 0;
  sessionStart = Date.now();

  root.innerHTML = `
    ${backBar(title)}
    <div class="player">
      <div class="player-count" id="lCount"></div>
      <div class="player-step" id="lStep">🎧 질문을 듣고 의미를 판단해 보세요</div>
      <div class="player-text" id="lText"></div>
      <button class="big-play" id="lPlay" aria-label="다시 듣기">🔊</button>
      <div class="player-sub-btns">
        <button class="sub-btn primary-btn" id="lReveal">질문 확인</button>
      </div>
      <div class="judge-btns hidden" id="lJudge">
        <button class="judge ok" id="lOk">✅ 의미를 알았어요</button>
        <button class="judge no" id="lNo">❌ 몰랐어요</button>
      </div>
      <div class="player-nav">
        <button class="nav-btn" id="lPrev">← 이전</button>
        <button class="nav-btn" id="lNext">다음 →</button>
      </div>
    </div>`;

  const $ = (sel) => root.querySelector(sel);

  function playCurrent() {
    tts.cancel();
    const q = playlist[index];
    tts.speak(q.questionEnglish, 'en-US');
    store.recordListen(q.id);
  }

  function show() {
    const q = playlist[index];
    $('#lCount').textContent = `QUESTION ${index + 1} / ${playlist.length}`;
    $('#lStep').textContent = '🎧 질문을 듣고 의미를 판단해 보세요';
    $('#lText').innerHTML = '';
    $('#lJudge').classList.add('hidden');
    $('#lReveal').classList.remove('hidden');
    playCurrent();
  }

  function reveal() {
    const q = playlist[index];
    const s = store.getSettings();
    const typeInfo = QUESTION_TYPES[q.questionType];
    $('#lStep').textContent = '이 질문이 나에게 무엇을 요구했나요?';
    $('#lText').innerHTML = `
      <div class="p-en">${highlightKey(q.questionEnglish, q.keyExpression, s.beginnerMode)}</div>
      <div class="p-meta">${typeBadge(q.questionType)} <span class="key-expr">${escapeHtml(q.keyExpression)}</span></div>
      <div class="p-ko">${escapeHtml(q.questionKorean)}</div>
      ${s.beginnerMode && typeInfo ? `<div class="hint">💡 ${escapeHtml(typeInfo.hint)}</div>` : ''}`;
    $('#lReveal').classList.add('hidden');
    $('#lJudge').classList.remove('hidden');
  }

  function judge(correct) {
    const q = playlist[index];
    store.recordAnswer(q.id, correct);
    if (!correct) toast('취약 질문 목록에 저장했습니다');
    next();
  }

  function next() {
    if (index + 1 >= playlist.length) {
      $('#lStep').textContent = '🎉 세션 완료!';
      $('#lText').innerHTML = '<div class="p-ko">모든 질문을 확인했습니다.<br>다시 시작하려면 다음 버튼을 누르세요.</div>';
      $('#lJudge').classList.add('hidden');
      index = -1;
      return;
    }
    index += 1;
    show();
  }

  $('#lPlay').addEventListener('click', playCurrent);
  $('#lReveal').addEventListener('click', reveal);
  $('#lOk').addEventListener('click', () => judge(true));
  $('#lNo').addEventListener('click', () => judge(false));
  $('#lNext').addEventListener('click', next);
  $('#lPrev').addEventListener('click', () => { if (index > 0) { index -= 1; show(); } });

  show();
}
