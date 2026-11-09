"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_EQUIP, EX, Equipped, ITEM, Muscle, Quest, Routine, Slot, TEMPLATES, Trophy, createTrophyForRank, defaultRestForExercise, e1rm, generateDefaultQuests, isBodyweight, leagueOf, levelOf, weekOfUtc,
} from "./data";

export interface SetEntry { id: string; kg: number; reps: number; done: boolean; pr?: boolean; rir?: number }
export interface ExEntry { exId: string; sets: SetEntry[] }
export interface ActiveWorkout { routineId: string; name: string; startedAt: number; exercises: ExEntry[] }
export interface WorkoutLog {
  id: string; name: string; startedAt: number; endedAt: number;
  exercises: ExEntry[]; tonnage: number; exp: number; prs: number;
}

export interface SetResult { exp: number; gold: number; pr: boolean; levelUp: number | null; strGain: number }

const uid = () => Math.random().toString(36).slice(2, 10);
const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
const zeroVol = (): Record<Muscle, number> => ({ chest: 0, back: 0, shoulders: 0, arms: 0, legs: 0 });

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
  bossDefeated: boolean;
  restTimeByEx: Record<string, number>;
  best: Record<string, { e1rm: number; vol: number }>;
  lastSet: Record<string, { kg: number; reps: number }>;
  history: WorkoutLog[];
  active: ActiveWorkout | null;
  restEndsAt: number | null;
  owned: string[];
  equipped: Equipped;
  customRoutines: Routine[];
  deletedRoutineIds: string[];
  trophies: Trophy[];
  sound: boolean;
  focusMode: boolean;

  setName: (n: string) => void;
  setBodyweight: (bw: number) => void;
  toggleSound: () => void;
  setFocusMode: (v: boolean) => void;
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
  startRest: (sec: number) => void;
  stopRest: () => void;
  buy: (id: string) => boolean;
  equip: (id: string) => void;
  saveRoutine: (r: Routine) => void;
  deleteRoutine: (id: string) => void;
  restoreDefaultRoutines: () => void;
  settleWeeklyTrophy: (forcedRank?: number) => Trophy;
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
      bossDefeated: false,
      restTimeByEx: {},
      best: {}, lastSet: {}, history: [], active: null, restEndsAt: null,
      owned: Object.values(DEFAULT_EQUIP).concat(["shirt_none", "belt_none", "wrist_none", "aura_none"]),
      equipped: { ...DEFAULT_EQUIP },
      customRoutines: [],
      deletedRoutineIds: [],
      trophies: [],
      sound: true,
      focusMode: true,

      setName: (name) => set({ name: name.slice(0, 12).toUpperCase() || "HÉROE" }),
      setBodyweight: (bw) => set({ bodyweight: Math.max(30, Math.min(250, Math.round(bw * 10) / 10)) }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      setFocusMode: (v) => set({ focusMode: v }),
      claimBossVictory: (gold, exp) => {
        const s = get();
        if (s.bossDefeated) return false;
        set({
          bossDefeated: true,
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
          set({
            name: typeof d.name === "string" ? d.name : get().name,
            bodyweight: typeof d.bodyweight === "number" ? d.bodyweight : get().bodyweight,
            exp: typeof d.exp === "number" ? d.exp : get().exp,
            gold: typeof d.gold === "number" ? d.gold : get().gold,
            tonnage: typeof d.tonnage === "number" ? d.tonnage : get().tonnage,
            weeklyExp: typeof d.weeklyExp === "number" ? d.weeklyExp : get().weeklyExp,
            streak: typeof d.streak === "number" ? d.streak : get().streak,
            muscleVol: d.muscleVol ?? get().muscleVol,
            best: d.best ?? get().best,
            history: Array.isArray(d.history) ? d.history : get().history,
            trophies: Array.isArray(d.trophies) ? d.trophies : get().trophies,
            customRoutines: Array.isArray(d.customRoutines) ? d.customRoutines : get().customRoutines,
            deletedRoutineIds: Array.isArray(d.deletedRoutineIds) ? d.deletedRoutineIds : get().deletedRoutineIds,
            owned: Array.isArray(d.owned) ? d.owned : get().owned,
            equipped: d.equipped ?? get().equipped,
          });
          return true;
        } catch {
          return false;
        }
      },

      startWorkout: (r) => {
        const st = get();
        set({
          focusMode: true,
          active: {
            routineId: r.id, name: r.name, startedAt: Date.now(),
            exercises: r.exercises.map((exId) => ({ exId, sets: [mkSet(st, exId)] })),
          },
        });
      },
      cancelWorkout: () => set({ active: null, restEndsAt: null }),
      addExercise: (exId) => set((s) => s.active ? ({
        active: { ...s.active, exercises: [...s.active.exercises, { exId, sets: [mkSet(s, exId)] }] },
      }) : {}),
      removeExercise: (i) => set((s) => s.active ? ({
        active: { ...s.active, exercises: s.active.exercises.filter((_, k) => k !== i) },
      }) : {}),
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
      removeSet: (i, si) => set((s) => s.active ? ({
        active: { ...s.active, exercises: s.active.exercises.map((e, k) => k !== i ? e : { ...e, sets: e.sets.filter((_, j) => j !== si) }) },
      }) : {}),
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
        const s = get();
        if (!s.active) return null;
        const entry = s.active.exercises[i];
        const st = entry?.sets[si];
        if (!st) return null;
        const ex = EX[entry.exId];
        const undo = st.done;
        const isBw = isBodyweight(ex);
        const lifted = isBw ? (s.bodyweight || 75) + st.kg : st.kg;
        const vol = lifted * st.reps;
        const est = e1rm(lifted, st.reps);
        const prev = s.best[entry.exId];

        if (undo) {
          const wasPr = Boolean(st.pr);
          const baseExp = Math.round(10 + vol / 25);
          const baseGold = 3 + Math.floor(st.reps / 4);
          const expSub = baseExp + (wasPr ? 100 : 0);
          const goldSub = baseGold + (wasPr ? 25 : 0);

          // Recalculate best[entry.exId] excluding this undone set
          let maxE1rm = 0;
          let maxVol = 0;
          for (const h of s.history) {
            for (const e of h.exercises) {
              if (e.exId === entry.exId) {
                const eBw = isBodyweight(EX[e.exId]);
                for (const x of e.sets) {
                  const l = eBw ? (s.bodyweight || 75) + x.kg : x.kg;
                  const eVal = e1rm(l, x.reps);
                  const vVal = l * x.reps;
                  if (eVal > maxE1rm) maxE1rm = eVal;
                  if (vVal > maxVol) maxVol = vVal;
                }
              }
            }
          }
          if (s.active) {
            for (let k = 0; k < s.active.exercises.length; k++) {
              const actE = s.active.exercises[k];
              if (actE.exId === entry.exId) {
                const eBw = isBodyweight(EX[actE.exId]);
                for (let j = 0; j < actE.sets.length; j++) {
                  if (k === i && j === si) continue; // skip this undone set
                  const x = actE.sets[j];
                  if (x.done) {
                    const l = eBw ? (s.bodyweight || 75) + x.kg : x.kg;
                    const eVal = e1rm(l, x.reps);
                    const vVal = l * x.reps;
                    if (eVal > maxE1rm) maxE1rm = eVal;
                    if (vVal > maxVol) maxVol = vVal;
                  }
                }
              }
            }
          }

          const newBest = { ...s.best };
          if (maxE1rm > 0) {
            newBest[entry.exId] = { e1rm: maxE1rm, vol: maxVol };
          } else {
            delete newBest[entry.exId];
          }

          set({
            exp: Math.max(0, s.exp - expSub),
            gold: Math.max(0, s.gold - goldSub),
            tonnage: Math.max(0, s.tonnage - vol),
            weeklyExp: Math.max(0, s.weeklyExp - expSub),
            muscleVol: { ...s.muscleVol, [ex.muscle]: Math.max(0, s.muscleVol[ex.muscle] - vol) },
            best: newBest,
            active: {
              ...s.active,
              exercises: s.active.exercises.map((e, k) =>
                k !== i ? e : { ...e, sets: e.sets.map((x, j) => (j !== si ? x : { ...x, done: false, pr: false })) }
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

        const updatedQuests = (s.quests || generateDefaultQuests()).map((q) => {
          if (q.claimed) return q;
          let add = 0;
          if (q.type === "chest_vol" && ex.muscle === "chest") add = vol;
          else if (q.type === "back_vol" && ex.muscle === "back") add = vol;
          else if (q.type === "legs_vol" && ex.muscle === "legs") add = vol;
          else if (q.type === "tonnage") add = vol;
          else if (q.type === "prs" && pr) add = 1;
          return add > 0 ? { ...q, current: Math.min(q.target, q.current + add) } : q;
        });

        const newPump = { ...(s.pumpUntil || zeroVol()), [ex.muscle]: Date.now() + 2 * 3600 * 1000 };
        const newBossDmg = (s.bossDmgDealt || 0) + vol;

        set({
          exp: newExp,
          gold: s.gold + gold,
          tonnage: s.tonnage + vol,
          weeklyExp: (s.weekKey === wk ? s.weeklyExp : 0) + exp,
          weekKey: wk,
          muscleVol: { ...s.muscleVol, [ex.muscle]: Math.max(0, s.muscleVol[ex.muscle] + vol) },
          pumpUntil: newPump,
          quests: updatedQuests,
          bossDmgDealt: newBossDmg,
          best: pr || firstRecord
            ? { ...s.best, [entry.exId]: { e1rm: est, vol: Math.max(vol, prev?.vol ?? 0) } }
            : s.best,
          lastSet: { ...s.lastSet, [entry.exId]: { kg: st.kg, reps: st.reps } },
          active: {
            ...s.active,
            exercises: s.active.exercises.map((e, k) =>
              k !== i ? e : { ...e, sets: e.sets.map((x, j) => (j !== si ? x : { ...x, done: true, pr })) }
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
        const s = get();
        if (!s.active) return null;
        const done = s.active.exercises
          .map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }))
          .filter((e) => e.sets.length);
        if (!done.length) { set({ active: null, restEndsAt: null }); return null; }
        const tonnage = done.reduce((a, e) => {
          const ex = EX[e.exId];
          const isBw = isBodyweight(ex);
          return a + e.sets.reduce((b, x) => b + (isBw ? (s.bodyweight || 75) + x.kg : x.kg) * x.reps, 0);
        }, 0);
        const today = dayKey(Date.now());
        const yest = dayKey(Date.now() - 864e5);
        const streak = s.lastDay === today ? s.streak : s.lastDay === yest || (s.lastDay && Date.now() - new Date(s.lastDay).getTime() < 3 * 864e5) ? s.streak + 1 : 1;
        const bonus = 50 + streak * 10;
        const log: WorkoutLog = {
          id: uid(), name: s.active.name, startedAt: s.active.startedAt, endedAt: Date.now(),
          exercises: done, tonnage, exp: bonus, prs: done.reduce((acc, e) => acc + e.sets.filter((x) => x.pr).length, 0),
        };

        const updatedQuests = (s.quests || generateDefaultQuests()).map((q) => {
          if (q.claimed) return q;
          if (q.type === "workouts") return { ...q, current: Math.min(q.target, q.current + 1) };
          return q;
        });

        set({
          history: [log, ...s.history].slice(0, 300),
          active: null, restEndsAt: null, streak, lastDay: today,
          exp: s.exp + bonus, weeklyExp: s.weeklyExp + bonus, gold: s.gold + 20,
          quests: updatedQuests,
        });
        return log;
      },

      deleteLog: (id) => set((s) => {
        const log = s.history.find((h) => h.id === id);
        if (!log) return {};
        const newHistory = s.history.filter((h) => h.id !== id);

        // 1. Recalculate muscleVol
        const mv = { ...s.muscleVol };
        for (const e of log.exercises) {
          const ex = EX[e.exId];
          const m = ex?.muscle;
          const isBw = isBodyweight(ex);
          if (m) {
            const volSub = e.sets.reduce((b, x) => b + (isBw ? (s.bodyweight || 75) + x.kg : x.kg) * x.reps, 0);
            mv[m] = Math.max(0, mv[m] - volSub);
          }
        }

        // 2. Re-evaluate best records for all exercises affected
        const newBest = { ...s.best };
        for (const entry of log.exercises) {
          let maxE1rm = 0;
          let maxVol = 0;
          for (const h of newHistory) {
            for (const e of h.exercises) {
              if (e.exId === entry.exId) {
                const ex = EX[e.exId];
                const isBw = isBodyweight(ex);
                for (const st of e.sets) {
                  const lifted = isBw ? (s.bodyweight || 75) + st.kg : st.kg;
                  const est = e1rm(lifted, st.reps);
                  const vol = lifted * st.reps;
                  if (est > maxE1rm) maxE1rm = est;
                  if (vol > maxVol) maxVol = vol;
                }
              }
            }
          }
          if (maxE1rm > 0) {
            newBest[entry.exId] = { e1rm: maxE1rm, vol: maxVol };
          } else {
            delete newBest[entry.exId];
          }
        }

        // 3. Recalculate streak & lastDay from remaining history
        let newStreak = 0;
        let newLastDay: string | null = null;
        if (newHistory.length > 0) {
          const uniqueDays = Array.from(new Set(newHistory.map((h) => dayKey(h.startedAt)))).sort().reverse();
          newLastDay = uniqueDays[0] || null;
          newStreak = 1;
          for (let k = 0; k < uniqueDays.length - 1; k++) {
            const d1 = new Date(uniqueDays[k]).getTime();
            const d2 = new Date(uniqueDays[k + 1]).getTime();
            const diffDays = Math.round((d1 - d2) / 864e5);
            if (diffDays <= 2) {
              newStreak++;
            } else {
              break;
            }
          }
        }

        // 4. Calculate total EXP and Gold that was generated by this workout
        let workoutExp = log.exp;
        let workoutGold = 20;
        for (const e of log.exercises) {
          const ex = EX[e.exId];
          const isBw = isBodyweight(ex);
          for (const st of e.sets) {
            const lifted = isBw ? (s.bodyweight || 75) + st.kg : st.kg;
            const vol = lifted * st.reps;
            workoutExp += Math.round(10 + vol / 25) + (st.pr ? 100 : 0);
            workoutGold += 3 + Math.floor(st.reps / 4) + (st.pr ? 25 : 0);
          }
        }

        return {
          history: newHistory,
          tonnage: Math.max(0, s.tonnage - log.tonnage),
          exp: Math.max(0, s.exp - workoutExp),
          weeklyExp: Math.max(0, s.weeklyExp - workoutExp),
          gold: Math.max(0, s.gold - workoutGold),
          muscleVol: mv,
          best: newBest,
          streak: newStreak,
          lastDay: newLastDay,
        };
      }),

      startRest: (sec) => set({ restEndsAt: Date.now() + sec * 1000 }),
      stopRest: () => set({ restEndsAt: null }),
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
        const lg = leagueOf(s.weeklyExp);
        let rank = forcedRank;
        if (!rank) {
          if (s.weeklyExp >= 12000) rank = 1;
          else if (s.weeklyExp >= 7000) rank = 2;
          else if (s.weeklyExp >= 3500) rank = 3;
          else if (s.weeklyExp >= 1200) rank = Math.floor(Math.random() * 6) + 4; // 4 to 9
          else rank = Math.floor(Math.random() * 7) + 10; // 10 to 16
        }
        const currentW = weekOfUtc(Date.now());
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
