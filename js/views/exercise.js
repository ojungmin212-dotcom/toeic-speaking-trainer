// 운동 모드 — 화면을 보지 않고 이어폰만으로 자동 반복 학습
import * as store from '../store.js';
import { SequencePlayer } from '../player.js';
import { pickWeighted } from '../srs.js';
import { PARTS } from '../seed-data.js';
import { escapeHtml, typeBadge, highlightKey, toast } from '../ui.js';
import { backBar } from './study.js';

let player = null;

export function stopExercise() {
  if (player) { player.stop(); player = null; }
}

function buildPlaylist(source) {
  const weakTypes = new Set(store.getWeakTypes().map((w) => w.type));
  let pool;
  if (source === 'wrong') pool = store.getWeakQuestions();
  else if (source === 'fav') pool = store.getFavorites();
  else if (source === 'due') pool = store.getDueQuestions();
  else if (source.startsWith('part')) pool = store.getQuestions({ part: Number(source.slice(4)) });
  else pool = store.getQuestions();
  if (!pool.length) return [];
  // SRS 가중치로 출제 순서 결정 (틀린 문제·취약 유형·복습 예정 우선) — 전체 풀 사용
  return pickWeighted(pool, store.getProgress, weakTypes, pool.length);
}

export function renderExerciseSetup(root) {
  const wrong = store.getWeakQuestions().length;
  const fav = store.getFavorites().length;
  const due = store.getDueQuestions().length;
  const s = store.getSettings();

  root.innerHTML = `
    ${backBar('운동 모드')}
    <p class="desc">재생 목록을 고르면 자동으로 재생됩니다.<br>영어 질문 → 생각 시간 → 한국어 해석 → 모범답변 순서로 계속 반복됩니다.</p>
    <nav class="menu">
      <a class="menu-btn primary" href="#/exercise/play/all">전체 학습<span class="menu-desc">모든 질문 (취약 문제 우선 출제)</span></a>
      ${Object.entries(PARTS).map(([n, p]) =>
        `<a class="menu-btn" href="#/exercise/play/part${n}">${p.name}만<span class="menu-desc">${escapeHtml(p.desc)}</span></a>`).join('')}
      <a class="menu-btn ${wrong ? '' : 'disabled'}" ${wrong ? '' : 'tabindex="-1" aria-disabled="true"'} href="#/exercise/play/wrong">틀린 문제만<span class="menu-desc">${wrong}문항</span></a>
      <a class="menu-btn ${fav ? '' : 'disabled'}" ${fav ? '' : 'tabindex="-1" aria-disabled="true"'} href="#/exercise/play/fav">즐겨찾기만<span class="menu-desc">${fav}문항</span></a>
      <a class="menu-btn ${due ? '' : 'disabled'}" ${due ? '' : 'tabindex="-1" aria-disabled="true"'} href="#/exercise/play/due">복습 예정만<span class="menu-desc">${due}문항</span></a>
    </nav>

    <h3 class="section-title">재생 단계</h3>
    <div class="card">
      ${toggleRow('playQuestionKo', '한국어 질문 해석', s.playQuestionKo)}
      ${toggleRow('playAnswerEn', '영어 모범답변', s.playAnswerEn)}
      ${toggleRow('playAnswerKo', '한국어 답변 해석', s.playAnswerKo)}
      ${toggleRow('repeatQuestion', '영어 질문 2회 반복', s.repeatQuestion)}
      ${toggleRow('beepAfterQuestion', '질문 후 신호음 (실제 시험처럼)', s.beepAfterQuestion)}
      <div class="setting-row">
        <span>생각 시간</span>
        <select id="thinkSeconds">
          ${[3, 4, 5, 7, 10].map((v) => `<option value="${v}" ${s.thinkSeconds === v ? 'selected' : ''}>${v}초</option>`).join('')}
        </select>
      </div>
    </div>`;

  root.querySelectorAll('input[type=checkbox][data-key]').forEach((cb) => {
    cb.addEventListener('change', () => store.saveSettings({ [cb.dataset.key]: cb.checked }));
  });
  root.querySelector('#thinkSeconds').addEventListener('change', (e) => {
    store.saveSettings({ thinkSeconds: Number(e.target.value) });
  });
}

