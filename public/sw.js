const CACHE_NAME = 'hashem-alahmadi-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle everything normally, we just need a fetch listener
  // to pass the PWA installation criteria in some browsers.
});
