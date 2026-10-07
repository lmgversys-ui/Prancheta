// Offline cache for the installed app: answer from cache first, refresh it in the background
// (a new version shows up the next time the app is opened with internet).
const CACHE = 'prancheta-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  // only the app itself and its libraries; cloud data (Supabase) always goes to the network
  if (e.request.method !== 'GET' || !(e.request.url.startsWith(self.location.origin) || e.request.url.startsWith('https://cdnjs.cloudflare.com/'))) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
