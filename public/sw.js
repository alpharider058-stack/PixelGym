/* PixelGym RPG service worker: 100% offline-first app shell + background rest timer notifications */
const VERSION = "pixelgym-v4";
const SHELL = [
  "/",
  "/manifest.json",
  "/logo.png",
  "/icon-512.png",
  "/icon-192.png",
  "/icon-64.png",
  "/apple-touch-icon.png",
  "/favicon.ico"
];

let restTimerId = null;

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Offline-first fetch strategy
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  // Navigations (loading the app / offline gym support):
  // Try network with quick timeout, if offline immediately serve cached shell "/"
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/").then((hit) => hit || caches.match(req)))
    );
    return;
  }

  // Static assets (Next.js chunks, fonts, icons, images): Cache first
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});

// Background rest timer handler for when phone screen turns off or app is minimized
self.addEventListener("message", (e) => {
  const data = e.data;
  if (!data) return;

  if (data.type === "START_REST_TIMER") {
    if (restTimerId) clearTimeout(restTimerId);
    const delay = Math.max(0, data.endsAt - Date.now());

    restTimerId = setTimeout(() => {
      if (self.registration && self.registration.showNotification) {
        self.registration.showNotification("PixelGym RPG", {
          body: "¡Descanso finalizado! A por la siguiente serie 💪",
          icon: "/icon-192.png",
          badge: "/icon-64.png",
          vibrate: [250, 100, 250],
          tag: "pixelgym-rest-timer",
          renotify: true,
        });
      }
      restTimerId = null;
    }, delay);
  } else if (data.type === "CANCEL_REST_TIMER") {
    if (restTimerId) {
      clearTimeout(restTimerId);
      restTimerId = null;
    }
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
