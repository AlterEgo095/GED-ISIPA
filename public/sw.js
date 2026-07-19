/**
 * GED-ISIPA Service Worker — Premium PWA
 * Version: 2.0.0
 */
const SW_VERSION = 'v2.0.0';
const CACHE_STATIC = `ged-static-${SW_VERSION}`;
const CACHE_PAGES = `ged-pages-${SW_VERSION}`;
const CACHE_API = `ged-api-${SW_VERSION}`;
const CACHE_IMG = `ged-img-${SW_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-192.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
  '/logo.svg',
];

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxItems);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(async (cache) => {
      await Promise.allSettled(PRECACHE_URLS.map(u => cache.add(u)));
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => ![CACHE_STATIC, CACHE_PAGES, CACHE_API, CACHE_IMG].includes(k))
          .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function shouldSkip(request) {
  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return true;
  if (url.pathname.startsWith('/api/auth')) return true;
  if (url.pathname.startsWith('/api/documents/') && url.pathname.endsWith('/download')) return true;
  if (url.pathname.includes('/preview')) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (shouldSkip(request)) return;

  const url = new URL(request.url);

  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_PAGES).then((c) => { c.put(request, copy); trimCache(CACHE_PAGES, 30); });
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match('/offline');
          if (offline) return offline;
          return new Response('Vous etes hors ligne.', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        })
    );
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image') || /\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|css|js)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_IMG).then((c) => { c.put(request, copy); trimCache(CACHE_IMG, 100); });
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(CACHE_API).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) { cache.put(request, response.clone()); trimCache(CACHE_API, 50); }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_STATIC).then((c) => c.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'GED-ISIPA', body: 'Nouvelle notification', url: '/' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch { if (event.data) data.body = event.data.text(); }
  const options = {
    body: data.body, icon: '/icon-192.png', badge: '/favicon-32.png',
    vibrate: [100, 50, 100], tag: data.tag || 'ged-notification', renotify: true,
    data: { url: data.url || '/' },
    actions: [{ action: 'open', title: 'Ouvrir' }, { action: 'dismiss', title: 'Ignorer' }],
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'ged-sync') {
    event.waitUntil(clients.matchAll().then((cs) => cs.forEach((c) => c.postMessage({ type: 'BACKGROUND_SYNC' }))));
  }
});
