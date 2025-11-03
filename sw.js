const CACHE_NAME = "fpc-pwa-cache-v1";
const urlsToCache = [
  //"/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Install: cache core assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve cached content, update in background
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          // Update cache with latest version
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => cachedResponse); // fallback to cache if offline

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(clientList => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});

// Import Firebase and messaging service
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging.js');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbJubEYeW3HVK2mmyrA3Suz2qdgPMyfo0",
  authDomain: "fpc-neptune.firebaseapp.com",
  databaseURL: "https://fpc-neptune.firebaseio.com",
  projectId: "fpc-neptune",
  storageBucket: "fpc-neptune.firebasestorage.app",
  messagingSenderId: "412324032446",
  appId: "1:412324032446:web:ebf8459bab0d8b215b13ef"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Add your existing service worker logic here (e.g., caching, etc.)

// Handle push notifications when the app is in the background
messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message: ', payload);

  // Customize notification content
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon
  };

  // Show notification to user
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// If you have other existing service worker logic (e.g., caching), keep it here
self.addEventListener('fetch', function(event) {
  // Your caching or network logic
  event.respondWith(/* your fetch logic here */);
});
