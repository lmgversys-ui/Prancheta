// Offline cache for the installed app. The page itself comes from the network when there is internet
// (so a new version shows at once) and from the cache when offline; icons and libraries cache-first.
const CACHE = 'prancheta-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = e.request.url;
  // only the app itself and its libraries; cloud data (Supabase) always goes to the network
  if (e.request.method !== 'GET' || !(u.startsWith(self.location.origin) || u.startsWith('https://cdnjs.cloudflare.com/') || u.startsWith('https://cdn.jsdelivr.net/'))) return;
  if (e.request.mode === 'navigate') {
    const net = fetch(e.request, { cache: 'no-cache' }).then(async r => {
      if (r.ok) await caches.open(CACHE).then(c => c.put('./index.html', r.clone()));
      return r;
    });
    e.waitUntil(net.catch(() => {}));
    // weak signal: after 4 s open the saved copy (the new one is still stored for next time)
    e.respondWith(caches.match('./index.html').then(saved => !saved ? net
      : Promise.race([net.catch(() => saved), new Promise(r => setTimeout(() => r(saved), 4000))])));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
