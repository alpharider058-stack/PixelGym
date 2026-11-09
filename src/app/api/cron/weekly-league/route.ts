import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { leagueOf, weekOfUtc } from "@/lib/data";
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

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subs = await listAllSubscribers();
    const currentWeek = weekOfUtc();

    let sent = 0;
    let expiredRemoved = 0;

    for (const sub of subs) {
      if (!sub.prefs.weeklyLeague) continue;
      if (sub.lastLeagueWarnWeek === currentWeek) continue;

      const sameWeek = sub.lastDay ? weekOfUtc(Date.parse(sub.lastDay)) === currentWeek : false;
      const exp = sameWeek ? Math.max(0, sub.weeklyExp || 0) : 0;
      const lg = leagueOf(exp);

      const res = await sendWebPush(
        sub.id,
        sub.subscription,
        {
          title: "PixelGym RPG · ♛ ¡Cierre de Liga esta noche!",
          body:
            exp > 0
              ? `Quedan pocas horas antes del reinicio semanal (00:00 UTC). Estás en Liga ${lg.name} con ${exp.toLocaleString("es-ES")} EXP. ¡Asegura tu trofeo!`
              : "Quedan pocas horas antes del reinicio semanal (00:00 UTC). Haz una sesión rápida hoy para sumar EXP y asegurar trofeo en tu Liga.",
          tag: "pixelgym-weekly-league",
          renotify: true,
          url: "/",
          kind: "league",
        },
        14400
      );

      if (res.expired) {
        expiredRemoved++;
        continue;
      }
      if (res.ok) {
        sent++;
        sub.lastLeagueWarnWeek = currentWeek;
        sub.updatedAt = Date.now();
        await saveSubscriber(sub);
      }
    }

    return NextResponse.json({
      ok: true,
      week: currentWeek,
      checked: subs.length,
      sent,
      expiredRemoved,
    });
  } catch (err) {
    console.error("[api/cron/weekly-league] GET error:", err);
    return NextResponse.json({ ok: false, error: "Weekly league cron failed" }, { status: 500 });
  }
}
