import { buildExercises } from "./exercises";

export type Muscle = "chest" | "back" | "shoulders" | "arms" | "legs" | "core";
export type Group = "push" | "pull" | "legs";

export interface Exercise {
  id: string;
  name: string;
  muscle: Muscle;
  group: Group;
  defKg: number;
  defReps: number;
  sub?: string;
  bw?: boolean;
}

export const EXERCISES: Exercise[] = [
  { id: "bench", name: "Press Banca", muscle: "chest", group: "push", defKg: 60, defReps: 8 },
  { id: "incline", name: "Press Inclinado Manc.", muscle: "chest", group: "push", defKg: 22.5, defReps: 10 },
  { id: "dips", name: "Fondos", muscle: "chest", group: "push", defKg: 0, defReps: 12, bw: true },
  { id: "ohp", name: "Press Militar", muscle: "shoulders", group: "push", defKg: 40, defReps: 8 },
  { id: "lateral", name: "Elev. Laterales", muscle: "shoulders", group: "push", defKg: 10, defReps: 15 },
  { id: "pushdown", name: "Extensión Tríceps", muscle: "arms", group: "push", defKg: 25, defReps: 12 },
  { id: "deadlift", name: "Peso Muerto", muscle: "back", group: "pull", defKg: 100, defReps: 5 },
  { id: "pullup", name: "Dominadas", muscle: "back", group: "pull", defKg: 0, defReps: 8, bw: true },
  { id: "row", name: "Remo con Barra", muscle: "back", group: "pull", defKg: 60, defReps: 10 },
  { id: "pulldown", name: "Jalón al Pecho", muscle: "back", group: "pull", defKg: 50, defReps: 10 },
  { id: "facepull", name: "Face Pull", muscle: "shoulders", group: "pull", defKg: 20, defReps: 15 },
  { id: "curl", name: "Curl Bíceps", muscle: "arms", group: "pull", defKg: 12.5, defReps: 12 },
  { id: "hammer", name: "Curl Martillo", muscle: "arms", group: "pull", defKg: 14, defReps: 12 },
  { id: "squat", name: "Sentadilla", muscle: "legs", group: "legs", defKg: 80, defReps: 6 },
  { id: "rdl", name: "Peso Muerto Rumano", muscle: "legs", group: "legs", defKg: 70, defReps: 10 },
  { id: "legpress", name: "Prensa", muscle: "legs", group: "legs", defKg: 140, defReps: 12 },
  { id: "lunge", name: "Zancadas", muscle: "legs", group: "legs", defKg: 16, defReps: 12 },
  { id: "calf", name: "Gemelos", muscle: "legs", group: "legs", defKg: 60, defReps: 15 },
];
const BASE_SUB: Record<string, string> = {
  bench: "Pecho", incline: "Pecho", dips: "Pecho", ohp: "Deltoides Anterior", lateral: "Deltoides Lateral",
  pushdown: "Tríceps", deadlift: "Lumbar", pullup: "Dorsal", row: "Espalda Media", pulldown: "Dorsal",
  facepull: "Deltoides Posterior", curl: "Bíceps", hammer: "Bíceps", squat: "Cuádriceps", rdl: "Femoral",
  legpress: "Cuádriceps", lunge: "Cuádriceps", calf: "Gemelo",
};
EXERCISES.forEach((e) => (e.sub = BASE_SUB[e.id]));
EXERCISES.push(...buildExercises(new Set(EXERCISES.map((e) => e.id))));

export const EX = Object.fromEntries(EXERCISES.map((e) => [e.id, e])) as Record<string, Exercise>;

export interface Routine {
  id: string;
  name: string;
  icon: string;
  exercises: string[];
  custom?: boolean;
}

export const TEMPLATES: Routine[] = [
  { id: "push", name: "EMPUJE", icon: "biceps", exercises: ["bench", "incline", "ohp", "lateral", "pushdown"] },
  { id: "pull", name: "TIRÓN", icon: "back", exercises: ["deadlift", "pullup", "row", "facepull", "curl"] },
  { id: "arms", name: "HOMBRO+BRAZO", icon: "shoulders", exercises: ["ohp", "lateral", "curl", "hammer", "pushdown"] },
  { id: "legs", name: "PIERNA", icon: "legs", exercises: ["squat", "rdl", "legpress", "lunge", "calf"] },
  { id: "upper", name: "TORSO", icon: "chest", exercises: ["bench", "row", "ohp", "pulldown", "curl", "pushdown"] },
];

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: "PECHO",
  back: "ESPALDA",
  shoulders: "HOMBROS",
  arms: "BRAZOS",
  legs: "PIERNAS",
  core: "ABDOMEN",
};

