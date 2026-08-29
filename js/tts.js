// TTS Provider Adapter — 호출부는 speak()만 사용하고 Provider 구현을 모른다.
// 재생 우선순위: ① 사전 생성 신경망 mp3 (audio/manifest.json) ② OpenAI TTS(로컬 서버) ③ 브라우저 내장.
// 실패 시 다음 Provider로 자동 폴백한다 (무음 진행 방지).
//
// 취소는 "세대 토큰" 방식: cancel()이 세대를 올리고, 모든 재생 경로는
// 자기 세대가 최신인지 확인한 뒤에만 소리를 낸다 → 유령 오디오/겹침 재생 방지.
//
// (실제 시험 음성이나 특정 화자의 목소리는 복제하지 않는다)

import { getSettings } from './store.js';

let voicesCache = [];
let gen = 0; // 취소 세대 — cancel()마다 +1

export function cancel() {
  gen += 1;
  try { speechSynthesis.cancel(); } catch {}
  settlePending(false);
  if (fileAudio) { try { fileAudio.pause(); } catch {} }
}

// ── 공유 오디오 엘리먼트 (모바일 자동재생 정책 대응) ──────────
// iOS/Android는 사용자 제스처 없이 새 Audio().play()를 차단한다.
// 하나의 엘리먼트를 첫 터치에서 무음으로 잠금 해제한 뒤 src만 바꿔 재사용한다.
const fileAudio = typeof Audio !== 'undefined' ? new Audio() : null;
let pendingResolve = null; // 진행 중 파일 재생의 resolve — 취소/교체 시 반드시 풀어준다
let audioUnlocked = false;
let unlockSrc = null; // unlock에 사용한 무음 src (실제 재생과 구분용)

function unlockAudio() {
  if (audioUnlocked || !fileAudio) return;
  // 이미 제스처 체인에서 실제 재생이 진행/대기 중이면 엘리먼트는 이미 unlock된 것 —
  // 재생 중인 음성을 무음 wav로 덮어쓰지 않는다.
  if (pendingResolve || (fileAudio.src && !fileAudio.paused)) { audioUnlocked = true; return; }
  audioUnlocked = true;
  try {
    if (!unlockSrc) unlockSrc = silenceDataUri(0.06); // 실제 샘플이 있는 짧은 무음 (0바이트 wav는 일부 WebKit에서 거부)
    fileAudio.src = unlockSrc;
    fileAudio.play().then(
      () => { if (fileAudio.src === unlockSrc) fileAudio.pause(); },
      (err) => {
        // 자동재생 정책 거부일 때만 재시도 대상. 실제 재생에 밀려난 Abort는 이미 unlock 성공.
        if (err && err.name === 'NotAllowedError') audioUnlocked = false;
      }
    );
  } catch { audioUnlocked = false; }
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state !== 'running') audioCtx.resume();
  } catch {}
}
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', unlockAudio, { capture: true });
  document.addEventListener('touchend', unlockAudio, { capture: true });
}

function settlePending(ok) {
  if (pendingResolve) { const r = pendingResolve; pendingResolve = null; r(ok); }
}

// 외부 인터럽션(전화 수신, 다른 앱의 오디오 포커스 등) 알림 — player가 자동 일시정지로 전파
let interruptHandler = null;
export function setInterruptHandler(fn) { interruptHandler = fn; }

// 공유 엘리먼트로 URL 재생. ended/error/pause 어느 경우든 promise가 반드시 풀린다.
function playUrl(url, rate, myGen) {
  if (!fileAudio || myGen !== gen) return Promise.resolve(false);
  settlePending(false);
  return new Promise((resolve) => {
    pendingResolve = resolve;
    fileAudio.onended = () => settlePending(true);
    fileAudio.onerror = () => settlePending(false);
    fileAudio.onpause = () => {
      if (fileAudio.ended || fileAudio.currentTime === 0) return;
      if (unlockSrc && fileAudio.src === unlockSrc) return; // unlock 무음의 정지는 인터럽션이 아님
      const external = myGen === gen; // 우리 cancel()이 아닌 외부 요인(통화 등)의 정지
      settlePending(false);
      if (external && interruptHandler) interruptHandler();
    };
    if (myGen !== gen) return settlePending(false);
    fileAudio.src = url;
    fileAudio.playbackRate = Math.max(0.6, Math.min(rate, 1.5));
    fileAudio.play().then(() => { if (myGen !== gen) { try { fileAudio.pause(); } catch {} } },
      () => settlePending(false));
  });
}

