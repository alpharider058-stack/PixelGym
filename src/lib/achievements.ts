import type { WorkoutLog } from "./store";

export interface AchievementSnapshot {
  tonnage: number;
  streak: number;
  maxStreak: number;
  history: WorkoutLog[];
  owned: string[];
  bossKills: number;
  totalPrs: number;
}

export interface AchievementEval {
  unlocked: boolean;
  progress: number;
  target: number;
  unit: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  rewardGold: number;
  profileTitle: string;
  color: string;
  eval: (s: AchievementSnapshot) => AchievementEval;
}

function countHistoricalPrs(history: WorkoutLog[]): number {
  let c = 0;
  for (const h of history) {
    c += h.prs || 0;
  }
  return c;
}

function hasWorkoutInHourRange(history: WorkoutLog[], minH: number, maxH: number): boolean {
  for (const h of history) {
    const hr = new Date(h.endedAt || h.startedAt).getHours();
    if (minH <= maxH) {
      if (hr >= minH && hr <= maxH) return true;
    } else {
      // wraps midnight e.g. 22 -> 4
      if (hr >= minH || hr <= maxH) return true;
    }
  }
  return false;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "ach_first_workout",
    title: "PRIMER DESPERTAR",
    desc: "Completa tu primer entrenamiento.",
    icon: "⚔️",
    rewardGold: 60,
    profileTitle: "Iniciado del Hierro",
    color: "#7dff6a",
    eval: (s) => ({
      unlocked: s.history.length >= 1,
      progress: Math.min(1, s.history.length),
      target: 1,
      unit: "entreno",
    }),
  },
  {
    id: "ach_10k",
    title: "FÉRREO (10.000 KG)",
    desc: "Mueve 10.000 kg de tonelaje total.",
    icon: "🏋️",
    rewardGold: 120,
    profileTitle: "Cargador de Hierro",
    color: "#3df2ff",
    eval: (s) => ({
      unlocked: s.tonnage >= 10000,
      progress: Math.min(10000, Math.round(s.tonnage)),
      target: 10000,
      unit: "kg",
    }),
  },
  {
    id: "ach_100k",
    title: "COLOSO 100.000 KG",
    desc: "Acumula 100.000 kg levantados en tu carrera.",
    icon: "🏔️",
    rewardGold: 450,
    profileTitle: "Señor del Tonelaje",
    color: "#ffe14d",
    eval: (s) => ({
      unlocked: s.tonnage >= 100000,
      progress: Math.min(100000, Math.round(s.tonnage)),
      target: 100000,
      unit: "kg",
    }),
  },
  {
    id: "ach_500k",
    title: "LEYENDA MEDIO MILLÓN",
    desc: "Acumula 500.000 kg levantados en tu carrera.",
    icon: "👑",
    rewardGold: 1000,
    profileTitle: "Emperador del Hierro",
    color: "#c06cff",
    eval: (s) => ({
      unlocked: s.tonnage >= 500000,
      progress: Math.min(500000, Math.round(s.tonnage)),
      target: 500000,
      unit: "kg",
    }),
  },
  {
    id: "ach_streak_7",
    title: "SEMANA INVICTA",
    desc: "Alcanza una racha de 7 días de disciplina.",
    icon: "🔥",
    rewardGold: 150,
    profileTitle: "Guerrero Constante",
    color: "#ff7a1a",
    eval: (s) => {
      const cur = Math.max(s.streak, s.maxStreak);
      return {
        unlocked: cur >= 7,
        progress: Math.min(7, cur),
        target: 7,
        unit: "días",
      };
    },
  },
  {
    id: "ach_streak_30",
    title: "RACHA 30 DÍAS",
    desc: "Mantén viva la llama durante 30 días de racha.",
    icon: "☄️",
    rewardGold: 600,
    profileTitle: "Llama Inextinguible",
    color: "#ff3f6c",
    eval: (s) => {
      const cur = Math.max(s.streak, s.maxStreak);
      return {
        unlocked: cur >= 30,
        progress: Math.min(30, cur),
        target: 30,
        unit: "días",
      };
    },
  },
  {
    id: "ach_pr_5",
    title: "ROMPE-PRs",
    desc: "Supera 5 Récords Personales en tu historia.",
    icon: "⚡",
    rewardGold: 140,
    profileTitle: "Cazador de Récords",
    color: "#ffe14d",
    eval: (s) => {
      const prs = Math.max(s.totalPrs, countHistoricalPrs(s.history));
      return {
        unlocked: prs >= 5,
        progress: Math.min(5, prs),
        target: 5,
        unit: "PRs",
      };
    },
  },
  {
    id: "ach_pr_25",
    title: "DESTRUCTOR DE LÍMITES",
    desc: "Rompe 25 Récords Personales en tu historia.",
    icon: "💥",
    rewardGold: 500,
    profileTitle: "Rompelímites",
    color: "#ff3f6c",
    eval: (s) => {
      const prs = Math.max(s.totalPrs, countHistoricalPrs(s.history));
      return {
        unlocked: prs >= 25,
        progress: Math.min(25, prs),
        target: 25,
        unit: "PRs",
      };
    },
  },
  {
    id: "ach_early_bird",
    title: "MADRUGADOR DE ACERO",
    desc: "Completa un entreno temprano (05:00 - 08:30).",
    icon: "🌅",
    rewardGold: 180,
    profileTitle: "Alba de Acero",
    color: "#3df2ff",
    eval: (s) => {
      const ok = s.history.some((h) => {
        const d = new Date(h.endedAt || h.startedAt);
        const mins = d.getHours() * 60 + d.getMinutes();
        return mins >= 5 * 60 && mins <= 8 * 60 + 30;
      });
      return { unlocked: ok, progress: ok ? 1 : 0, target: 1, unit: "sesión" };
    },
  },
  {
    id: "ach_night_owl",
    title: "BÚHO NOCTURNO",
    desc: "Completa un entreno de noche (22:00 - 03:59).",
    icon: "🦉",
    rewardGold: 180,
    profileTitle: "Sombra Nocturna",
    color: "#c06cff",
    eval: (s) => {
      const ok = hasWorkoutInHourRange(s.history, 22, 3);
      return { unlocked: ok, progress: ok ? 1 : 0, target: 1, unit: "sesión" };
    },
  },
  {
    id: "ach_boss_slayer",
    title: "MATADOR DE COLOSOS",
    desc: "Reclama la victoria sobre un Raid Boss semanal.",
    icon: "👹",
    rewardGold: 320,
    profileTitle: "Azote de Titanes",
    color: "#7dff6a",
    eval: (s) => ({
      unlocked: s.bossKills >= 1,
      progress: Math.min(1, s.bossKills),
      target: 1,
      unit: "jefe",
    }),
  },
  {
    id: "ach_collector",
    title: "ARMERO REAL",
    desc: "Posee al menos 12 objetos entre equipo, armas y mascotas.",
    icon: "🛡️",
    rewardGold: 260,
    profileTitle: "Coleccionista Real",
    color: "#ffe14d",
    eval: (s) => ({
      unlocked: s.owned.length >= 12,
      progress: Math.min(12, s.owned.length),
      target: 12,
      unit: "ítems",
    }),
  },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])) as Record<string, AchievementDef>;
