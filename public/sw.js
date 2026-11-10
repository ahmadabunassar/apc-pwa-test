// Service worker: caches the app shell so it opens offline.
// Change VERSION whenever you update files to force phones to refresh.
const VERSION = 'apc-test-v1';
const SHELL = ['/', '/index.html', '/app.js', '/style.css', '/manifest.webmanifest',
               '/icons/icon-180.png', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;            // POST/DELETE go straight to server

  if (url.pathname.startsWith('/api/')) {
    // API: network first, fall back to last cached answer when offline
    e.respondWith(fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request)));
    return;
  }
  // App files: cache first, then network
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
