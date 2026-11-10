"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useGame, WorkoutLog } from "@/lib/store";
import { Muscle, TEMPLATES } from "@/lib/data";
import { calculateMuscleHeatmap, MuscleHeatmapData } from "@/lib/heatmap";
import { APPLE_BOUNCE, APPLE_SPRING, APPLE_TAP, Panel, PixelButton } from "./ui";
import { sfx, haptic } from "@/lib/fx";

const EMPTY_HISTORY: WorkoutLog[] = [];

interface Props {
  onClose?: () => void;
  compact?: boolean;
}

export default function MuscleHeatmap({ onClose, compact = false }: Props) {
  const { history, bodyweight } = useGame(
    useShallow((s) => ({
      history: s.history ?? EMPTY_HISTORY,
      bodyweight: s.bodyweight ?? 75,
    }))
  );

  const [selectedMuscle, setSelectedMuscle] = useState<Muscle>("chest");
  const [viewMode, setViewMode] = useState<"both" | "front" | "back">("both");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const id = setInterval(refresh, 60000);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const heatmap = useMemo(
    () => calculateMuscleHeatmap(history, bodyweight, now),
    [history, bodyweight, now]
  );

  const counts = useMemo(() => {
    let recovered = 0;
    let recovering = 0;
    let fatigued = 0;
    for (const m of Object.values(heatmap)) {
      if (m.state === "recovered") recovered++;
      else if (m.state === "recovering") recovering++;
      else if (m.state === "fatigued") fatigued++;
    }
    return { recovered, recovering, fatigued };
  }, [heatmap]);

  const cur = heatmap[selectedMuscle];

  const handleSelect = (m: Muscle) => {
    setSelectedMuscle(m);
    sfx.tick();
    haptic(6);
  };

  return (
    <div className="space-y-3.5">
      {/* Recovery summary header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#2c3350] pb-2 px-1">
        <div>
          <h3 className="pixel-title text-xs text-[var(--gold)] flex items-center gap-1.5 font-bold">
            <span>🧬</span> MAPA DE CALOR MUSCULAR
          </h3>
          <span className="pixel-title text-[7px] text-[#8b93b8]">
            CIENCIA DEL ENTRENAMIENTO & RECUPERACIÓN (7 DÍAS)
          </span>
        </div>

        {/* Legend status pills */}
        <div className="flex items-center gap-1.5 text-[7px] pixel-title">
          <span className="flex items-center gap-1 border border-[#2c3350] bg-[#10131f] px-1.5 py-0.5 text-[#7dff6a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7dff6a] animate-pulse" />
            {counts.recovered} FRESCOS
          </span>
          <span className="flex items-center gap-1 border border-[#2c3350] bg-[#10131f] px-1.5 py-0.5 text-[#ffe14d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ffe14d]" />
            {counts.recovering} ÓPTIMOS
          </span>
          <span className="flex items-center gap-1 border border-[#2c3350] bg-[#10131f] px-1.5 py-0.5 text-[#ff3f6c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff3f6c]" />
            {counts.fatigued} FATIGADOS
          </span>
        </div>
      </div>

      {/* View switcher tabs */}
      <div className="grid grid-cols-3 gap-1 px-1">
        {(
          [
            { id: "both", label: "AMBAS VISTAS" },
            { id: "front", label: "VISTA FRONTAL" },
            { id: "back", label: "VISTA TRASERA" },
          ] as const
        ).map((t) => (
          <motion.button
            key={t.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.94 }}
            transition={APPLE_TAP}
            onClick={() => {
              setViewMode(t.id);
              sfx.tick();
            }}
            className={`pixel-title py-1.5 text-[7px] border-2 transition-colors ${
              viewMode === t.id
                ? "border-[var(--gold)] bg-[var(--gold)] text-black font-bold shadow-[2px_2px_0_#000]"
                : "border-[#2c3350] bg-[#141826] text-[#8b93b8] hover:border-[#4a5280]"
            }`}
          >
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* Silhouettes Stage with Pedestal & Pixel Grid */}
      <div className="relative flex items-center justify-around rounded border-2 border-[#2c3350] bg-[#070912] p-2.5 sm:p-4 shadow-[inset_0_2px_14px_rgba(0,0,0,0.85)]">
        {(viewMode === "both" || viewMode === "front") && (
          <div className="flex flex-col items-center gap-1">
            <span className="pixel-title text-[7.5px] text-[#cbd5e1] tracking-wider font-bold">
              [FRONTAL]
            </span>
            <FrontSilhouette
              heatmap={heatmap}
              selected={selectedMuscle}
              onSelect={handleSelect}
            />
          </div>
        )}

        {(viewMode === "both" || viewMode === "back") && (
          <div className="flex flex-col items-center gap-1">
            <span className="pixel-title text-[7.5px] text-[#cbd5e1] tracking-wider font-bold">
              [TRASERA]
            </span>
            <BackSilhouette
              heatmap={heatmap}
              selected={selectedMuscle}
              onSelect={handleSelect}
            />
          </div>
        )}
      </div>

      {/* Muscle selector chips */}
      <div className="flex gap-1 overflow-x-auto pb-1 px-0.5 scrollbar-none touch-pan-x">
        {(["chest", "back", "shoulders", "arms", "legs", "core"] as Muscle[]).map((m) => {
          const item = heatmap[m];
          const isSel = selectedMuscle === m;
          return (
            <motion.button
              key={m}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              transition={APPLE_TAP}
              onClick={() => handleSelect(m)}
              className={`pixel-title flex items-center gap-1.5 shrink-0 border-2 px-2.5 py-1.5 text-[7.5px] transition-colors ${
                isSel
                  ? "border-white bg-[#1e2538] text-white shadow-[2px_2px_0_#000]"
                  : "border-[#2c3350] bg-[#10131f] text-[#8b93b8]"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full border border-black shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Detailed inspector card for selected muscle */}
      {cur && (
        <motion.div
          key={cur.muscle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={APPLE_SPRING}
          className="rounded border-2 p-3 space-y-2.5 shadow-[3px_3px_0_#000]"
          style={{
            borderColor: cur.color,
            background: `linear-gradient(180deg, ${cur.bgGlow} 0%, #0d101a 100%)`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {cur.muscle === "chest"
                  ? "🛡️"
                  : cur.muscle === "back"
                  ? "🦅"
                  : cur.muscle === "shoulders"
                  ? "⚡"
                  : cur.muscle === "arms"
                  ? "💪"
                  : cur.muscle === "core"
                  ? "🔥"
                  : "🦵"}
              </span>
              <div>
                <h4 className="pixel-title text-sm text-white font-bold">
                  {cur.label}
                </h4>
                <div className="mono text-[10px] text-[#cbd5e1]">
                  Último entreno: <b className="text-white">{cur.lastTrainedStr}</b>
                </div>
              </div>
            </div>

            <span
              className="pixel-title border-2 border-black px-2 py-0.5 text-[7.5px] font-bold shadow-[1px_1px_0_#000]"
              style={{ backgroundColor: cur.color, color: "#000" }}
            >
              {cur.statusTitle}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="border border-[#2c3350] bg-[#0c0e17]/80 p-2">
              <div className="pixel-title text-[7px] text-[#8b93b8]">SERIES ÚLTIMOS 7 DÍAS</div>
              <div className="mono text-base font-bold tabular-nums text-white">
                {cur.setsCount7d} series
              </div>
            </div>
            <div className="border border-[#2c3350] bg-[#0c0e17]/80 p-2">
              <div className="pixel-title text-[7px] text-[#8b93b8]">VOLUMEN ACUMULADO</div>
              <div className="mono text-base font-bold tabular-nums text-[var(--gold)]">
                {cur.volumeKg7d.toLocaleString("es")} kg
              </div>
            </div>
          </div>

          <div className="border-t border-[#2c3350] pt-2">
            <div className="pixel-title text-[7.5px] text-[#8b93b8] mb-0.5 font-bold">
              DIAGNÓSTICO DEL ENTRENADOR:
            </div>
            <p className="mono text-xs text-[#e2e8f0] leading-relaxed">
              {cur.recommendation}
            </p>
          </div>
        </motion.div>
      )}

      {onClose && (
        <PixelButton
          variant="gold"
          className="w-full py-3 text-xs mt-2 shadow-[2px_2px_0_#000]"
          onClick={onClose}
        >
          VOLVER AL ENTRENAMIENTO
        </PixelButton>
      )}
    </div>
  );
}

/* ---------------- FRONT SILHOUETTE (SCULPTED PIXEL ART) ---------------- */
function FrontSilhouette({
  heatmap,
  selected,
  onSelect,
}: {
  heatmap: Record<Muscle, MuscleHeatmapData>;
  selected: Muscle;
  onSelect: (m: Muscle) => void;
}) {
  const chCol = heatmap.chest.color;
  const shCol = heatmap.shoulders.color;
  const arCol = heatmap.arms.color;
  const lgCol = heatmap.legs.color;
  const crCol = heatmap.core.color;

  const isSelSh = selected === "shoulders";
  const isSelCh = selected === "chest";
  const isSelAr = selected === "arms";
  const isSelLg = selected === "legs";
  const isSelCr = selected === "core";

  return (
    <svg
      viewBox="0 0 64 96"
      className="pixelated cursor-pointer select-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] w-32 sm:w-36 max-w-[140px] h-auto"
      shapeRendering="crispEdges"
    >
      {/* Dark background silhouette shadow for crisp retro arcade outline */}
      <path
        d="M26 3h12v12h-12z M12 16h40v12h-40z M9 28h46v24h-46z M18 50h28v42h-28z"
        fill="#000000"
        opacity="0.6"
      />

      {/* Head, Hair & Facial features */}
      <rect x="26" y="3" width="12" height="5" fill="#241711" />
      <rect x="25" y="5" width="2" height="4" fill="#241711" />
      <rect x="37" y="5" width="2" height="4" fill="#241711" />
      <rect x="27" y="7" width="10" height="7" fill="#e5a872" />
      {/* Eyes & brow */}
      <rect x="29" y="9" width="1.8" height="1.8" fill="#121622" />
      <rect x="33.2" y="9" width="1.8" height="1.8" fill="#121622" />
      <rect x="29" y="8" width="2" height="0.8" fill="#241711" />
      <rect x="33" y="8" width="2" height="0.8" fill="#241711" />
      {/* Nose and mouth shadow */}
      <rect x="31.2" y="11" width="1.6" height="0.8" fill="#b87a4a" />
      <rect x="30.5" y="12.5" width="3" height="0.8" fill="#8a4f28" />
      {/* Neck & trapezius slope */}
      <rect x="29.5" y="14" width="5" height="3" fill="#cb8a56" />
      <polygon points="27,17 37,17 35,14 29,14" fill="#cb8a56" opacity="0.8" />

      {/* ================= SHOULDERS (Deltoides Anteriores y Laterales) ================= */}
      <g
        onClick={() => onSelect("shoulders")}
        className="transition-transform active:scale-95 [transform-box:fill-box] origin-center"
        style={{ cursor: "pointer" }}
      >
        {/* Left Boulder Deltoid */}
        <polygon
          points="15,19 22,17 23,26 14,27 12,23"
          fill={shCol}
          stroke={isSelSh ? "#ffffff" : "#000000"}
          strokeWidth={isSelSh ? "1.6" : "1"}
        />
        {/* Right Boulder Deltoid */}
        <polygon
          points="42,17 49,19 52,23 50,27 41,26"
          fill={shCol}
          stroke={isSelSh ? "#ffffff" : "#000000"}
          strokeWidth={isSelSh ? "1.6" : "1"}
        />
        {/* Specular highlights on shoulder caps */}
        <rect x="15" y="19" width="4" height="2" fill="#ffffff" opacity="0.35" />
        <rect x="45" y="19" width="4" height="2" fill="#ffffff" opacity="0.35" />
      </g>

      {/* ================= CHEST (Pectoral Mayor y Menor) ================= */}
      <g
        onClick={() => onSelect("chest")}
        className="transition-transform active:scale-95 [transform-box:fill-box] origin-center"
        style={{ cursor: "pointer" }}
      >
        {/* Left Pectoral plate */}
        <polygon
          points="22,17 31,17 31,31 22,31 20,26"
          fill={chCol}
          stroke={isSelCh ? "#ffffff" : "#000000"}
          strokeWidth={isSelCh ? "1.6" : "1"}
        />
        {/* Right Pectoral plate */}
        <polygon
          points="33,17 42,17 44,26 42,31 33,31"
          fill={chCol}
          stroke={isSelCh ? "#ffffff" : "#000000"}
          strokeWidth={isSelCh ? "1.6" : "1"}
        />
        {/* Sternal cleft (separation midline) */}
        <line x1="32" y1="17" x2="32" y2="31" stroke="#000000" strokeWidth="1.2" />
        {/* Upper clavicular highlights */}
        <rect x="23" y="18" width="6" height="2" fill="#ffffff" opacity="0.3" />
        <rect x="35" y="18" width="6" height="2" fill="#ffffff" opacity="0.3" />
        {/* Lower pectoral shadow fold */}
        <line x1="22" y1="30" x2="30" y2="30" stroke="#000000" strokeWidth="1" opacity="0.5" />
        <line x1="34" y1="30" x2="42" y2="30" stroke="#000000" strokeWidth="1" opacity="0.5" />
      </g>

      {/* ================= CORE / SIX-PACK ABS & SERRATUS ================= */}
      <g
        onClick={() => onSelect("core")}
        className="transition-transform active:scale-95 [transform-box:fill-box] origin-center"
        style={{ cursor: "pointer" }}
      >
        {/* Torso abdominal wall */}
        <polygon
          points="22,31 42,31 39,48 25,48"
          fill={crCol}
          stroke={isSelCr ? "#ffffff" : "#000000"}
          strokeWidth={isSelCr ? "1.6" : "1"}
        />
        {/* Linea alba (vertical midline) */}
        <line x1="32" y1="31" x2="32" y2="47" stroke="#000000" strokeWidth="1.2" opacity="0.6" />
        {/* Tendinous intersections (horizontal 6-pack cuts) */}
        <line x1="25" y1="36" x2="39" y2="36" stroke="#000000" strokeWidth="1" opacity="0.55" />
        <line x1="26" y1="41" x2="38" y2="41" stroke="#000000" strokeWidth="1" opacity="0.55" />
        {/* Abs highlights */}
        <rect x="26" y="32" width="4" height="2.5" fill="#ffffff" opacity="0.28" />
        <rect x="34" y="32" width="4" height="2.5" fill="#ffffff" opacity="0.28" />
        <rect x="26" y="37" width="4" height="2.5" fill="#ffffff" opacity="0.28" />
        <rect x="34" y="37" width="4" height="2.5" fill="#ffffff" opacity="0.28" />
        {/* Serratus anterior & Adonis belt */}
        <line x1="21" y1="34" x2="24" y2="37" stroke="#000000" strokeWidth="0.8" opacity="0.55" />
        <line x1="43" y1="34" x2="40" y2="37" stroke="#000000" strokeWidth="0.8" opacity="0.55" />
        <line x1="27" y1="45" x2="32" y2="48" stroke="#000000" strokeWidth="1" opacity="0.55" />
        <line x1="37" y1="45" x2="32" y2="48" stroke="#000000" strokeWidth="1" opacity="0.55" />
      </g>

      {/* ================= ARMS (Bíceps y Antebrazos) ================= */}
      <g
        onClick={() => onSelect("arms")}
        className="transition-transform active:scale-95 [transform-box:fill-box] origin-center"
        style={{ cursor: "pointer" }}
      >
        {/* Left Biceps peak */}
        <polygon
          points="13,27 21,26 20,40 11,40 10,34"
          fill={arCol}
          stroke={isSelAr ? "#ffffff" : "#000000"}
          strokeWidth={isSelAr ? "1.6" : "1"}
        />
        {/* Left Forearm sweep */}
        <polygon
          points="11,40 20,40 18,53 10,53 9,46"
          fill={arCol}
          stroke={isSelAr ? "#ffffff" : "#000000"}
          strokeWidth={isSelAr ? "1.6" : "1"}
        />
        {/* Left Clenched Fist */}
        <rect x="9.5" y="53.5" width="7" height="6.5" fill="#e5a872" stroke="#000000" strokeWidth="1" />

        {/* Right Biceps peak */}
        <polygon
          points="43,26 51,27 54,34 53,40 44,40"
          fill={arCol}
          stroke={isSelAr ? "#ffffff" : "#000000"}
          strokeWidth={isSelAr ? "1.6" : "1"}
        />
        {/* Right Forearm sweep */}
        <polygon
          points="44,40 53,40 55,46 54,53 46,53"
          fill={arCol}
          stroke={isSelAr ? "#ffffff" : "#000000"}
          strokeWidth={isSelAr ? "1.6" : "1"}
        />
        {/* Right Clenched Fist */}
        <rect x="47.5" y="53.5" width="7" height="6.5" fill="#e5a872" stroke="#000000" strokeWidth="1" />

        {/* Biceps Specular Highlights */}
        <rect x="12" y="31" width="3" height="5" fill="#ffffff" opacity="0.3" />
        <rect x="49" y="31" width="3" height="5" fill="#ffffff" opacity="0.3" />
      </g>

      {/* Gym waistband & trunks */}
      <rect x="25" y="48" width="14" height="4" fill="#0c101d" stroke="#000000" strokeWidth="1" />
      <line x1="25" y1="48" x2="39" y2="48" stroke="var(--gold)" strokeWidth="1" />

      {/* ================= LEGS (Cuádriceps, Rodillas, Gemelos) ================= */}
      <g
        onClick={() => onSelect("legs")}
        className="transition-transform active:scale-95 [transform-box:fill-box] origin-center"
        style={{ cursor: "pointer" }}
      >
        {/* Left Thigh (Cuádriceps sweep) */}
        <polygon
          points="20,52 30,52 30,68 22,68 18,60"
          fill={lgCol}
          stroke={isSelLg ? "#ffffff" : "#000000"}
          strokeWidth={isSelLg ? "1.6" : "1"}
        />
        {/* Left Kneecap */}
        <polygon points="22,68 29,68 28,72 23,72" fill={lgCol} stroke="#000" strokeWidth="1" />

        {/* Left Shin & Calf flare */}
        <polygon
          points="22,72 29,72 28,88 23,88 19,79"
          fill={lgCol}
          stroke={isSelLg ? "#ffffff" : "#000000"}
          strokeWidth={isSelLg ? "1.6" : "1"}
        />
        {/* Left Athletic Sneaker */}
        <rect x="20" y="88.5" width="9" height="4" fill="#121622" stroke="#000" strokeWidth="1" />
        <line x1="20" y1="92" x2="29" y2="92" stroke="#ffffff" strokeWidth="1" />

        {/* Right Thigh (Cuádriceps sweep) */}
        <polygon
          points="34,52 44,52 46,60 42,68 34,68"
          fill={lgCol}
          stroke={isSelLg ? "#ffffff" : "#000000"}
          strokeWidth={isSelLg ? "1.6" : "1"}
        />
        {/* Right Kneecap */}
        <polygon points="35,68 42,68 41,72 36,72" fill={lgCol} stroke="#000" strokeWidth="1" />

        {/* Right Shin & Calf flare */}
        <polygon
          points="35,72 42,72 45,79 41,88 36,88"
          fill={lgCol}
          stroke={isSelLg ? "#ffffff" : "#000000"}
          strokeWidth={isSelLg ? "1.6" : "1"}
        />
        {/* Right Athletic Sneaker */}
        <rect x="35" y="88.5" width="9" height="4" fill="#121622" stroke="#000" strokeWidth="1" />
        <line x1="35" y1="92" x2="44" y2="92" stroke="#ffffff" strokeWidth="1" />

        {/* Vastus Medialis (Teardrop) Highlights */}
        <rect x="25.5" y="63" width="3.5" height="3.5" fill="#ffffff" opacity="0.35" />
        <rect x="35" y="63" width="3.5" height="3.5" fill="#ffffff" opacity="0.35" />
      </g>
    </svg>
  );
}

/* ---------------- BACK SILHOUETTE (SCULPTED PIXEL ART) ---------------- */
function BackSilhouette({
  heatmap,
  selected,
  onSelect,
}: {
  heatmap: Record<Muscle, MuscleHeatmapData>;
  selected: Muscle;
  onSelect: (m: Muscle) => void;
}) {
  const bkCol = heatmap.back.color;
  const shCol = heatmap.shoulders.color;
  const arCol = heatmap.arms.color;
  const lgCol = heatmap.legs.color;

  const isSelBk = selected === "back";
  const isSelSh = selected === "shoulders";
  const isSelAr = selected === "arms";
  const isSelLg = selected === "legs";

  return (
    <svg
      viewBox="0 0 64 96"
      className="pixelated cursor-pointer select-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] w-32 sm:w-36 max-w-[140px] h-auto"
      shapeRendering="crispEdges"
    >
      {/* Dark background silhouette shadow */}
      <path
        d="M26 3h12v12h-12z M12 16h40v12h-40z M9 28h46v24h-46z M18 50h28v42h-28z"
        fill="#000000"
        opacity="0.6"
      />

      {/* Head Back & Hair fade */}
      <rect x="26" y="3" width="12" height="9" fill="#241711" stroke="#000" strokeWidth="1" />
      <rect x="28" y="12" width="8" height="3" fill="#19100b" />
      <rect x="29.5" y="14" width="5" height="3" fill="#cb8a56" />

      {/* ================= REAR SHOULDERS (Deltoides Posteriores) ================= */}
      <g
        onClick={() => onSelect("shoulders")}
        className="transition-transform active:scale-95 [transform-box:fill-box] origin-center"
        style={{ cursor: "pointer" }}
      >
        <polygon
          points="15,19 23,17 22,26 13,26 12,22"
          fill={shCol}
          stroke={isSelSh ? "#ffffff" : "#000000"}
          strokeWidth={isSelSh ? "1.6" : "1"}
        />
        <polygon
          points="41,17 49,19 52,22 51,26 42,26"
          fill={shCol}
          stroke={isSelSh ? "#ffffff" : "#000000"}
          strokeWidth={isSelSh ? "1.6" : "1"}
        />
        <rect x="15" y="19" width="3.5" height="2" fill="#ffffff" opacity="0.3" />
        <rect x="45.5" y="19" width="3.5" height="2" fill="#ffffff" opacity="0.3" />
      </g>

      {/* ================= BACK (Trapecio y Dorsales "Lats" en V) ================= */}
      <g
        onClick={() => onSelect("back")}
        className="transition-transform active:scale-95 [transform-box:fill-box] origin-center"
        style={{ cursor: "pointer" }}
      >
        {/* Upper Diamond Trapezius */}
        <polygon
          points="29,15 35,15 39,22 32,31 25,22"
          fill={bkCol}
          stroke={isSelBk ? "#ffffff" : "#000000"}
          strokeWidth={isSelBk ? "1.6" : "1"}
        />

        {/* Flared V-Taper Lats (Dorsales anchos) */}
        <polygon
          points="23,22 41,22 47,31 40,44 24,44 17,31"
          fill={bkCol}
          stroke={isSelBk ? "#ffffff" : "#000000"}
          strokeWidth={isSelBk ? "1.6" : "1"}
        />

        {/* Lower Back / Erector Spinae (Árbol de Navidad lumbar) */}
        <polygon
          points="24,44 40,44 38,49 26,49"
          fill={bkCol}
          stroke={isSelBk ? "#ffffff" : "#000000"}
          strokeWidth={isSelBk ? "1.6" : "1"}
        />

        {/* Spine line division */}
        <line x1="32" y1="16" x2="32" y2="48" stroke="#000000" strokeWidth="1.2" />

        {/* Lats Wing Highlights */}
        <rect x="19" y="28" width="4" height="6" fill="#ffffff" opacity="0.25" />
        <rect x="41" y="28" width="4" height="6" fill="#ffffff" opacity="0.25" />
      </g>

      {/* ================= ARMS BACK (Tríceps y Antebrazos) ================= */}
      <g
        onClick={() => onSelect("arms")}
        className="transition-transform active:scale-95 [transform-box:fill-box] origin-center"
        style={{ cursor: "pointer" }}
      >
        {/* Left Triceps Horseshoe */}
        <polygon
          points="13,26 21,26 20,40 11,40 10,33"
          fill={arCol}
          stroke={isSelAr ? "#ffffff" : "#000000"}
          strokeWidth={isSelAr ? "1.6" : "1"}
        />
        {/* Left Forearm Posterior */}
        <polygon
          points="11,40 20,40 18,53 10,53 9,46"
          fill={arCol}
          stroke={isSelAr ? "#ffffff" : "#000000"}
          strokeWidth={isSelAr ? "1.6" : "1"}
        />
        <rect x="9.5" y="53.5" width="7" height="6.5" fill="#e5a872" stroke="#000000" strokeWidth="1" />

        {/* Right Triceps Horseshoe */}
        <polygon
          points="43,26 51,26 54,33 53,40 44,40"
          fill={arCol}
          stroke={isSelAr ? "#ffffff" : "#000000"}
          strokeWidth={isSelAr ? "1.6" : "1"}
        />
        {/* Right Forearm Posterior */}
        <polygon
          points="44,40 53,40 55,46 54,53 46,53"
          fill={arCol}
          stroke={isSelAr ? "#ffffff" : "#000000"}
          strokeWidth={isSelAr ? "1.6" : "1"}
        />
        <rect x="47.5" y="53.5" width="7" height="6.5" fill="#e5a872" stroke="#000000" strokeWidth="1" />

        {/* Triceps Specular Highlights */}
        <rect x="12" y="30" width="3" height="6" fill="#ffffff" opacity="0.3" />
        <rect x="49" y="30" width="3" height="6" fill="#ffffff" opacity="0.3" />
      </g>

      {/* Gym Shorts Back */}
      <rect x="25" y="49" width="14" height="3" fill="#0c101d" stroke="#000" strokeWidth="1" />

      {/* ================= LEGS BACK (Glúteos, Femorales y Gemelos) ================= */}
      <g
        onClick={() => onSelect("legs")}
        className="transition-transform active:scale-95 [transform-box:fill-box] origin-center"
        style={{ cursor: "pointer" }}
      >
        {/* Powerful Gluteus Maximus (Left & Right) */}
        <polygon
          points="20,52 32,52 32,63 19,63 18,57"
          fill={lgCol}
          stroke={isSelLg ? "#ffffff" : "#000000"}
          strokeWidth={isSelLg ? "1.6" : "1"}
        />
        <polygon
          points="32,52 44,52 46,57 45,63 32,63"
          fill={lgCol}
          stroke={isSelLg ? "#ffffff" : "#000000"}
          strokeWidth={isSelLg ? "1.6" : "1"}
        />
        {/* Gluteal cleft */}
        <line x1="32" y1="52" x2="32" y2="63" stroke="#000000" strokeWidth="1.2" />

        {/* Hamstrings (Femorales / Isquiosurales) */}
        <polygon
          points="19,63 30,63 29,73 21,73"
          fill={lgCol}
          stroke={isSelLg ? "#ffffff" : "#000000"}
          strokeWidth={isSelLg ? "1.6" : "1"}
        />
        <polygon
          points="34,63 45,63 43,73 35,73"
          fill={lgCol}
          stroke={isSelLg ? "#ffffff" : "#000000"}
          strokeWidth={isSelLg ? "1.6" : "1"}
        />

        {/* Diamond Gastrocnemius Calves (Gemelos) */}
        <polygon
          points="21,73 29,73 28,84 23,84 18,78"
          fill={lgCol}
          stroke={isSelLg ? "#ffffff" : "#000000"}
          strokeWidth={isSelLg ? "1.6" : "1"}
        />
        {/* Left Achilles tendon */}
        <rect x="23" y="84" width="5" height="4" fill={lgCol} stroke="#000" strokeWidth="1" />
        <rect x="20" y="88.5" width="9" height="4" fill="#121622" stroke="#000" strokeWidth="1" />
        <line x1="20" y1="92" x2="29" y2="92" stroke="#ffffff" strokeWidth="1" />

        <polygon
          points="35,73 43,73 46,78 41,84 36,84"
          fill={lgCol}
          stroke={isSelLg ? "#ffffff" : "#000000"}
          strokeWidth={isSelLg ? "1.6" : "1"}
        />
        {/* Right Achilles tendon */}
        <rect x="36" y="84" width="5" height="4" fill={lgCol} stroke="#000" strokeWidth="1" />
        <rect x="35" y="88.5" width="9" height="4" fill="#121622" stroke="#000" strokeWidth="1" />
        <line x1="35" y1="92" x2="44" y2="92" stroke="#ffffff" strokeWidth="1" />

        {/* Calf Diamond Highlights */}
        <rect x="22" y="76" width="3.5" height="3" fill="#ffffff" opacity="0.3" />
        <rect x="38.5" y="76" width="3.5" height="3" fill="#ffffff" opacity="0.3" />
      </g>
    </svg>
  );
}
