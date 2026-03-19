const CACHE_NAME = 'awlaacore-pwa-v1';
const ASSETS = [
  './index.html',
  './styles.css',
  './script.js',
  './ai.js',
  './AwlaaCore.js',
  './services.js',
  './products.js',
  './Awlaa Global Main Logo.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
