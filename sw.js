const CACHE_VERSION = 'lifepulse-v5-shell-42';
const OFFLINE_URL = './offline.html';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  OFFLINE_URL,
  './assets/lifepulse-icon-512.png',
  './assets/lifepulse-maskable-512.png',
  './assets/lifepulse-notification.png',
  './assets/time-flight/1900-paris-exposition.jpg',
  './assets/time-flight/1903-first-flight.jpg',
  './assets/time-flight/1905-einstein.jpg',
  './assets/time-flight/1908-model-t.jpg',
  './assets/time-flight/1912-titanic.jpg',
  './assets/time-flight/1914-world-war-i.jpg',
  './assets/time-flight/1918-influenza.jpg',
  './assets/time-flight/1920-womens-suffrage.jpg',
  './assets/time-flight/1922-tutankhamun.jpg',
  './assets/time-flight/1925-scopes-trial.jpg',
  './assets/time-flight/1927-lindbergh.jpg',
  './assets/time-flight/1929-wall-street-crash.jpg',
  './assets/time-flight/1933-fdr-inauguration.jpg',
  './assets/time-flight/1936-jesse-owens.jpg',
  './assets/time-flight/1937-hindenburg.jpg',
  './assets/time-flight/1939-world-war-ii.jpg',
  './assets/time-flight/1940-battle-of-britain.jpg',
  './assets/time-flight/1941-pearl-harbor.jpg',
  './assets/time-flight/1944-d-day.jpg',
  './assets/time-flight/1945-atomic-bombings.jpg',
  './assets/time-flight/1945-vj-day.jpg',
  './assets/time-flight/1946-eniac.jpg',
  './assets/time-flight/1947-transistor.jpg',
  './assets/time-flight/1951-univac.jpg',
  './assets/time-flight/1953-dna.jpg',
  './assets/time-flight/1954-brown.jpg',
  './assets/time-flight/1955-polio.jpg',
  './assets/time-flight/1957-sputnik.jpg',
  './assets/time-flight/1961-gagarin.jpg',
  './assets/time-flight/1962-cuban.jpg',
  './assets/time-flight/1963-march.jpg',
  './assets/time-flight/1963-jfk.jpg',
  './assets/time-flight/1964-civil-rights.jpg',
  './assets/time-flight/1965-voting-rights.jpg',
  './assets/time-flight/1968-mlk.jpg',
  './assets/time-flight/1968-rfk.jpg',
  './assets/time-flight/1968-earthrise.jpg',
  './assets/time-flight/1969-stonewall.jpg',
  './assets/time-flight/1969-apollo11.jpg',
  './assets/time-flight/1972-blue-marble.jpg',
  './assets/time-flight/1973-vietnam-peace.jpg',
  './assets/time-flight/1975-apollo-soyuz.jpg',
  './assets/time-flight/1977-voyager.jpg',
  './assets/time-flight/1979-iran-hostage.jpg',
  './assets/time-flight/1980-smallpox.jpg',
  './assets/time-flight/1981-reagan-attempt.jpg',
  './assets/time-flight/1981-shuttle.jpg',
  './assets/time-flight/1984-macintosh.jpg',
  './assets/time-flight/1986-challenger.jpg',
  './assets/time-flight/1986-chernobyl.jpg',
  './assets/time-flight/1989-berlin-wall.jpg',
  './assets/time-flight/1991-web.jpg',
  './assets/time-flight/1991-soviet-flag.jpg',
  './assets/time-flight/1994-mandela.jpg',
  './assets/time-flight/1994-rwanda.jpg',
  './assets/time-flight/1996-hubble.jpg',
  './assets/time-flight/1997-dolly.jpg',
  './assets/time-flight/1998-iss.jpg',
'./assets/time-flight/2001-september11.jpg',
 './assets/time-flight/2003-columbia.jpg',
  './assets/time-flight/2003-human-genome.jpg',
  './assets/time-flight/2004-tsunami.jpg',
  './assets/time-flight/2007-iphone.jpg',
  './assets/time-flight/2008-lhc.jpg',
  './assets/time-flight/2011-tohoku.jpg',
  './assets/time-flight/2012-higgs.jpg',
  './assets/time-flight/2015-pluto.jpg',
  './assets/time-flight/2015-paris-agreement.jpg',
  './assets/time-flight/2019-black-hole.jpg',
  './assets/time-flight/2020-covid.jpg',
  './assets/time-flight/2022-ukraine.jpg',
  './assets/time-flight/2022-webb.jpg',
  './assets/time-flight/2024-eclipse.jpg',
  './assets/time-flight/2024-trump-attempt.jpg',
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