/** Volume (kg) thresholds for hypertrophy tiers 0..4 */
export const TIER_KG = [0, 4000, 15000, 45000, 120000];
export const tierOf = (kg: number) => {
  let t = 0;
  for (let i = 0; i < TIER_KG.length; i++) if (kg >= TIER_KG[i]) t = i;
  return t;
};

export const expForLevel = (lvl: number) => 60 * lvl * (lvl + 1); // cumulative EXP to reach lvl+1
export const levelOf = (exp: number) => {
  let l = 1;
  while (exp >= expForLevel(l)) l++;
  return l;
};

export const e1rm = (kg: number, reps: number) => (reps <= 0 ? 0 : kg * (1 + reps / 30));

export function isBodyweight(ex?: Exercise): boolean {
  if (!ex) return false;
  if (typeof ex.bw === "boolean") return ex.bw;
  const s = (ex.name + " " + (ex.sub ?? "")).toLowerCase();
  if (
    s.includes("en maquina") ||
    s.includes("en máquina") ||
    s.includes("en polea") ||
    s.includes("con banda") ||
    s.includes("con barra") ||
    s.includes("con mancuerna") ||
    s.includes("con kettlebell")
  ) {
    return s.includes("dominada");
  }
  return (
    s.includes("peso corporal") ||
    s.includes("flexion") ||
    s.includes("dominada") ||
    s.includes("fondo") ||
    s.includes("anillas") ||
    s.includes("australiana") ||
    s.includes("muscle up") ||
    s.includes("hiperextension") ||
    s.includes("plancha")
  );
}

