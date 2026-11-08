"use client";
import { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { allRoutines, useGame } from "@/lib/store";
import { EX, EXERCISES, MUSCLE_LABEL, Routine, defaultRestForExercise, expForLevel, titleOf } from "@/lib/data";
import { useMyAvatar, useStats } from "@/lib/hooks";
import { fx, fxAt, haptic, sfx } from "@/lib/fx";
import Avatar from "./Avatar";
import { PixelButton, Panel, Bar, SPRING, APPLE_SPRING, APPLE_TAP, APPLE_BOUNCE, APPLE_FLUID } from "./ui";
import PlateCalculator from "./PlateCalculator";
import RaidBossView from "./RaidBoss";
import { PIXEL_ROUTINE_ICONS, PixelArtIcon } from "./PixelIcon";

export default function GymView() {
  const active = useGame((s) => !!s.active);
  return active ? <ActiveLogger /> : <RoutinePicker />;
}

/* ---------------- Routine picker ---------------- */
function RoutinePicker() {
  const custom = useGame((s) => s.customRoutines);
  const deletedRoutineIds = useGame((s) => s.deletedRoutineIds || []);
  const restoreDefaultRoutines = useGame((s) => s.restoreDefaultRoutines);
  const start = useGame((s) => s.startWorkout);
  const del = useGame((s) => s.deleteRoutine);
  const name = useGame((s) => s.name);
  const streak = useGame((s) => s.streak);
  const myAvatar = useMyAvatar();
  const stats = useStats();
  const [creating, setCreating] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [tab, setTab] = useState<"routines" | "boss">("routines");

  const prev = stats.level > 1 ? expForLevel(stats.level - 1) : 0;
  const next = expForLevel(stats.level);
  const expInLevel = stats.exp - prev;
  const expNeeded = next - prev;

  const routines = allRoutines(custom, deletedRoutineIds);
  const firstRoutine = routines[0];

  return (
    <div className="space-y-4">
      {/* 8 & 9. Top Hero Profile Card: Shield expands into frame & Avatar glides into idle */}
      <motion.div
        layoutId="hero-shield-panel"
        transition={SPRING}
        className="panel p-3.5 sm:p-4"
      >
        <div className="flex items-center gap-4 sm:gap-6 px-1">
          <motion.div
            layoutId="hero-avatar-box"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            transition={APPLE_TAP}
            className="frame9 shrink-0 overflow-hidden bg-black ml-1 cursor-pointer"
          >
            <Avatar cfg={myAvatar} scale={1.8} interactive animate />
          </motion.div>
          <motion.div
            className="min-w-0 flex-1 space-y-2 pl-3 sm:pl-4 pr-1.5"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...APPLE_SPRING, delay: 0.04 }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="pixel-title text-sm text-white truncate font-bold">{name}</span>
              <motion.span
                whileHover={{ scale: 1.08 }}
                transition={APPLE_SPRING}
                className="pixel-title text-[8px] text-[var(--gold)] border border-[#2c3350] bg-[#10131f] px-1.5 py-0.5 shrink-0 shadow-[1px_1px_0_#000]"
              >
                LV {stats.level}
              </motion.span>
            </div>
            <div className="pixel-title text-[7.5px] text-[#8b93b8]">
              {titleOf(stats.level).toUpperCase()} · <span className="text-[var(--gold)]">🔥 RACHA {streak}D</span>
            </div>

            {/* EXP Bar: fills left to right on morph */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[7px] pixel-title text-[#8b93b8]">
                <span>EXP</span>
                <span className="tabular-nums text-white">{expInLevel}/{expNeeded}</span>
              </div>
              <Bar
                value={expInLevel}
                max={expNeeded}
                color="var(--green)"
                h={7}
                fillDelay={0.06}
                minVisual={0.12}
              />
            </div>

            {/* STR Bar: fills left to right on morph */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[7px] pixel-title text-[#8b93b8]">
                <span>STR (FUERZA)</span>
                <span className="text-[var(--red)] tabular-nums font-bold">{stats.str} PTS</span>
              </div>
              <Bar
                value={stats.str}
                max={Math.max(120, stats.str * 1.2)}
                color="var(--red)"
                h={7}
                fillDelay={0.1}
                minVisual={0.15}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* TABS SELECTOR: RUTINAS vs RAID BOSS & MISIONES */}
      <div className="mt-6 mb-2 grid grid-cols-2 gap-2.5 px-0.5">
        <motion.button
          whileHover={{ scale: 1.015, y: -1 }}
          whileTap={{ scale: 0.94, y: 1 }}
          transition={APPLE_TAP}
          onClick={(e) => {
            if (tab !== "routines") {
              setTab("routines");
              sfx.whoosh();
              haptic(10);
              fxAt(e.currentTarget, (x, y) => [{ kind: "burst", x, y, color: "#ffe14d", count: 14 }]);
            }
          }}
          className={`relative flex items-center justify-between p-2.5 border-2 text-left transition-all ${
            tab === "routines"
              ? "border-black bg-gradient-to-b from-[#ffe14d] via-[#facc15] to-[#d4a017] text-black shadow-[3px_3px_0_#000]"
              : "border-[#2c3350] bg-[#141826] text-[#8b93b8] hover:border-[#4a5280] shadow-[2px_2px_0_#000]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center border border-black/40 bg-black/15 text-sm shrink-0">
              ⚔
            </span>
            <div className="min-w-0">
              <div className={`pixel-title text-[8.5px] leading-tight font-bold ${tab === "routines" ? "text-black" : "text-white"}`}>
                RUTINAS
              </div>
              <div className={`pixel-title text-[6.5px] leading-none ${tab === "routines" ? "text-black/80" : "text-[#8b93b8]"}`}>
                MISIÓN & GYM
              </div>
            </div>
          </div>
          {tab === "routines" && (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={APPLE_BOUNCE}
              className="pixel-title text-[7px] border border-black/30 bg-black/20 px-1 py-0.5 text-black shrink-0 font-bold"
            >
              ACTIVO
            </motion.span>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.015, y: -1 }}
          whileTap={{ scale: 0.94, y: 1 }}
          transition={APPLE_TAP}
          onClick={(e) => {
            if (tab !== "boss") {
              setTab("boss");
              sfx.bossRoar();
              haptic([25, 15, 45]);
              fxAt(e.currentTarget, (x, y) => [
                { kind: "burst", x, y, color: "#ff3f6c", count: 20 },
                { kind: "text", x, y: y - 24, text: "¡AL COMBATE!", color: "#ff3f6c" },
              ]);
            }
          }}
          className={`relative flex items-center justify-between p-2.5 border-2 text-left transition-all ${
            tab === "boss"
              ? "border-black bg-gradient-to-b from-[#ff3f6c] via-[#e11d48] to-[#9f1239] text-white shadow-[3px_3px_0_#000]"
              : "border-[#3d1822] bg-[#160d13] text-[#8b93b8] hover:border-[#ff3f6c] shadow-[2px_2px_0_#000]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center border border-black/40 bg-black/20 text-sm shrink-0">
              👹
            </span>
            <div className="min-w-0">
              <div className={`pixel-title text-[8.5px] leading-tight font-bold ${tab === "boss" ? "text-white" : "text-[#ff6b8b]"}`}>
                RAID BOSS
              </div>
              <div className={`pixel-title text-[6.5px] leading-none ${tab === "boss" ? "text-white/80" : "text-[#8b93b8]"}`}>
                JEFE SEMANAL
              </div>
            </div>
          </div>
          {tab === "boss" ? (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={APPLE_BOUNCE}
              className="pixel-title text-[7px] border border-white/30 bg-black/30 px-1 py-0.5 text-white shrink-0 font-bold"
            >
              ACTIVO
            </motion.span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-[var(--red)] animate-pulse shrink-0" />
          )}
        </motion.button>
      </div>

      {/* ANIMATED TRANSITION BETWEEN RUTINAS AND RAID BOSS */}
      <AnimatePresence mode="wait" initial={false}>
        {tab === "boss" ? (
          <motion.div
            key="tab-boss"
            initial={{ opacity: 0, x: 36, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 36, scale: 0.98 }}
            transition={APPLE_SPRING}
            className="space-y-4"
          >
            <RaidBossView />
          </motion.div>
        ) : (
          <motion.div
            key="tab-routines"
            initial={{ opacity: 0, x: -36, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -36, scale: 0.98 }}
            transition={APPLE_SPRING}
            className="space-y-4"
          >
            {/* 10. Main Start Button */}
            {firstRoutine && (
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...APPLE_SPRING, delay: 0.04 }}
              >
                <PixelButton
                  variant="gold"
                  className="w-full py-3 text-xs flex items-center justify-center gap-2 shadow-[4px_4px_0_#000]"
                  onClick={(e) => {
                    sfx.whoosh();
                    fxAt(e.currentTarget, (x, y) => [{ kind: "burst", x, y, count: 16 }]);
                    start(firstRoutine);
                  }}
                >
                  <span>⚔ EMPEZAR ENTRENAMIENTO</span>
                  <span className="opacity-80 text-[9px]">({firstRoutine.name})</span>
                </PixelButton>
              </motion.div>
            )}

            {/* Routine Mission Cards with Stagger (0.04s between elements) */}
            <div className="space-y-2">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...APPLE_SPRING, delay: 0.08 }}
                className="flex items-center justify-between"
              >
                <h2 className="pixel-title text-xs text-[var(--gold)]">▶ ELIGE TU MISIÓN</h2>
                <span className="mono text-xs text-[#8b93b8]">{routines.length} rutinas</span>
              </motion.div>
              <div className="grid grid-cols-2 gap-3">
                {routines.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...APPLE_SPRING, delay: 0.12 + i * 0.04 }}
                  >
                    <PixelButton
                      variant={r.custom ? "cyan" : "primary"}
                      className="flex h-28 w-full flex-col items-start justify-between p-3 text-left"
                      onClick={(e) => {
                        sfx.whoosh();
                        fxAt(e.currentTarget, (x, y) => [{ kind: "burst", x, y, count: 10 }]);
                        start(r);
                      }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center">
                        <PixelArtIcon name={r.icon} size={28} />
                      </div>
                      <span className="pixel-title text-[10px] leading-relaxed">{r.name}</span>
                      <span className="mono text-xs opacity-80">{r.exercises.length} ejercicios</span>
                    </PixelButton>
                    <div className="mt-1.5 flex gap-1 w-full">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        transition={APPLE_TAP}
                        className="mono flex-1 border border-[#2c3350] bg-[#141826] py-1.5 text-xs text-[var(--cyan)] active:border-[var(--cyan)]"
                        onClick={() => setEditingRoutine(r)}
                        aria-label={`Editar ${r.name}`}
                      >
                        ✎ editar
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        transition={APPLE_TAP}
                        className="mono flex-1 border border-[#2c3350] bg-[#141826] py-1.5 text-xs text-[var(--red)] active:border-[var(--red)]"
                        onClick={() => del(r.id)}
                        aria-label={`Borrar ${r.name}`}
                      >
                        ✕ borrar
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...APPLE_SPRING, delay: 0.12 + routines.length * 0.04 }}
                >
                  <PixelButton
                    variant="ghost"
                    className="flex h-28 w-full flex-col items-center justify-center gap-2"
                    onClick={() => setCreating(true)}
                  >
                    <span className="text-2xl">＋</span>
                    <span className="pixel-title text-[9px]">CREAR RUTINA</span>
                  </PixelButton>
                </motion.div>
              </div>
              {deletedRoutineIds.length > 0 && (
                <div className="flex justify-center pt-2">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    transition={APPLE_TAP}
                    onClick={() => {
                      restoreDefaultRoutines();
                      sfx.coin();
                      haptic(10);
                    }}
                    className="pixel-title text-[7.5px] text-[#8b93b8] hover:text-[var(--gold)] underline transition-colors"
                  >
                    ↺ RESTAURAR RUTINAS DE SERIE ({deletedRoutineIds.length} eliminadas)
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {creating && <RoutineBuilder onClose={() => setCreating(false)} />}
        {editingRoutine && (
          <RoutineBuilder
            initial={editingRoutine}
            onClose={() => setEditingRoutine(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RoutineBuilder({ onClose, initial }: { onClose: () => void; initial?: Routine }) {
  const save = useGame((s) => s.saveRoutine);
  const [name, setName] = useState(initial?.name || "MI RUTINA");
  const [icon, setIcon] = useState<string>(initial?.icon || "biceps");
  const [sel, setSel] = useState<string[]>(initial?.exercises || []);

  return (
    <Sheet
      onClose={onClose}
      title={initial ? "EDITAR RUTINA" : "NUEVA RUTINA"}
      footer={
        <PixelButton
          className="w-full py-3 text-xs"
          variant="gold"
          disabled={!sel.length}
          onClick={() => {
            save({
              id: initial?.id || ("c" + Date.now()),
              name: name.trim() || "MI RUTINA",
              icon: icon || "biceps",
              exercises: sel,
            });
            sfx.coin();
            onClose();
          }}
        >
          GUARDAR RUTINA ({sel.length})
        </PixelButton>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[var(--gold)] bg-[#10131f] shadow-[2px_2px_0_#000]">
            <PixelArtIcon name={icon} size={30} />
          </div>
          <input
            className="pinput flex-1 w-full"
            value={name}
            maxLength={14}
            placeholder="NOMBRE DE RUTINA"
            onChange={(e) => setName(e.target.value.toUpperCase())}
          />
        </div>

        {/* Pixel-Art Icon Picker */}
        <div>
          <div className="pixel-title text-[8px] text-[var(--gold)] mb-1.5">
            ELIGE ICONO PIXEL-ART:
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 p-2 border-2 border-[#2c3350] bg-[#10131f] max-h-40 overflow-y-auto">
            {PIXEL_ROUTINE_ICONS.map((ic) => (
              <motion.button
                key={ic.id}
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                transition={APPLE_TAP}
                onClick={() => {
                  setIcon(ic.id);
                  sfx.tick();
                }}
                className={`flex flex-col items-center gap-1 p-1.5 border-2 transition-colors ${
                  icon === ic.id
                    ? "border-[var(--gold)] bg-[#2a2410] shadow-[2px_2px_0_#000]"
                    : "border-[#2c3350] bg-[#141826] active:border-[#4a5280]"
                }`}
              >
                <PixelArtIcon name={ic.id} size={22} />
                <span className="pixel-title text-[6px] text-[#cbd5e1] truncate max-w-full">
                  {ic.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        <ExerciseList selected={sel} onPick={(id) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])} />
      </div>
    </Sheet>
  );
}

const SUBS = Array.from(new Set(EXERCISES.map((e) => e.sub ?? MUSCLE_LABEL[e.muscle])));
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function ExerciseList({ selected = [], onPick }: { selected?: string[]; onPick: (id: string) => void }) {
  const [sub, setSub] = useState<string>("TODOS");
  const [q, setQ] = useState("");
  const nq = norm(q.trim());
  const list = EXERCISES.filter((e) => (sub === "TODOS" || (e.sub ?? MUSCLE_LABEL[e.muscle]) === sub) && (!nq || norm(e.name).includes(nq)));
  return (
    <div className="space-y-2">
      <input className="pinput w-full" placeholder={`BUSCAR (${EXERCISES.length})...`} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex gap-1 overflow-x-auto pb-1">
        {["TODOS", ...SUBS].map((s) => (
          <motion.button
            key={s}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={APPLE_TAP}
            onClick={() => { setSub(s); sfx.tick(); }}
            className={`pixel-title shrink-0 border-2 px-2 py-2 text-[7px] transition-colors ${sub === s ? "border-[var(--gold)] bg-[var(--gold)] text-black" : "border-[#2c3350] text-[#8b93b8]"}`}
          >
            {s.toUpperCase()}
          </motion.button>
        ))}
      </div>
      <div className="mono text-xs text-[#8b93b8]">{list.length} ejercicios</div>
      {list.map((e) => {
        const on = selected.includes(e.id);
        return (
          <motion.button
            key={e.id}
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.96 }}
            transition={APPLE_TAP}
            onClick={() => { sfx.tick(); haptic(5); onPick(e.id); }}
            style={{ contentVisibility: "auto", containIntrinsicSize: "auto 44px" }}
            className={`flex w-full items-center justify-between gap-2 border-2 px-3 py-2 text-left transition-colors ${on ? "border-[var(--gold)] bg-[#2a2410]" : "border-[#2c3350] bg-[#141826]"}`}
          >
            <span className="mono text-base leading-tight">{e.name}</span>
            <span className="pixel-title shrink-0 text-[7px] opacity-70">{(e.sub ?? MUSCLE_LABEL[e.muscle]).toUpperCase()}{on ? " ✓" : ""}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function Sheet({ children, onClose, title, footer }: { children: React.ReactNode; onClose: () => void; title: string; footer?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // lock background scroll
    return () => { document.body.style.overflow = prev; };
  }, []);
  if (!mounted) return null;
  // Portal to <body>: escapes transformed ancestors (tab transition / shell shake) so `fixed` is viewport-relative
  return createPortal(
    <motion.div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="panel flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden shadow-2xl touch-pan-y"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={SPRING}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
            sfx.whoosh();
          }
        }}
      >
        <div className="shrink-0 px-4 pt-2.5 pb-2 border-b-2 border-[#2c3350] bg-[#121626]">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-[#4a5280]" />
          <div className="flex items-center justify-between">
            <h3 className="pixel-title text-xs text-[var(--gold)]">{title}</h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              transition={APPLE_TAP}
              className="pixel-title flex h-7 w-7 items-center justify-center border border-[#2c3350] bg-[#141826] text-xs text-[#8b93b8] active:text-white"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </motion.button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">{children}</div>
        {footer && (
          <div className="shrink-0 border-t-4 border-black bg-[#10131f] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3">
            {footer}
          </div>
        )}
        {!footer && <div className="shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]" />}
      </motion.div>
    </motion.div>,
    document.body,
  );
}

/* ---------------- Active logger ---------------- */
function ActiveLogger() {
  const { name, startedAt, count } = useGame(useShallow((s) => ({ name: s.active!.name, startedAt: s.active!.startedAt, count: s.active!.exercises.length })));
  const finish = useGame((s) => s.finishWorkout);
  const cancel = useGame((s) => s.cancelWorkout);
  const addExercise = useGame((s) => s.addExercise);
  const [picking, setPicking] = useState(false);
  const [confirm, setConfirm] = useState(false);

  // Wake Lock API: Keep screen awake during workouts
  useEffect(() => {
    let sentinel: any = null;
    const acquire = async () => {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator && document.visibilityState === "visible") {
        try {
          sentinel = await (navigator as any).wakeLock.request("screen");
        } catch {}
      }
    };
    acquire();
    const onVis = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (sentinel) sentinel.release().catch(() => {});
    };
  }, []);

  return (
    <div className="space-y-3 pb-4">
      <Panel className="flex items-center justify-between p-3">
        <div>
          <div className="pixel-title text-[10px] text-[var(--gold)]">⚔ {name}</div>
          <Elapsed since={startedAt} />
        </div>
        <PixelButton variant="gold" className="px-3 py-2 text-[10px]" onClick={(e) => {
          const log = finish();
          if (log) {
            sfx.levelUp(); haptic([20, 40, 20, 40, 60]);
            fxAt(e.currentTarget, (x, y) => [{ kind: "burst", x, y, big: true, count: 50 }, { kind: "text", x: innerWidth / 2, y: innerHeight / 2, text: `+${log.exp} EXP  +20 ORO`, color: "#ffe14d" }, { kind: "shake", power: 3 }]);
          }
        }}>FIN ✓</PixelButton>
      </Panel>

      {Array.from({ length: count }, (_, i) => <ExerciseCard key={i} index={i} total={count} />)}

      <div className="grid grid-cols-2 gap-3">
        <PixelButton variant="ghost" className="py-3 text-[10px]" onClick={() => setPicking(true)}>＋ EJERCICIO</PixelButton>
        <PixelButton variant="danger" className="py-3 text-[10px]" onClick={() => confirm ? cancel() : (setConfirm(true), setTimeout(() => setConfirm(false), 2500))}>
          {confirm ? "¿SEGURO?" : "ABANDONAR"}
        </PixelButton>
      </div>
      <AnimatePresence>
        {picking && <Sheet title="AÑADIR EJERCICIO" onClose={() => setPicking(false)}><ExerciseList onPick={(id) => { addExercise(id); setPicking(false); }} /></Sheet>}
      </AnimatePresence>
    </div>
  );
}

function Elapsed({ since }: { since: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const tick = () => {
      const s = Math.floor((Date.now() - since) / 1000);
      if (ref.current) ref.current.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [since]);
  return <span ref={ref} className="mono text-lg tabular-nums text-[var(--cyan)]">00:00</span>;
}

const ExerciseCard = memo(function ExerciseCard({ index, total }: { index: number; total: number }) {
  const entry = useGame((s) => s.active?.exercises[index]);
  const best = useGame((s) => entry ? s.best[entry.exId] : undefined);
  const addSet = useGame((s) => s.addSet);
  const removeEx = useGame((s) => s.removeExercise);
  const reorder = useGame((s) => s.reorderActiveExercises);
  const restTimeByEx = useGame((s) => s.restTimeByEx);
  const setRestTimeForEx = useGame((s) => s.setRestTimeForEx);
  const [calcKg, setCalcKg] = useState<number | null>(null);

  if (!entry) return null;
  const ex = EX[entry.exId];
  const currentRest = restTimeByEx[entry.exId] ?? defaultRestForExercise(ex);

  const cycleRest = () => {
    const opts = [60, 90, 120, 180, 240];
    const next = opts[(opts.indexOf(currentRest) + 1) % opts.length];
    setRestTimeForEx(entry.exId, next);
    sfx.tick();
  };

  const lastKg = entry.sets[entry.sets.length - 1]?.kg ?? ex?.defKg ?? 60;

  return (
    <motion.div layout="position" transition={SPRING} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Panel className="p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <div className="mono text-lg leading-tight">{ex?.name ?? entry.exId}</div>
            <div className="pixel-title text-[8px] text-[#8b93b8]">{ex && MUSCLE_LABEL[ex.muscle]}{best ? ` · 1RM ${best.e1rm.toFixed(1)}kg` : ""}</div>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.82 }}
              transition={APPLE_TAP}
              disabled={index === 0}
              onClick={() => { reorder(index, index - 1); sfx.tick(); }}
              className="pixel-title flex h-7 w-7 items-center justify-center border border-[#2c3350] bg-[#141826] text-[9px] text-[#8b93b8] disabled:opacity-20 active:border-[var(--gold)] active:text-white"
              aria-label="Subir ejercicio"
            >
              ▲
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.82 }}
              transition={APPLE_TAP}
              disabled={index === total - 1}
              onClick={() => { reorder(index, index + 1); sfx.tick(); }}
              className="pixel-title flex h-7 w-7 items-center justify-center border border-[#2c3350] bg-[#141826] text-[9px] text-[#8b93b8] disabled:opacity-20 active:border-[var(--gold)] active:text-white"
              aria-label="Bajar ejercicio"
            >
              ▼
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.82 }}
              transition={APPLE_TAP}
              className="pixel-title flex h-7 w-7 items-center justify-center border border-[#2c3350] bg-[#141826] text-[10px] text-[#8b93b8] hover:text-[var(--red)] hover:border-[var(--red)]"
              onClick={() => removeEx(index)}
              aria-label="Quitar ejercicio"
            >
              ✕
            </motion.button>
          </div>
        </div>

        {/* Toolbar: Custom Rest time & Plate Calculator */}
        <div className="mb-2.5 flex items-center justify-between border-y border-[#2c3350] py-1.5 text-[8px]">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
            transition={APPLE_TAP}
            onClick={cycleRest}
            className="pixel-title flex items-center gap-1.5 text-[var(--cyan)] active:text-white"
          >
            <span className="opacity-80">⏱ DESCANSO:</span>
            <span className="border border-[#2c3350] bg-[#141826] px-1.5 py-0.5 font-bold shadow-[1px_1px_0_#000]">{currentRest}s</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.92, y: 1 }}
            transition={APPLE_TAP}
            onClick={() => setCalcKg(lastKg)}
            className="pixel-title flex items-center gap-1 border border-[var(--gold)] bg-[#241e0a] px-2 py-1 text-[var(--gold)] shadow-[1px_1px_0_#000]"
          >
            <span>🏋️ DISCOS</span>
          </motion.button>
        </div>

        <div className="mono grid grid-cols-[1.1rem_1fr_1fr_2.4rem_2.6rem] items-center gap-1 px-0.5 text-xs text-[#8b93b8]">
          <span className="text-center">#</span><span className="text-center">KG</span><span className="text-center">REPS</span><span className="text-center">RIR</span><span />
        </div>
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {entry.sets.map((s, j) => <SetRow key={s.id} i={index} j={j} />)}
          </AnimatePresence>
        </div>
        <PixelButton variant="ghost" className="mt-2 w-full py-2.5 text-[9px]" onClick={() => { addSet(index); sfx.tick(); }}>＋ SERIE (auto-fill)</PixelButton>

        {calcKg !== null && (
          <PlateCalculator initialKg={calcKg} onClose={() => setCalcKg(null)} />
        )}
      </Panel>
    </motion.div>
  );
});

const SetRow = memo(function SetRow({ i, j }: { i: number; j: number }) {
  const s = useGame((st) => st.active?.exercises[i]?.sets[j]);
  const exId = useGame((st) => st.active?.exercises[i]?.exId);
  const restTimeByEx = useGame((st) => st.restTimeByEx);
  const update = useGame((st) => st.updateSet);
  const complete = useGame((st) => st.completeSet);
  const remove = useGame((st) => st.removeSet);
  const startRest = useGame((st) => st.startRest);
  if (!s) return null;

  const step = (patch: { kg?: number; reps?: number }) => { update(i, j, patch); sfx.tick(); haptic(4); };

  const cycleRir = () => {
    const cur = s.rir;
    const next = cur === undefined ? 2 : cur === 2 ? 1 : cur === 1 ? 0 : undefined;
    update(i, j, { rir: next });
    sfx.tick();
  };

  const onDone = (el: HTMLElement) => {
    const res = complete(i, j);
    if (!res) return;
    if (res.exp < 0) { sfx.error(); return; }
    sfx.set(); haptic(res.pr ? [15, 30, 15, 30, 40] : 12);
    const restSeconds = exId ? (restTimeByEx[exId] ?? defaultRestForExercise(EX[exId])) : 90;
    startRest(restSeconds);
    fxAt(el, (x, y) => [
      { kind: "burst", x, y, color: res.pr ? "#ff3f6c" : "#7dff6a", count: res.pr ? 40 : 16, big: res.pr },
      { kind: "text", x, y: y - 16, text: `+${res.exp} EXP`, color: "#7dff6a" },
      { kind: "text", x: x - 60, y: y + 4, text: `+${res.gold}G`, color: "#ffe14d" },
      { kind: "shake", power: res.pr ? 3 : 2 },
    ]);
    if (res.pr) {
      setTimeout(() => { sfx.pr(); fx({ kind: "pr", name: EX[exId!]?.name ?? "" }); fxAt(el, (x, y) => [{ kind: "text", x, y: y - 40, text: `+${res.strGain} STR`, color: "#ff3f6c" }]); }, 120);
    }
    if (res.levelUp) setTimeout(() => { sfx.levelUp(); fx({ kind: "levelup", level: res.levelUp! }); }, res.pr ? 2100 : 200);
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      transition={SPRING}
      drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.5, right: 0 }} dragSnapToOrigin
      onDragEnd={(_, info) => { if (info.offset.x < -90 && !s.done) { remove(i, j); sfx.whoosh(); } }}
      className={`grid grid-cols-[1.1rem_1fr_1fr_2.4rem_2.6rem] items-center gap-1 border-2 p-1 ${s.done ? "border-[#3a7a30] bg-[#15291a]" : "border-[#2c3350] bg-[#10131f]"}`}
    >
      <span className="pixel-title text-center text-[10px] text-[#8b93b8]">{j + 1}</span>
      <Stepper value={s.kg} unit="" onMinus={() => step({ kg: s.kg - 2.5 })} onPlus={() => step({ kg: s.kg + 2.5 })} onSet={(v) => update(i, j, { kg: v })} disabled={s.done} decimals />
      <Stepper value={s.reps} unit="" onMinus={() => step({ reps: s.reps - 1 })} onPlus={() => step({ reps: s.reps + 1 })} onSet={(v) => update(i, j, { reps: v })} disabled={s.done} />

      {/* RIR (Repeticiones en Reserva) */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.88 }}
        transition={APPLE_TAP}
        onClick={cycleRir}
        disabled={s.done}
        className={`pixel-title flex h-10 flex-col items-center justify-center gap-0.5 border px-0.5 text-center leading-none transition-colors ${
          s.rir === 0
            ? "border-[var(--red)] bg-[#3a151f] text-[var(--red)] font-bold shadow-[inset_0_0_8px_rgba(255,63,108,0.3)]"
            : s.rir !== undefined
            ? "border-[var(--cyan)] bg-[#0d2330] text-[var(--cyan)] font-bold shadow-[inset_0_0_8px_rgba(61,242,255,0.2)]"
            : "border-[#2c3350] bg-[#141826] text-[#636c8f]"
        }`}
        title="RIR (Repeticiones en Reserva)"
      >
        <span className="text-[6.5px] opacity-70">RIR</span>
        <span className="text-[8px] font-bold">
          {s.rir === 0 ? "FALLO" : s.rir !== undefined ? s.rir : "—"}
        </span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.86 }}
        transition={APPLE_TAP}
        onClick={(e) => onDone(e.currentTarget)}
        className={`pixel-title h-10 border-2 text-sm flex items-center justify-center ${s.done ? "border-[#7dff6a] bg-[#3a7a30] text-white shadow-[0_0_8px_rgba(125,255,106,0.35)]" : "border-[#4a5280] bg-[#1d2236] text-[#8b93b8]"}`}
        aria-label={s.done ? "Deshacer serie" : "Completar serie"}
      >
        <motion.span
          animate={s.done ? { scale: [0.75, 1.3, 1], rotate: [0, -6, 0] } : { scale: 1 }}
          transition={APPLE_BOUNCE}
        >
          ✓
        </motion.span>
      </motion.button>
    </motion.div>
  );
});

function Stepper({
  value,
  onMinus,
  onPlus,
  onSet,
  disabled,
  decimals,
}: {
  value: number;
  unit: string;
  onMinus: () => void;
  onPlus: () => void;
  onSet: (v: number) => void;
  disabled?: boolean;
  decimals?: boolean;
}) {
  const [text, setText] = useState<string>(String(value));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setText(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const cleaned = raw.replace(",", ".");
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      onSet(num);
    }
  };

  const handleBlur = () => {
    isFocused.current = false;
    const cleaned = text.replace(",", ".");
    const num = parseFloat(cleaned);
    if (isNaN(num) || text.trim() === "") {
      onSet(0);
      setText("0");
    } else {
      onSet(num);
      setText(String(num));
    }
  };

  return (
    <div className="flex items-stretch border border-[#2c3350] bg-[#0c0e17] overflow-hidden">
      <motion.button
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.82 }}
        transition={APPLE_TAP}
        disabled={disabled}
        onClick={onMinus}
        className="step-btn"
        aria-label="menos"
      >
        −
      </motion.button>
      <input
        inputMode={decimals ? "decimal" : "numeric"}
        disabled={disabled}
        value={text}
        onChange={handleChange}
        onFocus={(e) => {
          isFocused.current = true;
          e.target.select();
        }}
        onBlur={handleBlur}
        className="mono w-full min-w-0 bg-transparent text-center text-sm sm:text-base font-bold tabular-nums outline-none text-white px-0.5"
      />
      <motion.button
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.82 }}
        transition={APPLE_TAP}
        disabled={disabled}
        onClick={onPlus}
        className="step-btn"
        aria-label="más"
      >
        +
      </motion.button>
    </div>
  );
}

