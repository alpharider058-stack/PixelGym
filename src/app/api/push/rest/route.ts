import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { getSubscriberById, getSubscriberId, saveSubscriber } from "@/lib/push-store";
import { restTimerPushWorkflow } from "@/workflows/push-workflows";

interface RestPushBody {
  endpoint?: string;
  cancel?: boolean;
  endsAt?: number;
  exerciseName?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RestPushBody;
    if (!body.endpoint || !body.endpoint.startsWith("https://")) {
      return NextResponse.json({ ok: false, error: "Missing endpoint" }, { status: 400 });
    }

    const id = getSubscriberId(body.endpoint);
    const sub = await getSubscriberById(id);
    if (!sub) {
      return NextResponse.json({ ok: false, skipped: true }, { status: 404 });
    }

    if (body.cancel) {
      sub.restToken = null;
      sub.restEndsAt = null;
      sub.updatedAt = Date.now();
      await saveSubscriber(sub);
      return NextResponse.json({ ok: true, cancelled: true });
    }

    if (!sub.prefs.restPush) {
      return NextResponse.json({ ok: true, disabled: true });
    }

    const now = Date.now();
    const endsAt = Number(body.endsAt);
    if (!Number.isFinite(endsAt) || endsAt <= now + 1000 || endsAt > now + 30 * 60 * 1000) {
      return NextResponse.json({ ok: false, error: "Invalid rest timer endsAt" }, { status: 400 });
    }

    const token = randomUUID();
    sub.restToken = token;
    sub.restEndsAt = endsAt;
    sub.updatedAt = now;
    await saveSubscriber(sub);

    const run = await start(restTimerPushWorkflow, [
      sub.id,
      endsAt,
      token,
      typeof body.exerciseName === "string" ? body.exerciseName.slice(0, 50) : undefined,
    ]);

    return NextResponse.json({ ok: true, runId: run.runId, token });
  } catch (err) {
    console.error("[api/push/rest] POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to schedule rest push" }, { status: 500 });
  }
}
