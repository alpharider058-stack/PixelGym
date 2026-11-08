"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useGame } from "@/lib/store";
import { EX, isBodyweight } from "@/lib/data";
import { haptic, sfx } from "@/lib/fx";
import { Panel, SPRING, APPLE_SPRING, APPLE_TAP, APPLE_BOUNCE, APPLE_FLUID } from "./ui";

export default function HistoryView() {
  const history = useGame((s) => s.history);
  const best = useGame((s) => s.best);
  const del = useGame((s) => s.deleteLog);
  const importBackupData = useGame((s) => s.importBackupData);

  const [open, setOpen] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const last = history.slice(0, 12).reverse();
  const maxT = Math.max(1, ...last.map((h) => h.tonnage));

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
      muscleVol: state.muscleVol,
      best: state.best,
      history: state.history,
      trophies: state.trophies,
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
    <div className="space-y-4">
      <Panel className="p-4">
        <h3 className="pixel-title mb-3 text-[10px] text-[var(--gold)]">TONELAJE · ÚLTIMAS SESIONES</h3>
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
              />
            ))}
          </div>
        ) : <p className="mono text-[#8b93b8]">Aún no hay sesiones. ¡Ve al gimnasio!</p>}
      </Panel>

      <Panel className="p-4">
        <h3 className="pixel-title mb-2 text-[10px] text-[var(--gold)]">RÉCORDS (1RM EST.)</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(best).sort((a, b) => b[1].e1rm - a[1].e1rm).map(([id, b]) => (
            <motion.div
              key={id}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={APPLE_TAP}
              className="border-2 border-[#2c3350] bg-[#10131f] p-2 cursor-pointer shadow-[2px_2px_0_#000]"
            >
              <div className="mono truncate text-sm">{EX[id]?.name ?? id}</div>
              <div className="mono text-lg tabular-nums text-[var(--red)]">{b.e1rm.toFixed(1)} kg</div>
            </motion.div>
          ))}
          {!Object.keys(best).length && <p className="mono col-span-2 text-[#8b93b8]">Sin récords todavía.</p>}
        </div>
      </Panel>

      <div className="space-y-2">
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
    </div>
  );
}
