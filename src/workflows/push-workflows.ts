import { sleep } from "workflow";
import { deliverDelayedTestPushStep, deliverRestPushStep } from "./push-steps";

export async function restTimerPushWorkflow(
  subId: string,
  endsAt: number,
  token: string,
  exerciseName?: string
) {
  "use workflow";
  console.log("[push-workflows] restTimerPushWorkflow sleeping until:", {
    subId,
    endsAt,
    token,
  });

  if (endsAt > Date.now()) {
    await sleep(new Date(endsAt));
  }

  return await deliverRestPushStep(subId, token, exerciseName);
}

export async function delayedTestPushWorkflow(
  subId: string,
  delaySec: number,
  label?: string
) {
  "use workflow";
  const safeSec = Math.max(1, Math.min(30, Math.round(delaySec)));
  console.log("[push-workflows] delayedTestPushWorkflow sleeping:", {
    subId,
    safeSec,
  });

  await sleep(`${safeSec}s`);
  return await deliverDelayedTestPushStep(subId, label);
}