/** Local YYYY-MM-DD key so user streaks, calendar and weekly comparison align with device day */
export function localDayKey(t: number = Date.now()): string {
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const weekOfUtc = (t: number = Date.now()) => {
  const d = new Date(t);
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday ...
  const diff = (day === 0 ? -6 : 1) - day; // difference to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dt = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-W${m}-${dt}`;
};

export const getNextMondayUtcTimestamp = (t: number = Date.now()) => {
  const now = new Date(t);
  const d = new Date(now);
  const day = d.getUTCDay();
  const diffToMonday = (8 - (day === 0 ? 7 : day)) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
};

/** Exact elapsed hours [0..168] since Monday 00:00 UTC of the current league/boss week */
export const getHoursIntoUtcWeek = (now: number = Date.now()): number => {
  const nextMon = getNextMondayUtcTimestamp(now);
  const weekStart = nextMon - 7 * 864e5;
  return Math.max(0, Math.min(168, (now - weekStart) / 36e5));
};

export const getTimeUntilWeeklyReset = (now: number = Date.now()): string => {
  const target = getNextMondayUtcTimestamp(now);
  const ms = Math.max(0, target - now);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
};

export type Slot = "shirt" | "belt" | "wrist" | "hair" | "aura" | "weapon" | "pet" | "bg";

export interface SkinPalette {
  id: string;
  name: string;
  skin: string;
  shade: string;
  hi: string;
  vein: string;
}

export const SKIN_PALETTES: SkinPalette[] = [
  { id: "classic", name: "Clásico", skin: "#e0a370", shade: "#b2703f", hi: "#f6c99c", vein: "#9a5a34" },
  { id: "fair", name: "Pálido", skin: "#f3c7a6", shade: "#c98f6d", hi: "#fce5d4", vein: "#a8624a" },
  { id: "bronze", name: "Bronceado", skin: "#c8834a", shade: "#945624", hi: "#e6a66d", vein: "#753d16" },
  { id: "olive", name: "Oliva", skin: "#bfa370", shade: "#8f7344", hi: "#dbc598", vein: "#6e552d" },
  { id: "dark", name: "Ébano", skin: "#764528", shade: "#4e2912", hi: "#9c603b", vein: "#381a09" },
  { id: "orc", name: "Orco Verde", skin: "#5d9948", shade: "#3d6d2e", hi: "#86c26f", vein: "#294d1c" },
  { id: "cyber", name: "Cyber Neón", skin: "#4da5b8", shade: "#2b6e7d", hi: "#86d6e6", vein: "#194c57" },
  { id: "undead", name: "Espectral", skin: "#948bb5", shade: "#645a85", hi: "#bcb4db", vein: "#473d66" },
];

export interface HairStyleOption {
  id: string;
  name: string;
}

export const HAIR_STYLES: HairStyleOption[] = [
  { id: "hair_short", name: "Rapado / Corto" },
  { id: "hair_mohawk", name: "Cresta Punk" },
  { id: "hair_spiky", name: "Pelo Súper / Spiky" },
  { id: "hair_long", name: "Melena Bárbara" },
];

export interface HairColorOption {
  id: string;
  name: string;
  color: string;
  hi?: string;
}

export const HAIR_COLORS: HairColorOption[] = [
  { id: "dark_brown", name: "Castaño Oscuro", color: "#2b1d14", hi: "#4a3528" },
  { id: "black", name: "Negro Azabache", color: "#14151a", hi: "#2c303d" },
  { id: "golden", name: "Rubio Dorado", color: "#fbf236", hi: "#ffffff" },
  { id: "chestnut", name: "Cobrizo", color: "#8a4b1f", hi: "#b86b35" },
  { id: "crimson", name: "Rojo Furia", color: "#ff3f6c", hi: "#ff8fa8" },
  { id: "silver", name: "Plata Titán", color: "#cbd5e1", hi: "#ffffff" },
  { id: "cyan", name: "Cyber Cian", color: "#3df2ff", hi: "#c5fcff" },
  { id: "neon_pink", name: "Rosa Neón", color: "#ff3fa4", hi: "#ffa3d5" },
];

export interface FacialHairOption {
  id: string;
  name: string;
}

export const FACIAL_HAIR_OPTIONS: FacialHairOption[] = [
  { id: "clean", name: "Afeitado Limpio" },
  { id: "stubble", name: "Barba 3 Días" },
  { id: "full", name: "Barba Espartana" },
  { id: "goatee", name: "Perilla de Guerrero" },
];

export interface HeroTraits {
  skinTone: string;
  hairStyle?: string;
  hairColor: string;
  facialHair: string;
}

export const DEFAULT_HERO_TRAITS: HeroTraits = {
  skinTone: "classic",
  hairStyle: "hair_short",
  hairColor: "dark_brown",
  facialHair: "clean",
};
export interface Item {
  id: string;
  slot: Slot;
  name: string;
  price: number;
  minLevel: number;
  color: string;
  color2?: string;
  bossBonus?: number; // % extra damage to Raid Boss
  desc?: string;
}

export const ITEMS: Item[] = [
  { id: "shirt_none", slot: "shirt", name: "Torso Desnudo", price: 0, minLevel: 1, color: "" },
  { id: "shirt_tank", slot: "shirt", name: "Tank Gris", price: 0, minLevel: 1, color: "#5b6273" },
  { id: "shirt_stringer", slot: "shirt", name: "Stringer Retro", price: 120, minLevel: 2, color: "#e83b3b", color2: "#fbf236" },
  { id: "shirt_comp", slot: "shirt", name: "Compresión Neón", price: 300, minLevel: 4, color: "#1b1f3a", color2: "#3df2ff" },
  { id: "shirt_gold", slot: "shirt", name: "Tank Dorado", price: 900, minLevel: 8, color: "#d4a017", color2: "#fff3a0" },
  { id: "belt_none", slot: "belt", name: "Sin Cinturón", price: 0, minLevel: 1, color: "" },
  { id: "belt_leather", slot: "belt", name: "Cinturón Cuero", price: 80, minLevel: 1, color: "#7a4a24", color2: "#c0c0c0" },
  { id: "belt_red", slot: "belt", name: "Lever Rojo", price: 250, minLevel: 3, color: "#a01c2c", color2: "#e0e0e0" },
  { id: "belt_gold", slot: "belt", name: "Cinturón Campeón", price: 1200, minLevel: 10, color: "#f5c542", color2: "#ff4d6d" },
  { id: "wrist_none", slot: "wrist", name: "Sin Muñequeras", price: 0, minLevel: 1, color: "" },
  { id: "wrist_white", slot: "wrist", name: "Muñequeras Blancas", price: 40, minLevel: 1, color: "#eeeeee" },
  { id: "wrist_cyan", slot: "wrist", name: "Muñequeras Cyber", price: 180, minLevel: 3, color: "#3df2ff" },
  { id: "hair_short", slot: "hair", name: "Rapado", price: 0, minLevel: 1, color: "#2b1d14" },
  { id: "hair_mohawk", slot: "hair", name: "Cresta Punk", price: 150, minLevel: 2, color: "#ff3fa4" },
  { id: "hair_spiky", slot: "hair", name: "Pelo Súper", price: 600, minLevel: 6, color: "#fbf236" },
  { id: "hair_long", slot: "hair", name: "Melena Bárbara", price: 350, minLevel: 4, color: "#8a4b1f" },
  { id: "aura_none", slot: "aura", name: "Sin Aura", price: 0, minLevel: 1, color: "" },
  { id: "aura_fire", slot: "aura", name: "Aura de Fuego", price: 800, minLevel: 7, color: "#ff7a1a", color2: "#ffd23f" },
  { id: "aura_bolt", slot: "aura", name: "Aura Relámpago", price: 1500, minLevel: 12, color: "#7df9ff", color2: "#ffffff" },
  // Weapons
  { id: "weapon_none", slot: "weapon", name: "Puños Desnudos", price: 0, minLevel: 1, color: "", bossBonus: 0 },
  { id: "weapon_dumbbell", slot: "weapon", name: "Mancuerna Hierro", price: 160, minLevel: 2, color: "#94a3b8", color2: "#e2e8f0", bossBonus: 8, desc: "+8% daño vs Raid Boss" },
  { id: "weapon_greatsword", slot: "weapon", name: "Espadón de Barra", price: 450, minLevel: 5, color: "#cbd5e1", color2: "#3df2ff", bossBonus: 15, desc: "+15% daño vs Raid Boss" },
  { id: "weapon_axe", slot: "weapon", name: "Hacha Carmesí", price: 950, minLevel: 9, color: "#ff3f6c", color2: "#ffe14d", bossBonus: 22, desc: "+22% daño vs Raid Boss" },
  { id: "weapon_hammer", slot: "weapon", name: "Martillo Titán", price: 1600, minLevel: 13, color: "#ffe14d", color2: "#3df2ff", bossBonus: 30, desc: "+30% daño vs Raid Boss" },
  // Pets
  { id: "pet_none", slot: "pet", name: "Sin Compañero", price: 0, minLevel: 1, color: "", bossBonus: 0 },
  { id: "pet_owl", slot: "pet", name: "Búho Nocturno", price: 220, minLevel: 2, color: "#a78bfa", color2: "#ffe14d", bossBonus: 10, desc: "Dispara orbes arcanos · +10% Boss" },
  { id: "pet_wolf", slot: "pet", name: "Lobo de Hierro", price: 550, minLevel: 4, color: "#94a3b8", color2: "#3df2ff", bossBonus: 16, desc: "Embestida férrea · +16% Boss" },
  { id: "pet_dragon", slot: "pet", name: "Dragón Bebé", price: 1100, minLevel: 7, color: "#ff3f6c", color2: "#ff7a1a", bossBonus: 24, desc: "Aliento ígneo · +24% Boss" },
  { id: "pet_golem", slot: "pet", name: "Espíritu de Disco", price: 1800, minLevel: 11, color: "#ffe14d", color2: "#7dff6a", bossBonus: 32, desc: "Onda olímpica · +32% Boss" },
  // Backgrounds
  { id: "bg_garage", slot: "bg", name: "Garaje Oxidado", price: 0, minLevel: 1, color: "#2a1f1a", color2: "#5a3a2a" },
  { id: "bg_gym", slot: "bg", name: "Gym de Barrio", price: 200, minLevel: 3, color: "#1d2b3a", color2: "#3a5a7a" },
  { id: "bg_beach", slot: "bg", name: "Muscle Beach", price: 500, minLevel: 5, color: "#ff9a5a", color2: "#3a8ad6" },
  { id: "bg_cyber", slot: "bg", name: "Templo Cyber-Pixel", price: 1400, minLevel: 10, color: "#120428", color2: "#ff2bd6" },
];
export const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<string, Item>;

export type Equipped = Record<Slot, string>;
export const DEFAULT_EQUIP: Equipped = {
  shirt: "shirt_tank",
  belt: "belt_none",
  wrist: "wrist_none",
  hair: "hair_short",
  aura: "aura_none",
  weapon: "weapon_none",
  pet: "pet_none",
  bg: "bg_garage",
};

export function getCombatBonus(eq?: Partial<Equipped>): { bossDmgPct: number; weapon?: Item; pet?: Item } {
  const weapon = eq?.weapon ? ITEM[eq.weapon] : undefined;
  const pet = eq?.pet ? ITEM[eq.pet] : undefined;
  return {
    bossDmgPct: (weapon?.bossBonus ?? 0) + (pet?.bossBonus ?? 0),
    weapon: weapon && weapon.id !== "weapon_none" ? weapon : undefined,
    pet: pet && pet.id !== "pet_none" ? pet : undefined,
  };
}

export const LEAGUES = [
  { name: "BRONCE", min: 0, color: "#c47a3a" },
  { name: "PLATA", min: 1500, color: "#c8d0dc" },
  { name: "ORO", min: 4000, color: "#f5c542" },
  { name: "DIAMANTE", min: 9000, color: "#5ce1ff" },
  { name: "MAESTRO", min: 18000, color: "#c06cff" },
  { name: "TITAN PIXEL", min: 32000, color: "#ff3f6c" },
];
export const leagueOf = (weeklyExp: number) => [...LEAGUES].reverse().find((l) => weeklyExp >= l.min)!;

const RIVAL_NAMES = [
  "BRUTUS", "PIXELYN", "IRONMAX", "LA_ROCA", "SQUATZILLA", "DELTOIDE", "KAIBA", "CHUNLIFT", "MEGABICEP", "VALKYRA",
  "TOR_8BIT", "BENCHZERO", "GOKULIFT", "ARNOLDINO", "SAMUS_FIT", "LINKGAINS", "ZELDAMUSCLE", "MAXPOWER", "TRAPKING", "NEONQUEEN",
];

function rivalRng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export interface SimulatedRival {
  id: string;
  name: string;
  weekly: number;
  tonnage: number;
  streak: number;
  rel: number;
  tiers: Record<Muscle, number>;
  equipped: Equipped;
  level: number;
  title: string;
}

export function getSimulatedRivals(now: number = Date.now()): SimulatedRival[] {
  const hours = getHoursIntoUtcWeek(now);
  const tick = Math.floor(now / 60000);
  const weekSeed = weekOfUtc(now).split("").reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const muscles: Muscle[] = ["chest", "back", "shoulders", "arms", "legs", "core"];

  return RIVAL_NAMES.map((name, i) => {
    const r = rivalRng(i * 7919 + 13 + weekSeed);
    const power = Math.pow(r(), 1.6);
    const lvl = 1 + Math.floor(power * 22);
    const tiers = Object.fromEntries(
      muscles.map((m) => [m, Math.min(4, Math.max(0, Math.round(power * 4 + (r() - 0.5) * 1.6)))])
    ) as Record<Muscle, number>;
    const pick = (slot: Slot) => {
      const opts = ITEMS.filter((it) => it.slot === slot && it.minLevel <= lvl);
      return opts[Math.floor(r() * opts.length)]?.id ?? DEFAULT_EQUIP[slot];
    };
    const equipped: Equipped = {
      shirt: pick("shirt"),
      belt: pick("belt"),
      wrist: pick("wrist"),
      hair: pick("hair"),
      aura: pick("aura"),
      weapon: pick("weapon"),
      pet: pick("pet"),
      bg: pick("bg"),
    };
    const jitter = rivalRng(i * 31 + tick)();
    return {
      id: "r" + i,
      name,
      title: titleOf(lvl),
      weekly: Math.round((power * 16000 + 180) * (hours / 168 + 0.08) + jitter * 35),
      tonnage: Math.round(power * 900000 + r() * 30000),
      streak: Math.round(power * 60 * r() + 1),
      rel: +(0.6 + power * 1.9).toFixed(2),
      tiers,
      equipped,
      level: lvl,
    };
  });
}

export function getWeeklyRankForExp(weeklyExp: number, weekKey?: string): number {
  let refNow = Date.now();
  if (weekKey) {
    const m = weekKey.match(/^(\d{4})-W(\d{2})-(\d{2})$/);
    if (m) {
      const mondayMs = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0);
      refNow = mondayMs + 7 * 864e5 - 60000; // Sunday 23:59:00 UTC of that week
    }
  }
  const rivals = getSimulatedRivals(refNow);
  const ahead = rivals.filter((r) => r.weekly > weeklyExp).length;
  return ahead + 1;
}

