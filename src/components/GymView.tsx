"use client";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { WorkoutSummary, allRoutines, useGame } from "@/lib/store";
import { EX, EXERCISES, MUSCLE_LABEL, Routine, defaultRestForExercise, expForLevel, isBodyweight, titleOf } from "@/lib/data";
import { ACHIEVEMENT_MAP } from "@/lib/achievements";
import { useMyAvatar, useStats } from "@/lib/hooks";
import { fx, fxAt, haptic, sfx } from "@/lib/fx";
import { cancelRemoteRestPush, scheduleRemoteRestPush } from "@/lib/push-client";
import { getSetOverloadAdvice } from "@/lib/overload";
import Avatar from "./Avatar";
import { PixelButton, Panel, Bar, SPRING, APPLE_SPRING, APPLE_TAP, APPLE_BOUNCE, APPLE_FLUID } from "./ui";
import PlateCalculator from "./PlateCalculator";
import RaidBossView from "./RaidBoss";
import { PIXEL_ROUTINE_ICONS, PixelArtIcon } from "./PixelIcon";

export default function GymView() {
  const active = useGame((s) => !!s.active);
  const summary = useGame((s) => s.lastWorkoutSummary);
  const clearSummary = useGame((s) => s.clearWorkoutSummary);
  return (
    <>
      {active ? <ActiveLogger /> : <RoutinePicker />}
      <AnimatePresence>
        {summary && <WorkoutSummaryModal summary={summary} onClose={clearSummary} />}
      </AnimatePresence>
    </>
  );
}

