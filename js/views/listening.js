// 실전 듣기 모드 — 화면에 정답/번역을 먼저 보여주지 않는다.
// 음성만 듣고 의미를 판단 → [질문 확인] → 원문+해석+유형 → 알았음/몰랐음 기록
// 취약 질문 복습(#/review)도 같은 화면을 오답/복습 예정 풀로 사용한다.
import * as store from '../store.js';
import * as tts from '../tts.js';
import { pickWeighted, groupBySet } from '../srs.js';
import { QUESTION_TYPES } from '../seed-data.js';
import { escapeHtml, typeBadges, highlightKey, toast, qNoBadge, scheduleHtml } from '../ui.js';
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
      root.innerHTML = `${backBar(title)}<p class="desc">아직 복습할 질문이 없습니다.<br>퀴즈나 실전 듣기에서 학습을 시작해 보세요.</p>`;
      return;
    }
  } else {
    pool = store.getQuestionParts();
    title = '실전 듣기';
    if (!pool.length) {
      root.innerHTML = `${backBar(title)}<p class="desc">질문이 없습니다.<br>질문 관리에서 문항을 추가하거나 설정에서 기본 문제로 초기화해 주세요.</p>`;
      return;
    }
  }

  const weakTypes = new Set(store.getWeakTypes().map((w) => w.type));
  // 같은 세트에서 뽑힌 문항은 실제 시험 순서(Q5→Q6→Q7)로 붙인다
  const playlist = groupBySet(pickWeighted(pool, store.getProgress, weakTypes, Math.min(pool.length, 20)));
  let index = 0;
  let done = false; // 세션 완료 상태 — 완료 화면에서 🔊/질문확인이 죽지 않도록 가드
  sessionStart = Date.now();

  root.innerHTML = `
    ${backBar(title)}
    <div class="player">
      <div class="player-count" id="lCount"></div>
      <div class="player-step" id="lStep">질문을 듣고 의미를 판단해 보세요</div>
      <div class="player-text" id="lText"></div>
      <button class="big-play" id="lPlay" aria-label="다시 듣기">🔊</button>
      <div class="player-sub-btns">
        <button class="sub-btn primary-btn" id="lReveal">질문 확인</button>
      </div>
      <div class="judge-btns hidden" id="lJudge">
        <button class="judge ok" id="lOk">의미를 알았어요</button>
        <button class="judge no" id="lNo">몰랐어요</button>
      </div>
      <div class="player-nav">
        <button class="nav-btn" id="lPrev">← 이전</button>
        <button class="nav-btn" id="lNext">다음 →</button>
      </div>
    </div>`;

  const $ = (sel) => root.querySelector(sel);

  function playCurrent() {
    if (done) return;
    tts.cancel();
    const q = playlist[index];
    tts.speak(q.questionEnglish, 'en-US');
    store.recordListen(q.id);
  }

  // 세트 질문은 주제를 먼저 알려 준다 (실제 시험에서는 질문 전에 상황 안내가 나온다)
  function stepText(q) {
    const set = store.getSet(q.setId);
    return set ? `[${set.topic}] 질문을 듣고 의미를 판단해 보세요` : '질문을 듣고 의미를 판단해 보세요';
  }

  function show() {
    done = false;
    const q = playlist[index];
    $('#lCount').textContent = `QUESTION ${index + 1} / ${playlist.length}${q.qNo ? ' · Q' + q.qNo : ''}`;
    $('#lStep').textContent = stepText(q);
    $('#lText').innerHTML = '';
    $('#lJudge').classList.add('hidden');
    $('#lReveal').classList.remove('hidden');
    playCurrent();
  }

  function reveal() {
    if (done) return;
    const q = playlist[index];
    const s = store.getSettings();
    const hint = [q.questionType, q.questionType2].filter(Boolean)
      .map((t) => QUESTION_TYPES[t] && QUESTION_TYPES[t].hint).filter(Boolean).join(' · ');
    const set = store.getSet(q.setId);
    $('#lStep').textContent = q.questionType2 ? '이 질문은 무엇 두 가지를 요구했나요?' : '이 질문이 나에게 무엇을 요구했나요?';
    $('#lText').innerHTML = `
      ${set && set.schedule ? scheduleHtml(set.schedule) : ''}
      ${set ? `<div class="p-intro">${escapeHtml(set.introEnglish)}</div>` : ''}
      <div class="p-en">${highlightKey(q.questionEnglish, q.keyExpression, s.beginnerMode)}</div>
      <div class="p-meta">${qNoBadge(q, { timing: false })}${typeBadges(q)} <span class="key-expr">${escapeHtml(q.keyExpression)}</span></div>
      <div class="p-ko">${escapeHtml(q.questionKorean)}</div>
      ${s.beginnerMode && hint ? `<div class="hint">💡 ${escapeHtml(hint)}</div>` : ''}`;
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
    if (!done && index + 1 >= playlist.length) {
      done = true;
      tts.cancel();
      $('#lStep').textContent = '세션 완료';
      $('#lText').innerHTML = '<div class="p-ko">모든 질문을 확인했습니다.<br>다시 시작하려면 다음 버튼을 누르세요.</div>';
      $('#lJudge').classList.add('hidden');
      $('#lReveal').classList.add('hidden');
      return;
    }
    index = done ? 0 : index + 1;
    show();
  }

  $('#lPlay').addEventListener('click', playCurrent);
  $('#lReveal').addEventListener('click', reveal);
  $('#lOk').addEventListener('click', () => judge(true));
  $('#lNo').addEventListener('click', () => judge(false));
  $('#lNext').addEventListener('click', next);
  $('#lPrev').addEventListener('click', () => {
    if (done) { index = playlist.length - 1; show(); } // 완료 화면에서 마지막 문제로 복귀
    else if (index > 0) { index -= 1; show(); }
  });

  show();
}
