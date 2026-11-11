/* PixelGym RPG service worker: 100% offline-first app shell + live lock-screen rest timer widget & remote Web Push */
const VERSION = "pixelgym-v13";
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
let liveRestIntervalId = null;
let activeRest = null; // { endsAt, notifyAt, totalMs, exerciseName, showLiveWidget }

function formatRestClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function buildRestProgressBar(leftSec, totalSec, segs = 10) {
  const safeTotal = Math.max(1, totalSec);
  const ratio = Math.max(0, Math.min(1, 1 - leftSec / safeTotal));
  const filled = Math.round(ratio * segs);
  return "▓".repeat(filled) + "░".repeat(Math.max(0, segs - filled));
}

function clearLiveRestNotification() {
  if (liveRestIntervalId) {
    clearInterval(liveRestIntervalId);
    liveRestIntervalId = null;
  }
  if (self.registration && self.registration.getNotifications) {
    return self.registration
      .getNotifications({ tag: "pixelgym-rest-live" })
      .then((list) => Promise.all(list.map((n) => n.close())))
      .catch(() => {});
  }
  return Promise.resolve();
}

function showLiveRestNotification() {
  if (!activeRest || !activeRest.showLiveWidget) return Promise.resolve();
  const leftMs = activeRest.endsAt - Date.now();
  if (leftMs <= 0) return clearLiveRestNotification();
  const leftSec = Math.ceil(leftMs / 1000);
  const totalSec = Math.max(leftSec, Math.ceil((activeRest.totalMs || leftMs) / 1000));
  const bar = buildRestProgressBar(leftSec, totalSec, 10);
  const title = activeRest.exerciseName
    ? `⏱ Descanso · ${activeRest.exerciseName}`
    : "⏱ Descanso PixelGym";
  const body = `${bar} ${formatRestClock(leftSec)} restante`;

  if (!self.registration || !self.registration.showNotification) return Promise.resolve();
  return self.registration
    .showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-64.png",
      tag: "pixelgym-rest-live",
      silent: true,
      renotify: false,
      actions: [
        { action: "add30", title: "➕ +30s" },
        { action: "skip", title: "⏭ Saltar" },
      ],
      data: { url: "/", kind: "rest-live" },
    })
    .catch(() => {});
}

function broadcastRestAction(payload) {
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel("pixelgym-rest");
      bc.postMessage(payload);
      bc.close();
    }
  } catch {}
  return self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      clients.forEach((c) => c.postMessage(payload));
    })
    .catch(() => {});
}

function scheduleLocalRestTimers(state) {
  if (restTimerId) clearTimeout(restTimerId);
  if (liveRestIntervalId) clearInterval(liveRestIntervalId);
  activeRest = state;

  const notifyAt = typeof state.notifyAt === "number" ? state.notifyAt : state.endsAt;
  const delay = Math.max(0, notifyAt - Date.now());
  const exName = state.exerciseName || "";

  restTimerId = setTimeout(() => {
    clearLiveRestNotification();
    if (self.registration && self.registration.showNotification) {
      self.registration
        .showNotification("PixelGym RPG", {
          body: exName
            ? `¡Descanso terminado en ${exName}! A por la siguiente serie 💪`
            : "¡Descanso finalizado! A por la siguiente serie 💪",
          icon: "/icon-192.png",
          badge: "/icon-64.png",
          vibrate: [250, 100, 250],
          tag: "pixelgym-rest-timer",
          renotify: true,
          data: { url: "/", kind: "rest-local" },
        })
        .catch(() => {});
    }
    restTimerId = null;
    activeRest = null;
  }, delay);

  if (state.showLiveWidget) {
    showLiveRestNotification();
    liveRestIntervalId = setInterval(() => {
      if (!activeRest || Date.now() >= activeRest.endsAt) {
        clearLiveRestNotification();
        return;
      }
      showLiveRestNotification();
    }, 3000);
  }
}

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

// Local background rest timer + live lock-screen notification widget handler
self.addEventListener("message", (e) => {
  const data = e.data;
  if (!data) return;

  if (data.type === "START_REST_TIMER") {
    const endsAt = typeof data.endsAt === "number" ? data.endsAt : Date.now() + 60000;
    const notifyAt = typeof data.notifyAt === "number" ? data.notifyAt : endsAt;
    const totalMs = typeof data.totalMs === "number" ? data.totalMs : Math.max(1000, endsAt - Date.now());
    const exerciseName = typeof data.exerciseName === "string" ? data.exerciseName.trim() : "";
    scheduleLocalRestTimers({
      endsAt,
      notifyAt,
      totalMs,
      exerciseName,
      showLiveWidget: Boolean(data.showLiveWidget),
    });
  } else if (data.type === "CANCEL_REST_TIMER") {
    if (restTimerId) {
      clearTimeout(restTimerId);
      restTimerId = null;
    }
    activeRest = null;
    clearLiveRestNotification();
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

  if (options.tag === "pixelgym-rest-timer") {
    if (restTimerId) {
      clearTimeout(restTimerId);
      restTimerId = null;
    }
    activeRest = null;
    e.waitUntil(Promise.all([clearLiveRestNotification(), self.registration.showNotification(title, options)]));
    return;
  }

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (e) => {
  const action = e.action;

  if (action === "skip") {
    e.notification.close();
    if (restTimerId) {
      clearTimeout(restTimerId);
      restTimerId = null;
    }
    activeRest = null;
    e.waitUntil(
      Promise.all([
        clearLiveRestNotification(),
        broadcastRestAction({ type: "REST_TIMER_ACTION", action: "skip" }),
      ])
    );
    return;
  }

  if (action === "add30") {
    const baseEnd = activeRest && activeRest.endsAt > Date.now() ? activeRest.endsAt : Date.now();
    const nextEndsAt = baseEnd + 30000;
    const nextState = {
      endsAt: nextEndsAt,
      notifyAt: nextEndsAt,
      totalMs: ((activeRest && activeRest.totalMs) || 60000) + 30000,
      exerciseName: (activeRest && activeRest.exerciseName) || "",
      showLiveWidget: true,
    };
    scheduleLocalRestTimers(nextState);
    e.waitUntil(
      Promise.all([
        showLiveRestNotification(),
        broadcastRestAction({ type: "REST_TIMER_ACTION", action: "add30", endsAt: nextEndsAt }),
      ])
    );
    return;
  }

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
