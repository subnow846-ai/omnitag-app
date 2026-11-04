const CACHE_NAME = "omnitag-cache-v8";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./mobile.html",
  "./css/style.css",
  "./css/mobile.css",
  "./js/api-sources.js",
  "./js/autocomplete.js",
  "./js/app.js",
  "./js/mobile-app.js",
  "./manifest.json",
  "./assets/icon.svg"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Network-First with Cache Fallback for online resilience & instant updates
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Network first for HTML, JS, CSS and same-origin assets
  if (e.request.mode === "navigate" || url.origin === location.origin) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
