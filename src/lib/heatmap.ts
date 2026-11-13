import { EX, MUSCLE_LABEL, Muscle, isBodyweight } from "./data";
import type { WorkoutLog } from "./store";

export type MuscleRecoveryState = "recovered" | "recovering" | "fatigued";

export interface MuscleHeatmapData {
  muscle: Muscle;
  label: string;
  state: MuscleRecoveryState;
  color: string;
  bgGlow: string;
  hoursSince: number | null;
  daysSince: number | null;
  lastTrainedStr: string;
  fatiguedRemainingStr: string | null;
  recoveryPct: number;
  volumeKg7d: number;
  setsCount7d: number;
  statusTitle: string;
  recommendation: string;
}

const FATIGUE_WINDOW_MS = 48 * 36e5;

function formatRemainingDuration(msLeft: number): string {
  const totalMins = Math.max(1, Math.ceil(msLeft / 60000));
  const days = Math.floor(totalMins / (24 * 60));
  const hours = Math.floor((totalMins % (24 * 60)) / 60);
  const mins = totalMins % 60;
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

const MUSCLE_LIST: Muscle[] = ["chest", "back", "shoulders", "arms", "legs", "core"];

/**
 * Calculates recovery status and 7-day training volume for all muscle groups.
 */
export function calculateMuscleHeatmap(
  history: WorkoutLog[],
  bodyweight: number = 75,
  now: number = Date.now()
): Record<Muscle, MuscleHeatmapData> {
  const sevenDaysAgo = now - 7 * 864e5;

  const result = {} as Record<Muscle, MuscleHeatmapData>;

  for (const m of MUSCLE_LIST) {
    let lastTrainedAt: number | null = null;
    let volumeKg7d = 0;
    let setsCount7d = 0;

    for (const log of history || []) {
      const logTime = log.endedAt || log.startedAt;
      const isWithin7d = logTime >= sevenDaysAgo;

      for (const exEntry of log.exercises || []) {
        const exDef = EX[exEntry.exId];
        if (exDef && exDef.muscle === m) {
          const completedSets = (exEntry.sets || []).filter((s) => s.done);
          if (completedSets.length > 0) {
            // Track the most recent session timestamp
            if (!lastTrainedAt || logTime > lastTrainedAt) {
              lastTrainedAt = logTime;
            }

            if (isWithin7d) {
              setsCount7d += completedSets.length;
              const isBw = isBodyweight(exDef);
              for (const s of completedSets) {
                const effectiveKg = isBw ? bodyweight + s.kg : s.kg;
                volumeKg7d += effectiveKg * s.reps;
              }
            }
          }
        }
      }
    }

    let hoursSince: number | null = null;
    let daysSince: number | null = null;
    let lastTrainedStr = "Sin entrenar recientemente";

    if (lastTrainedAt) {
      hoursSince = Math.max(0, Math.floor((now - lastTrainedAt) / 36e5));
      daysSince = Math.floor(hoursSince / 24);

      if (hoursSince < 1) {
        lastTrainedStr = "Hace menos de 1 hora";
      } else if (hoursSince < 24) {
        lastTrainedStr = `Hace ${hoursSince} horas`;
      } else if (daysSince === 1) {
        lastTrainedStr = "Ayer (hace 24-48h)";
      } else {
        lastTrainedStr = `Hace ${daysSince} días`;
      }
    }

    let state: MuscleRecoveryState = "recovered";
    let color = "#7dff6a"; // Green
    let bgGlow = "rgba(125, 255, 106, 0.3)";
    let statusTitle = "TOTALMENTE RECUPERADO";
    let recommendation =
      "Músculo fresco al 100%. Batería cargada para buscar un nuevo récord hoy.";
    let fatiguedRemainingStr: string | null = null;
    let recoveryPct = 100;

    if (hoursSince !== null && lastTrainedAt !== null) {
      const elapsedMs = Math.max(0, now - lastTrainedAt);
      if (hoursSince < 48) {
        state = "fatigued";
        color = "#ff3f6c"; // Red
        bgGlow = "rgba(255, 63, 108, 0.35)";
        statusTitle = "FATIGADO / EN REPARACIÓN";
        const msLeft = Math.max(0, FATIGUE_WINDOW_MS - elapsedMs);
        fatiguedRemainingStr = formatRemainingDuration(msLeft);
        recoveryPct = Math.min(99, Math.max(0, Math.round((elapsedMs / FATIGUE_WINDOW_MS) * 100)));
        recommendation =
          `Fibras musculares en síntesis proteica y reparación. Dejará de estar fatigado en ${fatiguedRemainingStr}.`;
      } else if (hoursSince < 96) {
        state = "recovering";
        color = "#ffe14d"; // Yellow / Gold
        bgGlow = "rgba(255, 225, 77, 0.3)";
        statusTitle = "EN RECUPERACIÓN / ÓPTIMO";
        recommendation =
          "Fase de supercompensación iniciada. Listo para recibir estímulo moderado o pesado.";
      }
    }

    result[m] = {
      muscle: m,
      label: MUSCLE_LABEL[m],
      state,
      color,
      bgGlow,
      hoursSince,
      daysSince,
      lastTrainedStr,
      fatiguedRemainingStr,
      recoveryPct,
      volumeKg7d: Math.round(volumeKg7d),
      setsCount7d,
      statusTitle,
      recommendation,
    };
  }

  return result;
}
