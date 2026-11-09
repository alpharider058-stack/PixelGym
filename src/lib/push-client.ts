"use client";
import { PushPrefs, PushSubscriptionPayload } from "./push-types";

export type PushSupportState = "supported" | "ios-needs-install" | "unsupported" | "no-vapid";

const SYNC_SIG_KEY = "pixelgym-push-sync-sig";

function getPublicVapidKey(): string | undefined {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || undefined;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArrayToBase64Url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.byteLength; i++) bin += String.fromCharCode(arr[i]);
  return window.btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function getPushSupportState(): PushSupportState {
  if (typeof window === "undefined") return "unsupported";
  if (!getPublicVapidKey()) return "no-vapid";
  if (isIosDevice() && !isStandalonePwa()) return "ios-needs-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
    return "unsupported";
  }
  return "supported";
}

function toPayload(sub: PushSubscription): PushSubscriptionPayload | null {
  const json = sub.toJSON();
  const endpoint = json.endpoint || sub.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) return null;
  return {
    endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: { p256dh, auth },
  };
}

async function ensureServiceWorkerReady(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) return null;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export interface ClientPushMeta {
  prefs: PushPrefs;
  heroName: string;
  streak: number;
  lastDay: string | null;
  weeklyExp: number;
}

function getLocalTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid";
  } catch {
    return "Europe/Madrid";
  }
}

export async function subscribeToRemotePush(
  meta: ClientPushMeta
): Promise<{ ok: boolean; reason?: "denied" | "dismissed" | "unsupported" | "error"; message?: string }> {
  const support = getPushSupportState();
  if (support !== "supported") {
    return { ok: false, reason: "unsupported" };
  }
  const vapidPublic = getPublicVapidKey();
  if (!vapidPublic) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    const permission = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

    if (permission === "denied") {
      return { ok: false, reason: "denied" };
    }
    if (permission !== "granted") {
      return { ok: false, reason: "dismissed" };
    }

    const reg = await ensureServiceWorkerReady();
    let sub = await reg.pushManager.getSubscription();

    // Rotate subscription if VAPID key changed cleanly
    if (sub?.options?.applicationServerKey) {
      const existingKey = uint8ArrayToBase64Url(sub.options.applicationServerKey);
      if (existingKey !== vapidPublic) {
        await sub.unsubscribe().catch(() => {});
        sub = null;
      }
    }

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      });
    }

    const payload = toPayload(sub);
    if (!payload) {
      return { ok: false, reason: "error", message: "Suscripción sin claves válidas" };
    }

    const timeZone = getLocalTimeZone();
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: payload,
        ...meta,
        timeZone,
      }),
    });

    if (!res.ok) {
      return { ok: false, reason: "error", message: `Error del servidor (${res.status})` };
    }

    try {
      localStorage.setItem(SYNC_SIG_KEY, buildSyncSignature(payload.endpoint, meta));
    } catch {}

    return { ok: true };
  } catch (err) {
    console.error("[push-client] subscribeToRemotePush failed:", err);
    return { ok: false, reason: "error", message: "No se pudo registrar el servicio Push" };
  }
}

export async function unsubscribeRemotePush(): Promise<boolean> {
  try {
    const sub = await getActivePushSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe().catch(() => {});
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
    }
    try {
      localStorage.removeItem(SYNC_SIG_KEY);
    } catch {}
    return true;
  } catch {
    return false;
  }
}

function buildSyncSignature(endpoint: string, meta: ClientPushMeta): string {
  return JSON.stringify({
    e: endpoint.slice(-24),
    h: meta.heroName,
    s: meta.streak,
    d: meta.lastDay,
    w: meta.weeklyExp,
    p: meta.prefs,
  });
}

export async function syncRemotePushState(
  meta: ClientPushMeta,
  { force = false }: { force?: boolean } = {}
): Promise<void> {
  try {
    const sub = await getActivePushSubscription();
    if (!sub) return;
    const payload = toPayload(sub);
    if (!payload) return;

    const sig = buildSyncSignature(payload.endpoint, meta);
    if (!force) {
      try {
        if (localStorage.getItem(SYNC_SIG_KEY) === sig) return;
      } catch {}
    }

    const res = await fetch("/api/push/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        endpoint: payload.endpoint,
        subscription: payload,
        ...meta,
        timeZone: getLocalTimeZone(),
      }),
    });

    if (res.ok) {
      try {
        localStorage.setItem(SYNC_SIG_KEY, sig);
      } catch {}
    }
  } catch {
    // Non-blocking background sync
  }
}

export async function scheduleRemoteRestPush(
  endsAt: number,
  exerciseName?: string
): Promise<boolean> {
  try {
    const sub = await getActivePushSubscription();
    if (!sub) return false;
    const res = await fetch("/api/push/rest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        endpoint: sub.endpoint,
        endsAt,
        exerciseName,
      }),
    });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      disabled?: boolean;
      skipped?: boolean;
    };
    return Boolean(data.ok && !data.disabled && !data.skipped);
  } catch {
    return false;
  }
}

export async function cancelRemoteRestPush(): Promise<void> {
  try {
    const sub = await getActivePushSubscription();
    if (!sub) return;
    await fetch("/api/push/rest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        endpoint: sub.endpoint,
        cancel: true,
      }),
    });
  } catch {}
}

export async function triggerRemoteTestPush(
  meta: ClientPushMeta,
  delaySeconds?: number
): Promise<{ ok: boolean; scheduled?: boolean; error?: string }> {
  try {
    const sub = await getActivePushSubscription();
    if (!sub) return { ok: false, error: "Push no activado aún" };
    const payload = toPayload(sub);
    if (!payload) return { ok: false, error: "Suscripción inválida" };

    const res = await fetch("/api/push/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        endpoint: payload.endpoint,
        subscription: payload,
        ...meta,
        timeZone: getLocalTimeZone(),
        delaySeconds,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      scheduled?: boolean;
      error?: string;
    };
    return {
      ok: Boolean(res.ok && data.ok),
      scheduled: data.scheduled,
      error: data.error,
    };
  } catch {
    return { ok: false, error: "Error de red al enviar Push de prueba" };
  }
}
