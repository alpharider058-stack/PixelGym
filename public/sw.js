/* PixelGym RPG service worker: 100% offline-first app shell + background rest timer & remote Web Push */
const VERSION = "pixelgym-v12";
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

// Offline-first fetch strategy (skip API & Workflow routes)
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/.well-known/")) return;

  // Navigations (loading the app / offline gym support):
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

// Local background rest timer handler (offline / foreground fallback)
self.addEventListener("message", (e) => {
  const data = e.data;
  if (!data) return;

  if (data.type === "START_REST_TIMER") {
    if (restTimerId) clearTimeout(restTimerId);
    const notifyAt = typeof data.notifyAt === "number" ? data.notifyAt : data.endsAt;
    const delay = Math.max(0, notifyAt - Date.now());
    const exName = typeof data.exerciseName === "string" ? data.exerciseName.trim() : "";

    restTimerId = setTimeout(() => {
      if (self.registration && self.registration.showNotification) {
        self.registration.showNotification("PixelGym RPG", {
          body: exName
            ? `¡Descanso terminado en ${exName}! A por la siguiente serie 💪`
            : "¡Descanso finalizado! A por la siguiente serie 💪",
          icon: "/icon-192.png",
          badge: "/icon-64.png",
          vibrate: [250, 100, 250],
          tag: "pixelgym-rest-timer",
          renotify: true,
          data: { url: "/", kind: "rest-local" },
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

// Remote VAPID Web Push delivery (works even when PWA is completely closed)
self.addEventListener("push", (e) => {
  let payload = {};
  try {
    payload = e.data ? e.data.json() : {};
  } catch {
    payload = { body: e.data ? e.data.text() : "¡Nueva notificación de PixelGym RPG!" };
  }

  const title = payload.title || "PixelGym RPG";
  const options = {
    body: payload.body || "¡Es hora de entrenar! 💪",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-64.png",
    tag: payload.tag || "pixelgym-push",
    renotify: payload.renotify !== undefined ? Boolean(payload.renotify) : true,
    vibrate: Array.isArray(payload.vibrate) ? payload.vibrate : [200, 100, 200],
    data: {
      url: payload.url || "/",
      kind: payload.kind || "push",
    },
  };

  if (options.tag === "pixelgym-rest-timer" && restTimerId) {
    clearTimeout(restTimerId);
    restTimerId = null;
  }

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const targetUrl = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus().then((focused) => {
            if (focused && "navigate" in focused && targetUrl && targetUrl !== "/") {
              return focused.navigate(targetUrl).catch(() => focused);
            }
            return focused;
          });
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
