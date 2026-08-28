// 서비스 워커 — 정적 자원 캐시 (오프라인에서도 학습 가능)
const CACHE = 'tst-v3';
const ASSETS = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
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

// 네트워크 우선, 실패 시 캐시 (API 요청은 캐시하지 않음)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/') || e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
