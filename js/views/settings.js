// 설정 — 음성(남/여, 특정 음성), 속도, 초보자 모드, 기기 간 동기화, 데이터 백업
import * as store from '../store.js';
import * as tts from '../tts.js';
import * as sync from '../sync.js';
import { applyTheme } from '../theme.js';
import { toast, download, pickFile } from '../ui.js';
import { backBar } from './study.js';

export async function renderSettings(root) {
  const s = store.getSettings();
  // 음성 목록/서버 확인은 느릴 수 있으므로 골격을 먼저 그린다 (빈 화면 방지)
  root.innerHTML = `${backBar('설정')}<p class="desc">설정을 불러오는 중…</p>`;
  const [enVoices, koVoices, server, genCount] = await Promise.all([
    tts.getEnglishVoices(), tts.getKoreanVoices(), tts.checkServerTts(), tts.generatedAudioCount(),
  ]);
  // 기다리는 동안 다른 화면으로 이동했으면 덮어쓰지 않는다
  if (!location.hash.startsWith('#/settings')) return;

  root.innerHTML = `
    ${backBar('설정')}
    <h3 class="section-title">화면</h3>
    <div class="card">
      <div class="setting-row"><span>화면 테마 (다크: 눈이 편한 어두운 화면)</span>
        <select id="theme">
          <option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>다크</option>
          <option value="light" ${s.theme === 'light' ? 'selected' : ''}>라이트</option>
          <option value="auto" ${s.theme === 'auto' ? 'selected' : ''}>기기 설정 따름</option>
        </select></div>
    </div>

    <h3 class="section-title">음성</h3>
    <div class="card">
      <label class="setting-row"><span>고품질 사전 생성 음성 ${genCount ? `<span class="ok-text">(${genCount}개 사용 중 ✓)</span>` : '<span class="warn-text">(음성생성.bat 실행 필요)</span>'}</span>
        <input type="checkbox" id="useGeneratedAudio" ${s.useGeneratedAudio !== false ? 'checked' : ''}></label>
      <div class="setting-row"><span>TTS 방식 (파일 없는 질문용)</span>
        <select id="ttsProvider">
          <option value="webspeech" ${s.ttsProvider === 'webspeech' ? 'selected' : ''}>브라우저 내장 (키 불필요)</option>
          <option value="openai" ${s.ttsProvider === 'openai' ? 'selected' : ''} ${server.tts ? '' : 'disabled'}>OpenAI TTS ${server.tts ? '' : '(서버 미설정)'}</option>
        </select></div>
      <div class="setting-row"><span>성별 (자동 선택 기준)</span>
        <select id="voiceGender">
          <option value="female" ${s.voiceGender === 'female' ? 'selected' : ''}>여성</option>
          <option value="male" ${s.voiceGender === 'male' ? 'selected' : ''}>남성</option>
        </select></div>
      <div class="setting-row"><span>영어 음성 직접 선택</span>
        <select id="voiceEnName">
          <option value="">자동 (미국 영어 우선)</option>
          ${enVoices.map((v) => `<option value="${v.name}" ${s.voiceEnName === v.name ? 'selected' : ''}>${v.name}</option>`).join('')}
        </select></div>
      <div class="setting-row"><span>한국어 음성</span>
        <select id="voiceKoName">
          <option value="">자동</option>
          ${koVoices.map((v) => `<option value="${v.name}" ${s.voiceKoName === v.name ? 'selected' : ''}>${v.name}</option>`).join('')}
        </select></div>
      <div class="setting-row"><span>말하기 속도</span>
        <select id="rate">
          ${[0.75, 0.85, 0.92, 1.0, 1.1].map((v) => `<option value="${v}" ${Math.abs(s.rate - v) < 0.01 ? 'selected' : ''}>${v}x</option>`).join('')}
        </select></div>
      <button class="sub-btn" id="testVoice">🔊 음성 테스트</button>
      <p class="desc small">🎙 <b>고품질 사전 생성 음성</b>이 켜져 있으면 기본 문항 전체가 자연스러운
        신경망 음성(mp3)으로 재생됩니다. 직접 추가한 질문 등 파일이 없는 문항만 아래 TTS 방식으로 폴백됩니다.
        직접 추가한 질문의 음성을 만들려면: 아래 <b>JSON 백업</b>으로 받은 파일을 프로젝트 폴더에
        <code>questions.json</code>으로 저장한 뒤 <code>음성생성.bat</code>을 실행하세요 (PC 전용).<br>
        ※ 실제 ETS 시험 성우의 목소리를 그대로 복제하는 것은 저작권 문제로 지원하지 않습니다.</p>
    </div>

    <h3 class="section-title">학습</h3>
    <div class="card">
      <div class="setting-row"><span>답변 화자 (대학생: 수업·캠퍼스 이야기 / 초보 추천: 둘 중 발음하기 쉬운 쪽)</span>
        <select id="persona">
          <option value="worker" ${s.persona !== 'student' && s.persona !== 'easy' ? 'selected' : ''}>직장인</option>
          <option value="student" ${s.persona === 'student' ? 'selected' : ''}>대학생</option>
          <option value="easy" ${s.persona === 'easy' ? 'selected' : ''}>초보 추천 (발음하기 쉬운 쪽)</option>
        </select></div>
      <div class="setting-row"><span>목표 레벨 (모범답변 수준)</span>
        <select id="targetLevel">
          ${['IL', 'IM', 'IH', 'AL'].map((lv) => `<option value="${lv}" ${(s.targetLevel || 'IL') === lv ? 'selected' : ''}>${lv}</option>`).join('')}
        </select></div>
      <label class="setting-row"><span>초보자 모드 (핵심 의문사 강조)</span>
        <input type="checkbox" id="beginnerMode" ${s.beginnerMode ? 'checked' : ''}></label>
      <label class="setting-row"><span>질문 후 신호음 (실제 시험처럼)</span>
        <input type="checkbox" id="beepAfterQuestion" ${s.beepAfterQuestion ? 'checked' : ''}></label>
    </div>

    <h3 class="section-title">기기 간 동기화</h3>
    <div class="card">
      <p class="desc small">서버 없이 두 기기(예: 휴대폰 ↔ PC)의 학습 기록을 합칩니다.
        한 기기에서 <b>보내기</b> → 다른 기기에서 <b>합치기</b>. 정답·오답·듣기 횟수, 날짜별 학습량, 즐겨찾기,
        직접 추가·AI 문항을 덮어쓰지 않고 합칩니다 (여러 번 합쳐도 두 번 세지 않습니다).
        양쪽을 똑같이 맞추려면 반대 방향으로도 한 번 합치세요.</p>
      <div class="btn-row">
        <button class="sub-btn primary-btn" id="syncCopy">📋 코드 복사</button>
        <button class="sub-btn" id="syncShare">📤 파일로 보내기</button>
      </div>
      <textarea id="syncOut" class="sync-box hidden" rows="3" readonly aria-label="이 기기의 동기화 코드"></textarea>
      <label class="sync-label">받은 동기화 코드
        <textarea id="syncIn" class="sync-box" rows="3" placeholder="TST1: 로 시작하는 코드를 붙여넣기"></textarea></label>
      <div class="btn-row">
        <button class="sub-btn primary-btn" id="syncMerge">📥 합치기</button>
        <button class="sub-btn" id="syncFile">파일에서 합치기</button>
      </div>
      <p class="desc small" id="syncResult"></p>
    </div>

    <h3 class="section-title">데이터</h3>
    <div class="card">
      <div class="btn-row">
        <button class="sub-btn" id="exportJson">JSON 백업</button>
        <button class="sub-btn" id="importJson">JSON 복원 (덮어쓰기)</button>
        <button class="sub-btn danger" id="resetSeed">기본 문제로 초기화</button>
      </div>
      <p class="desc small">학습 기록은 이 브라우저에만 저장됩니다. 주기적으로 JSON 백업을 권장합니다.
        복원은 이 기기의 기록을 백업 내용으로 바꿉니다 — 두 기기의 기록을 합치려면 위의 동기화를 쓰세요.</p>
    </div>`;

  const bind = (id, key, isCheck = false, isNum = false) => {
    root.querySelector('#' + id).addEventListener('change', (e) => {
      let v = isCheck ? e.target.checked : e.target.value;
      if (isNum) v = Number(v);
      store.saveSettings({ [key]: v });
      toast('저장했습니다');
    });
  };
  bind('ttsProvider', 'ttsProvider');
  bind('voiceGender', 'voiceGender');
  bind('voiceEnName', 'voiceEnName');
  bind('voiceKoName', 'voiceKoName');
  bind('rate', 'rate', false, true);
  bind('beginnerMode', 'beginnerMode', true);
  bind('targetLevel', 'targetLevel');
  bind('persona', 'persona');
  bind('theme', 'theme');
  root.querySelector('#theme').addEventListener('change', (e) => applyTheme(e.target.value));
  bind('beepAfterQuestion', 'beepAfterQuestion', true);
  bind('useGeneratedAudio', 'useGeneratedAudio', true);

  root.querySelector('#testVoice').addEventListener('click', () => {
    tts.cancel();
    tts.speak('What do you usually do on weekends?', 'en-US');
  });

  // ── 기기 간 동기화 ──
  const $ = (sel) => root.querySelector(sel);
  const showResult = (r) => {
    $('#syncResult').textContent = `합쳤습니다 — 문항 기록 ${r.progress}개 · 날짜 ${r.days}일${r.questions ? ` · 새 문항 ${r.questions}개` : ''}`;
    toast('학습 기록을 합쳤습니다');
  };
  $('#syncCopy').addEventListener('click', async () => {
    const code = await sync.makeCode();
    if (await sync.copyText(code)) {
      toast(`코드를 복사했습니다 (${Math.ceil(code.length / 1024)}KB) — 다른 기기의 '받은 동기화 코드'에 붙여넣으세요`);
      $('#syncOut').classList.add('hidden');
    } else {
      // 클립보드 권한이 없으면 직접 복사하도록 코드를 보여 준다
      const box = $('#syncOut');
      box.value = code;
      box.classList.remove('hidden');
      box.focus(); box.select();
      toast('코드를 길게 눌러 전체 복사하세요');
    }
  });
  $('#syncShare').addEventListener('click', async () => {
    const code = await sync.makeCode();
    if (!(await sync.shareCodeFile(code))) {
      download(sync.fileName(), code, 'text/plain');
      toast('파일을 저장했습니다 — 다른 기기에서 \'파일에서 합치기\'로 여세요');
    }
  });
  $('#syncMerge').addEventListener('click', async () => {
    try {
      showResult(await sync.mergeCode($('#syncIn').value));
      $('#syncIn').value = '';
    } catch (e) { $('#syncResult').textContent = '⚠️ ' + e.message; }
  });
  $('#syncFile').addEventListener('click', async () => {
    const text = await pickFile('.txt,.json,text/plain,application/json');
    if (!text) return;
    try { showResult(await sync.mergeCode(text)); }
    catch (e) { $('#syncResult').textContent = '⚠️ ' + e.message; }
  });

  root.querySelector('#exportJson').addEventListener('click', () => {
    download('toeic-speaking-trainer-backup.json', store.exportJSON(), 'application/json');
  });
  root.querySelector('#importJson').addEventListener('click', async () => {
    const text = await pickFile('.json');
    if (!text) return;
    try {
      const count = store.importJSON(text);
      toast(count + '개 질문을 복원했습니다');
    } catch (e) { toast('복원 실패: ' + e.message); }
  });
  root.querySelector('#resetSeed').addEventListener('click', () => {
    if (confirm(`사용자 추가 질문이 삭제되고 기본 ${store.seedCount()}문항으로 돌아갑니다. 계속할까요? (학습 기록은 유지)`)) {
      store.resetToSeed();
      toast('기본 문제로 초기화했습니다');
    }
  });
}
