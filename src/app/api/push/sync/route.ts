import { NextResponse } from "next/server";
import { getSubscriberById, getSubscriberId, saveSubscriber, upsertSubscriber } from "@/lib/push-store";
import type { PushPrefs, PushSubscriptionPayload } from "@/lib/push-types";

interface SyncBody {
  endpoint?: string;
  subscription?: PushSubscriptionPayload;
  prefs?: Partial<PushPrefs>;
  heroName?: string;
  streak?: number;
  lastDay?: string | null;
  weeklyExp?: number;
  timeZone?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SyncBody;
    const endpoint = body.subscription?.endpoint || body.endpoint;
    if (!endpoint || !endpoint.startsWith("https://")) {
      return NextResponse.json({ ok: false, error: "Missing endpoint" }, { status: 400 });
    }

    const id = getSubscriberId(endpoint);
    const existing = await getSubscriberById(id);

    if (!existing) {
      if (body.subscription?.keys?.p256dh && body.subscription?.keys?.auth) {
        await upsertSubscriber({
          subscription: body.subscription,
          prefs: {
            dailyReminder: body.prefs?.dailyReminder ?? true,
            streakRisk: body.prefs?.streakRisk ?? true,
            weeklyLeague: body.prefs?.weeklyLeague ?? true,
            raidBoss: body.prefs?.raidBoss ?? true,
            restPush: body.prefs?.restPush ?? true,
          },
          heroName: body.heroName ?? "HÉROE",
          streak: body.streak ?? 0,
          lastDay: body.lastDay ?? null,
          weeklyExp: body.weeklyExp ?? 0,
          timeZone: body.timeZone,
        });
        return NextResponse.json({ ok: true, created: true });
      }
      return NextResponse.json({ ok: false, resubscribe: true }, { status: 404 });
    }

    if (body.prefs) {
      existing.prefs = { ...existing.prefs, ...body.prefs };
    }
    if (typeof body.heroName === "string" && body.heroName.trim()) {
      existing.heroName = body.heroName.trim().slice(0, 20);
    }
    if (typeof body.streak === "number" && Number.isFinite(body.streak)) {
      existing.streak = Math.max(0, Math.round(body.streak));
    }
    if (body.lastDay === null || (typeof body.lastDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.lastDay))) {
      existing.lastDay = body.lastDay;
    }
    if (typeof body.weeklyExp === "number" && Number.isFinite(body.weeklyExp)) {
      existing.weeklyExp = Math.max(0, Math.round(body.weeklyExp));
    }
    if (typeof body.timeZone === "string" && body.timeZone) {
      existing.timeZone = body.timeZone;
    }
    existing.updatedAt = Date.now();

    await saveSubscriber(existing);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/push/sync] POST error:", err);
    return NextResponse.json({ ok: false, error: "Sync failed" }, { status: 500 });
  }
}
