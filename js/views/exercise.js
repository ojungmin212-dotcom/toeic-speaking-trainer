// 듣기 모드 — 화면을 보지 않고 이어폰만으로 자동 반복 학습
import * as store from '../store.js';
import { SequencePlayer } from '../player.js';
import { pickWeighted, groupBySet } from '../srs.js';
import { PARTS } from '../seed-data.js';
import {
  escapeHtml, typeBadges, highlightKey, toast, levelPickerHtml, bindLevelPicker, levelInfoHtml, qNoBadge, scheduleHtml,
  guideHtml, photoHtml, expressionMarkupHtml,
} from '../ui.js';
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
  else pool = store.getQuestionParts(); // 전체 학습 = 질문 듣기(Part 3~5). Part 1·2는 파트별 재생 목록으로
  if (!pool.length) return [];
  // SRS 가중치로 출제 순서 결정 (틀린 문제·취약 유형·복습 예정 우선) — 전체 풀 사용
  // 세트 문항은 실제 시험처럼 상황 안내 → Q5 → Q6 → Q7 순서로 이어서 재생
  return groupBySet(pickWeighted(pool, store.getProgress, weakTypes, pool.length));
}

export function renderExerciseSetup(root) {
  const wrong = store.getWeakQuestions().length;
  const fav = store.getFavorites().length;
  const due = store.getDueQuestions().length;
  const s = store.getSettings();

  root.innerHTML = `
    ${backBar('듣기 모드')}
    <p class="desc">재생 목록을 고르면 자동으로 재생됩니다.<br>실제 시험처럼 세트마다 상황 안내 → Q5·Q6·Q7(또는 Q8·Q9·Q10) 순서로,<br>영어 질문 → 생각 시간 → 한국어 해석 → 모범답변이 계속 반복됩니다.</p>

    <div class="card level-card">
      <div class="card-label">모범답변 레벨</div>
      ${levelPickerHtml(s.targetLevel || 'IL', { id: 'exLevel' })}
      <div id="exLevelInfo">${levelInfoHtml(s.targetLevel || 'IL')}</div>
      <button type="button" class="play-summary" id="exSummary">${escapeHtml(summaryText(s))}</button>
    </div>

    <h3 class="section-title">재생 목록</h3>
    <nav class="menu">
      <a class="menu-btn primary" href="#/exercise/play/all">전체 학습<span class="menu-desc">Part 3~5 질문 전체 (취약 문제 우선 출제)</span></a>
      ${Object.entries(PARTS).map(([n, p]) =>
        `<a class="menu-btn" href="#/exercise/play/part${n}">${p.name}만<span class="menu-desc">${escapeHtml(p.desc)}</span></a>`).join('')}
      <a class="menu-btn ${wrong ? '' : 'disabled'}" ${wrong ? '' : 'tabindex="-1" aria-disabled="true"'} href="#/exercise/play/wrong">틀린 문제만<span class="menu-desc">${wrong}문항</span></a>
      <a class="menu-btn ${fav ? '' : 'disabled'}" ${fav ? '' : 'tabindex="-1" aria-disabled="true"'} href="#/exercise/play/fav">즐겨찾기만<span class="menu-desc">${fav}문항</span></a>
      <a class="menu-btn ${due ? '' : 'disabled'}" ${due ? '' : 'tabindex="-1" aria-disabled="true"'} href="#/exercise/play/due">복습 예정만<span class="menu-desc">${due}문항</span></a>
    </nav>

    <h3 class="section-title" id="exSettings">재생 단계</h3>
    <div class="card">
      ${toggleRow('playSetIntro', '세트 상황 안내 (실제 시험처럼)', s.playSetIntro)}
      ${toggleRow('shadowing', '쉐도잉 — 모범답변을 문장마다 끊어 듣고 따라 말하기', s.shadowing)}
      ${toggleRow('playQuestionKo', '한국어 질문 해석', s.playQuestionKo)}
      ${toggleRow('playAnswerEn', '영어 모범답변', s.playAnswerEn)}
      ${toggleRow('playAnswerKo', '한국어 답변 해석', s.playAnswerKo)}
      ${toggleRow('repeatQuestion', '영어 질문 2회 반복', s.repeatQuestion)}
      ${toggleRow('beepAfterQuestion', '질문 후 신호음 (실제 시험처럼)', s.beepAfterQuestion)}
      <div class="setting-row">
        <span>생각·답변 시간<br><small class="muted">실전 = 문항별 실제 준비·응답 시간 (Q5 15초 … Q11 60초)</small></span>
        <select id="thinkSeconds">
          <option value="0" ${!s.thinkSeconds ? 'selected' : ''}>실전 (문항별)</option>
          ${[3, 4, 5, 7, 10, 15, 30, 45, 60].map((v) => `<option value="${v}" ${s.thinkSeconds === v ? 'selected' : ''}>${v}초</option>`).join('')}
        </select>
      </div>
    </div>`;

  const refreshSummary = () => { root.querySelector('#exSummary').textContent = summaryText(store.getSettings()); };
  root.querySelector('#exSummary').addEventListener('click', () => {
    root.querySelector('#exSettings').scrollIntoView({ block: 'start' });
  });
  root.querySelectorAll('input[type=checkbox][data-key]').forEach((cb) => {
    cb.addEventListener('change', () => { store.saveSettings({ [cb.dataset.key]: cb.checked }); refreshSummary(); });
  });
  root.querySelector('#thinkSeconds').addEventListener('change', (e) => {
    store.saveSettings({ thinkSeconds: Number(e.target.value) });
    refreshSummary();
  });
  bindLevelPicker(root, 'exLevel', (lv) => {
    store.saveSettings({ targetLevel: lv });
    root.querySelector('#exLevelInfo').innerHTML = levelInfoHtml(lv);
    refreshSummary();
  });
}

