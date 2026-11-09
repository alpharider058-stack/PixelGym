import { createHash } from "node:crypto";
import { del, get, list, put } from "@vercel/blob";
import {
  DEFAULT_PUSH_PREFS,
  PushPrefs,
  PushSyncInput,
  StoredPushSubscriber,
} from "./push-types";

export function getSubscriberId(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
}

function blobPath(id: string): string {
  return `subs/${id}.json`;
}

function sanitizePrefs(prefs?: Partial<PushPrefs>): PushPrefs {
  return {
    dailyReminder: prefs?.dailyReminder ?? DEFAULT_PUSH_PREFS.dailyReminder,
    streakRisk: prefs?.streakRisk ?? DEFAULT_PUSH_PREFS.streakRisk,
    weeklyLeague: prefs?.weeklyLeague ?? DEFAULT_PUSH_PREFS.weeklyLeague,
    raidBoss: prefs?.raidBoss ?? DEFAULT_PUSH_PREFS.raidBoss,
    restPush: prefs?.restPush ?? DEFAULT_PUSH_PREFS.restPush,
  };
}

export async function getSubscriberById(id: string): Promise<StoredPushSubscriber | null> {
  try {
    const res = await get(blobPath(id), { access: "private", useCache: false });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    const raw = await new Response(res.stream).text();
    const parsed = JSON.parse(raw) as StoredPushSubscriber;
    if (!parsed?.subscription?.endpoint || !parsed.subscription?.keys?.p256dh || !parsed.subscription?.keys?.auth) {
      return null;
    }
    return parsed;
  } catch (err) {
    console.error("[push-store] getSubscriberById failed:", id, err);
    return null;
  }
}

export async function saveSubscriber(sub: StoredPushSubscriber): Promise<void> {
  await put(blobPath(sub.id), JSON.stringify(sub), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export async function upsertSubscriber(input: PushSyncInput): Promise<StoredPushSubscriber> {
  const id = getSubscriberId(input.subscription.endpoint);
  const existing = await getSubscriberById(id);
  const next: StoredPushSubscriber = {
    id,
    subscription: {
      endpoint: input.subscription.endpoint,
      expirationTime: input.subscription.expirationTime ?? null,
      keys: {
        p256dh: input.subscription.keys.p256dh,
        auth: input.subscription.keys.auth,
      },
    },
    prefs: sanitizePrefs(input.prefs),
    heroName: (input.heroName || "HÉROE").slice(0, 20),
    streak: Math.max(0, Math.round(Number(input.streak) || 0)),
    lastDay: typeof input.lastDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.lastDay) ? input.lastDay : null,
    weeklyExp: Math.max(0, Math.round(Number(input.weeklyExp) || 0)),
    timeZone: input.timeZone || existing?.timeZone || "Europe/Madrid",
    restToken: existing?.restToken ?? null,
    restEndsAt: existing?.restEndsAt ?? null,
    lastDailySentDate: existing?.lastDailySentDate ?? null,
    lastLeagueWarnWeek: existing?.lastLeagueWarnWeek ?? null,
    lastBossAnnouncedWeek: existing?.lastBossAnnouncedWeek ?? null,
    updatedAt: Date.now(),
  };

  await saveSubscriber(next);
  return next;
}

export async function deleteSubscriberById(id: string): Promise<void> {
  try {
    await del(blobPath(id));
  } catch (err) {
    console.error("[push-store] deleteSubscriberById failed:", id, err);
  }
}

export async function deleteSubscriberByEndpoint(endpoint: string): Promise<void> {
  return deleteSubscriberById(getSubscriberId(endpoint));
}

export async function listAllSubscribers(): Promise<StoredPushSubscriber[]> {
  const items: { pathname: string }[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({ prefix: "subs/", limit: 1000, cursor });
    for (const b of page.blobs) {
      if (b.pathname.endsWith(".json")) {
        items.push({ pathname: b.pathname });
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const subs: StoredPushSubscriber[] = [];
  const BATCH = 10;
  for (let i = 0; i < items.length; i += BATCH) {
    const slice = items.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      slice.map(async (entry) => {
        const id = entry.pathname.replace(/^subs\//, "").replace(/\.json$/, "");
        return getSubscriberById(id);
      })
    );
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) {
        subs.push(r.value);
      }
    }
  }
  return subs;
}
