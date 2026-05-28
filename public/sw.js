const CACHE_NAME = 'einundzwanzig-news-cache-v1';
const ID_KEY_URL = 'https://einundzwanzig-pool-sw-notif/last-id';

async function getLastNotifiedId() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(ID_KEY_URL);
    if (response) {
      return await response.text();
    }
  } catch (e) {}
  return null;
}

async function setLastNotifiedId(id) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(ID_KEY_URL, new Response(id));
  } catch (e) {}
}

async function checkNewsAndNotify() {
  try {
    const response = await fetch('/api/news');
    if (!response.ok) return;
    const data = await response.json();
    if (data && data.success && Array.isArray(data.items) && data.items.length > 0) {
      const latestItem = data.items[0];
      const latestId = latestItem.id || latestItem.title;
      
      const lastId = await getLastNotifiedId();
      if (lastId && lastId !== latestId) {
        self.registration.showNotification('EINUNDZWANZIG POOL: Neue News!', {
          body: latestItem.title,
          badge: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=128&h=128&fit=crop',
          icon: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=128&h=128&fit=crop',
          tag: 'news-alert-' + latestId,
          data: { url: latestItem.link || 'https://www.blocktrainer.de' },
          requireInteraction: true
        });
      }
      await setLastNotifiedId(latestId);
    }
  } catch (err) {
    console.error('SW Check News Error:', err);
  }
}

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    self.clients.claim().then(async () => {
      const response = await fetch('/api/news');
      if (response.ok) {
        const data = await response.json();
        if (data && data.success && Array.isArray(data.items) && data.items.length > 0) {
          await setLastNotifiedId(data.items[0].id || data.items[0].title);
        }
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Standard PWA-required fetch event handler
  // Responds with cache first, otherwise fetches from network and updates cache
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const url = new URL(event.request.url);
          // Cache static assets and icon files on-the-fly for offline capabilities
          if (
            url.pathname === '/' ||
            url.pathname.endsWith('.html') ||
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.json')
          ) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
        }
        return response;
      }).catch(() => {
        // Graceful failure fallback
      });
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (let i = 0; i < clientsList.length; i++) {
        const client = clientsList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'CHECK_LATEST_NEWS') {
    e.waitUntil(checkNewsAndNotify());
  }
});

self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'check-news-periodic') {
    e.waitUntil(checkNewsAndNotify());
  }
});

// Simple interval fallback background poller (30 minutes check interval)
setInterval(() => {
  checkNewsAndNotify();
}, 30 * 60 * 1000);
