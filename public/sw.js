// Standard, compliant Service Worker for Android TWA (Bubblewrap requirement)
const CACHE_NAME = "einundzwanzig-pool-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/bitcoin-logo.svg",
  "/bitcoin-logo-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Always network-first to ensure live news, falling back to cache
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request) || caches.match("/");
    })
  );
});
