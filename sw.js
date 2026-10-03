/* Service worker — offline support. Bump VERSION whenever app files change. */
const VERSION = 'v1.2.1';
const SHELL_CACHE = 'trip-shell-' + VERSION;
const IMG_CACHE = 'trip-img-v1'; // images persist across shell updates
const SHELL = [
  './',
  'index.html',
  'css/style.css',
  'js/data.js',
  'js/app.js',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
];
// All trip photos are precached so the whole itinerary works offline after one visit.
const IMAGES = [
  'assets/img/beijing-lu-pedestrian-mall-at-night-1.jpg',
  'assets/img/canton-tower-20241027.jpg',
  'assets/img/chaoshan-beef-hot-pot-at-baheli-haiji-zgc1-20221003132726.jpg',
  'assets/img/chaozhou-guangji-bridge-20191211-1280.jpg',
  'assets/img/chaozhou-guangji-bridge-20191211-2.jpg',
  'assets/img/char-siu-pieces.jpg',
  'assets/img/gd-zs-zhongshan-shiqi-sunwen-west-road-pedestrian-zone-night.jpg',
  'assets/img/huacheng-square-guangzhou.jpg',
  'assets/img/jieyang-gate-tower.jpg',
  'assets/img/jieyang-xuegong-2013-10-27-15-12-27.jpg',
  'assets/img/night-of-civic-center-shenzhen-from-lianhua-mountain.jpg',
  'assets/img/paifangjie-cropped.jpg',
  'assets/img/shanwei-zhelang-honghaiwan-2014-01-18-14-28-16.jpg',
  'assets/img/shenzhenzhongshanbridge3.jpg',
  'assets/img/three-dim-sum-in-steamer-basket.jpg',
  'assets/img/yongqingfang.jpg',
];
const NET_TIMEOUT = 4000; // slow mobile networks: fall back to cache after 4 s

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(SHELL.map((url) => cache.add(url).catch(() => { /* skip missing file */ })))
    ).then(() => caches.open(IMG_CACHE)).then((cache) =>
      Promise.all(IMAGES.map((url) => cache.match(url).then((hit) => hit || cache.add(url)).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith('trip-shell-') && k !== SHELL_CACHE)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function networkFirst(request) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (res) => { if (!settled && res) { settled = true; resolve(res); } };
    const fallback = () => caches.match(request, { ignoreSearch: true }).then((hit) =>
      hit || (request.mode === 'navigate' ? caches.match('index.html') : null));

    const timer = setTimeout(() => { fallback().then(done); }, NET_TIMEOUT);

    fetch(request).then((res) => {
      clearTimeout(timer);
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(SHELL_CACHE).then((c) => c.put(request, copy)).catch(() => {});
      }
      done(res);
    }).catch(() => {
      clearTimeout(timer);
      fallback().then((hit) => { if (hit) done(hit); else done(Response.error()); });
    });
  });
}

function cacheFirst(request) {
  return caches.open(IMG_CACHE).then((cache) =>
    cache.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone()).catch(() => {});
        return res;
      });
    })
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!/^https?:$/.test(url.protocol)) return;

  if (req.destination === 'image') {
    event.respondWith(cacheFirst(req));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req));
  }
  // everything else (maps, tel:, wa.me links are navigations away) — leave to the browser
});