/* ---------------- Floating arcade rest timer (persists offline & background) ---------------- */
export function RestTimer() {
  const endsAt = useGame((s) => s.restEndsAt);
  const stop = useGame((s) => s.stopRest);
  const start = useGame((s) => s.startRest);
  const ref = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!endsAt) {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CANCEL_REST_TIMER" });
      }
      return;
    }

    // Request notification permission for background alarms on mobile/PWA
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    // Forward timer to Service Worker for background system notification when screen is off
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "START_REST_TIMER",
        endsAt,
      });
    }

    const total = Math.max(1, endsAt - Date.now());
    let raf = 0, lastSec = -1;

    const checkResume = () => {
      const left = endsAt - Date.now();
      if (left <= 0) {
        sfx.restDone();
        haptic([80, 60, 80]);
        if (typeof window !== "undefined") {
          fx({ kind: "text", x: window.innerWidth / 2, y: window.innerHeight / 2, text: "¡DESCANSO TERMINADO!", color: "#3df2ff" });
        }
        stop();
      }
    };

    document.addEventListener("visibilitychange", checkResume);
    window.addEventListener("focus", checkResume);

    const loop = () => {
      const left = endsAt - Date.now();
      if (left <= 0) {
        sfx.restDone();
        haptic([80, 60, 80]);
        if (typeof window !== "undefined") {
          fx({ kind: "text", x: window.innerWidth / 2, y: window.innerHeight / 2, text: "¡A POR LA SERIE!", color: "#3df2ff" });
        }
        stop();
        return;
      }
      const sec = Math.ceil(left / 1000);
      if (sec !== lastSec) {
        lastSec = sec;
        if (ref.current) ref.current.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
        if (sec <= 3) sfx.tick();
      }
      if (barRef.current) barRef.current.style.transform = `scaleX(${left / total})`;
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", checkResume);
      window.removeEventListener("focus", checkResume);
    };
  }, [endsAt, stop]);

  return (
    <AnimatePresence>
      {endsAt && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={APPLE_BOUNCE}
          className="panel fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[min(92vw,26rem)] p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
          style={{ x: "-50%" }}
        >
          <div className="flex items-center gap-2">
            <span className="pixel-title text-[9px] text-[var(--cyan)]">DESCANSO</span>
            <span ref={ref} className="mono flex-1 text-center text-2xl tabular-nums font-bold text-[var(--gold)]">
              1:30
            </span>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              transition={APPLE_TAP}
              className="pixel-title border-2 border-[#4a5280] bg-[#141826] px-3 py-1.5 min-h-[34px] text-[9px] text-white active:border-[var(--gold)]"
              onClick={() => {
                start(Math.max(0, (endsAt - Date.now()) / 1000) + 30);
                sfx.tick();
              }}
            >
              +30s
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              transition={APPLE_TAP}
              className="pixel-title border-2 border-[#4a5280] bg-[#141826] px-3 py-1.5 min-h-[34px] text-[9px] text-[#cbd5e1] active:border-[var(--red)]"
              onClick={() => {
                stop();
                sfx.tap();
              }}
            >
              SKIP
            </motion.button>
          </div>
          <div className="pbar mt-2" style={{ height: 8 }}>
            <div ref={barRef} className="pbar-fill bg-[var(--cyan)]" style={{ transformOrigin: "0 50%" }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type { Routine };
