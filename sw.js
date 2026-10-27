/* Thesis Tracker v2 — service worker (F20, ARCHITECTURE 2a)
   - Menyimpan cangkang aplikasi agar cepat terbuka dan tetap terbuka saat offline.
   - Network-first untuk file situs sendiri: versi terbaru dari GitHub Pages selalu didahulukan.
   - Permintaan ke domain lain (Apps Script, Google Fonts) TIDAK disentuh: data dan token tidak pernah masuk cache.
   Naikkan CACHE_VERSION setiap rilis. */
const CACHE_VERSION = '2.2.1';
const CACHE = 'tt-' + CACHE_VERSION;
const SHELL = [
  './', 'index.html', 'styles.css', 'i18n.js', 'app.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tt-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // domain lain: biarkan browser
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});
