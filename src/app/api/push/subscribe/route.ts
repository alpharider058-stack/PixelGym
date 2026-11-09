import { NextResponse } from "next/server";
import { deleteSubscriberByEndpoint, upsertSubscriber } from "@/lib/push-store";
import type { PushSyncInput } from "@/lib/push-types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<PushSyncInput>;
    const endpoint = body?.subscription?.endpoint;
    const p256dh = body?.subscription?.keys?.p256dh;
    const auth = body?.subscription?.keys?.auth;

    if (!endpoint || !endpoint.startsWith("https://") || !p256dh || !auth) {
      return NextResponse.json({ ok: false, error: "Invalid PushSubscription payload" }, { status: 400 });
    }

    const sub = await upsertSubscriber({
      subscription: {
        endpoint,
        expirationTime: body.subscription?.expirationTime ?? null,
        keys: { p256dh, auth },
      },
      prefs: body.prefs ?? {
        dailyReminder: true,
        streakRisk: true,
        weeklyLeague: true,
        raidBoss: true,
        restPush: true,
      },
      heroName: body.heroName ?? "HÉROE",
      streak: body.streak ?? 0,
      lastDay: body.lastDay ?? null,
      weeklyExp: body.weeklyExp ?? 0,
      timeZone: body.timeZone,
    });

    return NextResponse.json({ ok: true, id: sub.id });
  } catch (err) {
    console.error("[api/push/subscribe] POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to save push subscription" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
    if (!body.endpoint || !body.endpoint.startsWith("https://")) {
      return NextResponse.json({ ok: false, error: "Missing endpoint" }, { status: 400 });
    }
    await deleteSubscriberByEndpoint(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/push/subscribe] DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Failed to remove push subscription" }, { status: 500 });
  }
}
