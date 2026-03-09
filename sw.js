/**
 * 🕋 Kur'an Portal Service Worker v2.0
 * Cache-first strategy for Quran data files
 */

const CACHE_NAME = 'quran-portal-v3';
const DATA_CACHE = 'quran-data-v3';

// Core app files to cache immediately on install
const CORE_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/admin.js',
  '/manifest.json',
];

// Install: cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_FILES).catch(() => {
        // Core files may not all be available, that's okay
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for data, network-first for everything else
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Surah data → cache first (sık değişmez)
  if (url.pathname.includes('/data/surah/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch (e) {
          return new Response(JSON.stringify({ error: 'offline' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })
    );
    return;
  }

  // Meal dosyaları → network-first (güncel meal her zaman gelsin)
  if (url.pathname.includes('/meal/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch (e) {
          const cached = await cache.match(event.request);
          return cached || new Response(JSON.stringify({ error: 'offline' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })
    );
    return;
  }

  // Audio files → cache after first load
  if (url.pathname.includes('/audio/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch (e) {
          return Response.error();
        }
      })
    );
    return;
  }

  // Core app files → cache first
  if (
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        });
        return cached || networkFetch;
      })
    );
    return;
  }

  // External APIs (Firebase, prayer times etc.) → network only
  if (!url.hostname.includes(self.location.hostname)) {
    event.respondWith(
      fetch(event.request).catch(() => Response.error())
    );
    return;
  }

  // Default: network first, fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
