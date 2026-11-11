"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_EQUIP, DEFAULT_HERO_TRAITS, EX, Equipped, HeroTraits, ITEM, Muscle, Quest, Routine, Slot, TEMPLATES, Trophy, createTrophyForRank, defaultRestForExercise, e1rm, generateDefaultQuests, getCombatBonus, getWeeklyRankForExp, isBodyweight, leagueOf, levelOf, localDayKey, weekOfUtc,
} from "./data";
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from "./achievements";
import { DEFAULT_PUSH_PREFS, PushPrefs } from "./push-types";

export interface WeightEntry {
  id: string;
  date: number; // ms timestamp
  kg: number;
  note?: string;
}

export interface SetAwarded {
  exp: number;
  gold: number;
  vol: number;
  bossDmg: number;
  muscle: Muscle;
  pr: boolean;
  weekKey: string;
  questAdds?: { id: string; delta: number }[];
}
export interface SetEntry { id: string; kg: number; reps: number; done: boolean; pr?: boolean; rir?: number; awarded?: SetAwarded }
export interface ExEntry { id?: string; exId: string; sets: SetEntry[] }
export interface ActiveWorkout { routineId: string; name: string; startedAt: number; exercises: ExEntry[] }
export interface WorkoutLog {
  id: string; name: string; startedAt: number; endedAt: number;
  exercises: ExEntry[]; tonnage: number; exp: number; prs: number;
  bossDamage?: number; totalGold?: number; weekKey?: string;
}
export interface WorkoutSummary {
  id: string;
  name: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  tonnage: number;
  setsDone: number;
  prs: number;
  exp: number;
  gold: number;
  bossDamage: number;
  bonusPct: number;
  streak: number;
  newlyUnlockedIds: string[];
  topExercises: { name: string; bestSet: string }[];
}

export interface SetResult { exp: number; gold: number; pr: boolean; levelUp: number | null; strGain: number }

const uid = () => Math.random().toString(36).slice(2, 10);
const zeroVol = (): Record<Muscle, number> => ({ chest: 0, back: 0, shoulders: 0, arms: 0, legs: 0, core: 0 });

function recomputeBestAndLast(
  exIds: Iterable<string>,
  history: WorkoutLog[],
  active: ActiveWorkout | null,
  bodyweight: number,
  currentBest: Record<string, { e1rm: number; vol: number }>,
  currentLastSet: Record<string, { kg: number; reps: number }>,
  skipSetCoords?: { exIdx: number; setIdx: number }
) {
  const newBest = { ...currentBest };
  const newLastSet = { ...currentLastSet };
  const bw = bodyweight || 75;

  for (const exId of exIds) {
    let maxE1rm = 0;
    let maxVol = 0;
    let latestDone: { kg: number; reps: number } | null = null;

    if (active) {
      for (let k = active.exercises.length - 1; k >= 0; k--) {
        const actE = active.exercises[k];
        if (actE.exId !== exId) continue;
        const eBw = isBodyweight(EX[actE.exId]);
        for (let j = actE.sets.length - 1; j >= 0; j--) {
          if (skipSetCoords && skipSetCoords.exIdx === k && skipSetCoords.setIdx === j) continue;
          const x = actE.sets[j];
          if (!x.done || x.reps <= 0) continue;
          if (!latestDone) latestDone = { kg: x.kg, reps: x.reps };
          const l = eBw ? bw + x.kg : x.kg;
          const eVal = e1rm(l, x.reps);
          const vVal = l * x.reps;
          if (eVal > maxE1rm) maxE1rm = eVal;
          if (vVal > maxVol) maxVol = vVal;
        }
      }
    }

    for (const h of history) {
      for (const e of h.exercises) {
        if (e.exId !== exId) continue;
        const eBw = isBodyweight(EX[e.exId]);
        for (let j = e.sets.length - 1; j >= 0; j--) {
          const x = e.sets[j];
          if (x.reps <= 0) continue;
          if (!latestDone) latestDone = { kg: x.kg, reps: x.reps };
          const l = eBw ? bw + x.kg : x.kg;
          const eVal = e1rm(l, x.reps);
          const vVal = l * x.reps;
          if (eVal > maxE1rm) maxE1rm = eVal;
          if (vVal > maxVol) maxVol = vVal;
        }
      }
    }

    if (maxE1rm > 0) {
      newBest[exId] = { e1rm: maxE1rm, vol: maxVol };
    } else {
      delete newBest[exId];
    }

    if (latestDone) {
      newLastSet[exId] = latestDone;
    } else {
      delete newLastSet[exId];
    }
  }

  return { best: newBest, lastSet: newLastSet };
}

