const CACHE_NAME = "omnitag-cache-v5";
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
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
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

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Serve app shell from cache if offline
  if (e.request.mode === "navigate" || STATIC_ASSETS.some(a => url.pathname.endsWith(a.replace("./", "")))) {
    e.respondWith(
      caches.match(e.request).then((res) => res || fetch(e.request))
    );
  }
});
