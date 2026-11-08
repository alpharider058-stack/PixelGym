"use client";
import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useGame } from "@/lib/store";
import { Muscle, TEMPLATES } from "@/lib/data";
import { calculateMuscleHeatmap, MuscleHeatmapData } from "@/lib/heatmap";
import { APPLE_BOUNCE, APPLE_SPRING, APPLE_TAP, Panel, PixelButton } from "./ui";
import { sfx, haptic } from "@/lib/fx";

interface Props {
  onClose?: () => void;
  compact?: boolean;
}

export default function MuscleHeatmap({ onClose, compact = false }: Props) {
  const { history, bodyweight } = useGame(
    useShallow((s) => ({
      history: s.history || [],
      bodyweight: s.bodyweight ?? 75,
    }))
  );

  const [selectedMuscle, setSelectedMuscle] = useState<Muscle>("chest");
  const [viewMode, setViewMode] = useState<"both" | "front" | "back">("both");

  const heatmap = useMemo(
    () => calculateMuscleHeatmap(history, bodyweight),
    [history, bodyweight]
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

  // Suggest routines based on which muscles are fresh / recovered
  const recommendedRoutines = useMemo(() => {
    return TEMPLATES.filter((r) => {
      // Check if majority of its targeted muscles are recovered/recovering
      return true;
    }).slice(0, 2);
  }, []);

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
          <h3 className="pixel-title text-xs text-[var(--gold)] flex items-center gap-1.5">
            <span>🧬</span> MAPA DE CALOR MUSCULAR
          </h3>
          <span className="pixel-title text-[7px] text-[#8b93b8]">
            RECUPERACIÓN Y VOLUMEN (ÚLTIMOS 7 DÍAS)
          </span>
        </div>

        {/* Legend status pills */}
        <div className="flex items-center gap-1.5 text-[7px] pixel-title">
          <span className="flex items-center gap-1 border border-[#2c3350] bg-[#10131f] px-1.5 py-0.5 text-[#7dff6a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7dff6a]" />
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
                : "border-[#2c3350] bg-[#10131f] text-[#8b93b8] hover:border-[#4a5280]"
            }`}
          >
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* Silhouettes Stage */}
      <div className="relative flex items-center justify-around rounded border-2 border-[#2c3350] bg-[#090b14] p-3 shadow-inner">
        {(viewMode === "both" || viewMode === "front") && (
          <div className="flex flex-col items-center gap-1">
            <span className="pixel-title text-[7.5px] text-[#cbd5e1] tracking-wider">
              FRONTAL
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
            <span className="pixel-title text-[7.5px] text-[#cbd5e1] tracking-wider">
              TRASERA
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
      <div className="flex gap-1 overflow-x-auto pb-1 px-0.5">
        {(["chest", "back", "shoulders", "arms", "legs"] as Muscle[]).map((m) => {
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
                className="h-2 w-2 rounded-full border border-black"
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
            <div className="border border-[#2c3350] bg-[#0c0e17]/80 p-1.5">
              <div className="pixel-title text-[7px] text-[#8b93b8]">SERIES ÚLTIMOS 7 DÍAS</div>
              <div className="mono text-base font-bold tabular-nums text-white">
                {cur.setsCount7d} series
              </div>
            </div>
            <div className="border border-[#2c3350] bg-[#0c0e17]/80 p-1.5">
              <div className="pixel-title text-[7px] text-[#8b93b8]">VOLUMEN ACUMULADO</div>
              <div className="mono text-base font-bold tabular-nums text-[var(--gold)]">
                {cur.volumeKg7d.toLocaleString("es")} kg
              </div>
            </div>
          </div>

          <div className="border-t border-[#2c3350] pt-2">
            <div className="pixel-title text-[7.5px] text-[#8b93b8] mb-0.5">
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
          className="w-full py-2.5 text-[9px] mt-2"
          onClick={onClose}
        >
          VOLVER AL ENTRENAMIENTO
        </PixelButton>
      )}
    </div>
  );
}

/* ---------------- FRONT SILHOUETTE (SVG PIXEL ART) ---------------- */
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

  return (
    <svg
      width="130"
      height="190"
      viewBox="0 0 60 90"
      className="pixelated cursor-pointer select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
      shapeRendering="crispEdges"
    >
      {/* Background shadow silhouette border */}
      <path
        d="M26 4h8v12h-8z M28 16h4v4h-4z M12 20h36v12h-36z M8 32h44v24h-44z M18 48h24v38h-24z"
        fill="#040609"
        opacity="0.8"
      />

      {/* Head & Neck */}
      <rect x="26" y="4" width="8" height="11" fill="#e0a370" stroke="#000" strokeWidth="1" />
      <rect x="28" y="7" width="1.5" height="1.5" fill="#111" />
      <rect x="31" y="7" width="1.5" height="1.5" fill="#111" />
      <rect x="28" y="15" width="4" height="4" fill="#b2703f" stroke="#000" strokeWidth="1" />

      {/* SHOULDERS (Deltoides Anteriores / Laterales) */}
      <g
        onClick={() => onSelect("shoulders")}
        className="transition-transform active:scale-95"
        style={{ cursor: "pointer" }}
      >
        {/* Left shoulder */}
        <rect
          x="14"
          y="19"
          width="8"
          height="10"
          fill={shCol}
          stroke={selected === "shoulders" ? "#fff" : "#000"}
          strokeWidth={selected === "shoulders" ? "1.5" : "1"}
        />
        <rect x="15" y="21" width="3" height="3" fill="#ffffff" opacity="0.25" />

        {/* Right shoulder */}
        <rect
          x="38"
          y="19"
          width="8"
          height="10"
          fill={shCol}
          stroke={selected === "shoulders" ? "#fff" : "#000"}
          strokeWidth={selected === "shoulders" ? "1.5" : "1"}
        />
        <rect x="42" y="21" width="3" height="3" fill="#ffffff" opacity="0.25" />
      </g>

      {/* CHEST (Pectorales) */}
      <g
        onClick={() => onSelect("chest")}
        className="transition-transform active:scale-95"
        style={{ cursor: "pointer" }}
      >
        <rect
          x="22"
          y="19"
          width="16"
          height="12"
          fill={chCol}
          stroke={selected === "chest" ? "#fff" : "#000"}
          strokeWidth={selected === "chest" ? "1.5" : "1"}
        />
        {/* Sternal line division */}
        <line x1="30" y1="19" x2="30" y2="31" stroke="#000" strokeWidth="1" />
        {/* Muscle spec line */}
        <rect x="23" y="21" width="5" height="2" fill="#fff" opacity="0.3" />
        <rect x="32" y="21" width="5" height="2" fill="#fff" opacity="0.3" />
      </g>

      {/* CORE / ABS (Abdominales) */}
      <g>
        <rect x="23" y="31" width="14" height="15" fill="#1e2438" stroke="#000" strokeWidth="1" />
        {/* Six pack divider lines */}
        <line x1="30" y1="31" x2="30" y2="44" stroke="#0c0e17" strokeWidth="1" />
        <line x1="25" y1="35" x2="35" y2="35" stroke="#0c0e17" strokeWidth="1" />
        <line x1="25" y1="39" x2="35" y2="39" stroke="#0c0e17" strokeWidth="1" />
      </g>

      {/* ARMS (Bíceps y Antebrazos) */}
      <g
        onClick={() => onSelect("arms")}
        className="transition-transform active:scale-95"
        style={{ cursor: "pointer" }}
      >
        {/* Left Arm */}
        <rect
          x="8"
          y="29"
          width="6"
          height="13"
          fill={arCol}
          stroke={selected === "arms" ? "#fff" : "#000"}
          strokeWidth={selected === "arms" ? "1.5" : "1"}
        />
        <rect
          x="7"
          y="42"
          width="5.5"
          height="14"
          fill={arCol}
          stroke={selected === "arms" ? "#fff" : "#000"}
          strokeWidth={selected === "arms" ? "1.5" : "1"}
        />

        {/* Right Arm */}
        <rect
          x="46"
          y="29"
          width="6"
          height="13"
          fill={arCol}
          stroke={selected === "arms" ? "#fff" : "#000"}
          strokeWidth={selected === "arms" ? "1.5" : "1"}
        />
        <rect
          x="47.5"
          y="42"
          width="5.5"
          height="14"
          fill={arCol}
          stroke={selected === "arms" ? "#fff" : "#000"}
          strokeWidth={selected === "arms" ? "1.5" : "1"}
        />
      </g>

      {/* LEGS (Cuádriceps y Piernas) */}
      <g
        onClick={() => onSelect("legs")}
        className="transition-transform active:scale-95"
        style={{ cursor: "pointer" }}
      >
        {/* Left Thigh (Cuádriceps) */}
        <rect
          x="19"
          y="46"
          width="9"
          height="18"
          fill={lgCol}
          stroke={selected === "legs" ? "#fff" : "#000"}
          strokeWidth={selected === "legs" ? "1.5" : "1"}
        />
        {/* Left Shin */}
        <rect
          x="20"
          y="64"
          width="7"
          height="18"
          fill={lgCol}
          stroke={selected === "legs" ? "#fff" : "#000"}
          strokeWidth={selected === "legs" ? "1.5" : "1"}
        />

        {/* Right Thigh (Cuádriceps) */}
        <rect
          x="32"
          y="46"
          width="9"
          height="18"
          fill={lgCol}
          stroke={selected === "legs" ? "#fff" : "#000"}
          strokeWidth={selected === "legs" ? "1.5" : "1"}
        />
        {/* Right Shin */}
        <rect
          x="33"
          y="64"
          width="7"
          height="18"
          fill={lgCol}
          stroke={selected === "legs" ? "#fff" : "#000"}
          strokeWidth={selected === "legs" ? "1.5" : "1"}
        />
      </g>
    </svg>
  );
}

/* ---------------- BACK SILHOUETTE (SVG PIXEL ART) ---------------- */
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

  return (
    <svg
      width="130"
      height="190"
      viewBox="0 0 60 90"
      className="pixelated cursor-pointer select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
      shapeRendering="crispEdges"
    >
      {/* Background shadow */}
      <path
        d="M26 4h8v12h-8z M28 16h4v4h-4z M12 20h36v12h-36z M8 32h44v24h-44z M18 48h24v38h-24z"
        fill="#040609"
        opacity="0.8"
      />

      {/* Head back & Neck */}
      <rect x="26" y="4" width="8" height="11" fill="#4a3728" stroke="#000" strokeWidth="1" />
      <rect x="28" y="15" width="4" height="4" fill="#b2703f" stroke="#000" strokeWidth="1" />

      {/* SHOULDERS BACK (Deltoides Posteriores) */}
      <g
        onClick={() => onSelect("shoulders")}
        className="transition-transform active:scale-95"
        style={{ cursor: "pointer" }}
      >
        <rect
          x="14"
          y="19"
          width="7"
          height="9"
          fill={shCol}
          stroke={selected === "shoulders" ? "#fff" : "#000"}
          strokeWidth={selected === "shoulders" ? "1.5" : "1"}
        />
        <rect
          x="39"
          y="19"
          width="7"
          height="9"
          fill={shCol}
          stroke={selected === "shoulders" ? "#fff" : "#000"}
          strokeWidth={selected === "shoulders" ? "1.5" : "1"}
        />
      </g>

      {/* BACK (Trapecios, Dorsales y Lumbar) */}
      <g
        onClick={() => onSelect("back")}
        className="transition-transform active:scale-95"
        style={{ cursor: "pointer" }}
      >
        {/* Trapezius V-shape */}
        <polygon
          points="25,19 35,19 38,26 30,32 22,26"
          fill={bkCol}
          stroke={selected === "back" ? "#fff" : "#000"}
          strokeWidth={selected === "back" ? "1.5" : "1"}
        />
        {/* Lats (Dorsal ancho) */}
        <rect
          x="21"
          y="27"
          width="18"
          height="12"
          fill={bkCol}
          stroke={selected === "back" ? "#fff" : "#000"}
          strokeWidth={selected === "back" ? "1.5" : "1"}
        />
        {/* Lower back / Lumbar */}
        <rect
          x="24"
          y="39"
          width="12"
          height="7"
          fill={bkCol}
          stroke={selected === "back" ? "#fff" : "#000"}
          strokeWidth={selected === "back" ? "1.5" : "1"}
        />
        {/* Spine line */}
        <line x1="30" y1="20" x2="30" y2="45" stroke="#000" strokeWidth="1" />
      </g>

      {/* ARMS BACK (Tríceps y Antebrazo posterior) */}
      <g
        onClick={() => onSelect("arms")}
        className="transition-transform active:scale-95"
        style={{ cursor: "pointer" }}
      >
        {/* Left Triceps */}
        <rect
          x="8"
          y="28"
          width="6"
          height="14"
          fill={arCol}
          stroke={selected === "arms" ? "#fff" : "#000"}
          strokeWidth={selected === "arms" ? "1.5" : "1"}
        />
        <rect
          x="7"
          y="42"
          width="5.5"
          height="14"
          fill={arCol}
          stroke={selected === "arms" ? "#fff" : "#000"}
          strokeWidth={selected === "arms" ? "1.5" : "1"}
        />

        {/* Right Triceps */}
        <rect
          x="46"
          y="28"
          width="6"
          height="14"
          fill={arCol}
          stroke={selected === "arms" ? "#fff" : "#000"}
          strokeWidth={selected === "arms" ? "1.5" : "1"}
        />
        <rect
          x="47.5"
          y="42"
          width="5.5"
          height="14"
          fill={arCol}
          stroke={selected === "arms" ? "#fff" : "#000"}
          strokeWidth={selected === "arms" ? "1.5" : "1"}
        />
      </g>

      {/* LEGS BACK (Glúteos, Femorales y Gemelos) */}
      <g
        onClick={() => onSelect("legs")}
        className="transition-transform active:scale-95"
        style={{ cursor: "pointer" }}
      >
        {/* Glutes */}
        <rect
          x="19"
          y="46"
          width="22"
          height="10"
          fill={lgCol}
          stroke={selected === "legs" ? "#fff" : "#000"}
          strokeWidth={selected === "legs" ? "1.5" : "1"}
        />
        <line x1="30" y1="46" x2="30" y2="56" stroke="#000" strokeWidth="1" />

        {/* Left Hamstring (Femoral) */}
        <rect
          x="19"
          y="56"
          width="9"
          height="10"
          fill={lgCol}
          stroke={selected === "legs" ? "#fff" : "#000"}
          strokeWidth={selected === "legs" ? "1.5" : "1"}
        />
        {/* Left Calf (Gemelo) */}
        <rect
          x="19.5"
          y="66"
          width="7.5"
          height="16"
          fill={lgCol}
          stroke={selected === "legs" ? "#fff" : "#000"}
          strokeWidth={selected === "legs" ? "1.5" : "1"}
        />

        {/* Right Hamstring (Femoral) */}
        <rect
          x="32"
          y="56"
          width="9"
          height="10"
          fill={lgCol}
          stroke={selected === "legs" ? "#fff" : "#000"}
          strokeWidth={selected === "legs" ? "1.5" : "1"}
        />
        {/* Right Calf (Gemelo) */}
        <rect
          x="33"
          y="66"
          width="7.5"
          height="16"
          fill={lgCol}
          stroke={selected === "legs" ? "#fff" : "#000"}
          strokeWidth={selected === "legs" ? "1.5" : "1"}
        />
      </g>
    </svg>
  );
}