export const titleOf = (lvl: number) =>
  lvl >= 20 ? "Semidiós del Hierro" : lvl >= 12 ? "Titán" : lvl >= 8 ? "Gladiador" : lvl >= 4 ? "Guerrero" : "Novato";

export type TrophyGrade = "gold" | "silver" | "bronze" | "diamond" | "medal";

export interface Trophy {
  id: string;
  weekKey: string;
  awardedAt: number;
  rank: number;
  leagueName: string;
  leagueColor: string;
  weeklyExp: number;
  title: string;
  icon: string;
  grade: TrophyGrade;
  goldReward: number;
}

export function createTrophyForRank(
  rank: number,
  leagueName: string,
  leagueColor: string,
  weeklyExp: number,
  weekKey: string
): Trophy {
  let grade: TrophyGrade = "medal";
  let title = `Medalla de Honor ${leagueName}`;
  let icon = "🎖️";
  let goldReward = 50;

  if (rank === 1) {
    grade = "gold";
    title = `Campeón Semanal ${leagueName}`;
    icon = "🏆";
    goldReward = 500;
  } else if (rank === 2) {
    grade = "silver";
    title = `Subcampeón ${leagueName}`;
    icon = "🥈";
    goldReward = 300;
  } else if (rank === 3) {
    grade = "bronze";
    title = `3er Puesto ${leagueName}`;
    icon = "🥉";
    goldReward = 200;
  } else if (rank <= 10) {
    grade = "diamond";
    title = `Top 10 Élite ${leagueName}`;
    icon = "💎";
    goldReward = 100;
  }

  return {
    id: "tr_" + Math.random().toString(36).slice(2, 9),
    weekKey,
    awardedAt: Date.now(),
    rank,
    leagueName,
    leagueColor,
    weeklyExp,
    title,
    icon,
    grade,
    goldReward,
  };
}