function rollbackDoneSets(s: State, targetExercises: ExEntry[], nextActive: ActiveWorkout | null) {
  let expSub = 0;
  let weeklyExpSub = 0;
  let goldSub = 0;
  let volSub = 0;
  let prsSub = 0;
  let bossSub = 0;
  const mv = { ...zeroVol(), ...(s.muscleVol || {}) };
  const questSubs: Record<string, number> = {};
  const touchedExIds = new Set<string>();
  const bw = s.bodyweight || 75;

  for (const e of targetExercises) {
    touchedExIds.add(e.exId);
    const ex = EX[e.exId];
    const isBw = isBodyweight(ex);
    for (const st of e.sets) {
      if (!st.done) continue;
      const a = st.awarded;
      const lifted = isBw ? bw + st.kg : st.kg;
      const fallbackVol = lifted * st.reps;
      const sVol = a?.vol ?? fallbackVol;
      const wasPr = a?.pr ?? Boolean(st.pr);
      const sExp = a?.exp ?? (Math.round(10 + fallbackVol / 25) + (wasPr ? 100 : 0));
      const sGold = a?.gold ?? (3 + Math.floor(st.reps / 4) + (wasPr ? 25 : 0));
      const sBoss = a?.bossDmg ?? 0;
      const mKey = a?.muscle ?? ex?.muscle;
      const sameWeek = !a || a.weekKey === s.weekKey;

      expSub += sExp;
      if (sameWeek) weeklyExpSub += sExp;
      goldSub += sGold;
      volSub += sVol;
      if (wasPr) prsSub += 1;
      if (sameWeek) bossSub += sBoss;
      if (mKey) mv[mKey] = Math.max(0, (mv[mKey] ?? 0) - sVol);
      if (sameWeek && a?.questAdds) {
        for (const qa of a.questAdds) {
          questSubs[qa.id] = (questSubs[qa.id] ?? 0) + qa.delta;
        }
      }
    }
  }

  const nextQuests = (s.quests || generateDefaultQuests()).map((q) => {
    const sub = questSubs[q.id];
    if (!sub || q.claimed) return q;
    return { ...q, current: Math.max(0, q.current - sub) };
  });

  const { best, lastSet } = recomputeBestAndLast(touchedExIds, s.history, nextActive, bw, s.best, s.lastSet);

  let nextPending = s.pendingBossDmg || 0;
  let nextDealt = s.bossDmgDealt || 0;
  if (bossSub > 0) {
    if (nextPending >= bossSub) {
      nextPending -= bossSub;
    } else {
      const rem = bossSub - nextPending;
      nextPending = 0;
      nextDealt = Math.max(0, nextDealt - rem);
    }
  }

  return {
    exp: Math.max(0, s.exp - expSub),
    weeklyExp: Math.max(0, s.weeklyExp - weeklyExpSub),
    gold: Math.max(0, s.gold - goldSub),
    tonnage: Math.max(0, s.tonnage - volSub),
    totalPrs: Math.max(0, (s.totalPrs || 0) - prsSub),
    pendingBossDmg: nextPending,
    bossDmgDealt: nextDealt,
    muscleVol: mv,
    quests: nextQuests,
    best,
    lastSet,
  };
}

interface State {
  name: string;
  bodyweight: number;
  exp: number;
  gold: number;
  tonnage: number;
  weeklyExp: number;
  weekKey: string;
  streak: number;
  lastDay: string | null;
  muscleVol: Record<Muscle, number>;
  pumpUntil: Record<Muscle, number>;
  quests: Quest[];
  bossDmgDealt: number;
  pendingBossDmg: number;
  bossDefeated: boolean;
  berserkUntil: number;
  restTimeByEx: Record<string, number>;
  best: Record<string, { e1rm: number; vol: number }>;
  lastSet: Record<string, { kg: number; reps: number }>;
  history: WorkoutLog[];
  active: ActiveWorkout | null;
  restEndsAt: number | null;
  restExName: string | null;
  owned: string[];
  equipped: Equipped;
  heroTraits: HeroTraits;
  weightHistory: WeightEntry[];
  customRoutines: Routine[];
  deletedRoutineIds: string[];
  trophies: Trophy[];
  sound: boolean;
  focusMode: boolean;
  pushPrefs: PushPrefs;
  maxStreak: number;
  totalPrs: number;
  bossKills: number;
  claimedAchievements: string[];
  activeTitle: string | null;
  lastWorkoutSummary: WorkoutSummary | null;

  setName: (n: string) => void;
  setBodyweight: (bw: number, customDate?: number) => void;
  deleteWeightEntry: (id: string) => void;
  setHeroTraits: (patch: Partial<HeroTraits>) => void;
  toggleSound: () => void;
  setFocusMode: (v: boolean) => void;
  setPushPrefs: (patch: Partial<PushPrefs>) => void;
  clearWorkoutSummary: () => void;
  claimAchievement: (id: string) => number;
  setActiveTitle: (title: string | null) => void;
  unleashBossAttack: () => number;
  claimBossVictory: (gold: number, exp: number) => boolean;
  setRestTimeForEx: (exId: string, sec: number) => void;
  reorderActiveExercises: (fromIndex: number, toIndex: number) => void;
  claimQuest: (id: string) => boolean;
  importBackupData: (data: unknown) => boolean;
  startWorkout: (r: Routine) => void;
  cancelWorkout: () => void;
  addExercise: (exId: string) => void;
  removeExercise: (i: number) => void;
  addSet: (i: number) => void;
  removeSet: (i: number, s: number) => void;
  updateSet: (i: number, s: number, patch: Partial<SetEntry>) => void;
  completeSet: (i: number, s: number) => SetResult | null;
  finishWorkout: () => WorkoutLog | null;
  deleteLog: (id: string) => void;
  startRest: (sec: number, exName?: string) => void;
  stopRest: () => void;
  buy: (id: string) => boolean;
  equip: (id: string) => void;
  saveRoutine: (r: Routine) => void;
  deleteRoutine: (id: string) => void;
  restoreDefaultRoutines: () => void;
  settleWeeklyTrophy: (forcedRank?: number) => Trophy | null;
  checkWeeklyReset: () => Trophy | null;
}