// ── 음성 목록 ──────────────────────────────────────────────────
function loadVoices() {
  return new Promise((resolve) => {
    const got = speechSynthesis.getVoices();
    if (got.length) { voicesCache = got; return resolve(got); }
    speechSynthesis.onvoiceschanged = () => {
      voicesCache = speechSynthesis.getVoices();
      resolve(voicesCache);
    };
    // 일부 브라우저는 이벤트가 안 올 수 있으므로 타임아웃 폴백 (캐시도 갱신)
    setTimeout(() => { voicesCache = speechSynthesis.getVoices(); resolve(voicesCache); }, 1500);
  });
}

export async function getEnglishVoices() {
  const voices = await loadVoices();
  return voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
}
export async function getKoreanVoices() {
  const voices = await loadVoices();
  return voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('ko'));
}

const FEMALE_HINTS = /female|woman|zira|jenny|aria|ava|samantha|susan|karen|hazel|michelle|ana|emma|jane|sun-hi|sunhi|heami|yuna/i;
const MALE_HINTS = /male|man|david|mark|guy|christopher|eric|andrew|brian|alex|daniel|tom|injoon|hyunsu/i;

// 음성 품질 점수 — 시험 안내 방송에 가까운 자연스러운 음성을 자동 선택
export function voiceQualityScore(v, langPrefix, gender) {
  let score = 0;
  if (/natural|neural|online/i.test(v.name)) score += 100; // Edge "… Online (Natural)"
  if (/^google/i.test(v.name)) score += 50;                // Chrome "Google US English"
  if (langPrefix === 'en' && /en[-_]us/i.test(v.lang)) score += 20;
  const hints = gender === 'male' ? MALE_HINTS : FEMALE_HINTS;
  if (hints.test(v.name)) score += 10;
  return score;
}

function pickVoice(voices, langPrefix, gender, preferredName) {
  const pool = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
  if (!pool.length) return null;
  if (preferredName) {
    const exact = pool.find((v) => v.name === preferredName);
    if (exact) return exact;
  }
  return pool.slice().sort((a, b) =>
    voiceQualityScore(b, langPrefix, gender) - voiceQualityScore(a, langPrefix, gender))[0];
}

// ── 시험 신호음 (질문 후 "삐—") ────────────────────────────────
let audioCtx = null;
export function beep(freq = 880, duration = 0.3) {
  return new Promise((resolve) => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = audioCtx.currentTime;
      // iOS는 잠금/세션 중단 시 비표준 'interrupted' 상태를 쓰므로 running이 아니면 모두 resume
      if (audioCtx.state !== 'running') { try { audioCtx.resume(); } catch {} }
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.05);
      osc.onended = () => resolve();
      setTimeout(resolve, (duration + 0.3) * 1000); // 폴백
    } catch { resolve(); }
  });
}

// ── 무음 재생 (생각 시간/간격용) ───────────────────────────────
// 타이머 대신 무음 오디오를 재생해 진행시키면, 화면 잠금/백그라운드에서도
// 음악 앱처럼 시퀀스가 계속 이어진다 (백그라운드 타이머 스로틀링 회피).
const silenceCache = new Map();
function silenceDataUri(seconds) {
  const rate = 8000;
  const n = Math.max(1, Math.round(rate * seconds));
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE');
  w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  w(36, 'data'); v.setUint32(40, n, true);
  new Uint8Array(buf, 44).fill(128); // 8-bit PCM 무음
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  }
  return 'data:audio/wav;base64,' + btoa(bin);
}

export async function playSilence(seconds) {
  const myGen = gen;
  const key = Math.round(seconds * 10);
  let uri = silenceCache.get(key);
  if (!uri) { uri = silenceDataUri(seconds); silenceCache.set(key, uri); }
  const ok = await playUrl(uri, 1, myGen);
  if (!ok && myGen === gen) await wait(seconds); // 오디오 불가 환경 폴백
}

// 취소 가능한 타이머 대기 (무음 오디오가 실패했을 때의 폴백)
export function wait(seconds) {
  const myGen = gen;
  return new Promise((resolve) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (gen !== myGen || Date.now() - start >= seconds * 1000) {
        clearInterval(timer);
        resolve();
      }
    }, 100);
  });
}

// ── 사전 생성 음성 Provider (audio/*.mp3 + manifest.json) ──────
let manifest = null;
let manifestPromise = null;
let manifestFailedAt = 0;

async function loadManifest() {
  if (manifest && Object.keys(manifest).length) return manifest;
  // 로드 실패(오프라인 첫 진입 등)는 30초 뒤 자동 재시도
  if (manifest && Date.now() - manifestFailedAt < 30000) return manifest;
  if (!manifestPromise) {
    manifestPromise = (async () => {
      try {
        const r = await fetch('audio/manifest.json');
        manifest = r.ok ? await r.json() : {};
      } catch { manifest = {}; }
      if (!Object.keys(manifest).length) manifestFailedAt = Date.now();
      manifestPromise = null;
      return manifest;
    })();
  }
  return manifestPromise;
}

