// 서비스 워커 — 정적 자원 캐시 (오프라인에서도 학습 가능)
// - 오류 응답(4xx/5xx)은 절대 캐시하지 않는다 (캐시 오염 방지)
// - 오디오(불변 mp3)는 캐시 우선: 반복 청취 시 재다운로드 없음, 오프라인 재생 가능
// - 나머지는 네트워크 우선 + 실패 시 캐시 폴백
const CACHE = 'tst-v4';
const ASSETS = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './icon-180.png', './icon-512.png',
  './js/app.js', './js/store.js', './js/seed-data.js', './js/srs.js',
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
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function putIfOk(request, res) {
  if (res && res.ok && res.status === 200) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.includes('/api/') || e.request.method !== 'GET') return;
  // 미디어 Range 요청(206)은 캐시할 수 없으므로 브라우저에 맡긴다
  if (e.request.headers.has('range')) return;

  if (url.pathname.includes('/audio/') && url.pathname.endsWith('.mp3')) {
    // 불변 오디오: 캐시 우선
    e.respondWith(
      caches.match(e.request).then((hit) =>
        hit || fetch(e.request).then((res) => putIfOk(e.request, res))
      )
    );
    return;
  }

  // 앱 자원: 네트워크 우선 (항상 최신), 실패 시 캐시 폴백
  e.respondWith(
    fetch(e.request)
      .then((res) => putIfOk(e.request, res))
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
  );
});