export const useGame = create<State>()(
  persist(
    (set, get) => ({
      name: "HÉROE",
      bodyweight: 75,
      exp: 0, gold: 100, tonnage: 0, weeklyExp: 0, weekKey: weekOfUtc(Date.now()),
      streak: 0, lastDay: null,
      muscleVol: zeroVol(),
      pumpUntil: zeroVol(),
      quests: generateDefaultQuests(),
      bossDmgDealt: 0,
      pendingBossDmg: 0,
      bossDefeated: false,
      berserkUntil: 0,
      restTimeByEx: {},
      best: {}, lastSet: {}, history: [], active: null, restEndsAt: null, restExName: null,
      owned: Object.values(DEFAULT_EQUIP).concat(["shirt_none", "belt_none", "wrist_none", "aura_none"]),
      equipped: { ...DEFAULT_EQUIP },
      heroTraits: { ...DEFAULT_HERO_TRAITS },
      weightHistory: [
        { id: "init_bw", date: Date.now() - 14 * 864e5, kg: 74 },
        { id: "prev_bw", date: Date.now() - 7 * 864e5, kg: 74.5 },
        { id: "curr_bw", date: Date.now(), kg: 75 },
      ],
      customRoutines: [],
      deletedRoutineIds: [],
      trophies: [],
      sound: true,
      focusMode: true,
      pushPrefs: { ...DEFAULT_PUSH_PREFS },
      maxStreak: 0,
      totalPrs: 0,
      bossKills: 0,
      claimedAchievements: [],
      activeTitle: null,
      lastWorkoutSummary: null,

      setName: (name) => set({ name: name.slice(0, 12).toUpperCase() || "HÉROE" }),
      setBodyweight: (bw, customDate) => {
        const clamped = Math.max(30, Math.min(250, Math.round(bw * 10) / 10));
        const timestamp = customDate || Date.now();
        set((s) => {
          const prevHist = Array.isArray(s.weightHistory) ? s.weightHistory : [];
          // Deduplicate if updated within the same hour on the same day, otherwise append
          const hourKey = new Date(timestamp).toISOString().slice(0, 13);
          const filtered = prevHist.filter((e) => new Date(e.date).toISOString().slice(0, 13) !== hourKey);
          const newEntry: WeightEntry = { id: uid(), date: timestamp, kg: clamped };
          const updated = [...filtered, newEntry].sort((a, b) => a.date - b.date).slice(-200);
          return {
            bodyweight: clamped,
            weightHistory: updated,
          };
        });
      },
      deleteWeightEntry: (id) =>
        set((s) => {
          const prevHist = Array.isArray(s.weightHistory) ? s.weightHistory : [];
          const updated = prevHist.filter((e) => e.id !== id);
          const latest = updated[updated.length - 1];
          return {
            weightHistory: updated,
            bodyweight: latest ? latest.kg : s.bodyweight,
          };
        }),
      setHeroTraits: (patch) =>
        set((s) => ({
          heroTraits: { ...(s.heroTraits || DEFAULT_HERO_TRAITS), ...patch },
        })),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      setFocusMode: (v) => set({ focusMode: v }),
      setPushPrefs: (patch) => set((s) => ({ pushPrefs: { ...(s.pushPrefs || DEFAULT_PUSH_PREFS), ...patch } })),
      clearWorkoutSummary: () => set({ lastWorkoutSummary: null }),
      claimAchievement: (id) => {
        const s = get();
        const def = ACHIEVEMENT_MAP[id];
        if (!def || (s.claimedAchievements || []).includes(id)) return 0;
        const ev = def.eval({
          tonnage: s.tonnage,
          streak: s.streak,
          maxStreak: s.maxStreak || s.streak,
          history: s.history || [],
          owned: s.owned || [],
          bossKills: s.bossKills || 0,
          totalPrs: s.totalPrs || 0,
        });
        if (!ev.unlocked) return 0;
        set({
          claimedAchievements: [...(s.claimedAchievements || []), id],
          gold: s.gold + def.rewardGold,
        });
        return def.rewardGold;
      },
      setActiveTitle: (title) => set({ activeTitle: title }),
      unleashBossAttack: () => {
        const s = get();
        const dmg = s.pendingBossDmg || 0;
        if (dmg <= 0) return 0;
        set({
          bossDmgDealt: (s.bossDmgDealt || 0) + dmg,
          pendingBossDmg: 0,
        });
        return dmg;
      },
      claimBossVictory: (gold, exp) => {
        const s = get();
        if (s.bossDefeated) return false;
        set({
          bossDefeated: true,
          bossKills: (s.bossKills || 0) + 1,
          gold: s.gold + gold,
          exp: s.exp + exp,
          weeklyExp: s.weeklyExp + exp,
        });
        return true;
      },
      setRestTimeForEx: (exId, sec) => set((s) => ({ restTimeByEx: { ...s.restTimeByEx, [exId]: sec } })),
      reorderActiveExercises: (from, to) => set((s) => {
        if (!s.active) return {};
        const arr = [...s.active.exercises];
        if (from < 0 || from >= arr.length || to < 0 || to >= arr.length) return {};
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        return { active: { ...s.active, exercises: arr } };
      }),
      claimQuest: (id) => {
        const s = get();
        const q = s.quests.find((x) => x.id === id);
        if (!q || q.claimed || q.current < q.target) return false;
        set({
          quests: s.quests.map((x) => x.id === id ? { ...x, claimed: true } : x),
          exp: s.exp + q.rewardExp,
          weeklyExp: s.weeklyExp + q.rewardExp,
          gold: s.gold + q.rewardGold,
        });
        return true;
      },
      importBackupData: (data: unknown) => {
        try {
          if (!data || typeof data !== "object") return false;
          const d = data as Partial<State>;
          const cur = get();
          const hist = Array.isArray(d.history) ? d.history : cur.history;
          const inferredLastDay =
            typeof d.lastDay === "string" || d.lastDay === null
              ? d.lastDay
              : hist.length > 0
              ? localDayKey(hist[0].endedAt || hist[0].startedAt)
              : cur.lastDay;

          set({
            name: typeof d.name === "string" ? d.name : cur.name,
            bodyweight: typeof d.bodyweight === "number" ? d.bodyweight : cur.bodyweight,
            exp: typeof d.exp === "number" ? d.exp : cur.exp,
            gold: typeof d.gold === "number" ? d.gold : cur.gold,
            tonnage: typeof d.tonnage === "number" ? d.tonnage : cur.tonnage,
            weeklyExp: typeof d.weeklyExp === "number" ? d.weeklyExp : cur.weeklyExp,
            weekKey: typeof d.weekKey === "string" ? d.weekKey : cur.weekKey,
            streak: typeof d.streak === "number" ? d.streak : cur.streak,
            lastDay: inferredLastDay,
            muscleVol: d.muscleVol ? { ...zeroVol(), ...d.muscleVol } : cur.muscleVol,
            best: d.best ?? cur.best,
            lastSet: d.lastSet ?? cur.lastSet,
            restTimeByEx: d.restTimeByEx ?? cur.restTimeByEx,
            quests: Array.isArray(d.quests) ? d.quests : cur.quests,
            bossDmgDealt: typeof d.bossDmgDealt === "number" ? d.bossDmgDealt : cur.bossDmgDealt,
            pendingBossDmg: typeof d.pendingBossDmg === "number" ? d.pendingBossDmg : cur.pendingBossDmg,
            bossDefeated: typeof d.bossDefeated === "boolean" ? d.bossDefeated : cur.bossDefeated,
            berserkUntil: typeof d.berserkUntil === "number" ? d.berserkUntil : cur.berserkUntil,
            history: hist,
            trophies: Array.isArray(d.trophies) ? d.trophies : cur.trophies,
            customRoutines: Array.isArray(d.customRoutines) ? d.customRoutines : cur.customRoutines,
            deletedRoutineIds: Array.isArray(d.deletedRoutineIds) ? d.deletedRoutineIds : cur.deletedRoutineIds,
            owned: Array.isArray(d.owned) ? Array.from(new Set([...d.owned, ...Object.values(DEFAULT_EQUIP)])) : cur.owned,
            equipped: d.equipped ? { ...DEFAULT_EQUIP, ...d.equipped } : cur.equipped,
            claimedAchievements: Array.isArray(d.claimedAchievements) ? d.claimedAchievements : cur.claimedAchievements,
            activeTitle: typeof d.activeTitle === "string" || d.activeTitle === null ? d.activeTitle : cur.activeTitle,
            maxStreak: typeof d.maxStreak === "number" ? d.maxStreak : cur.maxStreak,
            totalPrs: typeof d.totalPrs === "number" ? d.totalPrs : cur.totalPrs,
            bossKills: typeof d.bossKills === "number" ? d.bossKills : cur.bossKills,
            sound: typeof d.sound === "boolean" ? d.sound : cur.sound,
            focusMode: typeof d.focusMode === "boolean" ? d.focusMode : cur.focusMode,
            pushPrefs: d.pushPrefs ? { ...DEFAULT_PUSH_PREFS, ...d.pushPrefs } : cur.pushPrefs,
            active: null,
            restEndsAt: null,
            restExName: null,
            lastWorkoutSummary: null,
          });
          return true;
        } catch {
          return false;
        }
      },

      startWorkout: (r) => {
        const st = get();
        const exList = Array.isArray(r.exercises) ? r.exercises : [];
        set({
          focusMode: true,
          active: {
            routineId: r.id,
            name: r.name,
            startedAt: Date.now(),
            exercises: exList.map((exId) => ({ id: uid(), exId, sets: [mkSet(st, exId)] })),
          },
        });
      },
      cancelWorkout: () => {
        const s = get();
        if (!s.active) {
          set({ active: null, restEndsAt: null, restExName: null });
          return;
        }
        const rollback = rollbackDoneSets(s, s.active.exercises, null);
        set({
          ...rollback,
          active: null,
          restEndsAt: null,
          restExName: null,
        });
      },
      addExercise: (exId) => set((s) => s.active ? ({
        active: { ...s.active, exercises: [...s.active.exercises, { id: uid(), exId, sets: [mkSet(s, exId)] }] },
      }) : {}),
      removeExercise: (i) => {
        const s = get();
        if (!s.active) return;
        const removed = s.active.exercises[i];
        if (!removed) return;
        const nextActive: ActiveWorkout = {
          ...s.active,
          exercises: s.active.exercises.filter((_, k) => k !== i),
        };
        const rollback = rollbackDoneSets(s, [removed], nextActive);
        set({
          ...rollback,
          active: nextActive,
        });
      },
      addSet: (i) => set((s) => {
        if (!s.active) return {};
        const exs = s.active.exercises.map((e, k) => {
          if (k !== i) return e;
          const prev = e.sets[e.sets.length - 1];
          const ns = prev ? { id: uid(), kg: prev.kg, reps: prev.reps, done: false } : mkSet(s, e.exId);
          return { ...e, sets: [...e.sets, ns] };
        });
        return { active: { ...s.active, exercises: exs } };
      }),
      removeSet: (i, si) => set((s) => {
        if (!s.active) return {};
        const target = s.active.exercises[i]?.sets[si];
        if (!target || target.done) return {};
        return {
          active: {
            ...s.active,
            exercises: s.active.exercises.map((e, k) =>
              k !== i ? e : { ...e, sets: e.sets.filter((_, j) => j !== si) }
            ),
          },
        };
      }),
      updateSet: (i, si, patch) => set((s) => s.active ? ({
        active: {
          ...s.active,
          exercises: s.active.exercises.map((e, k) => k !== i ? e : {
            ...e, sets: e.sets.map((x, j) => j !== si ? x : {
              ...x, ...patch,
              kg: Math.max(0, Math.round(((patch.kg ?? x.kg)) * 4) / 4),
              reps: Math.max(0, Math.min(99, Math.round(patch.reps ?? x.reps))),
            }),
          }),
        },
      }) : {}),

      completeSet: (i, si) => {
        let s = get();
        if (!s.active) return null;
        let entry = s.active.exercises[i];
        let st = entry?.sets[si];
        if (!st) return null;
        const undo = st.done;

        if (!undo && st.reps <= 0) {
          return null;
        }

        if (!undo) {
          const wkNow = weekOfUtc(Date.now());
          if (s.weekKey && s.weekKey !== wkNow) {
            s.checkWeeklyReset();
            s = get();
            entry = s.active?.exercises[i] ?? entry;
            st = entry?.sets[si] ?? st;
            if (!s.active || !st) return null;
          }
        }

        const ex = EX[entry.exId];
        const isBw = isBodyweight(ex);
        const bw = s.bodyweight || 75;
        const lifted = isBw ? bw + st.kg : st.kg;
        const vol = lifted * st.reps;
        const est = e1rm(lifted, st.reps);
        const prev = s.best[entry.exId];

        if (undo) {
          const a = st.awarded;
          const wasPr = a?.pr ?? Boolean(st.pr);
          const sVol = a?.vol ?? vol;
          const expSub = a?.exp ?? (Math.round(10 + vol / 25) + (wasPr ? 100 : 0));
          const goldSub = a?.gold ?? (3 + Math.floor(st.reps / 4) + (wasPr ? 25 : 0));
          const bossSub = a?.bossDmg ?? 0;
          const mKey = a?.muscle ?? ex?.muscle;
          const sameWeek = !a || a.weekKey === s.weekKey;

          const { best: newBest, lastSet: newLastSet } = recomputeBestAndLast(
            [entry.exId],
            s.history,
            s.active,
            bw,
            s.best,
            s.lastSet,
            { exIdx: i, setIdx: si }
          );

          const questSubs: Record<string, number> = {};
          if (sameWeek && a?.questAdds) {
            for (const qa of a.questAdds) {
              questSubs[qa.id] = (questSubs[qa.id] ?? 0) + qa.delta;
            }
          }
          const nextQuests = (s.quests || generateDefaultQuests()).map((q) => {
            const sub = questSubs[q.id];
            if (!sub || q.claimed) return q;
            return { ...q, current: Math.max(0, q.current - sub) };
          });

          const mv = { ...zeroVol(), ...(s.muscleVol || {}) };
          if (mKey) mv[mKey] = Math.max(0, (mv[mKey] ?? 0) - sVol);

          let nextPending = s.pendingBossDmg || 0;
          let nextDealt = s.bossDmgDealt || 0;
          if (sameWeek && bossSub > 0) {
            if (nextPending >= bossSub) {
              nextPending -= bossSub;
            } else {
              const rem = bossSub - nextPending;
              nextPending = 0;
              nextDealt = Math.max(0, nextDealt - rem);
            }
          }

          set({
            exp: Math.max(0, s.exp - expSub),
            gold: Math.max(0, s.gold - goldSub),
            tonnage: Math.max(0, s.tonnage - sVol),
            totalPrs: Math.max(0, (s.totalPrs || 0) - (wasPr ? 1 : 0)),
            weeklyExp: sameWeek ? Math.max(0, s.weeklyExp - expSub) : s.weeklyExp,
            pendingBossDmg: nextPending,
            bossDmgDealt: nextDealt,
            muscleVol: mv,
            quests: nextQuests,
            best: newBest,
            lastSet: newLastSet,
            active: {
              ...s.active,
              exercises: s.active.exercises.map((e, k) =>
                k !== i ? e : { ...e, sets: e.sets.map((x, j) => (j !== si ? x : { ...x, done: false, pr: false, awarded: undefined })) }
              ),
            },
          });
          return { exp: -expSub, gold: -goldSub, pr: false, levelUp: null, strGain: 0 };
        }

        // Completing set (!undo)
        const pr = st.reps > 0 && lifted > 0 && (!prev || est > prev.e1rm + 0.01) && (s.history.length > 0 || !!prev);
        const firstRecord = !prev && lifted > 0 && st.reps > 0;
        const baseExp = Math.round(10 + vol / 25);
        const baseGold = 3 + Math.floor(st.reps / 4);
        const exp = baseExp + (pr ? 100 : 0);
        const gold = baseGold + (pr ? 25 : 0);
        const lvlBefore = levelOf(s.exp);
        const newExp = s.exp + exp;
        const lvlAfter = levelOf(newExp);
        const wk = weekOfUtc(Date.now());

        const questAdds: { id: string; delta: number }[] = [];
        const updatedQuests = (s.quests || generateDefaultQuests()).map((q) => {
          if (q.claimed) return q;
          let rawAdd = 0;
          if (q.type === "chest_vol" && ex?.muscle === "chest") rawAdd = vol;
          else if (q.type === "back_vol" && ex?.muscle === "back") rawAdd = vol;
          else if (q.type === "legs_vol" && ex?.muscle === "legs") rawAdd = vol;
          else if (q.type === "tonnage") rawAdd = vol;
          else if (q.type === "prs" && pr) rawAdd = 1;
          if (rawAdd <= 0) return q;
          const nextCur = Math.min(q.target, q.current + rawAdd);
          const applied = nextCur - q.current;
          if (applied > 0) questAdds.push({ id: q.id, delta: applied });
          return applied > 0 ? { ...q, current: nextCur } : q;
        });

        const muscleKey: Muscle = ex?.muscle ?? "chest";
        const newPump = { ...zeroVol(), ...(s.pumpUntil || {}), [muscleKey]: Date.now() + 2 * 3600 * 1000 };
        const { bossDmgPct } = getCombatBonus(s.equipped);
        const bossHitDmg = Math.round(vol * (1 + bossDmgPct / 100));
        const newPendingBossDmg = (s.pendingBossDmg || 0) + bossHitDmg;
        const nextBerserkUntil = pr ? Date.now() + 10 * 60 * 1000 : (s.berserkUntil || 0);
        const mv = { ...zeroVol(), ...(s.muscleVol || {}) };
        mv[muscleKey] = Math.max(0, (mv[muscleKey] ?? 0) + vol);

        const awarded: SetAwarded = {
          exp,
          gold,
          vol,
          bossDmg: bossHitDmg,
          muscle: muscleKey,
          pr,
          weekKey: wk,
          questAdds: questAdds.length ? questAdds : undefined,
        };

        const shouldUpdateBest = pr || firstRecord || (prev !== undefined && vol > prev.vol);

        set({
          exp: newExp,
          gold: s.gold + gold,
          tonnage: s.tonnage + vol,
          totalPrs: (s.totalPrs || 0) + (pr ? 1 : 0),
          weeklyExp: (s.weekKey === wk ? s.weeklyExp : 0) + exp,
          weekKey: wk,
          muscleVol: mv,
          pumpUntil: newPump,
          quests: updatedQuests,
          pendingBossDmg: newPendingBossDmg,
          berserkUntil: nextBerserkUntil,
          best: shouldUpdateBest
            ? { ...s.best, [entry.exId]: { e1rm: Math.max(est, prev?.e1rm ?? 0), vol: Math.max(vol, prev?.vol ?? 0) } }
            : s.best,
          lastSet: { ...s.lastSet, [entry.exId]: { kg: st.kg, reps: st.reps } },
          active: {
            ...s.active,
            exercises: s.active.exercises.map((e, k) =>
              k !== i ? e : { ...e, sets: e.sets.map((x, j) => (j !== si ? x : { ...x, done: true, pr, awarded })) }
            ),
          },
        });
        return {
          exp,
          gold,
          pr,
          levelUp: lvlAfter > lvlBefore ? lvlAfter : null,
          strGain: pr ? Math.max(1, Math.round((est - (prev?.e1rm ?? 0)) / 2)) : 0,
        };
      },

      finishWorkout: () => {
        const now = Date.now();
        const currentW = weekOfUtc(now);
        if (get().weekKey && get().weekKey !== currentW) {
          get().checkWeeklyReset();
        }
        const s = get();
        if (!s.active) return null;
        const done = s.active.exercises
          .map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }))
          .filter((e) => e.sets.length);
        if (!done.length) { set({ active: null, restEndsAt: null, restExName: null }); return null; }

        const bw = s.bodyweight || 75;
        const { bossDmgPct } = getCombatBonus(s.equipped);
        let tonnage = 0;
        let setsDone = 0;
        let prs = 0;
        let setsExp = 0;
        let setsGold = 0;
        let bossDamage = 0;
        const topExercises: { name: string; bestSet: string }[] = [];

        for (const e of done) {
          const ex = EX[e.exId];
          const isBw = isBodyweight(ex);
          let bestVol = -1;
          let bestStr = "";
          for (const x of e.sets) {
            setsDone++;
            const lifted = isBw ? bw + x.kg : x.kg;
            const vol = x.awarded?.vol ?? lifted * x.reps;
            tonnage += vol;
            const isPr = Boolean(x.awarded?.pr ?? x.pr);
            if (isPr) prs++;
            setsExp += x.awarded?.exp ?? (Math.round(10 + vol / 25) + (isPr ? 100 : 0));
            setsGold += x.awarded?.gold ?? (3 + Math.floor(x.reps / 4) + (isPr ? 25 : 0));
            bossDamage += x.awarded?.bossDmg ?? Math.round(vol * (1 + bossDmgPct / 100));
            if (vol > bestVol) {
              bestVol = vol;
              bestStr = isBw ? (x.kg > 0 ? `+${x.kg}kg × ${x.reps}` : `PC × ${x.reps}`) : `${x.kg}kg × ${x.reps}`;
            }
          }
          if (bestStr) {
            topExercises.push({ name: ex?.name ?? e.exId, bestSet: bestStr });
          }
        }

        const today = localDayKey(now);
        const todayMs = Date.parse(today + "T12:00:00Z");
        const lastMs = s.lastDay ? Date.parse(s.lastDay + "T12:00:00Z") : NaN;
        const dayDiff = Number.isFinite(lastMs) ? Math.round((todayMs - lastMs) / 864e5) : 999;
        const streak = s.lastDay === today ? Math.max(1, s.streak) : dayDiff >= 1 && dayDiff <= 2 ? s.streak + 1 : 1;
        const bonus = 50 + streak * 10;
        const bonusGold = 20;
        const totalExp = setsExp + bonus;
        const totalGold = setsGold + bonusGold;
        const nextMaxStreak = Math.max(s.maxStreak || 0, streak);

        const log: WorkoutLog = {
          id: uid(), name: s.active.name, startedAt: s.active.startedAt, endedAt: now,
          exercises: done, tonnage, exp: bonus, prs, bossDamage, totalGold, weekKey: currentW,
        };
        const nextHistory = [log, ...s.history].slice(0, 300);

        const updatedQuests = (s.quests || generateDefaultQuests()).map((q) => {
          if (q.claimed) return q;
          if (q.type === "workouts") return { ...q, current: Math.min(q.target, q.current + 1) };
          return q;
        });

        const snapAfter = {
          tonnage: s.tonnage,
          streak,
          maxStreak: nextMaxStreak,
          history: nextHistory,
          owned: s.owned || [],
          bossKills: s.bossKills || 0,
          totalPrs: s.totalPrs || 0,
        };
        const claimed = s.claimedAchievements || [];
        const newlyUnlockedIds = ACHIEVEMENTS.filter(
          (a) => !claimed.includes(a.id) && a.eval(snapAfter).unlocked
        ).map((a) => a.id);

        const summary: WorkoutSummary = {
          id: log.id,
          name: log.name,
          startedAt: log.startedAt,
          endedAt: now,
          durationMs: Math.max(1000, now - log.startedAt),
          tonnage,
          setsDone,
          prs,
          exp: totalExp,
          gold: totalGold,
          bossDamage,
          bonusPct: bossDmgPct,
          streak,
          newlyUnlockedIds,
          topExercises: topExercises.slice(0, 4),
        };

        const highTonnageBerserk = tonnage >= 1500 || prs > 0 ? now + 15 * 60 * 1000 : (s.berserkUntil || 0);

        set({
          history: nextHistory,
          active: null, restEndsAt: null, restExName: null, streak, maxStreak: nextMaxStreak, lastDay: today,
          exp: s.exp + bonus, weeklyExp: s.weeklyExp + bonus, gold: s.gold + bonusGold,
          quests: updatedQuests,
          berserkUntil: Math.max(s.berserkUntil || 0, highTonnageBerserk),
          lastWorkoutSummary: summary,
        });
        return log;
      },

      deleteLog: (id) => set((s) => {
        const log = s.history.find((h) => h.id === id);
        if (!log) return {};
        const newHistory = s.history.filter((h) => h.id !== id);
        const bw = s.bodyweight || 75;
        const logWeek = log.weekKey || weekOfUtc(log.endedAt || log.startedAt);
        const sameWeekAsCurrent = logWeek === s.weekKey;

        // 1. Recalculate muscleVol & exact EXP / Gold / BossDmg from this workout
        const mv = { ...zeroVol(), ...(s.muscleVol || {}) };
        let setsExp = 0;
        let setsGold = 0;
        let sameWeekBossSub = 0;
        let sameWeekExpSub = sameWeekAsCurrent ? log.exp : 0;
        const touchedExIds: string[] = [];

        for (const e of log.exercises) {
          touchedExIds.push(e.exId);
          const ex = EX[e.exId];
          const m = ex?.muscle;
          const isBw = isBodyweight(ex);
          for (const st of e.sets) {
            const a = st.awarded;
            const lifted = isBw ? bw + st.kg : st.kg;
            const fallbackVol = lifted * st.reps;
            const sVol = a?.vol ?? fallbackVol;
            const sExp = a?.exp ?? (Math.round(10 + fallbackVol / 25) + (st.pr ? 100 : 0));
            const sGold = a?.gold ?? (3 + Math.floor(st.reps / 4) + (st.pr ? 25 : 0));
            const sBoss = a?.bossDmg ?? 0;
            const mKey = a?.muscle ?? m;
            if (mKey) mv[mKey] = Math.max(0, (mv[mKey] ?? 0) - sVol);
            setsExp += sExp;
            setsGold += sGold;
            if (!a ? sameWeekAsCurrent : a.weekKey === s.weekKey) {
              sameWeekExpSub += sExp;
              sameWeekBossSub += sBoss;
            }
          }
        }
        if (sameWeekBossSub === 0 && sameWeekAsCurrent && typeof log.bossDamage === "number") {
          sameWeekBossSub = log.bossDamage;
        }

        const workoutExp = log.exp + setsExp;
        const workoutGold = typeof log.totalGold === "number" ? log.totalGold : 20 + setsGold;

        // 2. Re-evaluate best records & lastSet for all exercises affected
        const { best: newBest, lastSet: newLastSet } = recomputeBestAndLast(
          touchedExIds,
          newHistory,
          s.active,
          bw,
          s.best,
          s.lastSet
        );

        // 3. Recalculate streak & lastDay from remaining history (using local calendar days)
        let newStreak = 0;
        let newLastDay: string | null = null;
        if (newHistory.length > 0) {
          const uniqueDays = Array.from(
            new Set(newHistory.map((h) => localDayKey(h.endedAt || h.startedAt)))
          ).sort().reverse();
          newLastDay = uniqueDays[0] || null;
          newStreak = 1;
          for (let k = 0; k < uniqueDays.length - 1; k++) {
            const d1 = Date.parse(uniqueDays[k] + "T12:00:00Z");
            const d2 = Date.parse(uniqueDays[k + 1] + "T12:00:00Z");
            const diffDays = Math.round((d1 - d2) / 864e5);
            if (diffDays <= 2) {
              newStreak++;
            } else {
              break;
            }
          }
        }

        let nextPending = s.pendingBossDmg || 0;
        let nextDealt = s.bossDmgDealt || 0;
        if (sameWeekAsCurrent && sameWeekBossSub > 0) {
          if (nextPending >= sameWeekBossSub) {
            nextPending -= sameWeekBossSub;
          } else {
            const rem = sameWeekBossSub - nextPending;
            nextPending = 0;
            nextDealt = Math.max(0, nextDealt - rem);
          }
        }

        return {
          history: newHistory,
          tonnage: Math.max(0, s.tonnage - log.tonnage),
          exp: Math.max(0, s.exp - workoutExp),
          weeklyExp: sameWeekAsCurrent ? Math.max(0, s.weeklyExp - sameWeekExpSub) : s.weeklyExp,
          gold: Math.max(0, s.gold - workoutGold),
          totalPrs: Math.max(0, (s.totalPrs || 0) - (log.prs || 0)),
          pendingBossDmg: nextPending,
          bossDmgDealt: nextDealt,
          muscleVol: mv,
          best: newBest,
          lastSet: newLastSet,
          streak: newStreak,
          lastDay: newLastDay,
        };
      }),

      startRest: (sec, exName) => set((s) => ({
        restEndsAt: Date.now() + sec * 1000,
        restExName: exName ?? s.restExName ?? null,
      })),
      stopRest: () => set({ restEndsAt: null, restExName: null }),
      buy: (id) => {
        const s = get(); const it = ITEM[id];
        if (!it || s.owned.includes(id) || s.gold < it.price || levelOf(s.exp) < it.minLevel) return false;
        set({ gold: s.gold - it.price, owned: [...s.owned, id], equipped: { ...s.equipped, [it.slot]: id } });
        return true;
      },
      equip: (id) => {
        const it = ITEM[id];
        if (it && get().owned.includes(id)) set((s) => ({ equipped: { ...s.equipped, [it.slot as Slot]: id } }));
      },
      saveRoutine: (r) =>
        set((s) => ({
          customRoutines: [...s.customRoutines.filter((c) => c.id !== r.id), { ...r, custom: true }],
          deletedRoutineIds: (s.deletedRoutineIds || []).filter((id) => id !== r.id),
        })),
      deleteRoutine: (id) =>
        set((s) => ({
          customRoutines: s.customRoutines.filter((c) => c.id !== id),
          deletedRoutineIds: Array.from(new Set([...(s.deletedRoutineIds || []), id])),
        })),
      restoreDefaultRoutines: () => set({ deletedRoutineIds: [] }),

      settleWeeklyTrophy: (forcedRank?: number) => {
        const s = get();
        const currentW = weekOfUtc(Date.now());
        if (!forcedRank && s.weeklyExp <= 0) {
          set({
            weeklyExp: 0,
            weekKey: currentW,
            quests: generateDefaultQuests(),
            bossDmgDealt: 0,
            pendingBossDmg: 0,
            bossDefeated: false,
          });
          return null;
        }
        const lg = leagueOf(s.weeklyExp);
        const rank = forcedRank ?? getWeeklyRankForExp(s.weeklyExp, s.weekKey || currentW);
        const trophy = createTrophyForRank(
          rank,
          lg.name,
          lg.color,
          s.weeklyExp,
          s.weekKey || currentW
        );
        const existingTrophies = s.trophies || [];
        set({
          trophies: [trophy, ...existingTrophies].slice(0, 50),
          gold: s.gold + trophy.goldReward,
          weeklyExp: 0,
          weekKey: currentW,
          quests: generateDefaultQuests(),
          bossDmgDealt: 0,
          pendingBossDmg: 0,
          bossDefeated: false,
        });
        return trophy;
      },

      checkWeeklyReset: () => {
        const currentW = weekOfUtc(Date.now());
        const s = get();
        if (s.weekKey && s.weekKey !== currentW) {
          return s.settleWeeklyTrophy();
        }
        return null;
      },
    }),
    {
      name: "pixelgym-rpg-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.name = typeof state.name === "string" && state.name ? state.name : "HÉROE";
        state.bodyweight =
          typeof state.bodyweight === "number" && Number.isFinite(state.bodyweight) && state.bodyweight > 0
            ? state.bodyweight
            : 75;
        state.equipped = { ...DEFAULT_EQUIP, ...(state.equipped || {}) };
        state.heroTraits = { ...DEFAULT_HERO_TRAITS, ...(state.heroTraits || {}) };
        state.weightHistory = Array.isArray(state.weightHistory) && state.weightHistory.length
          ? state.weightHistory
          : [{ id: "init_bw", date: Date.now(), kg: state.bodyweight || 75 }];
        state.owned = Array.from(
          new Set([...(Array.isArray(state.owned) ? state.owned : []), ...Object.values(DEFAULT_EQUIP)])
        );
        state.muscleVol = { ...zeroVol(), ...(state.muscleVol || {}) };
        state.pumpUntil = { ...zeroVol(), ...(state.pumpUntil || {}) };
        state.pendingBossDmg = typeof state.pendingBossDmg === "number" ? state.pendingBossDmg : 0;
        state.berserkUntil = typeof state.berserkUntil === "number" ? state.berserkUntil : 0;
        state.pushPrefs = { ...DEFAULT_PUSH_PREFS, ...(state.pushPrefs || {}) };
        state.history = Array.isArray(state.history) ? state.history : [];
        state.best = state.best && typeof state.best === "object" ? state.best : {};
        state.lastSet = state.lastSet && typeof state.lastSet === "object" ? state.lastSet : {};
        state.restTimeByEx =
          state.restTimeByEx && typeof state.restTimeByEx === "object" ? state.restTimeByEx : {};
        state.quests = Array.isArray(state.quests) && state.quests.length ? state.quests : generateDefaultQuests();
        state.customRoutines = Array.isArray(state.customRoutines) ? state.customRoutines : [];
        state.deletedRoutineIds = Array.isArray(state.deletedRoutineIds) ? state.deletedRoutineIds : [];
        state.trophies = Array.isArray(state.trophies) ? state.trophies : [];
        state.claimedAchievements = Array.isArray(state.claimedAchievements) ? state.claimedAchievements : [];
        state.focusMode = typeof state.focusMode === "boolean" ? state.focusMode : true;
        state.sound = typeof state.sound === "boolean" ? state.sound : true;
        state.maxStreak = Math.max(state.maxStreak || 0, state.streak || 0);
        state.totalPrs = state.totalPrs || 0;
        state.bossKills = state.bossKills || 0;
        state.lastWorkoutSummary = null;
        if (state.active) {
          if (typeof state.active !== "object" || !Array.isArray(state.active.exercises)) {
            state.active = null;
          } else {
            state.active = {
              routineId: typeof state.active.routineId === "string" ? state.active.routineId : "recovered",
              name: typeof state.active.name === "string" && state.active.name ? state.active.name : "ENTRENO",
              startedAt:
                typeof state.active.startedAt === "number" && Number.isFinite(state.active.startedAt)
                  ? state.active.startedAt
                  : Date.now(),
              exercises: state.active.exercises
                .filter((e): e is ExEntry => Boolean(e && typeof e === "object" && typeof e.exId === "string"))
                .map((e) => ({
                  ...e,
                  id: e.id || uid(),
                  sets: Array.isArray(e.sets)
                    ? e.sets
                        .filter((st) => Boolean(st && typeof st === "object"))
                        .map((st) => ({
                          ...st,
                          id: st.id || uid(),
                          kg: typeof st.kg === "number" && Number.isFinite(st.kg) ? Math.max(0, st.kg) : 0,
                          reps: typeof st.reps === "number" && Number.isFinite(st.reps) ? Math.max(0, st.reps) : 0,
                          done: Boolean(st.done),
                        }))
                    : [mkSet(state, e.exId)],
                })),
            };
          }
        }
        if (
          state.restEndsAt !== null &&
          (typeof state.restEndsAt !== "number" ||
            !Number.isFinite(state.restEndsAt) ||
            Date.now() - state.restEndsAt > 60000)
        ) {
          state.restEndsAt = null;
          state.restExName = null;
        }
      },
    },
  ),
);

function mkSet(s: Pick<State, "lastSet">, exId: string): SetEntry {
  const last = s.lastSet[exId];
  const ex = EX[exId];
  return { id: uid(), kg: last?.kg ?? ex?.defKg ?? 20, reps: last?.reps ?? ex?.defReps ?? 10, done: false };
}

export const allRoutines = (custom: Routine[], deletedRoutineIds: string[] = []) =>
  [...TEMPLATES.filter((t) => !deletedRoutineIds.includes(t.id)), ...custom];
