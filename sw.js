// INDYGAMES service worker — network-first (safe for live/dynamic app)
const CACHE = 'indygames-v1';
const PRECACHE = ['/', '/index.html', '/minihry.html'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Only handle GET. Never touch Supabase / realtime / external POSTs.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Bypass cross-origin (Supabase API, flagcdn fallback, fonts CDNs, etc.)
  if (url.origin !== self.location.origin) return;

  // Network-first: always try the live version, fall back to cache when offline.
  e.respondWith(
    fetch(req)
      .then((res) => {
        // cache a copy of successful same-origin navigations/assets
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match('/index.html'))
      )
  );
});
