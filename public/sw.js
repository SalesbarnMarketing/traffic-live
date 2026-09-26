// LiveTrafficNPC Service Worker for PWA Installation & Offline Support
const CACHE_NAME = 'livetraffic-cache-v3';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/traffic-logo.png',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache non-fatal error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Let API requests and dynamic data go straight to network
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Network-first strategy for HTML documents and main bundle to avoid stale cache on new release
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Stale-while-revalidate for static files
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic' &&
            event.request.method === 'GET'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// ==========================================
// 🔔 EMERGENCY SOS PUSH & FCM NOTIFICATIONS
// ==========================================

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = {
      title: '🚨 LiveTraffic NPC Emergency Alert',
      body: event.data ? event.data.text() : 'High-priority Emergency SOS received.'
    };
  }

  const title = data.title || '🚨 EMERGENCY SOS DISPATCH ALERT';
  const notificationOptions = {
    body: data.body || 'Immediate motorist assistance requested. Tap to open dispatch console.',
    icon: data.icon || '/traffic-logo.png',
    badge: data.badge || '/traffic-logo.png',
    image: data.image,
    tag: data.tag || `sos-alert-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    silent: false,
    timestamp: Date.now(),
    vibrate: data.vibrate || [300, 100, 300, 100, 300, 100, 500],
    data: data.data || {
      url: '/?view=admin&tab=sos',
      timestamp: Date.now()
    },
    actions: data.actions || [
      { action: 'open_dispatch', title: '🚨 Open Dispatch' },
      { action: 'dismiss', title: 'Acknowledge' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/?view=admin&tab=sos';

  if (event.action === 'call_reporter' && notifData.phone) {
    if (self.clients && self.clients.openWindow) {
      event.waitUntil(self.clients.openWindow(`tel:${notifData.phone}`));
    }
    return;
  }

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
