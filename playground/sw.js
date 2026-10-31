// Offline cache for the Direnya playground. Bump CACHE when any listed file changes.
const CACHE = 'direnya-v13';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'favicon.ico',
  'dictionaries.js', 'translit.js', 'html-transpiler.js', 'css-transpiler.js', 'js-transpiler.js', 'web-format.js',
  'vendor/codemirror.min.js', 'vendor/codemirror.min.css', 'vendor/xml.min.js', 'vendor/css.min.js', 'vendor/javascript.min.js',
  'vendor/overlay.min.js', 'vendor/show-hint.min.js', 'vendor/show-hint.min.css', 'vendor/jszip.min.js',
  'vendor/ethiopic-400.woff2', 'vendor/ethiopic-700.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // Network first, cache only as the offline fallback — so a new version of the
  // playground is picked up on the next open instead of the old copy sticking forever.
  e.respondWith(fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
});
