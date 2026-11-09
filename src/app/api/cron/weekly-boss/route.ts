import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getWeeklyBoss, weekOfUtc } from "@/lib/data";
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
    const boss = getWeeklyBoss(currentWeek);

    let sent = 0;
    let expiredRemoved = 0;

    for (const sub of subs) {
      const wantBoss = sub.prefs.raidBoss;
      const wantLeague = sub.prefs.weeklyLeague;
      if (!wantBoss && !wantLeague) continue;
      if (sub.lastBossAnnouncedWeek === currentWeek) continue;

      const hpStr = boss.totalHp.toLocaleString("es-ES");
      let title = `PixelGym RPG · ${boss.icon} ¡Nuevo Raid Boss: ${boss.name}!`;
      let body = `${boss.title} (${hpStr} HP). ¡Entrena hoy para hacerle daño y ganar ORO!`;

      if (wantBoss && wantLeague) {
        title = `PixelGym RPG · ${boss.icon} ¡Nuevo Raid Boss y Nueva Liga!`;
        body = `Ha llegado ${boss.name} (${hpStr} HP). ¡Reclama tu trofeo de la semana pasada y da el primer golpe!`;
      } else if (!wantBoss && wantLeague) {
        title = "PixelGym RPG · 🏆 ¡Nueva Temporada de Liga!";
        body = "La clasificación semanal se ha reiniciado. Entra en Ligas para reclamar tu trofeo y subir de división.";
      }

      const res = await sendWebPush(
        sub.id,
        sub.subscription,
        {
          title,
          body,
          tag: "pixelgym-weekly-boss",
          renotify: true,
          url: "/",
          kind: "boss",
        },
        43200
      );

      if (res.expired) {
        expiredRemoved++;
        continue;
      }
      if (res.ok) {
        sent++;
        sub.lastBossAnnouncedWeek = currentWeek;
        sub.updatedAt = Date.now();
        await saveSubscriber(sub);
      }
    }

    return NextResponse.json({
      ok: true,
      week: currentWeek,
      boss: boss.name,
      checked: subs.length,
      sent,
      expiredRemoved,
    });
  } catch (err) {
    console.error("[api/cron/weekly-boss] GET error:", err);
    return NextResponse.json({ ok: false, error: "Weekly boss cron failed" }, { status: 500 });
  }
}
