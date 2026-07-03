// Bump this on every deploy that changes cached files — old caches are purged on activate.
const CACHE_NAME = 'deal-calculator-v5';

const APP_SHELL = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/pwa.js',
    './manifest.json',
  ];

self.addEventListener('install', (event) => {
    event.waitUntil(
          caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
        );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
          caches.keys()
            .then((keys) => Promise.all(
                      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
                   ))
            .then(() => self.clients.claim())
        );
});

// Cache-first, falling back to network, so the app works at a signal-dead auction lot.
// Successful network responses refresh the cache for next time.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

                        event.respondWith(
                              caches.match(event.request).then((cached) => {
                                      const networkFetch = fetch(event.request)
                                        .then((response) => {
                                                    if (response && response.ok) {
                                                                  const clone = response.clone();
                                                                  caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                                                    }
                                                    return response;
                                        })
                                        .catch(() => cached);

                                                                     return cached || networkFetch;
                              })
                            );
});
