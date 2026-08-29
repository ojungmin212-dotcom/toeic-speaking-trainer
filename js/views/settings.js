// 설정 — 음성(남/여, 특정 음성), 속도, 초보자 모드, 데이터 백업
import * as store from '../store.js';
import * as tts from '../tts.js';
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
      <label class="setting-row"><span>초보자 모드 (핵심 의문사 강조)</span>
        <input type="checkbox" id="beginnerMode" ${s.beginnerMode ? 'checked' : ''}></label>
      <label class="setting-row"><span>질문 후 신호음 (실제 시험처럼)</span>
        <input type="checkbox" id="beepAfterQuestion" ${s.beepAfterQuestion ? 'checked' : ''}></label>
    </div>

    <h3 class="section-title">데이터</h3>
    <div class="card">
      <div class="btn-row">
        <button class="sub-btn" id="exportJson">JSON 백업</button>
        <button class="sub-btn" id="importJson">JSON 복원</button>
        <button class="sub-btn danger" id="resetSeed">기본 문제로 초기화</button>
      </div>
      <p class="desc small">학습 기록은 이 브라우저에만 저장됩니다. 주기적으로 JSON 백업을 권장합니다.</p>
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
  bind('beepAfterQuestion', 'beepAfterQuestion', true);
  bind('useGeneratedAudio', 'useGeneratedAudio', true);

  root.querySelector('#testVoice').addEventListener('click', () => {
    tts.cancel();
    tts.speak('What do you usually do on weekends?', 'en-US');
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
