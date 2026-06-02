// Standard, compliant Service Worker for Android TWA (Bubblewrap requirement)
const CACHE_NAME = "einundzwanzig-pool-v3";
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
      // Don't fail the whole installation if some assets fail
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
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

// periodic background sync handler
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-news-periodic') {
    event.waitUntil(checkNewsAndNotify());
  }
});

async function checkNewsAndNotify() {
  try {
    const rssUrl = "https://www.blocktrainer.de/rss";
    const rsstojsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const res = await fetch(rsstojsonUrl);
    const data = await res.json();
    
    if (data && data.items && data.items.length > 0) {
      const newestItem = data.items[0];
      const savedNewsLink = await getSavedNewsLink();
      
      if (newestItem.link !== savedNewsLink) {
        await saveNewsLink(newestItem.link);
        
        self.registration.showNotification("Bitcoin News: " + newestItem.title, {
          body: (newestItem.description || "").replace(/<\/?[^>]+(>|$)/g, "").substring(0, 100) + '...',
          icon: "/bitcoin-logo-512.png",
          badge: "/bitcoin-logo-512.png",
          data: { url: newestItem.link }
        });
      }
    }
  } catch (error) {
    console.error("Periodic sync news fetch failed", error);
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});

// Simple IndexedDB implementation for SW caching state
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('einundzwanzig-sw-db', 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('store');
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function getSavedNewsLink() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('store', 'readonly');
      const req = tx.objectStore('store').get('last_news_link');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return null;
  }
}

async function saveNewsLink(link) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('store', 'readwrite');
      const req = tx.objectStore('store').put(link, 'last_news_link');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return null;
  }
}
