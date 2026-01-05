// PWA Service Worker for Fizzy Timer
// Manual service worker since vite-plugin-pwa doesn't work well with TanStack Start SSR

const CACHE_NAME = 'fizzy-timer-v1';
const STATIC_CACHE = 'fizzy-timer-static-v1';

// Files to cache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls and Convex
  if (url.pathname.startsWith('/api/') ||
      url.hostname.includes('convex.cloud') ||
      url.hostname.includes('fizzy.do') ||
      url.hostname.includes('workers.dev')) {
    return;
  }

  // Skip HTTP/HTTPS mixed content
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache static assets and Giphy images
        if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2)$/) ||
            url.hostname.includes('giphy.com') ||
            url.hostname.includes('media.giphy.com')) {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      });
    })
  );
});
