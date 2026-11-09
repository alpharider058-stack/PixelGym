"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useGame, WorkoutLog } from "@/lib/store";
import { e1rm, EX, isBodyweight, MUSCLE_LABEL, Muscle } from "@/lib/data";
import { haptic, sfx } from "@/lib/fx";
import { Panel, APPLE_SPRING, APPLE_TAP, APPLE_BOUNCE } from "./ui";
import { Sheet } from "./GymView";

function localDayKey(t: number): string {
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function HistoryView() {
  const history = useGame((s) => s.history);
  const best = useGame((s) => s.best);
  const bodyweight = useGame((s) => s.bodyweight ?? 75);
  const del = useGame((s) => s.deleteLog);
  const importBackupData = useGame((s) => s.importBackupData);

  const [open, setOpen] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [inspectExId, setInspectExId] = useState<string | null>(null);

  const last = history.slice(0, 12).reverse();
  const maxT = Math.max(1, ...last.map((h) => h.tonnage));

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
    };

    for (const h of history) {
      const t = h.startedAt;
      if (t >= thisWeekStart) {
        thisWeekTonnage += h.tonnage;
        thisWeekWorkouts++;
        for (const e of h.exercises) {
          const m = EX[e.exId]?.muscle;
          if (m) setsByMuscle[m] += e.sets.length;
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
      streak: state.streak,
      maxStreak: state.maxStreak,
      totalPrs: state.totalPrs,
      bossKills: state.bossKills,
      muscleVol: state.muscleVol,
      best: state.best,
      history: state.history,
      trophies: state.trophies,
      claimedAchievements: state.claimedAchievements,
      activeTitle: state.activeTitle,
      unlockedThemes: state.unlockedThemes,
      activeTheme: state.activeTheme,
      customRoutines: state.customRoutines,
      deletedRoutineIds: state.deletedRoutineIds,
      owned: state.owned,
      equipped: state.equipped,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixelgym-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    sfx.coin();
    haptic([20, 40]);
    const headers = "Fecha,Rutina,DuracionMin,Ejercicio,Serie,Kilos,Reps,EsPR\n";
    const rows: string[] = [];
    for (const h of history) {
      const date = new Date(h.startedAt).toISOString().slice(0, 10);
      const min = Math.round((h.endedAt - h.startedAt) / 60000);
      for (const e of h.exercises) {
        const exName = EX[e.exId]?.name ?? e.exId;
        e.sets.forEach((s, idx) => {
          rows.push(
            `"${date}","${h.name}",${min},"${exName}",${idx + 1},${s.kg},${s.reps},${s.pr ? "SI" : "NO"}`
          );
        });
      }
    }
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixelgym-entrenamientos-${new Date().toISOString().slice(0, 10)}.csv`;
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
              {weeklyStats.pctDelta > 0 ? `▲ +${weeklyStats.pctDelta}%` : weeklyStats.pctDelta < 0 ? `▼ ${weeklyStats.pctDelta}%` : "＝ 0%"} VS SEM. ANTERIOR
            </span>
          ) : weeklyStats.thisWeekTonnage > 0 ? (
            <span className="pixel-title border border-[var(--cyan)] bg-[#0d2330] px-2 py-0.5 text-[7px] text-[var(--cyan)]">
              ★ SEMANA EN MARCHA
            </span>
          ) : null}
        </div>

        {last.length ? (
          <div className="flex h-32 items-end gap-1">
            {last.map((h, i) => (
              <motion.div
                key={h.id}
                className="flex-1 bg-[var(--cyan)] cursor-pointer"
                style={{ height: "100%", originY: 1, boxShadow: "inset -3px 0 0 rgba(0,0,0,.35)" }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: Math.max(0.04, h.tonnage / maxT) }}
                whileHover={{ scaleY: Math.min(1, (h.tonnage / maxT) * 1.1) }}
                transition={{ ...APPLE_SPRING, delay: i * 0.03 }}
                title={`${h.name}: ${Math.round(h.tonnage).toLocaleString("es")} kg`}
              />
            ))}
          </div>
        ) : (
          <p className="mono text-[#8b93b8]">Aún no hay sesiones. ¡Ve al gimnasio!</p>
        )}

        {/* Weekly Muscle Series Breakdown */}
        <div className="border-t-2 border-[#2c3350] pt-2.5 space-y-2">
          <div className="flex items-center justify-between text-[7px] pixel-title text-[#8b93b8]">
            <span>SERIES ESTA SEMANA</span>
            <span className="text-white tabular-nums">
              {Math.round(weeklyStats.thisWeekTonnage).toLocaleString("es")} kg
              {weeklyStats.prevWeekTonnage > 0
                ? ` / ${Math.round(weeklyStats.prevWeekTonnage).toLocaleString("es")} ant.`
                : ""}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {(Object.keys(MUSCLE_LABEL) as Muscle[]).map((m) => {
              const cnt = weeklyStats.setsByMuscle[m];
              return (
                <div
                  key={m}
                  className={`border px-1 py-1.5 ${
                    cnt > 0 ? "border-[var(--cyan)]/50 bg-[#10131f]" : "border-[#2c3350] bg-[#0c0e17] opacity-65"
                  }`}
                >
                  <div className="pixel-title text-[5.5px] text-[#8b93b8] truncate">
                    {MUSCLE_LABEL[m].slice(0, 6)}
                  </div>
                  <div className={`mono text-base font-bold leading-none mt-0.5 tabular-nums ${cnt > 0 ? "text-[var(--cyan)]" : "text-[#636c8f]"}`}>
                    {cnt}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* CALENDARIO DE CONSISTENCIA (12 SEMANAS / 84 DÍAS) */}
      <ConsistencyCalendar history={history} />

      {/* RÉCORDS (INTERACTIVOS -> ABREN GRÁFICA) */}
      <Panel className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="pixel-title text-[10px] text-[var(--gold)]">RÉCORDS (1RM EST.)</h3>
          {Object.keys(best).length > 0 && (
            <span className="pixel-title text-[6.5px] text-[#8b93b8]">TOCA PARA VER GRÁFICA</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(best).sort((a, b) => b[1].e1rm - a[1].e1rm).map(([id, b]) => (
            <motion.button
              key={id}
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
              <div className="mono truncate text-sm text-white">{EX[id]?.name ?? id}</div>
              <div className="mt-0.5 flex items-baseline justify-between">
                <span className="mono text-lg tabular-nums font-bold text-[var(--red)]">{b.e1rm.toFixed(1)} kg</span>
                <span className="pixel-title text-[6px] text-[var(--cyan)]">📈 VER</span>
              </div>
            </motion.button>
          ))}
          {!Object.keys(best).length && <p className="mono col-span-2 text-[#8b93b8]">Sin récords todavía.</p>}
        </div>
      </Panel>

      {/* HISTORIAL */}
      <div className="flex flex-col gap-3">
        <h3 className="pixel-title text-[10px] text-[var(--gold)]">HISTORIAL</h3>
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
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={APPLE_TAP}
                  className="flex w-full items-center justify-between text-left cursor-pointer"
                  onClick={() => { setOpen(open === h.id ? null : h.id); sfx.tick(); }}
                >
                  <div>
                    <div className="pixel-title text-[9px]">{h.name}</div>
                    <div className="mono text-sm text-[#8b93b8]">{new Date(h.startedAt).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })} · {Math.round((h.endedAt - h.startedAt) / 60000)} min</div>
                  </div>
                  <span className="mono text-base tabular-nums text-[var(--cyan)]">{Math.round(h.tonnage).toLocaleString("es")} kg</span>
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
                          <span>{EX[e.exId]?.name ?? e.exId}</span>
                          <span className="tabular-nums text-[#8b93b8]">
                            {e.sets.map((s) => {
                              const isBw = isBodyweight(EX[e.exId]);
                              return isBw ? (s.kg > 0 ? `+${s.kg}kg×${s.reps}` : `PC×${s.reps}`) : `${s.kg}×${s.reps}`;
                            }).join(" · ")}
                          </span>
                        </div>
                      ))}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.92 }}
                        transition={APPLE_TAP}
                        className="pixel-title mt-2 w-full border-2 border-[var(--red)] py-2 text-[9px] text-[var(--red)] cursor-pointer"
                        onClick={() => { if (armed === h.id) { del(h.id); sfx.whoosh(); setArmed(null); } else { setArmed(h.id); sfx.error(); } }}
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
      </div>

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

        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.94, y: 1 }}
            transition={APPLE_TAP}
            onClick={exportJson}
            className="pixel-title flex items-center justify-center gap-1.5 border-2 border-[var(--cyan)] bg-[#0d222d] py-2.5 text-[8px] text-[var(--cyan)] shadow-[2px_2px_0_#000] cursor-pointer"
          >
            <span>📤 BACKUP (JSON)</span>
          </motion.button>
          <motion.button
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
      </Panel>

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
