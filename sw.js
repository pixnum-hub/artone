/* ================================================================
   Artone — Service Worker v2.1.0
   © 2026 Manik Roy · All Rights Reserved
   Cache strategy: Core=Cache-first | HTML=Network-first | Fonts=Permanent
================================================================ */

const SW_VER  = '2.1.0';
const CACHE   = `artone-v${SW_VER}`;
const OFFLINE = '/offline.html';

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-512x512-maskable.png',
  '/icons/icon-180x180.png',
  '/icons/icon-152x152.png',
  '/icons/icon-96x96.png',
];

const PRECACHE_FONTS = [
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap',
];

/* ── Install: pre-cache core assets ── */
self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {})),
      caches.open(CACHE).then(c => c.addAll(PRECACHE_FONTS).catch(() => {})),
    ]).then(() => self.skipWaiting())
  );
});

/* ── Activate: purge old caches, claim clients ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('artone-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch routing ── */
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Share target POST
  if (url.pathname === '/' && url.searchParams.has('share') && req.method === 'POST') {
    e.respondWith(handleShareTarget(req));
    return;
  }

  // Fonts → cache-first permanent
  if (url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
    e.respondWith(cacheFirst(req));
    return;
  }

  // Icons & splash → cache-first
  if (url.pathname.startsWith('/icons/') || url.pathname.startsWith('/splash/')) {
    e.respondWith(cacheFirst(req));
    return;
  }

  // HTML navigation → network-first, offline fallback
  if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req));
    return;
  }

  // JS/CSS/JSON → stale-while-revalidate
  if (/\.(js|css|json|woff2?)$/.test(url.pathname)) {
    e.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Same-origin → cache-first
  if (url.origin === location.origin) {
    e.respondWith(cacheFirst(req));
    return;
  }
});

/* ── Strategies ── */
async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
    return res;
  } catch { return caches.match(OFFLINE); }
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req)) || caches.match(OFFLINE);
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const fetchPromise = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await fetchPromise) || caches.match(OFFLINE);
}

/* ── Share target: receive shared images ── */
async function handleShareTarget(req) {
  try {
    const fd = await req.formData();
    const file = fd.get('image');
    if (file) {
      const cache = await caches.open(CACHE);
      await cache.put('/shared-image', new Response(file));
    }
  } catch {}
  return Response.redirect('/?shared=1', 303);
}

/* ── Background sync ── */
self.addEventListener('sync', e => {
  if (e.tag === 'artone-save') e.waitUntil(Promise.resolve());
});

/* ── Periodic background sync (Chrome) ── */
self.addEventListener('periodicsync', e => {
  if (e.tag === 'artone-autosave-check') {
    e.waitUntil(
      self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage({ type: 'periodic-autosave' })))
    );
  }
});

/* ── Push notifications ── */
self.addEventListener('push', e => {
  const d = e.data?.json?.() || {};
  e.waitUntil(self.registration.showNotification(d.title || 'Artone', {
    body: d.body || 'New notification from Artone',
    icon: d.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'artone',
    renotify: true,
    data: d.url || '/',
    actions: [{ action: 'open', title: 'Open' }, { action: 'dismiss', title: 'Dismiss' }],
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(clients.matchAll({ type: 'window' }).then(cs => {
    const c = cs.find(x => x.url === e.notification.data);
    return c ? c.focus() : clients.openWindow(e.notification.data || '/');
  }));
});

/* ── Messages from main thread ── */
self.addEventListener('message', e => {
  const { type } = e.data || {};
  if (type === 'skipWaiting') self.skipWaiting();
  if (type === 'clearCache') {
    caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k)))).then(() => e.ports[0]?.postMessage({ ok: true }));
  }
  if (type === 'getCacheSize') {
    caches.keys().then(async ks => {
      let n = 0;
      for (const k of ks) { const c = await caches.open(k); n += (await c.keys()).length; }
      e.ports[0]?.postMessage({ entries: n, caches: ks.length, version: SW_VER });
    });
  }
});
