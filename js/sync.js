// 기기 간 동기화 (서버 없음) — 학습 기록을 '동기화 코드'(압축 + base64url 텍스트)나 파일로 옮겨 합친다.
// 데이터를 읽고 합치는 일은 store.js(exportSync/mergeSync)가 하고, 여기서는 인코딩과 공유만 담당한다.
import * as store from './store.js';

const PREFIX_GZIP = 'TST1:'; // gzip 압축
const PREFIX_RAW = 'TST0:';  // 압축 미지원 브라우저

function toB64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

// 이 기기의 기록 → 동기화 코드
export async function makeCode() {
  const bytes = new TextEncoder().encode(JSON.stringify(store.exportSync()));
  if (typeof CompressionStream === 'function') {
    try { return PREFIX_GZIP + toB64url(await pipe(bytes, new CompressionStream('gzip'))); } catch {}
  }
  return PREFIX_RAW + toB64url(bytes);
}

// 동기화 코드 또는 JSON(백업 파일) 텍스트 → 데이터. 메신저가 넣은 줄바꿈·공백은 무시한다.
export async function readCode(text) {
  const t = String(text || '').trim();
  if (!t) throw new Error('붙여넣은 내용이 없습니다.');
  if (t.startsWith('{')) return JSON.parse(t);
  const m = /TST([01]):([A-Za-z0-9_-]+)/.exec(t.replace(/\s+/g, ''));
  if (!m) throw new Error('동기화 코드가 아닙니다. TST1: 로 시작하는 코드 전체를 붙여넣어 주세요.');
  let bytes;
  try { bytes = fromB64url(m[2]); } catch { throw new Error('코드가 잘렸거나 손상되었습니다. 전체를 다시 복사해 주세요.'); }
  if (m[1] === '1') {
    if (typeof DecompressionStream !== 'function') throw new Error('이 브라우저는 압축 코드를 풀 수 없습니다. 파일로 옮겨 주세요.');
    try { bytes = await pipe(bytes, new DecompressionStream('gzip')); } catch { throw new Error('코드가 잘렸거나 손상되었습니다. 전체를 다시 복사해 주세요.'); }
  }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error('코드를 읽지 못했습니다. 전체를 다시 복사해 주세요.'); }
}

// 코드 → 이 기기에 합치기 (덮어쓰지 않음)
export async function mergeCode(text) {
  return store.mergeSync(await readCode(text));
}

// 동기화 파일 이름 (날짜 포함)
export function fileName() {
  const d = new Date();
  const ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  return `toeic-speaking-sync-${ymd}.txt`;
}

// 휴대폰 공유 시트로 보내기 (카카오톡·메일·드라이브 등). 파일 공유가 안 되면 false — 호출한 쪽에서 내려받기로 대신한다.
// 텍스트 파일(.txt)로 보낸다: 안드로이드 Chrome은 .json 파일 공유를 허용하지 않는다.
export async function shareCodeFile(code) {
  if (!navigator.share || !navigator.canShare) return false;
  const file = new File([code], fileName(), { type: 'text/plain' });
  if (!navigator.canShare({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title: 'TOEIC Speaking 학습 기록' });
    return true;
  } catch (e) {
    if (e && e.name === 'AbortError') return true; // 사용자가 공유 창을 닫음
    return false;
  }
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch { return false; }
}
