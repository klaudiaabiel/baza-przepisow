// BiteCraft Service Worker (PWA Offline Support & Instant Updates)
const CACHE_NAME = 'baza-przepisow-v4.2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/app.min.css',
  '/recipes.json',
  '/manifest.json',
  '/images/placeholder.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/js/app.js',
  '/js/store.js',
  '/js/catalog.js',
  '/js/planner.js',
  '/js/shopping.js',
  '/js/modal.js',
  '/js/creator.js',
  '/js/utils/dom.js',
  '/js/utils/stemmer.js',
  '/js/utils/substitutes.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[SW] Pre-cache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Usunięto przestarzały cache:', k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. Navigation requests (HTML): Network first, fallback to cached index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 2. Images: Stale-While-Revalidate with placeholder fallback
  if (req.destination === 'image' || url.pathname.endsWith('.webp') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.ico')) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return networkResponse;
        }).catch(() => {
          return cached || caches.match('/images/placeholder.svg');
        });

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 3. Application code (JS, CSS, JSON): NETWORK FIRST with CACHE FALLBACK
  // Guarantees desktop & mobile users immediately receive code updates on deploy!
  event.respondWith(
    fetch(req).then(networkResponse => {
      if (networkResponse && networkResponse.status === 200) {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
      }
      return networkResponse;
    }).catch(() => {
      return caches.match(req);
    })
  );
});
