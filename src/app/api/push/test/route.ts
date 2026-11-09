import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { sendWebPush } from "@/lib/push-server";
import { getSubscriberById, getSubscriberId, upsertSubscriber } from "@/lib/push-store";
import type { PushSyncInput } from "@/lib/push-types";
import { delayedTestPushWorkflow } from "@/workflows/push-workflows";

interface TestPushBody extends Partial<PushSyncInput> {
  endpoint?: string;
  delaySeconds?: number;
  label?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TestPushBody;
    const endpoint = body.subscription?.endpoint || body.endpoint;
    if (!endpoint || !endpoint.startsWith("https://")) {
      return NextResponse.json({ ok: false, error: "Missing endpoint" }, { status: 400 });
    }

    const id = getSubscriberId(endpoint);
    let sub = await getSubscriberById(id);

    if (!sub && body.subscription?.keys?.p256dh && body.subscription?.keys?.auth) {
      sub = await upsertSubscriber({
        subscription: body.subscription,
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
    }

    if (!sub) {
      return NextResponse.json({ ok: false, error: "Subscription not found" }, { status: 404 });
    }

    const delaySeconds = Number(body.delaySeconds ?? 0);
    if (Number.isFinite(delaySeconds) && delaySeconds > 0) {
      const clamped = Math.max(1, Math.min(30, Math.round(delaySeconds)));
      const run = await start(delayedTestPushWorkflow, [sub.id, clamped, body.label]);
      return NextResponse.json({ ok: true, scheduled: true, delaySeconds: clamped, runId: run.runId });
    }

    const res = await sendWebPush(
      sub.id,
      sub.subscription,
      {
        title: "PixelGym RPG · 🔔 Push Remoto Activo",
        body: `¡Listo, ${sub.heroName}! Tus alertas de racha, Liga y Raid Boss llegarán aunque la app esté cerrada.`,
        tag: "pixelgym-test",
        renotify: true,
        url: "/",
        kind: "test",
      },
      180
    );

    return NextResponse.json({ ok: res.ok, expired: res.expired, statusCode: res.statusCode });
  } catch (err) {
    console.error("[api/push/test] POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to send test push" }, { status: 500 });
  }
}
