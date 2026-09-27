// 서비스 워커 — 정적 자원 캐시 (오프라인에서도 학습 가능)
// - 오류 응답(4xx/5xx)은 절대 캐시하지 않는다 (캐시 오염 방지)
// - 오디오(불변 mp3)는 캐시 우선: 반복 청취 시 재다운로드 없음, 오프라인 재생 가능
// - 나머지는 네트워크 우선 + 실패 시 캐시 폴백
const CACHE = 'tst-v9';
const AUDIO_CACHE = 'tst-audio-v1'; // 앱 버전과 분리 — 업데이트해도 받아 둔 음성 유지
const ASSETS = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './icon-180.png', './icon-512.png',
  './fonts/NanumBarunGothicSubset.woff2', './fonts/NanumBarunGothicBoldSubset.woff2',
  './js/app.js', './js/store.js', './js/seed-data.js', './js/level-answers.js', './js/srs.js',
  './js/tts.js', './js/llm.js', './js/player.js', './js/ui.js',
  './js/views/home.js', './js/views/study.js', './js/views/exercise.js',
  './js/views/listening.js', './js/views/quiz.js', './js/views/stats.js',
  './js/views/admin.js', './js/views/settings.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

function putIfOk(request, res) {
  if (res && res.ok && res.status === 200) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
  }
  return res;
}

// 오디오 Range 요청 처리: iOS Safari는 <audio>에 항상 Range 헤더를 붙이므로
// 캐시된 전체 파일에서 요청 구간을 잘라 206으로 합성해 준다 (오프라인/반복 청취 대응).
async function audioResponse(request) {
  const key = new URL(request.url).href.split('#')[0];
  const cache = await caches.open(AUDIO_CACHE);
  let full = await cache.match(key);
  if (!full) {
    // Range 헤더 없는 전체 GET으로 받아서 캐시
    const res = await fetch(key);
    if (!(res.ok && res.status === 200)) return res; // 오류는 캐시하지 않고 그대로 전달
    await cache.put(key, res.clone());
    full = res;
  }
  const range = request.headers.get('range');
  if (!range) return full;
  const buf = await full.arrayBuffer();
  const m = /bytes=(\d+)-(\d*)/.exec(range);
  const start = m ? Number(m[1]) : 0;
  const end = m && m[2] ? Math.min(Number(m[2]), buf.byteLength - 1) : buf.byteLength - 1;
  if (start >= buf.byteLength) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${buf.byteLength}` } });
  }
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.includes('/api/') || e.request.method !== 'GET') return;

  if (url.pathname.includes('/audio/') && url.pathname.endsWith('.mp3')) {
    // 불변 오디오: 캐시 우선 + Range 206 합성, 실패 시 원 요청으로 폴백
    e.respondWith(audioResponse(e.request).catch(() => fetch(e.request)));
    return;
  }

  // 오디오 외 Range 요청은 브라우저에 맡긴다
  if (e.request.headers.has('range')) return;

  // 앱 자원: 네트워크 우선 + HTTP 캐시 재검증 강제 (배포 후 옛 버전이 남지 않도록), 실패 시 캐시 폴백
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((res) => putIfOk(e.request, res))
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
  );
});
