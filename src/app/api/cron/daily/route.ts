import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendWebPush } from "@/lib/push-server";
import { listAllSubscribers, saveSubscriber } from "@/lib/push-store";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  if (!secret || !header) return false;
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

function localDateForTz(tz?: string, nowMs: number = Date.now()): string {
  const candidates = [tz, "Europe/Madrid", "UTC"].filter(Boolean) as string[];
  for (const timeZone of candidates) {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(nowMs));
    } catch {
      // try next timezone
    }
  }
  return new Date(nowMs).toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subs = await listAllSubscribers();
    const nowMs = Date.now();
    const todayUtc = new Date(nowMs).toISOString().slice(0, 10);

    let sentDaily = 0;
    let sentStreak = 0;
    let skippedTrained = 0;
    let expiredRemoved = 0;

    for (const sub of subs) {
      const todayLocal = localDateForTz(sub.timeZone, nowMs);
      if (sub.lastDailySentDate === todayLocal) continue;

      let diffDays = 1;
      if (sub.lastDay) {
        const todayNoonMs = Date.parse(`${todayLocal}T12:00:00Z`);
        const lastNoonMs = Date.parse(`${sub.lastDay}T12:00:00Z`);
        if (!Number.isNaN(todayNoonMs) && !Number.isNaN(lastNoonMs)) {
          diffDays = Math.round((todayNoonMs - lastNoonMs) / 86400000);
        }
      }

      // Already trained today in subscriber's local timezone
      if (diffDays <= 0) {
        skippedTrained++;
        continue;
      }

      const hero = sub.heroName || "HÉROE";
      const streakActive = sub.streak > 0 && diffDays < 3;
      const streakAtRisk = streakActive && diffDays === 2 && sub.prefs.streakRisk;
      const shouldSendDaily = sub.prefs.dailyReminder;
      const streakDaysText = sub.streak === 1 ? "1 día" : `${sub.streak} días`;

      if (!streakAtRisk && !shouldSendDaily) continue;

      const payload = streakAtRisk
        ? {
            title: `PixelGym RPG · 🔥 ¡Racha de ${sub.streak}D en riesgo!`,
            body: `¡Último aviso, ${hero}! Entrena antes de medianoche o perderás tu racha de ${streakDaysText}.`,
            tag: "pixelgym-streak-risk",
            renotify: true,
            url: "/",
            kind: "streak" as const,
            vibrate: [250, 100, 250, 100, 300],
          }
        : {
            title: "PixelGym RPG · ⚔️ Recordatorio de Entreno",
            body: streakActive
              ? `¡Hora de entrenar, ${hero}! Llevas ${streakDaysText} seguidos 🔥 Suma EXP y golpea al Raid Boss.`
              : `¡Hoy toca hierro, ${hero}! Completa una sesión para encender tu racha y ganar EXP.`,
            tag: "pixelgym-daily",
            renotify: false,
            url: "/",
            kind: "daily" as const,
          };

      const res = await sendWebPush(sub.id, sub.subscription, payload, 21600);
      if (res.expired) {
        expiredRemoved++;
        continue;
      }
      if (res.ok) {
        if (streakAtRisk) sentStreak++;
        else sentDaily++;
        sub.lastDailySentDate = todayLocal;
        sub.updatedAt = Date.now();
        await saveSubscriber(sub);
      }
    }

    return NextResponse.json({
      ok: true,
      date: todayUtc,
      checked: subs.length,
      sentDaily,
      sentStreak,
      skippedTrained,
      expiredRemoved,
    });
  } catch (err) {
    console.error("[api/cron/daily] GET error:", err);
    return NextResponse.json({ ok: false, error: "Daily cron failed" }, { status: 500 });
  }
}