// 재생 설정 한 줄 요약 — 재생 목록을 누르기 전에 무엇이 나올지 보이도록
function summaryText(s) {
  const parts = [`${s.targetLevel || 'IL'} 답변`, s.thinkSeconds ? `생각 ${s.thinkSeconds}초` : '실전 시간'];
  parts.push(s.playQuestionKo ? '질문 해석 켬' : '질문 해석 끔');
  if (s.shadowing) parts.push('쉐도잉');
  if (!s.playAnswerEn) parts.push('모범답변 끔');
  else parts.push(s.playAnswerKo ? '답변 해석 켬' : '답변 해석 끔');
  return parts.join(' · ') + '  (설정 ↓)';
}

function toggleRow(key, label, checked) {
  return `<label class="setting-row"><span>${label}</span>
    <input type="checkbox" data-key="${key}" ${checked ? 'checked' : ''}></label>`;
}

const STEP_LABELS = {
  intro: '상황 안내',
  question: '영어 질문',
  think: '생각해 보세요…',
  prep: '준비 시간',
  respond: '답변해 보세요',
  questionKo: '질문 해석',
  answer: '모범답변',
  answerKo: '답변 해석',
  model: '모범 낭독',
  readAloud: '소리 내어 따라 읽어 보세요',
  describe: '사진을 보고 묘사해 보세요',
};
// 실전 시간의 '응답' 단계 이름은 파트마다 다르다
const RESPOND_LABELS = { 1: '소리 내어 읽어 보세요', 2: '사진을 묘사해 보세요' };

