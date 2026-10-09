// Incremente a versão sempre que qualquer arquivo listado abaixo mudar.
var CACHE_NAME = 'taxista-calc-v11';

var ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './js/calc.js',
  './js/storage.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ARQUIVOS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(
        nomes.filter(function (n) { return n !== CACHE_NAME; })
             .map(function (n) { return caches.delete(n); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

// Cache-first: o app é 100% offline, nunca depende de rede.
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function (resposta) {
      if (resposta) return resposta;
      return fetch(event.request).then(function (rede) {
        if (rede && rede.status === 200 && rede.type === 'basic') {
          var clone = rede.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, clone); });
        }
        return rede;
      }).catch(function () {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
