// Baza Przepisów Service Worker (Cloudflare Pages 100% Offline Support)
const CACHE_NAME = 'baza-przepisow-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/recipes.json',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/placeholder.png'
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
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // HTML Navigation: Network-first, fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Recipes, static images & CDNs: Stale-While-Revalidate / Cache-First
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, clone);
          });
        }
        return networkResponse;
      }).catch(err => {
        // Return cached or fallback placeholder if image
        if (req.destination === 'image') {
          return caches.match('/placeholder.png');
        }
        throw err;
      });

      return cached || fetchPromise;
    })
  );
});
