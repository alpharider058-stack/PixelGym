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
import { APPLE_BOUNCE, APPLE_SPRING, APPLE_TAP, SPRING } from "./ui";

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
  const activeTheme = useGame((s) => s.activeTheme || "theme_default");
  const hasActiveWorkout = useGame((s) => !!s.active);
  const focusMode = useGame((s) => s.focusMode);
  const setFocusMode = useGame((s) => s.setFocusMode);
  useEffect(() => setSoundEnabled(sound), [sound]);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeTheme);
  }, [activeTheme]);

  const showNav = !hasActiveWorkout || !focusMode;
  const activeIdx = Math.max(0, TABS.findIndex((x) => x.id === tab));

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
            <main className={`relative flex-1 overflow-x-hidden px-3 pt-3 transition-[padding] duration-200 ${showNav ? "pb-[calc(7.5rem+env(safe-area-inset-bottom))]" : "pb-[calc(4.5rem+env(safe-area-inset-bottom))]"}`}>
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
          <RestTimer
            hasNavbar={showNav}
            showQuickReturn={Boolean(hasActiveWorkout && (!focusMode || tab !== "gym"))}
            onReturnToWorkout={() => {
              if (tab !== "gym") {
                setDir(-1);
                setTab("gym");
              }
              setFocusMode(true);
            }}
          />
          <AnimatePresence>
            {showNav && (
              <motion.nav
                key="bottom-navbar"
                className="navbar fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "110%" }}
                transition={SPRING}
              >
                <div className="relative mx-auto grid max-w-lg grid-cols-4">
                  {/* Rock-solid deterministic sliding yellow highlight box (never flies off-screen) */}
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-1 left-0 w-1/4 px-1.5"
                    initial={false}
                    animate={{ x: `${activeIdx * 100}%` }}
                    transition={SPRING}
                  >
                    <div className="h-full w-full bg-[var(--gold)] border-2 border-black shadow-[2px_2px_0_#000]" />
                  </motion.div>

                  {TABS.map((t) => (
                    <motion.button
                      key={t.id}
                      whileTap={{ scale: 0.92 }}
                      transition={APPLE_TAP}
                      onClick={() => go(t.id)}
                      className={`relative z-10 flex flex-col items-center gap-1 py-2.5 sm:py-3 transition-colors ${tab === t.id ? "text-black" : "text-[#8b93b8]"}`}
                      aria-label={t.label}
                    >
                      <motion.span
                        animate={tab === t.id ? { scale: [1, 1.2, 1], y: [0, -1.5, 0] } : { scale: 1, y: 0 }}
                        transition={APPLE_BOUNCE}
                        className="relative text-lg leading-none"
                      >
                        {t.icon}
                        {t.id === "gym" && hasActiveWorkout && (
                          <span className="absolute -right-2.5 -top-0.5 h-2 w-2 rounded-full bg-[#7dff6a] border border-black animate-pulse" />
                        )}
                      </motion.span>
                      <span className="pixel-title relative text-[8px] font-bold">{t.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
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
  const { gold, name, streak } = useGame(useShallow((s) => ({ gold: s.gold, name: s.name, streak: s.streak })));
  return (
    <motion.header
      className="hud sticky top-0 z-30 flex items-center justify-between px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]"
      initial={{ y: -36, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={SPRING}
    >
      <div className="flex items-center gap-2">
        <span className="pixel-title text-[9px] text-white font-bold">{name}</span>
        <motion.span
          whileHover={{ scale: 1.08 }}
          transition={APPLE_SPRING}
          className="pixel-title text-[7.5px] text-[var(--gold)] border border-[#2c3350] bg-[#10131f] px-1.5 py-0.5 shadow-[1px_1px_0_#000]"
        >
          LV {st.level}
        </motion.span>
      </div>
      <div className="flex items-center gap-3">
        <span className="pixel-title text-[8px] text-[#8b93b8]">
          🔥 <b className="text-[var(--gold)]">{streak}D</b>
        </span>
        <motion.span
          key={gold}
          initial={{ scale: 1.5, y: -2 }}
          animate={{ scale: 1, y: 0 }}
          transition={APPLE_BOUNCE}
          className="mono text-base tabular-nums text-[var(--gold)]"
        >
          ● {gold}
        </motion.span>
      </div>
    </motion.header>
  );
}