/* ---------------- Guild Quests & Bounties ---------------- */
export interface Quest {
  id: string;
  title: string;
  desc: string;
  target: number;
  current: number;
  type: "tonnage" | "chest_vol" | "back_vol" | "legs_vol" | "workouts" | "prs";
  rewardExp: number;
  rewardGold: number;
  claimed: boolean;
  icon: string;
}

export function generateDefaultQuests(): Quest[] {
  return [
    {
      id: "q_chest_titan",
      title: "ROMPE-PECTORALES",
      desc: "Levanta 4,000 kg en ejercicios de Pecho.",
      target: 4000,
      current: 0,
      type: "chest_vol",
      rewardExp: 350,
      rewardGold: 120,
      claimed: false,
      icon: "⚔",
    },
    {
      id: "q_pr_hunter",
      title: "CAZA-RÉCORDS",
      desc: "Bate al menos 1 Récord Personal (PR).",
      target: 1,
      current: 0,
      type: "prs",
      rewardExp: 250,
      rewardGold: 80,
      claimed: false,
      icon: "⚡",
    },
    {
      id: "q_consistency",
      title: "TITÁN CONSTANTE",
      desc: "Completa 3 entrenamientos esta semana.",
      target: 3,
      current: 0,
      type: "workouts",
      rewardExp: 400,
      rewardGold: 150,
      claimed: false,
      icon: "🏆",
    },
    {
      id: "q_heavy_legs",
      title: "SENTADILLA DE HIERRO",
      desc: "Acumula 6,000 kg en ejercicios de Pierna.",
      target: 6000,
      current: 0,
      type: "legs_vol",
      rewardExp: 500,
      rewardGold: 200,
      claimed: false,
      icon: "▲",
    },
  ];
}

