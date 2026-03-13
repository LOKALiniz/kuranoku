const CACHE_NAME = 'kuranoku-v1';
const STATIC_ASSETS = [
  '/kuranoku/',
  '/kuranoku/index.html',
  '/kuranoku/style.css',
  '/kuranoku/script.js',
  '/kuranoku/firebase-init.js',
];

// Kurulum — statik dosyaları önbelleğe al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Aktivasyon — eski önbellekleri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — önce ağ, hata olursa önbellek
self.addEventListener('fetch', (event) => {
  // Firebase ve Google isteklerini SW'dan geçirme
  if (
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('identitytoolkit.googleapis.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('firebaseapp.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Başarılı yanıtı önbelleğe de yaz
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
