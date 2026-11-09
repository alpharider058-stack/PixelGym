import { sendWebPush } from "@/lib/push-server";
import { getSubscriberById, saveSubscriber } from "@/lib/push-store";

export async function deliverRestPushStep(
  subId: string,
  token: string,
  exerciseName?: string
): Promise<{ sent: boolean; reason?: string }> {
  "use step";
  console.log("[push-steps] deliverRestPushStep checking:", subId);

  const sub = await getSubscriberById(subId);
  if (!sub) {
    console.log("[push-steps] subscriber not found:", subId);
    return { sent: false, reason: "not_found" };
  }
  if (!sub.prefs.restPush || sub.restToken !== token) {
    console.log("[push-steps] stale or disabled rest push skipped:", subId);
    return { sent: false, reason: "cancelled_or_superseded" };
  }

  sub.restToken = null;
  sub.restEndsAt = null;
  sub.updatedAt = Date.now();
  await saveSubscriber(sub);

  const cleanEx = exerciseName ? exerciseName.trim() : "";
  const res = await sendWebPush(
    sub.id,
    sub.subscription,
    {
      title: "PixelGym RPG · ⏱ ¡Descanso terminado!",
      body: cleanEx
        ? `¡Descanso finalizado en ${cleanEx}! A por la siguiente serie 💪`
        : "¡Descanso finalizado! A por la siguiente serie 💪",
      tag: "pixelgym-rest-timer",
      renotify: true,
      url: "/",
      kind: "rest",
      vibrate: [250, 100, 250],
    },
    120
  );

  return { sent: res.ok, reason: res.ok ? "ok" : `status_${res.statusCode ?? "err"}` };
}

export async function deliverDelayedTestPushStep(
  subId: string,
  label?: string
): Promise<{ sent: boolean; reason?: string }> {
  "use step";
  console.log("[push-steps] deliverDelayedTestPushStep firing:", subId);

  const sub = await getSubscriberById(subId);
  if (!sub) {
    return { sent: false, reason: "not_found" };
  }

  const res = await sendWebPush(
    sub.id,
    sub.subscription,
    {
      title: "PixelGym RPG · 🔔 Push Remoto OK",
      body:
        label ||
        `¡Hola ${sub.heroName}! Esta alerta llegó desde el servidor con la app cerrada 💪`,
      tag: "pixelgym-test",
      renotify: true,
      url: "/",
      kind: "test",
    },
    180
  );

  return { sent: res.ok, reason: res.ok ? "ok" : `status_${res.statusCode ?? "err"}` };
}