/* ---------------- Community Weekly Raid Boss ---------------- */
export interface RaidBoss {
  id: string;
  name: string;
  title: string;
  totalHp: number;
  color: string;
  theme: "iron" | "toxic" | "fire" | "spectral";
  icon: string;
  attackName: string;
  lore: string;
  rewardGold: number;
  rewardExp: number;
}

export const RAID_BOSSES: RaidBoss[] = [
  {
    id: "iron_colossus",
    name: "EL COLOSO DE HIERRO",
    title: "TITÁN ANCESTRAL DE OBSIDIANA",
    totalHp: 1000000,
    color: "#ff3f6c",
    theme: "iron",
    icon: "👹",
    attackName: "¡APLASTAMIENTO DE DISCOS!",
    lore: "Un titán forjado con toneladas de hierro olímpico. Cada kilo que levanta la comunidad le inflige daño directo hasta resquebrajar su coraza.",
    rewardGold: 500,
    rewardExp: 1000,
  },
  {
    id: "hypertrophic_chimera",
    name: "QUIMERA HIPERTRÓFICA",
    title: "BESTIA PRIMIGENIA DEL ÁCIDO LÁCTICO",
    totalHp: 1200000,
    color: "#7dff6a",
    theme: "toxic",
    icon: "🐲",
    attackName: "¡ALIENTO DE ÁCIDO LÁCTICO!",
    lore: "Una criatura descomunal mutada por entrenamientos al fallo extremo. Sus fibras arden con toxinas fosforescentes y ruge con cada sentadilla pesada.",
    rewardGold: 600,
    rewardExp: 1200,
  },
  {
    id: "ignis_pyrolord",
    name: "IGNIS, SEÑOR DEL CALOR",
    title: "DEMONIO DE MAGMA Y CONGESTIÓN",
    totalHp: 900000,
    color: "#ff7a1a",
    theme: "fire",
    icon: "🔥",
    attackName: "¡ERUPCIÓN DE MAGNESIO VOLCÁNICO!",
    lore: "Un señor demoníaco hecho de magma ardiente y polvo de tiza. Su fuego consume las excusas e incinera la debilidad en cada repetición al límite.",
    rewardGold: 450,
    rewardExp: 900,
  },
  {
    id: "necrolift_specter",
    name: "REY NECROLIFT",
    title: "SOBERANO DE LOS RÉCORDS OLVIDADOS",
    totalHp: 1100000,
    color: "#3df2ff",
    theme: "spectral",
    icon: "💀",
    attackName: "¡CADENAS DE FATIGA ETERNA!",
    lore: "El espectro ancestral de los colosos que nunca conocieron el descanso. Absorbe la fuerza de quienes dudan antes de levantar la barra.",
    rewardGold: 550,
    rewardExp: 1100,
  },
];

