import { EX, isBodyweight } from "./data";
import type { WorkoutLog } from "./store";

export interface OverloadAdvice {
  hasHistory: boolean;
  daysAgo?: number;
  sessionDateStr?: string;
  prevKg: number;
  prevReps: number;
  targetKg: number;
  targetReps: number;
  summaryText: string;
  achieved: boolean;
}

/**
 * Finds the most recent completed performance for a given exercise from user's history.
 */
export function getLastPerformance(history: WorkoutLog[], exId: string) {
  if (!history || history.length === 0) return null;

  for (const log of history) {
    const foundEx = log.exercises?.find(
      (e) => e.exId === exId && e.sets && e.sets.some((s) => s.done)
    );
    if (foundEx) {
      const validSets = foundEx.sets.filter((s) => s.done);
      if (validSets.length > 0) {
        return {
          logId: log.id,
          timestamp: log.endedAt || log.startedAt,
          sets: validSets,
        };
      }
    }
  }
  return null;
}

/**
 * Computes the progressive overload target for a specific set of an exercise.
 */
export function getSetOverloadAdvice(
  history: WorkoutLog[],
  exId: string,
  setIndex: number,
  currentKg?: number,
  currentReps?: number,
  isDone?: boolean
): OverloadAdvice {
  const last = getLastPerformance(history, exId);
  const ex = EX[exId];
  const isBw = isBodyweight(ex);

  if (!last || last.sets.length === 0) {
    return {
      hasHistory: false,
      prevKg: 0,
      prevReps: 0,
      targetKg: ex?.defKg ?? 20,
      targetReps: ex?.defReps ?? 8,
      summaryText: "Primera sesión: establece tu marca base de fuerza.",
      achieved: false,
    };
  }

  // Get matching set from previous session, or fallback to the last/heaviest set
  const prevSet = last.sets[setIndex] || last.sets[last.sets.length - 1];
  const prevKg = prevSet.kg;
  const prevReps = prevSet.reps;

  // Weight increment: 2.5kg standard, or 1.25kg for small dumbbell exercises
  const kgIncrement = prevKg >= 40 ? 2.5 : 1.25;
  const targetKg = isBw && prevKg === 0 ? 2.5 : prevKg + kgIncrement;
  const targetReps = prevReps + 1;

  const daysAgo = Math.max(1, Math.round((Date.now() - last.timestamp) / 864e5));
  const timeLabel = daysAgo <= 7 ? "La semana pasada" : `Hace ${daysAgo} días`;

  const prevDisplay = isBw && prevKg === 0 ? `PC × ${prevReps}` : `${prevKg} kg × ${prevReps}`;
  const targetLoadDisplay = isBw && prevKg === 0 ? `+2.5 kg × ${prevReps}` : `${targetKg} kg × ${prevReps}`;
  const targetRepsDisplay = isBw && prevKg === 0 ? `PC × ${targetReps}` : `${prevKg} kg × ${targetReps}`;

  const summaryText = `${timeLabel} hiciste ${prevDisplay}. Hoy el reto para sobrecarga progresiva es: ${targetLoadDisplay} ó ${targetRepsDisplay}.`;

  let achieved = false;
  if (isDone && typeof currentKg === "number" && typeof currentReps === "number") {
    // Condition A: Lifted higher or equal weight with same or more reps
    const beatWeight = currentKg >= targetKg && currentReps >= prevReps;
    // Condition B: Same weight with more reps
    const beatReps = currentKg >= prevKg && currentReps >= targetReps;
    achieved = (beatWeight || beatReps) && currentReps > 0;
  }

  return {
    hasHistory: true,
    daysAgo,
    sessionDateStr: new Date(last.timestamp).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    }),
    prevKg,
    prevReps,
    targetKg,
    targetReps,
    summaryText,
    achieved,
  };
}
