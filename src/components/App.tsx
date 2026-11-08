"use client";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useGame } from "@/lib/store";
import { setSoundEnabled, sfx, haptic } from "@/lib/fx";
import { useStats } from "@/lib/hooks";
import GymView, { RestTimer } from "./GymView";
import AvatarView from "./AvatarView";
import RankView from "./RankView";
import HistoryView from "./HistoryView";
import FxLayer from "./FxLayer";
import GymIntro from "./GymIntro";
import { APPLE_BOUNCE, APPLE_TAP, SPRING } from "./ui";

const TABS = [
  { id: "gym", label: "GYM", icon: "⚔" },
  { id: "avatar", label: "AVATAR", icon: "☻" },
  { id: "rank", label: "LIGAS", icon: "♛" },
  { id: "log", label: "PROGRESO", icon: "▤" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function App() {
  const [tab, setTab] = useState<Tab>("gym");
  const [dir, setDir] = useState(1);
  const [morphed, setMorphed] = useState(false);
  const [intro, setIntro] = useState(true);

  const handleMorph = useCallback(() => {
    setMorphed(true);
  }, []);

  const handleDone = useCallback(() => {
    setIntro(false);
  }, []);

  useEffect(() => {
    Promise.resolve(useGame.persist.rehydrate()).then(() => {
      useGame.getState().checkWeeklyReset();
    });
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const onVis = () => {
      if (document.visibilityState === "visible") {
        useGame.getState().checkWeeklyReset();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  const sound = useGame((s) => s.sound);
  useEffect(() => setSoundEnabled(sound), [sound]);

  const go = (t: Tab) => {
    if (t === tab) return;
    setDir(TABS.findIndex((x) => x.id === t) > TABS.findIndex((x) => x.id === tab) ? 1 : -1);
    setTab(t); sfx.tap(); haptic(5);
  };

  return (
    <LayoutGroup>
      {morphed && (
        <>
          <div id="shell" className="mx-auto flex min-h-dvh max-w-lg flex-col will-change-transform">
            <HUD />
            <main className="relative flex-1 overflow-x-hidden px-3 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-3">
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.div
                  key={tab} custom={dir}
                  variants={{ in: (d: number) => ({ x: 40 * d, opacity: 0 }), on: { x: 0, opacity: 1 }, out: (d: number) => ({ x: -40 * d, opacity: 0 }) }}
                  initial="in" animate="on" exit="out" transition={SPRING}
                >
                  {tab === "gym" && <GymView />}
                  {tab === "avatar" && <AvatarView />}
                  {tab === "rank" && <RankView />}
                  {tab === "log" && <HistoryView />}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
          <RestTimer />
          <motion.nav
            className="navbar fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ ...SPRING, delay: 0.04 }}
          >
            <div className="mx-auto grid max-w-lg grid-cols-4">
              {TABS.map((t, i) => (
                <motion.button
                  key={t.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ ...SPRING, delay: 0.06 + i * 0.04 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.88, y: 1 }}
                  onClick={() => go(t.id)}
                  className={`relative flex flex-col items-center gap-1 py-2.5 sm:py-3 ${tab === t.id ? "text-black" : "text-[#8b93b8]"}`}
                  aria-label={t.label}
                >
                  {tab === t.id && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-x-1.5 inset-y-1 bg-[var(--gold)] border-2 border-black shadow-[2px_2px_0_#000]"
                      transition={SPRING}
                    />
                  )}
                  <motion.span
                    animate={tab === t.id ? { scale: [1, 1.25, 1], y: [0, -2, 0] } : { scale: 1, y: 0 }}
                    transition={APPLE_BOUNCE}
                    className="relative text-lg leading-none"
                  >
                    {t.icon}
                  </motion.span>
                  <span className="pixel-title relative text-[8px] font-bold">{t.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.nav>
        </>
      )}
      <FxLayer />
      {intro && (
        <GymIntro
          onMorph={handleMorph}
          onDone={handleDone}
        />
      )}
    </LayoutGroup>
  );
}

function HUD() {
  const st = useStats();
  const { gold, name } = useGame(useShallow((s) => ({ gold: s.gold, name: s.name })));
  return (
    <motion.header
      className="hud sticky top-0 z-30 flex items-center justify-between px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]"
      initial={{ y: -36, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={SPRING}
    >
      <div className="flex items-center gap-2">
        <img
          src="/icon-64.png"
          alt="PixelGym Logo"
          width={26}
          height={26}
          className="pixelated border-2 border-black shadow-[2px_2px_0_#000]"
        />
        <div className="pixel-title text-[10px] text-[var(--gold)]">
          PIXELGYM<span className="text-[var(--red)]">RPG</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <motion.span whileHover={{ scale: 1.05 }} className="pixel-title text-[8px] text-white">{name} LV{st.level}</motion.span>
        <motion.span key={gold} initial={{ scale: 1.5, y: -2 }} animate={{ scale: 1, y: 0 }} transition={APPLE_BOUNCE} className="mono text-base tabular-nums text-[var(--gold)]">● {gold}</motion.span>
      </div>
    </motion.header>
  );
}