/* ---------------- Routine picker ---------------- */
function RoutinePicker() {
  const custom = useGame((s) => s.customRoutines);
  const deletedRoutineIds = useGame((s) => s.deletedRoutineIds || []);
  const restoreDefaultRoutines = useGame((s) => s.restoreDefaultRoutines);
  const start = useGame((s) => s.startWorkout);
  const del = useGame((s) => s.deleteRoutine);
  const name = useGame((s) => s.name);
  const activeTitle = useGame((s) => s.activeTitle);
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
    <div className="flex flex-col gap-5">
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
            <div className="pixel-title text-[7.5px] text-[#8b93b8] truncate">
              {(activeTitle || titleOf(stats.level)).toUpperCase()} · <span className="text-[var(--gold)]">🔥 RACHA {streak}D</span>
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

      {/* TABS SELECTOR: RUTINAS vs RAID BOSS & MISIONES (strict fixed dimensions) */}
      <div className="grid grid-cols-2 gap-2.5 px-0.5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={APPLE_TAP}
          onClick={(e) => {
            if (tab !== "routines") {
              setTab("routines");
              sfx.whoosh();
              haptic(10);
              fxAt(e.currentTarget, (x, y) => [{ kind: "burst", x, y, color: "#ffe14d", count: 14 }]);
            }
          }}
          className={`relative flex h-[58px] items-center justify-between gap-1.5 px-2.5 border-2 text-left transition-colors ${
            tab === "routines"
              ? "border-black bg-gradient-to-b from-[#ffe14d] via-[#facc15] to-[#d4a017] text-black shadow-[3px_3px_0_#000]"
              : "border-[#2c3350] bg-[#141826] text-[#8b93b8] hover:border-[#4a5280] shadow-[2px_2px_0_#000]"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 items-center justify-center border border-black/40 bg-black/15 text-sm shrink-0">
              ⚔
            </span>
            <div className="min-w-0">
              <div className={`pixel-title text-[8.5px] leading-tight font-bold truncate ${tab === "routines" ? "text-black" : "text-white"}`}>
                RUTINAS
              </div>
              <div className={`pixel-title text-[6.5px] leading-none mt-0.5 truncate ${tab === "routines" ? "text-black/80" : "text-[#8b93b8]"}`}>
                MISIÓN & GYM
              </div>
            </div>
          </div>
          <div className="w-11 flex items-center justify-end shrink-0">
            {tab === "routines" && (
              <span className="pixel-title text-[6.5px] border border-black/30 bg-black/20 px-1 py-0.5 text-black font-bold">
                ACTIVO
              </span>
            )}
          </div>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
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
          className={`relative flex h-[58px] items-center justify-between gap-1.5 px-2.5 border-2 text-left transition-colors ${
            tab === "boss"
              ? "border-black bg-gradient-to-b from-[#ff3f6c] via-[#e11d48] to-[#9f1239] text-white shadow-[3px_3px_0_#000]"
              : "border-[#3d1822] bg-[#160d13] text-[#8b93b8] hover:border-[#ff3f6c] shadow-[2px_2px_0_#000]"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 items-center justify-center border border-black/40 bg-black/20 text-sm shrink-0">
              👹
            </span>
            <div className="min-w-0">
              <div className={`pixel-title text-[8.5px] leading-tight font-bold truncate ${tab === "boss" ? "text-white" : "text-[#ff6b8b]"}`}>
                RAID BOSS
              </div>
              <div className={`pixel-title text-[6.5px] leading-none mt-0.5 truncate ${tab === "boss" ? "text-white/80" : "text-[#8b93b8]"}`}>
                JEFE SEMANAL
              </div>
            </div>
          </div>
          <div className="w-11 flex items-center justify-end shrink-0">
            {tab === "boss" ? (
              <span className="pixel-title text-[6.5px] border border-white/30 bg-black/30 px-1 py-0.5 text-white font-bold">
                ACTIVO
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-[var(--red)] animate-pulse" />
            )}
          </div>
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
            className="flex flex-col gap-5"
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
            className="flex flex-col gap-5"
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
  const [iconCat, setIconCat] = useState<"all" | "muscle" | "equipment" | "attribute">("all");
  const [sel, setSel] = useState<string[]>(initial?.exercises || []);

  const filteredIcons = useMemo(() => {
    if (iconCat === "all") return PIXEL_ROUTINE_ICONS;
    return PIXEL_ROUTINE_ICONS.filter((ic) => ic.category === iconCat);
  }, [iconCat]);

  return (
    <Sheet
      onClose={onClose}
      title={initial ? "EDITAR RUTINA" : "NUEVA RUTINA"}
      footer={
        <PixelButton
          className="w-full py-3.5 text-xs font-bold shadow-[2px_2px_0_#000]"
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
          GUARDAR RUTINA ({sel.length} EJERCICIOS)
        </PixelButton>
      }
    >
      <div className="space-y-4">
        {/* Name & Selected Icon Header */}
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={APPLE_SPRING}
            className="flex h-13 w-13 shrink-0 items-center justify-center border-2 border-[var(--gold)] bg-[#10131f] shadow-[2px_2px_0_#000]"
          >
            <PixelArtIcon name={icon} size={32} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <input
              className="pinput w-full text-sm font-bold uppercase tracking-wide"
              value={name}
              maxLength={16}
              placeholder="NOMBRE DE RUTINA"
              onChange={(e) => setName(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {/* Pixel-Art Icon Picker without inner scroll trap */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="pixel-title text-[8px] text-[var(--gold)] font-bold">
              ELIGE ICONO PIXEL-ART:
            </span>
            <span className="mono text-[10px] text-[var(--cyan)] font-bold">
              {PIXEL_ROUTINE_ICONS.find((x) => x.id === icon)?.label ?? icon.toUpperCase()}
            </span>
          </div>

          {/* Category filter pills for rapid mobile selection */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
            {(
              [
                { id: "all", label: "TODOS (16)" },
                { id: "muscle", label: "MÚSCULOS" },
                { id: "equipment", label: "MATERIAL" },
                { id: "attribute", label: "ATRIBUTOS" },
              ] as const
            ).map((cat) => (
              <motion.button
                key={cat.id}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                transition={APPLE_TAP}
                onClick={() => {
                  setIconCat(cat.id);
                  sfx.tick();
                }}
                className={`pixel-title shrink-0 border-2 px-2.5 py-1.5 text-[7px] transition-colors ${
                  iconCat === cat.id
                    ? "border-[var(--gold)] bg-[var(--gold)] text-black font-bold shadow-[1px_1px_0_#000]"
                    : "border-[#2c3350] bg-[#10131f] text-[#8b93b8]"
                }`}
              >
                {cat.label}
              </motion.button>
            ))}
          </div>

          {/* Smooth, direct grid that flows with the sheet (no inner scroll trap) */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 p-2 border-2 border-[#2c3350] bg-[#10131f] shadow-inner">
            {filteredIcons.map((ic) => (
              <motion.button
                key={ic.id}
                type="button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.9 }}
                transition={APPLE_TAP}
                onClick={() => {
                  setIcon(ic.id);
                  sfx.tick();
                  haptic(4);
                }}
                className={`flex flex-col items-center justify-center gap-1 p-2 min-h-[50px] border-2 transition-colors ${
                  icon === ic.id
                    ? "border-[var(--gold)] bg-[#2a2410] shadow-[2px_2px_0_#000]"
                    : "border-[#2c3350] bg-[#141826] active:border-[#4a5280]"
                }`}
              >
                <PixelArtIcon name={ic.id} size={24} />
                <span className="pixel-title text-[6px] text-[#cbd5e1] truncate max-w-full">
                  {ic.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Exercise Selection List */}
        <div className="pt-1">
          <ExerciseList
            selected={sel}
            onPick={(id) =>
              setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
            }
          />
        </div>
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
  const list = EXERCISES.filter(
    (e) =>
      (sub === "TODOS" || (e.sub ?? MUSCLE_LABEL[e.muscle]) === sub) &&
      (!nq || norm(e.name).includes(nq))
  );

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="pixel-title text-[8px] text-[var(--gold)] font-bold">
          EJERCICIOS ({selected.length} SELECCIONADOS):
        </span>
        <span className="mono text-[10px] text-[#8b93b8]">
          {list.length} disponibles
        </span>
      </div>

      <input
        className="pinput w-full text-xs"
        placeholder={`🔍 BUSCAR EJERCICIO (${EXERCISES.length})...`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {/* Horizontal Muscle Group Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
        {["TODOS", ...SUBS].map((s) => (
          <motion.button
            key={s}
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
            transition={APPLE_TAP}
            onClick={() => {
              setSub(s);
              sfx.tick();
            }}
            className={`pixel-title shrink-0 border-2 px-2.5 py-1.5 text-[7px] transition-colors ${
              sub === s
                ? "border-[var(--gold)] bg-[var(--gold)] text-black font-bold shadow-[1px_1px_0_#000]"
                : "border-[#2c3350] bg-[#10131f] text-[#8b93b8]"
            }`}
          >
            {s.toUpperCase()}
          </motion.button>
        ))}
      </div>

      {/* Exercise list items with touch-friendly min-h-[48px] */}
      <div className="space-y-1.5">
        {list.map((e) => {
          const on = selected.includes(e.id);
          return (
            <motion.button
              key={e.id}
              type="button"
              whileHover={{ scale: 1.01, x: 2 }}
              whileTap={{ scale: 0.96 }}
              transition={APPLE_TAP}
              onClick={() => {
                sfx.tick();
                haptic(5);
                onPick(e.id);
              }}
              className={`flex w-full min-h-[48px] items-center justify-between gap-2 border-2 px-3 py-2 text-left transition-colors ${
                on
                  ? "border-[var(--gold)] bg-[#2a2410] shadow-[2px_2px_0_#000]"
                  : "border-[#2c3350] bg-[#141826] active:border-[#4a5280]"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="mono text-sm leading-tight text-white font-medium">
                  {e.name}
                </div>
                <div className="pixel-title text-[7px] text-[#8b93b8] mt-0.5">
                  {(e.sub ?? MUSCLE_LABEL[e.muscle]).toUpperCase()}
                </div>
              </div>
              <span
                className={`pixel-title shrink-0 px-2 py-1 text-[7.5px] font-bold border ${
                  on
                    ? "border-[var(--gold)] bg-[var(--gold)] text-black shadow-[1px_1px_0_#000]"
                    : "border-[#2c3350] bg-[#10131f] text-[#8b93b8]"
                }`}
              >
                {on ? "✓ AÑADIDO" : "＋ AÑADIR"}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function Sheet({ children, onClose, title, footer }: { children: React.ReactNode; onClose: () => void; title: string; footer?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const dragControls = useDragControls();

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
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="panel flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={SPRING}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 400) {
            onClose();
            sfx.whoosh();
          }
        }}
      >
        {/* Grab bar header - only this area handles pull-down dismissal */}
        <div
          className="shrink-0 px-4 pt-3 pb-2.5 border-b-2 border-[#2c3350] bg-[#121626] cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            dragControls.start(e);
          }}
        >
          <div className="mx-auto mb-2 h-1.5 w-14 rounded-full bg-[#4a5280] active:bg-[var(--gold)] transition-colors" />
          <div className="flex items-center justify-between">
            <h3 className="pixel-title text-xs text-[var(--gold)] font-bold">{title}</h3>
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

        {/* Scrollable body: free vertical scrolling without accidental dismissal */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 touch-pan-y [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
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
  const { name, startedAt, count, doneSetsCount } = useGame(
    useShallow((s) => ({
      name: s.active!.name,
      startedAt: s.active!.startedAt,
      count: s.active!.exercises.length,
      doneSetsCount: s.active!.exercises.reduce(
        (acc, ex) => acc + ex.sets.filter((st) => st.done).length,
        0
      ),
    }))
  );
  const focusMode = useGame((s) => s.focusMode);
  const setFocusMode = useGame((s) => s.setFocusMode);
  const finish = useGame((s) => s.finishWorkout);
  const cancel = useGame((s) => s.cancelWorkout);
  const addExercise = useGame((s) => s.addExercise);
  const [picking, setPicking] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [abandonModal, setAbandonModal] = useState(false);

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

  const handleFinish = (el?: HTMLElement) => {
    const log = finish();
    if (log) {
      sfx.levelUp();
      haptic([20, 40, 20, 40, 60]);
      if (el) {
        fxAt(el, (x, y) => [
          { kind: "burst", x, y, big: true, count: 50 },
          { kind: "text", x: innerWidth / 2, y: innerHeight / 2, text: `+${log.exp} EXP  +20 ORO`, color: "#ffe14d" },
          { kind: "shake", power: 3 },
        ]);
      } else {
        fx({ kind: "text", x: innerWidth / 2, y: innerHeight / 2, text: `+${log.exp} EXP  +20 ORO`, color: "#ffe14d" });
      }
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      <Panel className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <div className="pixel-title text-[10px] text-[var(--gold)] truncate">⚔ {name}</div>
          <Elapsed since={startedAt} />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <PixelButton
            variant={focusMode ? "ghost" : "cyan"}
            className="px-2.5 py-2 text-[9px] flex items-center gap-1"
            onClick={() => {
              sfx.tap();
              haptic(6);
              setFocusMode(!focusMode);
            }}
            title={focusMode ? "Salir del Modo Enfoque para navegar por la app" : "Activar Modo Enfoque"}
          >
            <span>{focusMode ? "🧭 SALIR" : "🎯 ENFOQUE"}</span>
          </PixelButton>
          <PixelButton
            variant="gold"
            className="px-3 py-2 text-[10px]"
            onClick={(e) => handleFinish(e.currentTarget)}
          >
            FIN ✓
          </PixelButton>
        </div>
      </Panel>

      {Array.from({ length: count }, (_, i) => <ExerciseCard key={i} index={i} total={count} />)}

      <div className="grid grid-cols-2 gap-3 mt-1">
        <PixelButton variant="ghost" className="py-3 text-[10px]" onClick={() => setPicking(true)}>＋ EJERCICIO</PixelButton>
        <PixelButton
          variant="danger"
          className="py-3 text-[10px]"
          onClick={() => {
            if (doneSetsCount > 0) {
              setAbandonModal(true);
            } else if (confirm) {
              cancel();
            } else {
              setConfirm(true);
              setTimeout(() => setConfirm(false), 2500);
            }
          }}
        >
          {confirm ? "¿SEGURO?" : "ABANDONAR"}
        </PixelButton>
      </div>
      <AnimatePresence>
        {picking && (
          <Sheet title="AÑADIR EJERCICIO" onClose={() => setPicking(false)}>
            <ExerciseList onPick={(id) => { addExercise(id); setPicking(false); }} />
          </Sheet>
        )}
        {abandonModal && (
          <Sheet title="¿FINALIZAR ENTRENAMIENTO?" onClose={() => setAbandonModal(false)}>
            <div className="space-y-4 text-center py-2">
              <div className="text-3xl">⚠️</div>
              <div className="space-y-1">
                <h4 className="pixel-title text-xs text-[var(--gold)]">
                  LLEVAS {doneSetsCount} {doneSetsCount === 1 ? "SERIE COMPLETADA" : "SERIES COMPLETADAS"}
                </h4>
                <p className="mono text-xs text-[#cbd5e1]">
                  Si descartas la sesión ahora, perderás las marcas registradas en estos ejercicios.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <PixelButton
                  variant="gold"
                  className="w-full py-3 text-[10px]"
                  onClick={(e) => {
                    setAbandonModal(false);
                    handleFinish(e.currentTarget);
                  }}
                >
                  ✓ GUARDAR PROGRESO Y TERMINAR
                </PixelButton>
                <PixelButton
                  variant="ghost"
                  className="w-full py-3 text-[10px]"
                  onClick={() => setAbandonModal(false)}
                >
                  ⚔ SEGUIR ENTRENANDO
                </PixelButton>
                <PixelButton
                  variant="danger"
                  className="w-full py-3 text-[10px]"
                  onClick={() => {
                    setAbandonModal(false);
                    cancel();
                    sfx.whoosh();
                  }}
                >
                  ✕ DESCARTAR TODO SIN GUARDAR
                </PixelButton>
              </div>
            </div>
          </Sheet>
        )}
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
  const bodyweight = useGame((s) => s.bodyweight || 75);
  const history = useGame((s) => s.history || []);
  const addSet = useGame((s) => s.addSet);
  const removeEx = useGame((s) => s.removeExercise);
  const reorder = useGame((s) => s.reorderActiveExercises);
  const restTimeByEx = useGame((s) => s.restTimeByEx);
  const setRestTimeForEx = useGame((s) => s.setRestTimeForEx);
  const [calcKg, setCalcKg] = useState<number | null>(null);

  const pendingSetIndex = Math.max(0, entry?.sets.findIndex((s) => !s.done) ?? 0);
  const currentTargetSet = entry?.sets[pendingSetIndex] ?? entry?.sets[0];
  const overloadAdvice = useMemo(
    () => entry ? getSetOverloadAdvice(history, entry.exId, pendingSetIndex, currentTargetSet?.kg, currentTargetSet?.reps) : null,
    [history, entry?.exId, pendingSetIndex, currentTargetSet?.kg, currentTargetSet?.reps]
  );

  if (!entry) return null;
  const ex = EX[entry.exId];
  const isBw = isBodyweight(ex);
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
            <div className="pixel-title text-[8px] text-[#8b93b8]">
              {ex && MUSCLE_LABEL[ex.muscle]}
              {isBw ? ` · CALISTENIA (${bodyweight}kg) + LASTRE` : ""}
              {best ? ` · 1RM ${best.e1rm.toFixed(1)}kg` : ""}
            </div>
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

        {/* Smart Progressive Overload Objective */}
        {overloadAdvice && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2.5 rounded border border-[#2c3350] bg-[#0c0e17] p-2 text-left shadow-[2px_2px_0_#000]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="pixel-title text-[7.5px] text-[var(--gold)] flex items-center gap-1 font-bold">
                <span>🎯</span> RETO SOBRECARGA PROGRESIVA
              </span>
              {overloadAdvice.hasHistory ? (
                <span className="pixel-title text-[7px] text-[#7dff6a] border border-[#3a7a30] bg-[#15291a] px-1 py-0.5">
                  SERIE {pendingSetIndex + 1}
                </span>
              ) : (
                <span className="pixel-title text-[7px] text-[#8b93b8]">
                  LÍNEA BASE
                </span>
              )}
            </div>
            <p className="mono text-[10.5px] sm:text-xs leading-tight text-[#cbd5e1]">
              {overloadAdvice.summaryText}
            </p>
          </motion.div>
        )}

        <div className="mono grid grid-cols-[1.1rem_1fr_1fr_2.4rem_2.6rem] items-center gap-1 px-0.5 text-xs text-[#8b93b8]">
          <span className="text-center">#</span>
          <span className="text-center">{isBw ? "+KG" : "KG"}</span>
          <span className="text-center">REPS</span>
          <span className="text-center">RIR</span>
          <span />
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
  const history = useGame((st) => st.history || []);
  const restTimeByEx = useGame((st) => st.restTimeByEx);
  const update = useGame((st) => st.updateSet);
  const complete = useGame((st) => st.completeSet);
  const remove = useGame((st) => st.removeSet);
  const startRest = useGame((st) => st.startRest);
  if (!s) return null;

  const ex = exId ? EX[exId] : undefined;
  const isBw = isBodyweight(ex);

  const overloadAdvice = useMemo(
    () => getSetOverloadAdvice(history, exId || "", j, s.kg, s.reps, s.done),
    [history, exId, j, s.kg, s.reps, s.done]
  );

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
    startRest(restSeconds, ex?.name);
    fxAt(el, (x, y) => {
      const effects: any[] = [
        { kind: "burst", x, y, color: res.pr ? "#ff3f6c" : "#7dff6a", count: res.pr ? 40 : 16, big: res.pr },
        { kind: "text", x, y: y - 16, text: `+${res.exp} EXP`, color: "#7dff6a" },
        { kind: "text", x: x - 60, y: y + 4, text: `+${res.gold}G`, color: "#ffe14d" },
        { kind: "shake", power: res.pr ? 3 : 2 },
      ];
      if (overloadAdvice.achieved) {
        effects.push({ kind: "text", x: x + 15, y: y - 36, text: "🔥 ¡SOBRECARGA!", color: "#ffe14d" });
      }
      return effects;
    });
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
      className={`grid grid-cols-[1.1rem_1fr_1fr_2.4rem_2.6rem] items-center gap-1 border-2 p-1 transition-colors ${
        s.done
          ? overloadAdvice.achieved
            ? "border-[var(--gold)] bg-[#241e0a] shadow-[0_0_8px_rgba(255,225,77,0.2)]"
            : "border-[#3a7a30] bg-[#15291a]"
          : "border-[#2c3350] bg-[#10131f]"
      }`}
    >
      <div className="flex flex-col items-center justify-center">
        <span className={`pixel-title text-center text-[10px] ${s.done && overloadAdvice.achieved ? "text-[var(--gold)] font-bold" : "text-[#8b93b8]"}`}>
          {j + 1}
        </span>
        {s.done && overloadAdvice.achieved ? (
          <span className="text-[6.5px] leading-none" title="¡Sobrecarga conseguida!">🔥</span>
        ) : overloadAdvice.hasHistory && !s.done ? (
          <span className="text-[6.5px] leading-none text-[var(--gold)]" title={`Meta: ${overloadAdvice.targetKg}kg × ${overloadAdvice.prevReps} ó ${overloadAdvice.prevKg}kg × ${overloadAdvice.targetReps}`}>🎯</span>
        ) : null}
      </div>
      <Stepper
        value={s.kg}
        unit=""
        badge={isBw ? (s.kg === 0 ? "PC" : "+KG") : undefined}
        onMinus={() => step({ kg: Math.max(0, s.kg - 2.5) })}
        onPlus={() => step({ kg: s.kg + 2.5 })}
        onSet={(v) => update(i, j, { kg: Math.max(0, v) })}
        disabled={s.done}
        decimals
      />
      <Stepper
        value={s.reps}
        unit=""
        onMinus={() => step({ reps: Math.max(0, s.reps - 1) })}
        onPlus={() => step({ reps: s.reps + 1 })}
        onSet={(v) => update(i, j, { reps: Math.max(0, v) })}
        disabled={s.done}
      />

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
  badge,
}: {
  value: number;
  unit: string;
  onMinus: () => void;
  onPlus: () => void;
  onSet: (v: number) => void;
  disabled?: boolean;
  decimals?: boolean;
  badge?: string;
}) {
  const [text, setText] = useState<string>(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setText(String(value));
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const cleaned = raw.replace(",", ".");
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      onSet(Math.max(0, num));
    }
  };

  const handleBlur = () => {
    setFocused(false);
    const cleaned = text.replace(",", ".");
    const num = parseFloat(cleaned);
    if (isNaN(num) || text.trim() === "") {
      onSet(0);
      setText("0");
    } else {
      const clamped = Math.max(0, num);
      onSet(clamped);
      setText(String(clamped));
    }
  };

  return (
    <div className="flex items-stretch border border-[#2c3350] bg-[#0c0e17] overflow-hidden">
      <motion.button
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.82 }}
        transition={APPLE_TAP}
        disabled={disabled || value <= 0}
        onClick={onMinus}
        className="step-btn"
        aria-label="menos"
      >
        −
      </motion.button>
      <div className="relative flex flex-1 min-w-0 items-center justify-center">
        <input
          inputMode={decimals ? "decimal" : "numeric"}
          disabled={disabled}
          value={text}
          onChange={handleChange}
          onFocus={(e) => {
            setFocused(true);
            e.target.select();
          }}
          onBlur={handleBlur}
          className={`mono w-full min-w-0 bg-transparent text-center text-sm sm:text-base font-bold tabular-nums outline-none text-white px-0.5 ${badge && !focused ? "pb-2" : ""}`}
        />
        {badge && !focused && (
          <span className="pointer-events-none absolute bottom-0.5 inset-x-0 text-center pixel-title text-[5.5px] leading-none text-[var(--cyan)] opacity-90">
            {badge}
          </span>
        )}
      </div>
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
export function RestTimer({
  hasNavbar = true,
  showQuickReturn = false,
  onReturnToWorkout,
}: {
  hasNavbar?: boolean;
  showQuickReturn?: boolean;
  onReturnToWorkout?: () => void;
} = {}) {
  const endsAt = useGame((s) => s.restEndsAt);
  const restExName = useGame((s) => s.restExName);
  const restPushOn = useGame((s) => s.pushPrefs?.restPush ?? true);
  const stop = useGame((s) => s.stopRest);
  const start = useGame((s) => s.startRest);
  const ref = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const prevEndsAtRef = useRef<number | null>(null);
  const remoteScheduledRef = useRef<boolean>(false);

  useEffect(() => {
    const prev = prevEndsAtRef.current;
    prevEndsAtRef.current = endsAt;

    if (!endsAt) {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CANCEL_REST_TIMER" });
      }
      if (remoteScheduledRef.current && prev && Date.now() - prev < 4000) {
        cancelRemoteRestPush();
      }
      remoteScheduledRef.current = false;
      return;
    }

    // Request notification permission for background alarms on mobile/PWA
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    let effectAlive = true;

    const postSwTimer = (notifyAt: number) => {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "START_REST_TIMER",
          endsAt,
          notifyAt,
        });
      }
    };

    // Schedule durable server Web Push fallback (works even if phone locks / app closes);
    // delay local SW notification slightly when remote push is armed to avoid double buzz.
    if (restPushOn && endsAt > Date.now() + 1000) {
      if (endsAt !== prev) {
        remoteScheduledRef.current = false;
        postSwTimer(endsAt + 12000);
        scheduleRemoteRestPush(endsAt, restExName || undefined).then((scheduled) => {
          if (!effectAlive) {
            if (scheduled && !useGame.getState().restEndsAt) {
              cancelRemoteRestPush();
            }
            return;
          }
          remoteScheduledRef.current = scheduled;
          if (!scheduled) {
            postSwTimer(endsAt);
          }
        });
      }
    } else {
      if (remoteScheduledRef.current) {
        cancelRemoteRestPush();
        remoteScheduledRef.current = false;
      }
      postSwTimer(endsAt);
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
      effectAlive = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", checkResume);
      window.removeEventListener("focus", checkResume);
    };
  }, [endsAt, restExName, restPushOn, stop]);

  return (
    <AnimatePresence>
      {endsAt && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={APPLE_BOUNCE}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            if (showQuickReturn && onReturnToWorkout) {
              sfx.whoosh();
              haptic(8);
              onReturnToWorkout();
            }
          }}
          className={`panel fixed left-1/2 z-50 w-[min(92vw,26rem)] p-2.5 shadow-[0_6px_24px_rgba(0,0,0,0.85)] transition-[bottom] duration-200 ${
            hasNavbar
              ? "bottom-[calc(5.25rem+env(safe-area-inset-bottom))]"
              : "bottom-[calc(1rem+env(safe-area-inset-bottom))]"
          } ${showQuickReturn ? "cursor-pointer ring-2 ring-[var(--cyan)]/70" : ""}`}
          style={{ x: "-50%" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex flex-col min-w-0">
              <span className="pixel-title text-[9px] text-[var(--cyan)]">DESCANSO</span>
              {showQuickReturn && (
                <span className="pixel-title text-[6.5px] text-[var(--gold)] animate-pulse leading-tight">
                  ▶ VOLVER AL ENTRENO
                </span>
              )}
            </div>
            <span ref={ref} className="mono flex-1 text-center text-2xl tabular-nums font-bold text-[var(--gold)]">
              1:30
            </span>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              transition={APPLE_TAP}
              className="pixel-title border-2 border-[#4a5280] bg-[#141826] px-3 py-1.5 min-h-[34px] text-[9px] text-white active:border-[var(--gold)]"
              onClick={() => {
                start(Math.max(0, (endsAt - Date.now()) / 1000) + 30, restExName || undefined);
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

/* ---------------- Post-Workout Epic RPG Summary Modal ("Misión Completada") ---------------- */
function WorkoutSummaryModal({
  summary,
  onClose,
}: {
  summary: WorkoutSummary;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const myAvatar = useMyAvatar();

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!mounted) return null;

  const totalSec = Math.floor(summary.durationMs / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const durStr = mins > 0 ? `${mins}m ${String(secs).padStart(2, "0")}s` : `${secs}s`;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.78, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={APPLE_BOUNCE}
        className="panel flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden border-4 border-[var(--gold)] bg-[#141826] shadow-[0_0_40px_rgba(255,225,77,0.28)]"
      >
        <div className="shrink-0 border-b-2 border-[#2c3350] bg-[#10131f] px-4 py-3 text-center">
          <div className="pixel-title text-[8.5px] text-[var(--green)] tracking-wider">
            ★ ¡MISIÓN COMPLETADA! ★
          </div>
          <h3 className="pixel-title mt-1 text-sm text-[var(--gold)] truncate">
            ⚔ {summary.name}
          </h3>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5 text-center">
          {/* Flexing Hero & Earned Ribbon */}
          <div className="flex items-center justify-center gap-4">
            <div className="frame9 bg-black shrink-0">
              <Avatar cfg={myAvatar} scale={1.7} interactive animate />
            </div>
            <div className="flex-1 space-y-1.5 text-left">
              <div className="border-2 border-[var(--gold)] bg-[#241e0a] px-2.5 py-1.5 shadow-[2px_2px_0_#000]">
                <div className="pixel-title text-[6.5px] text-[var(--gold)]">BOTÍN TOTAL</div>
                <div className="mono text-lg font-bold text-white leading-tight tabular-nums">
                  +{summary.exp} EXP · +{summary.gold}G
                </div>
              </div>
              <div className="border border-[#2c3350] bg-[#10131f] px-2.5 py-1 flex items-center justify-between">
                <span className="pixel-title text-[7px] text-[#8b93b8]">RACHA</span>
                <span className="pixel-title text-[8px] text-[var(--gold)]">🔥 {summary.streak} DÍAS</span>
              </div>
            </div>
          </div>

          {/* 4 Main RPG Metrics */}
          <div className="grid grid-cols-2 gap-2.5 text-center">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...APPLE_SPRING, delay: 0.05 }}
              className="border-2 border-[#2c3350] bg-[#10131f] p-2.5 shadow-[2px_2px_0_#000]"
            >
              <div className="pixel-title text-[7px] text-[#8b93b8]">⏱ DURACIÓN</div>
              <div className="mono text-xl font-bold text-[var(--cyan)] tabular-nums mt-0.5">
                {durStr}
              </div>
              <div className="mono text-[11px] text-[#8b93b8]">{summary.setsDone} series</div>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...APPLE_SPRING, delay: 0.09 }}
              className="border-2 border-[#2c3350] bg-[#10131f] p-2.5 shadow-[2px_2px_0_#000]"
            >
              <div className="pixel-title text-[7px] text-[#8b93b8]">⚖️ TONELAJE</div>
              <div className="mono text-xl font-bold text-white tabular-nums mt-0.5">
                {Math.round(summary.tonnage).toLocaleString("es")} kg
              </div>
              <div className="mono text-[11px] text-[var(--green)]">volumen movido</div>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...APPLE_SPRING, delay: 0.13 }}
              className={`border-2 p-2.5 shadow-[2px_2px_0_#000] ${
                summary.prs > 0 ? "border-[var(--red)] bg-[#3a151f]/50" : "border-[#2c3350] bg-[#10131f]"
              }`}
            >
              <div className="pixel-title text-[7px] text-[#8b93b8]">⚡ PRs BATIDOS</div>
              <div className={`mono text-xl font-bold tabular-nums mt-0.5 ${summary.prs > 0 ? "text-[var(--gold)]" : "text-white"}`}>
                {summary.prs}
              </div>
              <div className="mono text-[11px] text-[#cbd5e1]">
                {summary.prs > 0 ? "¡Récord roto!" : "Firmeza constante"}
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...APPLE_SPRING, delay: 0.17 }}
              className="border-2 border-[#2c3350] bg-[#10131f] p-2.5 shadow-[2px_2px_0_#000]"
            >
              <div className="pixel-title text-[7px] text-[#8b93b8]">👹 DAÑO AL BOSS</div>
              <div className="mono text-xl font-bold text-[var(--red)] tabular-nums mt-0.5">
                {summary.bossDamage.toLocaleString("es")}
              </div>
              <div className="mono text-[11px] text-[#8b93b8]">
                {summary.bonusPct > 0 ? `+${summary.bonusPct}% equipo` : "Daño directo"}
              </div>
            </motion.div>
          </div>

          {/* Best lifts of the session */}
          {summary.topExercises.length > 0 && (
            <div className="border-2 border-[#2c3350] bg-[#10131f] p-2.5 text-left space-y-1.5">
              <div className="pixel-title text-[7.5px] text-[var(--gold)]">
                📋 MARCAS DESTACADAS DE HOY
              </div>
              {summary.topExercises.map((t, idx) => (
                <div key={idx} className="mono flex items-center justify-between text-sm border-t border-[#2c3350]/60 pt-1">
                  <span className="truncate text-[#cbd5e1]">{t.name}</span>
                  <span className="font-bold text-[var(--cyan)] shrink-0 ml-2">{t.bestSet}</span>
                </div>
              ))}
            </div>
          )}

          {/* Newly Unlocked Achievements banner */}
          {summary.newlyUnlockedIds.length > 0 && (
            <div className="border-2 border-[var(--gold)] bg-[#241e0a] p-2.5 text-left space-y-1.5 shadow-[2px_2px_0_#000]">
              <div className="pixel-title text-[8px] text-[var(--gold)]">
                🏅 ¡{summary.newlyUnlockedIds.length} {summary.newlyUnlockedIds.length === 1 ? "MEDALLA DESBLOQUEADA" : "MEDALLAS DESBLOQUEADAS"}!
              </div>
              <div className="flex flex-wrap gap-1.5">
                {summary.newlyUnlockedIds.map((id) => {
                  const def = ACHIEVEMENT_MAP[id];
                  if (!def) return null;
                  return (
                    <span key={id} className="mono text-xs border border-[var(--gold)]/60 bg-[#10131f] px-2 py-0.5 text-white">
                      {def.icon} {def.title} (+{def.rewardGold}G)
                    </span>
                  );
                })}
              </div>
              <div className="pixel-title text-[6.5px] text-[#cbd5e1]">
                COBRA TU ORO EN AVATAR → MEDALLAS DE CARRERA
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t-4 border-black bg-[#10131f] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
          <PixelButton
            variant="gold"
            className="w-full py-3.5 text-[10px] font-bold shadow-[3px_3px_0_#000]"
            onClick={onClose}
          >
            ✓ CONTINUAR AVENTURA
          </PixelButton>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

export type { Routine };
