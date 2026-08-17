const CACHE_VERSION = 'lifepulse-v5-shell-12';
const OFFLINE_URL = './offline.html';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  OFFLINE_URL,
  './assets/lifepulse-icon-512.png',
  './assets/lifepulse-maskable-512.png',
  './assets/lifepulse-notification.png',
  './assets/time-flight/1957-sputnik.jpg',
  './assets/time-flight/1963-march.jpg',
  './assets/time-flight/2022-webb.jpg',
  './time-flight.js',
  './cost-of-living-data.json',
  './sports-data-v4.json',
  './sky-events.json'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.allSettled(SHELL_ASSETS.map(asset => cache.add(new Request(asset, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('lifepulse-') && key !== CACHE_VERSION).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

function stableCacheKey(request) {
  const url = new URL(request.url);
  url.search = '';
  return new Request(url.toString(), { method: 'GET', headers: request.headers });
}

async function networkFirst(request, fallbackUrl = null) {
  const cache = await caches.open(CACHE_VERSION);
  const cacheKey = stableCacheKey(request);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(cacheKey, response.clone());
    return response;
  } catch {
    return (await cache.match(cacheKey)) || (fallbackUrl ? await cache.match(fallbackUrl) : null) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cacheKey = stableCacheKey(request);
  const cached = await cache.match(cacheKey);
  const refresh = fetch(request).then(response => {
    if (response.ok) cache.put(cacheKey, response.clone());
    return response;
  }).catch(() => null);
  return cached || await refresh || Response.error();
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, OFFLINE_URL));
    return;
  }

  if (/\/(version|live-data)\.json$/.test(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Let the browser handle byte-range requests for video natively. Android
  // media players depend on the server's 206 Partial Content responses.
  if (/\.mp4$/i.test(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data?.json() || {}; }
  catch { payload = { body: event.data?.text() || 'A new LifePulse event is ready.' }; }
  const title = payload.title || 'LifePulse';
  const options = {
    body: payload.body || 'A new LifePulse event is ready.',
    icon: './assets/lifepulse-notification.png',
    tag: payload.tag || 'lifepulse-update',
    renotify: Boolean(payload.renotify),
    data: { url: payload.url || './?source=notification' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || './', self.location.href).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.focus();
      if ('navigate' in existing) await existing.navigate(targetUrl);
      return;
    }
    await self.clients.openWindow(targetUrl);
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
