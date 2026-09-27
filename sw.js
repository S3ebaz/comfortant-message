const CACHE = 'para-ti-hoy-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './sw.js',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) {
      event.waitUntil(updateCache(req));
      return cached;
    }
    try {
      const fresh = await fetch(req);
      const copy = fresh.clone();
      const cache = await caches.open(CACHE);
      cache.put(req, copy);
      return fresh;
    } catch (err) {
      if (req.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});

async function updateCache(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(CACHE);
    await cache.put(req, fresh.clone());
  } catch (e) {}
}