export const RAID_BOSS: RaidBoss = RAID_BOSSES[0];

export function getWeeklyBoss(weekKey: string = weekOfUtc()): RaidBoss {
  let hash = 0;
  for (let i = 0; i < weekKey.length; i++) {
    hash = (hash * 37 + weekKey.charCodeAt(i)) >>> 0;
  }
  return RAID_BOSSES[hash % RAID_BOSSES.length];
}

/* ---------------- Barbell Plate Calculator ---------------- */
export interface Plate {
  kg: number;
  color: string;
  textColor: string;
  h: number;
}

export const PLATES: Plate[] = [
  { kg: 25, color: "#e83b3b", textColor: "#fff", h: 42 },
  { kg: 20, color: "#3b82f6", textColor: "#fff", h: 40 },
  { kg: 15, color: "#facc15", textColor: "#000", h: 36 },
  { kg: 10, color: "#22c55e", textColor: "#fff", h: 32 },
  { kg: 5, color: "#ffffff", textColor: "#000", h: 26 },
  { kg: 2.5, color: "#1f2937", textColor: "#fff", h: 22 },
  { kg: 1.25, color: "#9ca3af", textColor: "#000", h: 18 },
];

export function calculatePlates(targetTotalKg: number, barKg: number = 20): { platesPerSide: Plate[]; remainder: number } {
  if (targetTotalKg <= barKg) return { platesPerSide: [], remainder: 0 };
  let sideWeight = (targetTotalKg - barKg) / 2;
  const platesPerSide: Plate[] = [];

  for (const plate of PLATES) {
    while (sideWeight >= plate.kg - 0.001) {
      platesPerSide.push(plate);
      sideWeight -= plate.kg;
    }
  }

  return { platesPerSide, remainder: Math.round(sideWeight * 2 * 10) / 10 };
}

/* ---------------- Exercise Rest Presets ---------------- */
export function defaultRestForExercise(ex?: Exercise): number {
  if (!ex) return 90;
  if (["bench", "squat", "deadlift", "ohp", "row", "legpress", "rdl"].includes(ex.id)) {
    return 180;
  }
  if (["incline", "dips", "pullup", "pulldown"].includes(ex.id)) {
    return 120;
  }
  return 90;
}
