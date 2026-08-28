const VERSAO = 'asf-v1';
const SHELL = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
const SDK = [
  'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js'
];

self.addEventListener('install', (ev) => {
  ev.waitUntil((async () => {
    const cache = await caches.open(VERSAO);
    await cache.addAll(SHELL);
    await Promise.all(SDK.map(async (url) => {
      try {
        const resp = await fetch(url, { mode: 'cors' });
        if (resp.ok) await cache.put(url, resp.clone());
      } catch (e) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('firebaseio.com') ||
      url.hostname.endsWith('googleapis.com') ||
      url.hostname.endsWith('firebaseapp.com')) return;

  if (req.mode === 'navigate') {
    ev.respondWith((async () => {
      try { return await fetch(req); }
      catch (e) {
        const cache = await caches.open(VERSAO);
        return (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  ev.respondWith((async () => {
    const cache = await caches.open(VERSAO);
    const guardado = await cache.match(req);
    const rede = fetch(req).then((resp) => {
      if (resp && resp.ok) cache.put(req, resp.clone());
      return resp;
    }).catch(() => null);
    return guardado || (await rede) || Response.error();
  })());
});
