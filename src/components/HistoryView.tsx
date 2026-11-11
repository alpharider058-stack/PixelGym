"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useGame, WorkoutLog, WeightEntry } from "@/lib/store";
import { e1rm, EX, isBodyweight, localDayKey, MUSCLE_LABEL, Muscle } from "@/lib/data";
import { haptic, sfx, fxAt } from "@/lib/fx";
import { Panel, PixelButton, SPRING, APPLE_SPRING, APPLE_TAP, APPLE_BOUNCE } from "./ui";
import { Sheet } from "./GymView";

type HistoryTab = "summary" | "records" | "history" | "backup";

const HISTORY_TABS: { id: HistoryTab; label: string; icon: string }[] = [
  { id: "summary", label: "RESUMEN", icon: "📊" },
  { id: "records", label: "RÉCORDS", icon: "🏆" },
  { id: "history", label: "HISTORIAL", icon: "📜" },
  { id: "backup", label: "BACKUP", icon: "💾" },
];

const EMPTY_HISTORY: WorkoutLog[] = [];
const EMPTY_BEST: Record<string, { e1rm: number; vol: number }> = {};
const EMPTY_ROUTINES_COUNT: unknown[] = [];

const normText = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function HistoryView() {
  const { history, best, bodyweight, customRoutinesCount } = useGame(
    useShallow((s) => ({
      history: s.history ?? EMPTY_HISTORY,
      best: s.best ?? EMPTY_BEST,
      bodyweight: s.bodyweight ?? 75,
      customRoutinesCount: (s.customRoutines ?? EMPTY_ROUTINES_COUNT).length,
    }))
  );
  const del = useGame((s) => s.deleteLog);
  const importBackupData = useGame((s) => s.importBackupData);

  const [subTab, setSubTab] = useState<HistoryTab>("summary");
  const [subDir, setSubDir] = useState(1);

  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);
  const [recordQuery, setRecordQuery] = useState("");
  const [recordMuscle, setRecordMuscle] = useState<"all" | Muscle>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [inspectExId, setInspectExId] = useState<string | null>(null);

  const last = useMemo(() => history.slice(0, 12).reverse(), [history]);
  const maxT = useMemo(() => Math.max(1, ...last.map((h) => h.tonnage)), [last]);
  const activeBar = useMemo(
    () => last.find((h) => h.id === selectedBarId) ?? last[last.length - 1] ?? null,
    [last, selectedBarId]
  );

  // Weekly Comparative Analytics (This week Mon->Now vs Last week Mon->Sun)
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dow = (now.getDay() + 6) % 7; // 0 = Mon .. 6 = Sun
    const thisWeekStart = todayStart - dow * 864e5;
    const prevWeekStart = thisWeekStart - 7 * 864e5;

    let thisWeekTonnage = 0;
    let prevWeekTonnage = 0;
    let thisWeekWorkouts = 0;
    const setsByMuscle: Record<Muscle, number> = {
      chest: 0,
      back: 0,
      shoulders: 0,
      arms: 0,
      legs: 0,
      core: 0,
    };

    for (const h of history) {
      const t = h.startedAt;
      if (t >= thisWeekStart) {
        thisWeekTonnage += h.tonnage;
        thisWeekWorkouts++;
        for (const e of h.exercises) {
          const m = EX[e.exId]?.muscle;
          if (m) setsByMuscle[m] = (setsByMuscle[m] ?? 0) + e.sets.length;
        }
      } else if (t >= prevWeekStart && t < thisWeekStart) {
        prevWeekTonnage += h.tonnage;
      }
    }

    let pctDelta: number | null = null;
    if (prevWeekTonnage > 0) {
      pctDelta = Math.round(((thisWeekTonnage - prevWeekTonnage) / prevWeekTonnage) * 100);
    }

    return { thisWeekTonnage, prevWeekTonnage, thisWeekWorkouts, pctDelta, setsByMuscle };
  }, [history]);

  const sortedRecords = useMemo(() => {
    const q = normText(recordQuery.trim());
    return Object.entries(best)
      .filter(([id]) => {
        const ex = EX[id];
        if (recordMuscle !== "all" && ex?.muscle !== recordMuscle) return false;
        if (!q) return true;
        return normText(ex?.name ?? id).includes(q);
      })
      .sort((a, b) => b[1].e1rm - a[1].e1rm);
  }, [best, recordQuery, recordMuscle]);

  const totalRecordCount = Object.keys(best).length;

  const activeIdx = Math.max(0, HISTORY_TABS.findIndex((t) => t.id === subTab));
  const goSub = (nextTab: HistoryTab) => {
    if (nextTab === subTab) return;
    const prevIdx = HISTORY_TABS.findIndex((t) => t.id === subTab);
    const nextIdx = HISTORY_TABS.findIndex((t) => t.id === nextTab);
    setSubDir(nextIdx >= prevIdx ? 1 : -1);
    setSubTab(nextTab);
    sfx.tick();
    haptic(6);
  };

  const exportJson = () => {
    sfx.coin();
    haptic([20, 40]);
    const state = useGame.getState();
    const data = {
      name: state.name,
      bodyweight: state.bodyweight,
      exp: state.exp,
      gold: state.gold,
      tonnage: state.tonnage,
      weeklyExp: state.weeklyExp,
      weekKey: state.weekKey,
      streak: state.streak,
      maxStreak: state.maxStreak,
      lastDay: state.lastDay,
      totalPrs: state.totalPrs,
      bossKills: state.bossKills,
      muscleVol: state.muscleVol,
      best: state.best,
      lastSet: state.lastSet,
      restTimeByEx: state.restTimeByEx,
      quests: state.quests,
      bossDmgDealt: state.bossDmgDealt,
      bossDefeated: state.bossDefeated,
      history: state.history,
      trophies: state.trophies,
      claimedAchievements: state.claimedAchievements,
      activeTitle: state.activeTitle,
      customRoutines: state.customRoutines,
      deletedRoutineIds: state.deletedRoutineIds,
      owned: state.owned,
      equipped: state.equipped,
      sound: state.sound,
      focusMode: state.focusMode,
      pushPrefs: state.pushPrefs,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixelgym-backup-${localDayKey(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    sfx.coin();
    haptic([20, 40]);
    const csvCell = (val: string) => `"${String(val).replace(/"/g, '""')}"`;
    const headers = "Fecha,Rutina,DuracionMin,Ejercicio,Serie,Kilos,Reps,EsPR\n";
    const rows: string[] = [];
    for (const h of history) {
      const date = localDayKey(h.startedAt);
      const min = Math.max(1, Math.round((h.endedAt - h.startedAt) / 60000));
      for (const e of h.exercises) {
        const exName = EX[e.exId]?.name ?? e.exId;
        e.sets.forEach((s, idx) => {
          rows.push(
            `${csvCell(date)},${csvCell(h.name)},${min},${csvCell(exName)},${idx + 1},${s.kg},${s.reps},${s.pr ? "SI" : "NO"}`
          );
        });
      }
    }
    const blob = new Blob(["\ufeff" + headers + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixelgym-entrenamientos-${localDayKey(Date.now())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (importBackupData(json)) {
          sfx.levelUp();
          haptic([30, 20, 60, 20, 100]);
          setImportStatus("✓ ¡COPIA DE SEGURIDAD RESTAURADA CON ÉXITO!");
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          sfx.error();
          setImportStatus("⚠️ Error: Formato de archivo de copia no válido.");
        }
      } catch {
        sfx.error();
        setImportStatus("⚠️ Error al leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-navegación fija en 4 pestañas para mantener PROGRESO limpio */}
      <div className="border-2 border-[#2c3350] bg-[#10131f] p-1 shadow-[3px_3px_0_#000]">
        <div className="relative grid grid-cols-4">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-1/4"
            initial={false}
            animate={{ x: `${activeIdx * 100}%` }}
            transition={APPLE_SPRING}
          >
            <div className="h-full w-full bg-[var(--gold)] border-2 border-black shadow-[2px_2px_0_#000]" />
          </motion.div>

          {HISTORY_TABS.map((t) => {
            const active = subTab === t.id;
            return (
              <motion.button
                key={t.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                transition={APPLE_TAP}
                onClick={() => goSub(t.id)}
                className={`relative z-10 flex flex-col items-center justify-center gap-1 py-2 transition-colors cursor-pointer ${
                  active ? "text-black" : "text-[#8b93b8]"
                }`}
                aria-label={t.label}
              >
                <span className="text-sm leading-none">{t.icon}</span>
                <span className="pixel-title text-[7px] font-bold leading-none">
                  {t.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {subTab === "summary" && (
          <motion.div
            key="hist-summary"
            initial={{ opacity: 0, x: 16 * subDir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 * subDir }}
            transition={SPRING}
            className="flex flex-col gap-5"
          >
            {/* TONELAJE + COMPARATIVA SEMANAL */}
            <Panel className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="pixel-title text-[10px] text-[var(--gold)]">TONELAJE · ÚLTIMAS SESIONES</h3>
                {weeklyStats.pctDelta !== null ? (
                  <span
                    className={`pixel-title border px-2 py-0.5 text-[7px] font-bold shadow-[1px_1px_0_#000] ${
                      weeklyStats.pctDelta > 0
                        ? "border-[#7dff6a] bg-[#15291a] text-[#7dff6a]"
                        : weeklyStats.pctDelta < 0
                        ? "border-[var(--red)] bg-[#3a151f] text-[var(--red)]"
                        : "border-[#2c3350] bg-[#10131f] text-[#cbd5e1]"
                    }`}
                  >
                    {weeklyStats.pctDelta > 0
                      ? `▲ +${weeklyStats.pctDelta}%`
                      : weeklyStats.pctDelta < 0
                      ? `▼ ${weeklyStats.pctDelta}%`
                      : "＝ 0%"}{" "}
                    VS SEM. ANTERIOR
                  </span>
                ) : weeklyStats.thisWeekTonnage > 0 ? (
                  <span className="pixel-title border border-[var(--cyan)] bg-[#0d2330] px-2 py-0.5 text-[7px] text-[var(--cyan)]">
                    ★ SEMANA EN MARCHA
                  </span>
                ) : null}
              </div>

              {last.length ? (
                <div className="space-y-2.5">
                  <div className="flex h-32 items-end gap-1.5 px-0.5">
                    {last.map((h, i) => {
                      const isSel = activeBar?.id === h.id;
                      return (
                        <motion.button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            setSelectedBarId(h.id);
                            sfx.tick();
                            haptic(5);
                          }}
                          className={`flex-1 cursor-pointer transition-colors ${
                            isSel
                              ? "bg-[var(--gold)] ring-2 ring-white/80"
                              : "bg-[var(--cyan)] opacity-85"
                          }`}
                          style={{
                            height: "100%",
                            originY: 1,
                            boxShadow: "inset -3px 0 0 rgba(0,0,0,.35)",
                          }}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: Math.max(0.06, h.tonnage / maxT) }}
                          whileTap={{ scaleY: Math.max(0.05, (h.tonnage / maxT) * 0.94) }}
                          transition={{ ...APPLE_SPRING, delay: i * 0.025 }}
                          aria-label={`${h.name}: ${Math.round(h.tonnage).toLocaleString("es")} kg`}
                        />
                      );
                    })}
                  </div>
                  {activeBar && (
                    <div className="flex items-center justify-between border border-[#2c3350] bg-[#10131f] px-2.5 py-1.5">
                      <div className="min-w-0">
                        <div className="pixel-title text-[7.5px] text-[var(--gold)] truncate">
                          ⚔ {activeBar.name}
                        </div>
                        <div className="mono text-xs text-[#8b93b8]">
                          {new Date(activeBar.startedAt).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          ·{" "}
                          {activeBar.exercises.reduce((a, ex) => a + ex.sets.length, 0)} series
                        </div>
                      </div>
                      <span className="mono text-base font-bold text-[var(--cyan)] tabular-nums shrink-0 ml-2">
                        {Math.round(activeBar.tonnage).toLocaleString("es")} kg
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mono text-[#8b93b8]">Aún no hay sesiones. ¡Ve al gimnasio!</p>
              )}

              {/* Weekly Muscle Series Breakdown (3x2 grid for all 6 muscle groups) */}
              <div className="border-t-2 border-[#2c3350] pt-2.5 space-y-2">
                <div className="flex items-center justify-between text-[7px] pixel-title text-[#8b93b8]">
                  <span>SERIES ESTA SEMANA ({weeklyStats.thisWeekWorkouts} ses.)</span>
                  <span className="text-white tabular-nums">
                    {Math.round(weeklyStats.thisWeekTonnage).toLocaleString("es")} kg
                    {weeklyStats.prevWeekTonnage > 0
                      ? ` / ${Math.round(weeklyStats.prevWeekTonnage).toLocaleString("es")} ant.`
                      : ""}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {(Object.keys(MUSCLE_LABEL) as Muscle[]).map((m) => {
                    const cnt = weeklyStats.setsByMuscle[m] ?? 0;
                    return (
                      <div
                        key={m}
                        className={`border px-1.5 py-1.5 ${
                          cnt > 0
                            ? "border-[var(--cyan)]/50 bg-[#10131f]"
                            : "border-[#2c3350] bg-[#0c0e17] opacity-65"
                        }`}
                      >
                        <div className="pixel-title text-[6px] text-[#8b93b8] truncate">
                          {MUSCLE_LABEL[m]}
                        </div>
                        <div
                          className={`mono text-base font-bold leading-none mt-0.5 tabular-nums ${
                            cnt > 0 ? "text-[var(--cyan)]" : "text-[#636c8f]"
                          }`}
                        >
                          {cnt}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Panel>

            {/* PROGRESO DE PESO CORPORAL (GRÁFICA Y REGISTRO) */}
            <WeightProgressCard />

            {/* CALENDARIO DE CONSISTENCIA (12 SEMANAS / 84 DÍAS) */}
            <ConsistencyCalendar history={history} />
          </motion.div>
        )}

        {subTab === "records" && (
          <motion.div
            key="hist-records"
            initial={{ opacity: 0, x: 16 * subDir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 * subDir }}
            transition={SPRING}
            className="flex flex-col gap-5"
          >
            {/* RÉCORDS (BUSCADOR + FILTRO POR MÚSCULO -> GRÁFICA) */}
            <Panel className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="pixel-title text-[10px] text-[var(--gold)]">
                  RÉCORDS ({totalRecordCount})
                </h3>
                {totalRecordCount > 0 && (
                  <span className="pixel-title text-[6.5px] text-[#8b93b8]">
                    TOCA PARA VER GRÁFICA
                  </span>
                )}
              </div>

              {totalRecordCount > 0 && (
                <>
                  <div className="relative">
                    <input
                      type="text"
                      className="pinput w-full pr-8 mono text-base"
                      placeholder="🔍 Buscar ejercicio..."
                      value={recordQuery}
                      onChange={(e) => setRecordQuery(e.target.value)}
                    />
                    {recordQuery && (
                      <button
                        type="button"
                        onClick={() => setRecordQuery("")}
                        className="pixel-title absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#8b93b8] hover:text-white px-1"
                        aria-label="Limpiar búsqueda"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                    {(["all", ...(Object.keys(MUSCLE_LABEL) as Muscle[])] as const).map((m) => (
                      <motion.button
                        key={m}
                        type="button"
                        whileTap={{ scale: 0.93 }}
                        transition={APPLE_TAP}
                        onClick={() => {
                          setRecordMuscle(m);
                          sfx.tick();
                          haptic(4);
                        }}
                        className={`pixel-title shrink-0 border-2 px-2.5 py-1.5 text-[7px] transition-colors ${
                          recordMuscle === m
                            ? "border-[var(--gold)] bg-[var(--gold)] text-black font-bold shadow-[1px_1px_0_#000]"
                            : "border-[#2c3350] bg-[#10131f] text-[#8b93b8]"
                        }`}
                      >
                        {m === "all" ? "TODOS" : MUSCLE_LABEL[m]}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                {sortedRecords.map(([id, b]) => {
                  const ex = EX[id];
                  return (
                    <motion.button
                      key={id}
                      type="button"
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      transition={APPLE_TAP}
                      onClick={() => {
                        setInspectExId(id);
                        sfx.tap();
                        haptic(6);
                      }}
                      className="border-2 border-[#2c3350] bg-[#10131f] p-2.5 text-left cursor-pointer shadow-[2px_2px_0_#000] active:border-[var(--gold)]"
                    >
                      <div className="mono truncate text-sm text-white">{ex?.name ?? id}</div>
                      {ex && (
                        <div className="pixel-title text-[6px] text-[#8b93b8] mt-0.5">
                          {MUSCLE_LABEL[ex.muscle]}
                        </div>
                      )}
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="mono text-lg tabular-nums font-bold text-[var(--red)]">
                          {b.e1rm.toFixed(1)} kg
                        </span>
                        <span className="pixel-title text-[6px] text-[var(--cyan)]">📈 VER</span>
                      </div>
                    </motion.button>
                  );
                })}
                {!totalRecordCount && (
                  <p className="mono col-span-2 text-[#8b93b8]">
                    Sin récords todavía. Completa tu primera serie en el gimnasio.
                  </p>
                )}
                {totalRecordCount > 0 && sortedRecords.length === 0 && (
                  <p className="mono col-span-2 py-3 text-center text-[#8b93b8]">
                    Ningún récord coincide con tu búsqueda o músculo seleccionado.
                  </p>
                )}
              </div>
            </Panel>
          </motion.div>
        )}

        {subTab === "history" && (
          <motion.div
            key="hist-log"
            initial={{ opacity: 0, x: 16 * subDir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 * subDir }}
            transition={SPRING}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between px-0.5">
              <h3 className="pixel-title text-[10px] text-[var(--gold)]">HISTORIAL DE SESIONES</h3>
              <span className="mono text-xs text-[#8b93b8] tabular-nums">
                {history.length} {history.length === 1 ? "sesión" : "sesiones"}
              </span>
            </div>

            {history.length === 0 ? (
              <Panel className="p-4 text-center">
                <p className="mono text-sm text-[#8b93b8]">
                  Aún no has completado ningún entrenamiento. ¡Empieza una rutina para estrenar tu diario!
                </p>
              </Panel>
            ) : (
              <AnimatePresence initial={false}>
                {history.map((h) => (
                  <motion.div
                    key={h.id}
                    layout="position"
                    transition={APPLE_SPRING}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Panel className="p-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        transition={APPLE_TAP}
                        className="flex w-full items-center justify-between text-left cursor-pointer gap-2"
                        onClick={() => {
                          setOpen(open === h.id ? null : h.id);
                          setArmed(null);
                          sfx.tick();
                        }}
                      >
                        <div className="min-w-0">
                          <div className="pixel-title text-[9px] truncate">
                            {open === h.id ? "▼" : "▶"} {h.name}
                          </div>
                          <div className="mono text-sm text-[#8b93b8]">
                            {new Date(h.startedAt).toLocaleString("es", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}{" "}
                            · {Math.max(1, Math.round((h.endedAt - h.startedAt) / 60000))} min
                          </div>
                        </div>
                        <span className="mono text-base tabular-nums text-[var(--cyan)] shrink-0">
                          {Math.round(h.tonnage).toLocaleString("es")} kg
                        </span>
                      </motion.button>
                      <AnimatePresence initial={false}>
                        {open === h.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={APPLE_SPRING}
                            className="mt-2 space-y-1 border-t-2 border-[#2c3350] pt-2"
                          >
                            {h.exercises.map((e, k) => (
                              <div key={k} className="mono flex justify-between gap-2 text-sm">
                                <span className="truncate">{EX[e.exId]?.name ?? e.exId}</span>
                                <span className="tabular-nums text-[#8b93b8] shrink-0">
                                  {e.sets
                                    .map((s) => {
                                      const isBw = isBodyweight(EX[e.exId]);
                                      return isBw
                                        ? s.kg > 0
                                          ? `+${s.kg}kg×${s.reps}`
                                          : `PC×${s.reps}`
                                        : `${s.kg}×${s.reps}`;
                                    })
                                    .join(" · ")}
                                </span>
                              </div>
                            ))}
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.92 }}
                              transition={APPLE_TAP}
                              className="pixel-title mt-2 w-full border-2 border-[var(--red)] py-2 text-[9px] text-[var(--red)] cursor-pointer"
                              onClick={() => {
                                if (armed === h.id) {
                                  del(h.id);
                                  sfx.whoosh();
                                  setArmed(null);
                                } else {
                                  setArmed(h.id);
                                  sfx.error();
                                }
                              }}
                            >
                              {armed === h.id ? "¿CONFIRMAR BORRADO?" : "ELIMINAR REGISTRO"}
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Panel>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}

        {subTab === "backup" && (
          <motion.div
            key="hist-backup"
            initial={{ opacity: 0, x: 16 * subDir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 * subDir }}
            transition={SPRING}
            className="flex flex-col gap-5"
          >
            {/* COPIA DE SEGURIDAD & EXPORTACIÓN */}
            <Panel className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b-2 border-[#2c3350] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">💾</span>
                  <div>
                    <h3 className="pixel-title text-[10px] text-[var(--gold)]">COPIA DE SEGURIDAD</h3>
                    <span className="pixel-title text-[7px] text-[#8b93b8]">EXPORTA O RESTAURA TUS DATOS</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border border-[#2c3350] bg-[#10131f] p-2">
                  <div className="pixel-title text-[6px] text-[#8b93b8]">SESIONES</div>
                  <div className="mono text-base font-bold text-white tabular-nums">{history.length}</div>
                </div>
                <div className="border border-[#2c3350] bg-[#10131f] p-2">
                  <div className="pixel-title text-[6px] text-[#8b93b8]">RÉCORDS</div>
                  <div className="mono text-base font-bold text-[var(--gold)] tabular-nums">{totalRecordCount}</div>
                </div>
                <div className="border border-[#2c3350] bg-[#10131f] p-2">
                  <div className="pixel-title text-[6px] text-[#8b93b8]">RUTINAS PROPIAS</div>
                  <div className="mono text-base font-bold text-[var(--cyan)] tabular-nums">{customRoutinesCount}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.94, y: 1 }}
                  transition={APPLE_TAP}
                  onClick={exportJson}
                  className="pixel-title flex items-center justify-center gap-1.5 border-2 border-[var(--cyan)] bg-[#0d222d] py-2.5 text-[8px] text-[var(--cyan)] shadow-[2px_2px_0_#000] cursor-pointer"
                >
                  <span>📤 BACKUP (JSON)</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.94, y: 1 }}
                  transition={APPLE_TAP}
                  onClick={exportCsv}
                  className="pixel-title flex items-center justify-center gap-1.5 border-2 border-[var(--gold)] bg-[#241e0a] py-2.5 text-[8px] text-[var(--gold)] shadow-[2px_2px_0_#000] cursor-pointer"
                >
                  <span>📊 EXCEL (CSV)</span>
                </motion.button>
              </div>

              <div>
                <motion.label
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.95, y: 1 }}
                  transition={APPLE_TAP}
                  className="pixel-title block w-full cursor-pointer border-2 border-[#4a5280] bg-[#1d2236] py-3 text-center text-[8px] text-white shadow-[2px_2px_0_#000]"
                >
                  <span>📥 RESTAURAR COPIA (JSON)</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImport}
                  />
                </motion.label>
              </div>

              {importStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={APPLE_BOUNCE}
                  className="pixel-title text-center text-[8px] text-[var(--green)]"
                >
                  {importStatus}
                </motion.div>
              )}

              <p className="mono text-xs text-[#8b93b8] leading-relaxed">
                El archivo JSON guarda tu perfil completo (héroe, inventario, mascotas, medallas, rutinas, récords, historial y preferencias) para cambiar de móvil o recuperar tus datos al instante.
              </p>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE GRÁFICA DE EVOLUCIÓN POR EJERCICIO */}
      <AnimatePresence>
        {inspectExId && (
          <ExerciseChartSheet
            exId={inspectExId}
            history={history}
            bodyweight={bodyweight}
            onClose={() => setInspectExId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- 12-Week RPG Consistency Calendar Heatmap ---------------- */
function ConsistencyCalendar({ history }: { history: WorkoutLog[] }) {
  const { weeks, dayMap, activeDaysCount, latestActiveKey } = useMemo(() => {
    const map = new Map<string, WorkoutLog[]>();
    for (const h of history) {
      const k = localDayKey(h.startedAt);
      const list = map.get(k);
      if (list) list.push(h);
      else map.set(k, [h]);
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayDow = (now.getDay() + 6) % 7; // Mon=0 .. Sun=6
    const gridStart = todayStart - (11 * 7 + todayDow) * 864e5;

    const cols: { key: string; ts: number; future: boolean; count: number; tonnage: number; prs: number }[][] = [];
    let count = 0;
    let latest: string | null = null;

    for (let w = 0; w < 12; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const ts = gridStart + (w * 7 + d) * 864e5;
        const key = localDayKey(ts);
        const future = ts > todayStart;
        const logs = map.get(key) || [];
        const tonnage = logs.reduce((a, x) => a + x.tonnage, 0);
        const prs = logs.reduce((a, x) => a + (x.prs || 0), 0);
        if (!future && logs.length > 0) {
          count++;
          latest = key;
        }
        col.push({ key, ts, future, count: logs.length, tonnage, prs });
      }
      cols.push(col);
    }

    return { weeks: cols, dayMap: map, activeDaysCount: count, latestActiveKey: latest };
  }, [history]);

  const [selectedKey, setSelectedKey] = useState<string | null>(() => latestActiveKey);
  const effectiveKey = selectedKey ?? latestActiveKey;
  const selectedLogs = effectiveKey ? dayMap.get(effectiveKey) || [] : [];

  const DOW_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <Panel className="p-4 space-y-3">
      <div className="flex items-center justify-between border-b-2 border-[#2c3350] pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">📅</span>
          <div>
            <h3 className="pixel-title text-[10px] text-[var(--gold)]">CALENDARIO DE CONSISTENCIA</h3>
            <span className="pixel-title text-[7px] text-[#8b93b8]">ÚLTIMAS 12 SEMANAS (84 DÍAS)</span>
          </div>
        </div>
        <span className="mono text-xs tabular-nums text-[var(--green)]">
          {activeDaysCount} {activeDaysCount === 1 ? "d. activo" : "d. activos"}
        </span>
      </div>

      {/* 12x7 Pixel Grid */}
      <div className="flex items-stretch gap-1.5">
        <div className="flex flex-col justify-between py-0.5 text-[7px] pixel-title text-[#8b93b8] select-none">
          {DOW_LABELS.map((l) => (
            <span key={l} className="leading-none">{l}</span>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-12 gap-1">
          {weeks.map((col, wIdx) => (
            <div key={wIdx} className="grid grid-rows-7 gap-1">
              {col.map((cell) => {
                const isSelected = effectiveKey === cell.key;
                let cellClass = "bg-[#10131f] border-[#2c3350]";
                if (cell.future) {
                  cellClass = "bg-[#0c0e17] border-[#1a1f33] opacity-25";
                } else if (cell.count > 0) {
                  if (cell.prs > 0 || cell.tonnage >= 8000) {
                    cellClass = "bg-[#7dff6a] border-[#ffe14d] shadow-[0_0_6px_rgba(125,255,106,0.45)]";
                  } else if (cell.tonnage >= 3500) {
                    cellClass = "bg-[#3fb950] border-[#7dff6a]";
                  } else {
                    cellClass = "bg-[#1f5d32] border-[#3fb950]";
                  }
                }
                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={cell.future}
                    onClick={() => {
                      setSelectedKey(cell.key);
                      sfx.tick();
                      haptic(4);
                    }}
                    className={`aspect-square w-full border transition-transform ${cellClass} ${
                      isSelected ? "ring-2 ring-[var(--gold)] scale-110 z-10" : ""
                    }`}
                    aria-label={`${cell.key}: ${cell.count} entrenamientos`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[7px] pixel-title text-[#8b93b8]">
        <span>TOCA UN DÍA PARA INSPECCIONAR</span>
        <div className="flex items-center gap-1">
          <span>MENOS</span>
          <span className="h-2.5 w-2.5 border border-[#2c3350] bg-[#10131f]" />
          <span className="h-2.5 w-2.5 border border-[#3fb950] bg-[#1f5d32]" />
          <span className="h-2.5 w-2.5 border border-[#7dff6a] bg-[#3fb950]" />
          <span className="h-2.5 w-2.5 border border-[#ffe14d] bg-[#7dff6a]" />
          <span>MÁS</span>
        </div>
      </div>

      {/* Selected Day Workout Inspector */}
      {effectiveKey && (
        <div className="border-2 border-[#2c3350] bg-[#10131f] p-2.5 space-y-1.5">
          <div className="flex items-center justify-between border-b border-[#2c3350] pb-1">
            <span className="pixel-title text-[7.5px] text-[var(--gold)]">
              📆 {new Date(effectiveKey + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase()}
            </span>
            <span className="mono text-xs text-[#8b93b8]">
              {selectedLogs.length ? `${selectedLogs.length} sesión${selectedLogs.length > 1 ? "es" : ""}` : "Día de descanso"}
            </span>
          </div>
          {selectedLogs.length > 0 ? (
            selectedLogs.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 pt-0.5">
                <div className="min-w-0">
                  <div className="pixel-title text-[8px] text-white truncate">⚔ {l.name}</div>
                  <div className="mono text-[11px] text-[#8b93b8] truncate">
                    {l.exercises.map((e) => EX[e.exId]?.name ?? e.exId).slice(0, 3).join(", ")}
                    {l.exercises.length > 3 ? ` +${l.exercises.length - 3}` : ""}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="mono text-xs font-bold text-[var(--cyan)] tabular-nums">
                    {Math.round(l.tonnage).toLocaleString("es")} kg
                  </div>
                  {l.prs > 0 && (
                    <div className="pixel-title text-[6.5px] text-[var(--gold)]">⚡ {l.prs} PR</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="mono text-xs text-[#636c8f]">
              Sin registros ese día. ¡El descanso también construye músculo!
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

/* ---------------- Exercise Progression Pixel Chart Sheet ---------------- */
function ExerciseChartSheet({
  exId,
  history,
  bodyweight,
  onClose,
}: {
  exId: string;
  history: WorkoutLog[];
  bodyweight: number;
  onClose: () => void;
}) {
  const [metric, setMetric] = useState<"e1rm" | "maxKg">("e1rm");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const ex = EX[exId];
  const isBw = isBodyweight(ex);

  const points = useMemo(() => {
    const pts: {
      date: string;
      fullDate: string;
      e1rm: number;
      maxKg: number;
      bestSet: string;
    }[] = [];

    const chronological = [...history].reverse();
    for (const h of chronological) {
      let bestE = 0;
      let bestW = 0;
      let label = "";
      for (const entry of h.exercises) {
        if (entry.exId !== exId) continue;
        for (const s of entry.sets) {
          const lifted = isBw ? bodyweight + s.kg : s.kg;
          const est = e1rm(lifted, s.reps);
          if (est > bestE) {
            bestE = est;
            label = isBw ? (s.kg > 0 ? `+${s.kg}kg×${s.reps}` : `PC×${s.reps}`) : `${s.kg}kg×${s.reps}`;
          }
          if (lifted > bestW) bestW = lifted;
        }
      }
      if (bestE > 0) {
        const d = new Date(h.startedAt);
        pts.push({
          date: `${d.getDate()}/${d.getMonth() + 1}`,
          fullDate: d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" }),
          e1rm: Math.round(bestE * 10) / 10,
          maxKg: Math.round(bestW * 10) / 10,
          bestSet: label,
        });
      }
    }
    return pts.slice(-16); // clean readable window of last 16 sessions for this exercise
  }, [history, exId, bodyweight, isBw]);

  const vals = points.map((p) => p[metric]);
  const maxVal = vals.length ? Math.max(...vals) : 100;
  const minVal = vals.length ? Math.min(...vals) : 0;
  const firstVal = vals[0] ?? 0;
  const lastVal = vals[vals.length - 1] ?? 0;
  const diff = Math.round((lastVal - firstVal) * 10) / 10;
  const selected = points[activeIdx ?? points.length - 1];

  const W = 320;
  const H = 132;
  const padX = 28;
  const padY = 18;
  const span = Math.max(4, maxVal - minVal);
  const lo = Math.max(0, minVal - span * 0.15);
  const hi = maxVal + span * 0.15;

  const coords = points.map((p, i) => {
    const x = points.length === 1 ? W / 2 : padX + (i / (points.length - 1)) * (W - padX * 2);
    const ratio = (p[metric] - lo) / Math.max(1, hi - lo);
    const y = H - padY - ratio * (H - padY * 2);
    return { x, y, ...p };
  });

  const polylinePts = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  return (
    <Sheet title={`📈 ${(ex?.name ?? exId).toUpperCase()}`} onClose={onClose}>
      <div className="space-y-3">
        {/* Metric Selector */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "e1rm" as const, label: "1RM ESTIMADO (KG)" },
            { id: "maxKg" as const, label: isBw ? "PESO TOTAL C/ LASTRE" : "PESO MÁXIMO (KG)" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMetric(m.id);
                sfx.tick();
              }}
              className={`pixel-title border-2 py-2 text-[7px] font-bold transition-colors ${
                metric === m.id
                  ? "border-black bg-[var(--cyan)] text-black shadow-[2px_2px_0_#000]"
                  : "border-[#2c3350] bg-[#10131f] text-[#8b93b8]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="border-2 border-[#2c3350] bg-[#10131f] p-2">
            <div className="pixel-title text-[6.5px] text-[#8b93b8]">ÚLTIMO</div>
            <div className="mono text-lg font-bold text-white tabular-nums">{lastVal} kg</div>
          </div>
          <div className="border-2 border-[#2c3350] bg-[#10131f] p-2">
            <div className="pixel-title text-[6.5px] text-[#8b93b8]">MEJOR</div>
            <div className="mono text-lg font-bold text-[var(--gold)] tabular-nums">{maxVal} kg</div>
          </div>
          <div className="border-2 border-[#2c3350] bg-[#10131f] p-2">
            <div className="pixel-title text-[6.5px] text-[#8b93b8]">MEJORA</div>
            <div className={`mono text-lg font-bold tabular-nums ${diff >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
              {diff > 0 ? `+${diff}` : diff} kg
            </div>
          </div>
        </div>

        {/* Pixel-Art Chart Canvas */}
        <div className="border-2 border-[#2c3350] bg-[#0a0c14] p-2.5 shadow-inner">
          {points.length > 0 ? (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40 overflow-visible" shapeRendering="crispEdges">
              {/* Guide gridlines */}
              {[0.2, 0.5, 0.8].map((r) => {
                const gy = padY + r * (H - padY * 2);
                const val = Math.round(hi - r * (hi - lo));
                return (
                  <g key={r}>
                    <line x1={padX} y1={gy} x2={W - padX} y2={gy} stroke="#2c3350" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={2} y={gy + 3} fill="#636c8f" fontSize="9" fontFamily="monospace">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Subtle pixel bars beneath each session */}
              {coords.map((c, idx) => (
                <rect
                  key={`b-${idx}`}
                  x={c.x - 5}
                  y={c.y}
                  width={10}
                  height={Math.max(2, H - padY - c.y)}
                  fill="var(--cyan)"
                  opacity={selected?.fullDate === c.fullDate && (activeIdx ?? points.length - 1) === idx ? 0.35 : 0.14}
                />
              ))}

              {/* Connecting progress line */}
              {coords.length > 1 && (
                <polyline
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="2.5"
                  points={polylinePts}
                />
              )}

              {/* Pixel point nodes */}
              {coords.map((c, idx) => {
                const activePos = activeIdx ?? points.length - 1;
                const isSel = activePos === idx;
                const showDate =
                  coords.length <= 6 ||
                  idx === 0 ||
                  idx === coords.length - 1 ||
                  idx === Math.floor(coords.length / 2) ||
                  isSel;
                return (
                  <g
                    key={`p-${idx}`}
                    className="cursor-pointer"
                    onClick={() => {
                      setActiveIdx(idx);
                      sfx.tick();
                    }}
                  >
                    <rect
                      x={c.x - (isSel ? 5 : 4)}
                      y={c.y - (isSel ? 5 : 4)}
                      width={isSel ? 10 : 8}
                      height={isSel ? 10 : 8}
                      fill={isSel ? "var(--gold)" : "var(--cyan)"}
                      stroke="#000"
                      strokeWidth="1.5"
                    />
                    {showDate && (
                      <text x={c.x} y={H - 3} textAnchor="middle" fill={isSel ? "var(--gold)" : "#8b93b8"} fontSize="8" fontFamily="monospace">
                        {c.date}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          ) : (
            <p className="mono py-6 text-center text-sm text-[#8b93b8]">
              Todavía no hay historial registrado para este ejercicio.
            </p>
          )}
        </div>

        {/* Highlighted point details */}
        {selected && (
          <div className="border-2 border-[var(--cyan)]/60 bg-[#10131f] p-2.5 flex items-center justify-between">
            <div>
              <div className="pixel-title text-[7px] text-[#8b93b8]">SESIÓN DEL {selected.fullDate.toUpperCase()}</div>
              <div className="mono text-base font-bold text-white">Mejor serie: {selected.bestSet}</div>
            </div>
            <div className="text-right">
              <div className="pixel-title text-[7px] text-[var(--gold)]">{metric === "e1rm" ? "1RM EST." : "PESO MÁX."}</div>
              <div className="mono text-lg font-bold text-[var(--cyan)] tabular-nums">{selected[metric]} kg</div>
            </div>
          </div>
        )}

        {points.length === 1 && (
          <div className="mono text-center text-xs text-[#8b93b8]">
            Completa una segunda sesión de este ejercicio para trazar tu curva de evolución.
          </div>
        )}
      </div>
    </Sheet>
  );
}

function WeightProgressCard() {
  const bodyweight = useGame((s) => s.bodyweight ?? 75);
  const weightHistory = useGame((s) => s.weightHistory ?? []);
  const setBodyweight = useGame((s) => s.setBodyweight);
  const deleteWeightEntry = useGame((s) => s.deleteWeightEntry);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBwDraft, setNewBwDraft] = useState(String(bodyweight));
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Sort entries ascending by timestamp
  const sortedEntries = useMemo(() => {
    const list = Array.isArray(weightHistory) ? [...weightHistory] : [];
    if (!list.length) {
      return [{ id: "curr", date: Date.now(), kg: bodyweight }];
    }
    return list.sort((a, b) => a.date - b.date);
  }, [weightHistory, bodyweight]);

  const stats = useMemo(() => {
    if (!sortedEntries.length) return { current: bodyweight, initial: bodyweight, delta: 0, min: bodyweight, max: bodyweight };
    const initial = sortedEntries[0].kg;
    const current = sortedEntries[sortedEntries.length - 1].kg;
    const delta = Math.round((current - initial) * 10) / 10;
    const kgs = sortedEntries.map((e) => e.kg);
    const min = Math.min(...kgs);
    const max = Math.max(...kgs);
    return { current, initial, delta, min, max };
  }, [sortedEntries, bodyweight]);

  const activeEntry = useMemo(() => {
    if (selectedPointId) {
      return sortedEntries.find((e) => e.id === selectedPointId) ?? sortedEntries[sortedEntries.length - 1];
    }
    return sortedEntries[sortedEntries.length - 1];
  }, [sortedEntries, selectedPointId]);

  // SVG Chart geometry
  const chart = useMemo(() => {
    const W = 320;
    const H = 140;
    const padX = 30;
    const padTop = 18;
    const padBottom = 26;

    if (sortedEntries.length === 0) return null;

    const minKg = Math.floor(stats.min - 1);
    const maxKg = Math.ceil(stats.max + 1);
    const rangeKg = Math.max(2, maxKg - minKg);

    const minT = sortedEntries[0].date;
    const maxT = sortedEntries[sortedEntries.length - 1].date;
    const rangeT = Math.max(1, maxT - minT);

    const coords = sortedEntries.map((e, idx) => {
      const x = sortedEntries.length === 1
        ? W / 2
        : padX + ((e.date - minT) / rangeT) * (W - padX * 2);
      const y = padTop + (1 - (e.kg - minKg) / rangeKg) * (H - padTop - padBottom);
      const d = new Date(e.date);
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
      const fullDateStr = d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
      return { id: e.id, x, y, kg: e.kg, dateStr, fullDateStr, rawDate: e.date };
    });

    // SVG path string
    const pathD = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, "");

    // Area fill under line
    const areaD = coords.length > 0
      ? `${pathD} L ${coords[coords.length - 1].x.toFixed(1)} ${H - padBottom} L ${coords[0].x.toFixed(1)} ${H - padBottom} Z`
      : "";

    // 3 horizontal guide lines
    const guides = [minKg, minKg + rangeKg / 2, maxKg].map((kgVal) => {
      const y = padTop + (1 - (kgVal - minKg) / rangeKg) * (H - padTop - padBottom);
      return { kg: Math.round(kgVal * 10) / 10, y };
    });

    return { W, H, coords, pathD, areaD, guides };
  }, [sortedEntries, stats]);

  const commitNewWeight = () => {
    const val = parseFloat(newBwDraft.replace(",", "."));
    if (!Number.isNaN(val)) {
      const clamped = Math.max(30, Math.min(250, Math.round(val * 10) / 10));
      setBodyweight(clamped);
      sfx.tick();
      haptic([10, 25]);
      setIsModalOpen(false);
    }
  };

  return (
    <Panel className="p-4 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#2c3350] pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">⚖️</span>
          <div>
            <h3 className="pixel-title text-[10px] text-[var(--gold)]">PROGRESO DE PESO CORPORAL</h3>
            <span className="pixel-title text-[7px] text-[#8b93b8]">EVOLUCIÓN EN EL TIEMPO</span>
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          transition={APPLE_TAP}
          onClick={() => {
            setNewBwDraft(String(bodyweight));
            setIsModalOpen(true);
            sfx.tick();
          }}
          className="pixel-title border-2 border-black bg-[var(--gold)] px-2.5 py-1 text-[7.5px] font-bold text-black shadow-[2px_2px_0_#000] cursor-pointer"
        >
          + REGISTRAR PESO
        </motion.button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="border border-[#2c3350] bg-[#10131f] p-1.5">
          <div className="pixel-title text-[6.5px] text-[#8b93b8]">ACTUAL</div>
          <div className="mono text-base font-bold text-white tabular-nums">{stats.current} <span className="text-[10px] text-[var(--gold)]">kg</span></div>
        </div>
        <div className="border border-[#2c3350] bg-[#10131f] p-1.5">
          <div className="pixel-title text-[6.5px] text-[#8b93b8]">INICIAL</div>
          <div className="mono text-base font-bold text-[#cbd5e1] tabular-nums">{stats.initial} <span className="text-[10px] text-[#8b93b8]">kg</span></div>
        </div>
        <div className={`border p-1.5 ${stats.delta > 0 ? "border-[#7dff6a]/50 bg-[#15291a]/40" : stats.delta < 0 ? "border-[var(--cyan)]/50 bg-[#0d2330]/40" : "border-[#2c3350] bg-[#10131f]"}`}>
          <div className="pixel-title text-[6.5px] text-[#8b93b8]">CAMBIO</div>
          <div className={`mono text-base font-bold tabular-nums ${stats.delta > 0 ? "text-[#7dff6a]" : stats.delta < 0 ? "text-[var(--cyan)]" : "text-white"}`}>
            {stats.delta > 0 ? `+${stats.delta}` : stats.delta} <span className="text-[10px]">kg</span>
          </div>
        </div>
        <div className="border border-[#2c3350] bg-[#10131f] p-1.5">
          <div className="pixel-title text-[6.5px] text-[#8b93b8]">MÍN / MÁX</div>
          <div className="mono text-[12px] font-bold text-[#8b93b8] tabular-nums pt-0.5">{stats.min}/{stats.max}</div>
        </div>
      </div>

      {/* Retro Pixel Chart Canvas / SVG */}
      <div className="relative border-2 border-[#2c3350] bg-[#0c0e17] p-2 overflow-hidden shadow-[inset_0_0_12px_rgba(0,0,0,0.85)]">
        {chart ? (
          <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="w-full h-36 overflow-visible select-none">
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal guideline grid */}
            {chart.guides.map((g, i) => (
              <g key={i}>
                <line x1="26" y1={g.y} x2={chart.W - 10} y2={g.y} stroke="#1f253d" strokeDasharray="3 3" strokeWidth="1" />
                <text x="22" y={g.y + 3} textAnchor="end" fill="#636c8f" fontSize="8" fontFamily="monospace">
                  {g.kg}
                </text>
              </g>
            ))}

            {/* Gradient area fill */}
            {chart.areaD && <path d={chart.areaD} fill="url(#weightGrad)" />}

            {/* Retro step trend line */}
            <path
              d={chart.pathD}
              fill="none"
              stroke="var(--gold)"
              strokeWidth="2.5"
              strokeLinejoin="miter"
              strokeLinecap="square"
            />

            {/* Interactive Data Nodes */}
            {chart.coords.map((pt) => {
              const isSel = activeEntry?.id === pt.id;
              return (
                <g
                  key={pt.id}
                  onClick={() => {
                    setSelectedPointId(pt.id);
                    sfx.tick();
                    haptic(5);
                  }}
                  className="cursor-pointer"
                >
                  {/* Invisible enlarged hit target for mobile tapping */}
                  <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                  {/* Pulsing ring on active node */}
                  {isSel && (
                    <rect
                      x={pt.x - 7}
                      y={pt.y - 7}
                      width="14"
                      height="14"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="animate-pulse"
                    />
                  )}

                  {/* Pixel square marker */}
                  <rect
                    x={pt.x - (isSel ? 5 : 3.5)}
                    y={pt.y - (isSel ? 5 : 3.5)}
                    width={isSel ? 10 : 7}
                    height={isSel ? 10 : 7}
                    fill={isSel ? "#ffffff" : "var(--gold)"}
                    stroke="#000000"
                    strokeWidth="1.5"
                  />

                  {/* Bottom date label */}
                  <text
                    x={pt.x}
                    y={chart.H - 8}
                    textAnchor="middle"
                    fill={isSel ? "var(--gold)" : "#8b93b8"}
                    fontSize="7.5"
                    fontFamily="monospace"
                  >
                    {pt.dateStr}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="mono py-8 text-center text-xs text-[#8b93b8]">
            Registra tu primer pesaje para comenzar la gráfica.
          </div>
        )}
      </div>

      {/* Selected point inspection pill */}
      {activeEntry && (
        <div className="flex items-center justify-between border-2 border-[var(--gold)]/60 bg-[#10131f] px-3 py-2">
          <div>
            <div className="pixel-title text-[7px] text-[#8b93b8]">
              REGISTRO DEL {new Date(activeEntry.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).toUpperCase()}
            </div>
            <div className="mono text-base font-bold text-white">
              {activeEntry.kg} kg
            </div>
          </div>
          {sortedEntries.length > 1 && (
            <button
              type="button"
              onClick={() => {
                deleteWeightEntry(activeEntry.id);
                sfx.tap();
                haptic(6);
              }}
              className="pixel-title border border-[#2c3350] bg-[#1a1215] px-2 py-1 text-[7px] text-[var(--red)] hover:border-[var(--red)] cursor-pointer"
            >
              ELIMINAR ENTRADA
            </button>
          )}
        </div>
      )}

      {/* Modal / Bottom Sheet for registering bodyweight */}
      <AnimatePresence>
        {isModalOpen && (
          <Sheet title="⚖️ REGISTRAR PESO" onClose={() => setIsModalOpen(false)}>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#2c3350] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚖️</span>
                  <div>
                    <h3 className="pixel-title text-[11px] text-[var(--gold)]">REGISTRAR NUEVO PESO</h3>
                    <span className="pixel-title text-[7px] text-[#8b93b8]">ACTUALIZA TU PROGRESO</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 py-4">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  transition={APPLE_TAP}
                  onClick={() => {
                    const cur = parseFloat(newBwDraft.replace(",", ".")) || bodyweight;
                    setNewBwDraft(String(Math.max(30, Math.round((cur - 0.2) * 10) / 10)));
                    sfx.tick();
                  }}
                  className="step-btn h-12 w-12 text-xl font-bold"
                >
                  −
                </motion.button>

                <div className="flex items-baseline border-2 border-[var(--gold)] bg-[#0c0e17] px-4 py-2">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="250"
                    value={newBwDraft}
                    onChange={(e) => setNewBwDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitNewWeight();
                    }}
                    autoFocus
                    className="mono w-24 bg-transparent text-center text-3xl font-bold text-white tabular-nums outline-none"
                  />
                  <span className="mono text-lg font-bold text-[var(--gold)]">kg</span>
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  transition={APPLE_TAP}
                  onClick={() => {
                    const cur = parseFloat(newBwDraft.replace(",", ".")) || bodyweight;
                    setNewBwDraft(String(Math.min(250, Math.round((cur + 0.2) * 10) / 10)));
                    sfx.tick();
                  }}
                  className="step-btn h-12 w-12 text-xl font-bold"
                >
                  +
                </motion.button>
              </div>

              <div className="flex gap-2">
                <PixelButton
                  variant="gold"
                  className="w-full py-3 text-[9px] font-bold"
                  onClick={commitNewWeight}
                >
                  ✓ GUARDAR EN EL HISTORIAL
                </PixelButton>
              </div>
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </Panel>
  );
}
