const CACHE = "shiguang-workbench-v2";
const CORE = [
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./manifest.webmanifest",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const { request } = e;
  const url = new URL(request.url);

  // GitHub API / 用户数据：永远走网络
  if (url.hostname === "api.github.com" || url.pathname.includes("workbench.json")) {
    return;
  }

  // 核心静态资源：优先缓存，后台刷新
  if (request.method === "GET" && (url.origin === self.location.origin || url.href === CORE[CORE.length - 1])) {
    e.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(request, clone));
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
