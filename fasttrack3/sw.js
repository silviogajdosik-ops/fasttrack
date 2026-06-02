// sw.js — Service Worker for FastTrack v3
// v3.0.0

const CACHE_VERSION = 'ft3-v3.1';
const CACHE_FILES = [
  '/fasttrack/fasttrack3/',
  '/fasttrack/fasttrack3/index.html',
  '/fasttrack/fasttrack3/css/style.css',
  '/fasttrack/fasttrack3/js/main.js',
  '/fasttrack/fasttrack3/js/storage.js',
  '/fasttrack/fasttrack3/js/phases.js',
  '/fasttrack/fasttrack3/js/badges.js',
  '/fasttrack/fasttrack3/js/ui.js',
  '/fasttrack/fasttrack3/js/fasting.js',
  '/fasttrack/fasttrack3/js/checkin.js',
  '/fasttrack/fasttrack3/js/journal.js',
  '/fasttrack/fasttrack3/js/struggling.js',
  '/fasttrack/fasttrack3/js/report.js',
  '/fasttrack/fasttrack3/js/notifications.js',
  '/fasttrack/fasttrack3/js/gfit.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Push notification scheduling
self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'SCHEDULE_NOTIF') return;
  const { delay, title, body, tag } = e.data;
  setTimeout(() => {
    self.registration.showNotification(title, {
      body,
      tag:      tag || 'ft',
      renotify: true,
      vibrate:  [200, 100, 200],
      icon:     'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Ctext y=%22.9em%22 font-size=%2256%22%3E%E2%9A%A1%3C/text%3E%3C/svg%3E',
    });
  }, Math.max(0, delay));
});