export function renderExercisePlay(root, source) {
  stopExercise();
  const playlist = buildPlaylist(source);
  if (!playlist.length) {
    root.innerHTML = `${backBar('듣기 모드', '#/exercise')}<p class="desc">재생할 질문이 없습니다.</p>`;
    return;
  }

  root.innerHTML = `
    ${backBar('듣기 모드', '#/exercise')}
    <div class="player">
      <div class="player-count" id="pCount">QUESTION 1 / ${playlist.length}</div>
      <div class="player-step" id="pStep">준비…</div>
      <div class="p-shadow hidden" id="pShadow"></div>
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
    const set = store.getSet(q.setId);
    $('#pCount').textContent = `${i + 1} / ${total}${q.qNo ? ' · Q' + q.qNo : ''}${set ? ' · ' + set.topic : ''}`;
    $('#pText').innerHTML = '';
    // Part 2는 사진이 곧 문제 — 처음부터 보여 준다
    if (q.part === 2) $('#pText').innerHTML = photoHtml(q, { credit: false });
  };

  player = new SequencePlayer(playlist, {
    onQuestionChange: showQuestion,
    onStepChange: (step, info) => {
      const part = player.current.part;
      // 쉐도잉: 지금 따라 말할 문장을 크게 보여 준다
      const sh = $('#pShadow');
      if (step === 'shadow' && info) {
        sh.classList.remove('hidden');
        sh.innerHTML = `<span class="p-shadow-n">${info.index + 1} / ${info.total}</span>${escapeHtml(info.text)}`;
        $('#pStep').textContent = '듣고 따라 말하세요';
        revealText();
        return;
      }
      sh.classList.add('hidden');
      // Part 4의 안내는 질문자(전화 건 사람)의 말
      $('#pStep').textContent = step === 'intro' && part === 4 ? '질문자 안내'
        : step === 'question' && part === 2 ? '지시문'
        : step === 'respond' && RESPOND_LABELS[part] ? RESPOND_LABELS[part]
          : (STEP_LABELS[step] || '');
      // 해석 단계부터는 자동으로 텍스트 표시 (원하면 먼저 '질문 확인'으로 미리 보기)
      // Part 1은 모범 낭독을 들으며 지문을 보고 따라 읽는다
      if (step === 'model' || step === 'questionKo' || step === 'answer' || step === 'answerKo') revealText();
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
    const ans = store.getAnswer(q, s.targetLevel);
    const set = store.getSet(q.setId);
    if (q.part === 1) {
      $('#pText').innerHTML = `
        <div class="p-meta">${qNoBadge(q, { timing: false })}${typeBadges(q)}</div>
        <div class="p-en guide">${guideHtml(q.guide || q.questionEnglish)}</div>
        <div class="p-ko">${escapeHtml(q.questionKorean)}</div>`;
      return;
    }
    if (q.part === 2) {
      $('#pText').innerHTML = `
        ${photoHtml(q, { credit: false })}
        <div class="p-meta">${qNoBadge(q, { timing: false })}${typeBadges(q)} <span class="lv-tag">${ans.level}</span></div>
        <div class="p-ans">${escapeHtml(ans.en)}<br><span class="p-ans-ko">${escapeHtml(ans.ko)}</span></div>`;
      return;
    }
    $('#pText').innerHTML = `
      ${set && set.schedule ? scheduleHtml(set.schedule) : ''}
      ${set ? `<div class="p-intro">${escapeHtml(set.introEnglish)}</div>` : ''}
      <div class="p-en">${highlightKey(q.questionEnglish, q.keyExpression, s.beginnerMode)}</div>
      <div class="p-meta">${qNoBadge(q, { timing: false })}${typeBadges(q)} <span class="lv-tag">${ans.level}</span></div>
      <div class="p-ko">${escapeHtml(q.questionKorean)}</div>
      <div class="p-ans">${ans.level === 'IH' || ans.level === 'AL' ? expressionMarkupHtml(ans.en) : escapeHtml(ans.en)}<br><span class="p-ans-ko">${escapeHtml(ans.ko)}</span></div>`;
  }

  $('#pToggle').addEventListener('click', () => player.toggle());
  $('#pReplay').addEventListener('click', () => player.replay());
  $('#pNext').addEventListener('click', () => player.next());
  $('#pPrev').addEventListener('click', () => player.prev());
  $('#pReveal').addEventListener('click', revealText);

  player.start();
}
