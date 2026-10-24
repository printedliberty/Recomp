// Recomp service worker. All paths are relative to this file, so it works at / or under a subpath like /recomp/.
const CACHE = 'recomp-v7';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
const INDEX = new URL('./index.html', self.location).href;

self.addEventListener('install', e => {
  // First install activates immediately; updates wait for the page to say "skip" (the refresh toast).
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(a => new Request(a, {cache: 'reload'}))))
    .then(() => self.registration.active ? null : self.skipWaiting()));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('recomp-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // Network-first for the page so new versions land; cached copy when offline.
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(INDEX, c)); } return r; })
      .catch(() => caches.match(INDEX)));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
