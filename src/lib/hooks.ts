"use client";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGame } from "./store";
import { Muscle, levelOf, tierOf, EX, e1rm } from "./data";
import type { AvatarCfg } from "./avatar";

export function useMyAvatar(): AvatarCfg {
  const { muscleVol, equipped, exp, pumpUntil, heroTraits } = useGame(
    useShallow((s) => ({
      muscleVol: s.muscleVol,
      equipped: s.equipped,
      exp: s.exp,
      pumpUntil: s.pumpUntil,
      heroTraits: s.heroTraits,
    }))
  );
  return useMemo(() => {
    const now = Date.now();
    const pump: Partial<Record<Muscle, boolean>> = {};
    if (pumpUntil) {
      for (const [m, until] of Object.entries(pumpUntil)) {
        if (until > now) pump[m as Muscle] = true;
      }
    }
    return {
      tiers: Object.fromEntries(Object.entries(muscleVol).map(([k, v]) => [k, tierOf(v)])) as Record<Muscle, number>,
      equipped,
      level: levelOf(exp),
      pump,
      traits: heroTraits,
    };
  }, [muscleVol, equipped, exp, pumpUntil, heroTraits]);
}

export function useStats() {
  const { best, tonnage, streak, exp, muscleVol } = useGame(useShallow((s) => ({ best: s.best, tonnage: s.tonnage, streak: s.streak, exp: s.exp, muscleVol: s.muscleVol })));
  return useMemo(() => {
    const str = Math.round(Object.entries(best).reduce((a, [id, b]) => a + (EX[id] ? b.e1rm : 0), 0) / 10);
    const hyp = Math.round(Object.values(muscleVol).reduce((a, b) => a + b, 0) / 1000);
    return { level: levelOf(exp), str, hyp, sta: streak, tonnage, exp };
  }, [best, tonnage, streak, exp, muscleVol]);
}

export { e1rm };