function toggleRow(key, label, checked) {
  return `<label class="setting-row"><span>${label}</span>
    <input type="checkbox" data-key="${key}" ${checked ? 'checked' : ''}></label>`;
}

const STEP_LABELS = {
  question: '🎧 영어 질문',
  think: '🤔 생각해 보세요…',
  questionKo: '🇰🇷 질문 해석',
  answer: '💬 모범답변',
  answerKo: '🇰🇷 답변 해석',
};

export function renderExercisePlay(root, source) {
  stopExercise();
  const playlist = buildPlaylist(source);
  if (!playlist.length) {
    root.innerHTML = `${backBar('운동 모드', '#/exercise')}<p class="desc">재생할 질문이 없습니다.</p>`;
    return;
  }

  root.innerHTML = `
    ${backBar('운동 모드', '#/exercise')}
    <div class="player">
      <div class="player-count" id="pCount">QUESTION 1 / ${playlist.length}</div>
      <div class="player-step" id="pStep">준비…</div>
      <div class="player-text" id="pText"></div>
      <button class="big-play" id="pToggle" aria-label="일시정지/재생">⏸</button>
      <div class="player-sub-btns">
        <button class="sub-btn" id="pReplay">↻ 다시 듣기</button>
        <button class="sub-btn" id="pReveal">질문 확인</button>
      </div>
      <div class="player-nav">
        <button class="nav-btn" id="pPrev">← 이전</button>
        <button class="nav-btn" id="pNext">다음 →</button>
      </div>
    </div>`;

  const $ = (sel) => root.querySelector(sel);
  let revealed = false;

  const showQuestion = (q, i, total) => {
    revealed = false;
    $('#pCount').textContent = `QUESTION ${i + 1} / ${total}`;
    $('#pText').innerHTML = '';
  };

  player = new SequencePlayer(playlist, {
    onQuestionChange: showQuestion,
    onStepChange: (step) => {
      $('#pStep').textContent = STEP_LABELS[step] || '';
      // 해석 단계부터는 자동으로 텍스트 표시 (원하면 먼저 '질문 확인'으로 미리 보기)
      if (step === 'questionKo' || step === 'answer' || step === 'answerKo') revealText();
    },
    onFinish: () => toast('한 바퀴 끝! 처음부터 다시 재생합니다.'),
    // 이어폰/잠금화면에서 조작해도 화면 버튼이 항상 실제 상태와 일치
    onPlayState: (state) => {
      const btn = $('#pToggle');
      if (!btn) return;
      btn.textContent = state === 'playing' ? '⏸' : '▶';
      if (state === 'blocked') {
        toast('오디오를 재생할 수 없어 일시정지했습니다. ▶를 눌러 다시 시작하세요.');
      }
    },
  });

  function revealText() {
    if (revealed) return;
    revealed = true;
    const q = player.current;
    const s = store.getSettings();
    $('#pText').innerHTML = `
      <div class="p-en">${highlightKey(q.questionEnglish, q.keyExpression, s.beginnerMode)}</div>
      <div class="p-meta">${typeBadge(q.questionType)}</div>
      <div class="p-ko">${escapeHtml(q.questionKorean)}</div>
      <div class="p-ans">${escapeHtml(q.answerEnglish)}<br><span class="p-ans-ko">${escapeHtml(q.answerKorean)}</span></div>`;
  }

  $('#pToggle').addEventListener('click', () => player.toggle());
  $('#pReplay').addEventListener('click', () => player.replay());
  $('#pNext').addEventListener('click', () => player.next());
  $('#pPrev').addEventListener('click', () => player.prev());
  $('#pReveal').addEventListener('click', revealText);

  player.start();
}
