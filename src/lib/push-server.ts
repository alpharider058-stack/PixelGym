import { sendNotification, type WebPushError } from "web-push";
import { deleteSubscriberById } from "./push-store";
import type { PushSubscriptionPayload } from "./push-types";

export interface PushMessagePayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  renotify?: boolean;
  badge?: string;
  icon?: string;
  vibrate?: number[];
  kind?: "rest" | "daily" | "streak" | "league" | "boss" | "test";
}

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:notifications@pixelgym-rpg.vercel.app";
  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID configuration in environment variables");
  }
  return { publicKey, privateKey, subject };
}

export async function sendWebPush(
  subId: string,
  subscription: PushSubscriptionPayload,
  payload: PushMessagePayload,
  ttlSeconds: number = 3600
): Promise<{ ok: boolean; expired?: boolean; statusCode?: number }> {
  const vapidDetails = getVapidConfig();
  const body = JSON.stringify({
    icon: "/icon-192.png",
    badge: "/icon-64.png",
    vibrate: [200, 100, 200],
    url: "/",
    ...payload,
  });

  try {
    const res = await sendNotification(subscription, body, {
      vapidDetails,
      TTL: ttlSeconds,
      urgency: "high",
    });
    return { ok: true, statusCode: res.statusCode };
  } catch (err) {
    const wpErr = err as Partial<WebPushError>;
    const status = wpErr?.statusCode;
    if (status === 404 || status === 410) {
      console.error("[push-server] removing expired push subscription:", subId, status);
      await deleteSubscriberById(subId);
      return { ok: false, expired: true, statusCode: status };
    }
    console.error("[push-server] sendNotification failed:", subId, status, wpErr?.message || err);
    return { ok: false, statusCode: status };
  }
}