export async function generatedAudioCount() {
  const m = await loadManifest();
  return Object.keys(m).length;
}

// true=성공, false=재생 실패(폴백 대상), null=파일 없음(폴백 대상)
async function speakGenerated(text, lang, myGen) {
  const s = getSettings();
  const m = await loadManifest();
  if (myGen !== gen) return false;
  const entry = m[(lang.startsWith('ko') ? 'ko' : 'en') + '|' + text];
  if (!entry) return null;
  const url = entry[s.voiceGender === 'male' ? 'm' : 'f'] || entry.f || entry.m;
  if (!url) return null;
  // 파일은 이미 시험 안내 속도(-5%)로 생성됨 → 기본 설정(0.92)에서 1.0배로 재생
  return playUrl(url, s.rate / 0.92, myGen);
}

// ── OpenAI TTS Provider (server.js 프록시, 로컬 전용) ──────────
const audioCache = new Map(); // text|lang → object URL

async function speakOpenAI(text, lang, myGen) {
  const key = lang + '|' + text;
  let url = audioCache.get(key);
  if (!url) {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
    });
    if (!res.ok) throw new Error('TTS 서버 오류: ' + res.status);
    const blob = await res.blob();
    url = URL.createObjectURL(blob);
    audioCache.set(key, url);
  }
  if (myGen !== gen) return false;
  return playUrl(url, 1, myGen);
}

// ── Web Speech Provider (최후 폴백) ────────────────────────────
function speakWebSpeech(text, lang, myGen) {
  return new Promise(async (resolve) => {
    try {
      if (typeof speechSynthesis === 'undefined') return resolve(false);
      const s = getSettings();
      await loadVoices();
      if (myGen !== gen) return resolve(false);
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = lang.startsWith('ko') ? Math.min(s.rate + 0.08, 1.1) : s.rate;
      utter.pitch = 1.0; // 중립적 억양
      const voice = pickVoice(
        voicesCache, lang.startsWith('ko') ? 'ko' : 'en',
        s.voiceGender,
        lang.startsWith('ko') ? s.voiceKoName : s.voiceEnName
      );
      if (voice) utter.voice = voice;

      let settled = false;
      let started = false;
      let safety = null;
      const settle = (ok) => { if (!settled) { settled = true; clearTimeout(safety); resolve(ok); } };
      utter.onstart = () => { started = true; };
      utter.onend = () => settle(true);
      utter.onerror = () => settle(false);

      // 안전 타임아웃: onend가 안 오는 브라우저 대응.
      // 발화가 시작된 적도 없고 지금도 말하고 있지 않으면 '무음 실패'로 판정한다
      // (iOS는 제스처 없는 speak를 이벤트 없이 조용히 무시하므로 true로 오판하면 안 됨).
      const deadline = Date.now() + 60000; // 아직 말하는 중이면 최대 60초까지 연장
      const check = () => {
        if (settled) return;
        if (speechSynthesis.speaking && Date.now() < deadline) {
          safety = setTimeout(check, 500);
        } else {
          settle(started || speechSynthesis.speaking);
        }
      };
      safety = setTimeout(check, Math.max(5000, text.length * 130));

      // Chrome 버그 대응: cancel() 직후 speak()가 무시될 수 있어 resume + 짧은 지연 후 재생
      try { speechSynthesis.resume(); } catch {}
      setTimeout(() => {
        if (myGen !== gen) return settle(false); // 그 사이 취소됨 — 이전 문장 부활 방지
        speechSynthesis.speak(utter);
      }, 60);
    } catch { resolve(false); }
  });
}

// ── 공개 API ───────────────────────────────────────────────────
// true = 소리가 정상 재생됨, false = 취소됐거나 모든 Provider 실패
export async function speak(text, lang = 'en-US') {
  const myGen = gen;
  const s = getSettings();

  if (s.useGeneratedAudio !== false) {
    try {
      const r = await speakGenerated(text, lang, myGen);
      if (r === true) return true;
      if (myGen !== gen) return false; // 취소됨 — 폴백 금지
      // r === null(파일 없음) 또는 false(자동재생 차단 등) → 다음 Provider로
    } catch { /* 폴백 진행 */ }
  }

  if (myGen !== gen) return false;
  if (s.ttsProvider === 'openai') {
    try {
      const r = await speakOpenAI(text, lang, myGen);
      if (r === true) return true;
      if (myGen !== gen) return false;
    } catch (e) {
      console.warn('OpenAI TTS 실패, Web Speech로 폴백:', e.message);
    }
  }

  if (myGen !== gen) return false;
  return speakWebSpeech(text, lang, myGen);
}

// 서버 TTS/LLM 사용 가능 여부 (설정·관리 화면에서 표시)
export async function checkServerTts() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return { tts: false, llm: false };
    return await res.json();
  } catch { return { tts: false, llm: false }; }
}
