"use client";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { EX, MUSCLE_LABEL } from "@/lib/data";
import { getExerciseGuide } from "@/lib/exerciseAnimations";
import { haptic, sfx } from "@/lib/fx";
import ExerciseAnimationCanvas from "./ExerciseAnimationCanvas";
import { APPLE_BOUNCE, APPLE_TAP, PixelButton } from "./ui";

interface Props {
  exId: string;
  onClose: () => void;
}

export default function ExerciseGuideModal({ exId, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1>(1);

  const ex = EX[exId];
  const guide = useMemo(() => getExerciseGuide(exId, ex?.name), [exId, ex?.name]);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, scale: 0.94, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 40, scale: 0.94, opacity: 0 }}
        transition={APPLE_BOUNCE}
        className="panel flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden border-2 border-[var(--cyan)] bg-[#0f1320] shadow-[0_0_32px_rgba(61,242,255,0.25),6px_6px_0_#000]"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-2 border-b-2 border-[#2c3350] bg-[#121626] px-4 py-3">
          <div className="min-w-0">
            <div className="pixel-title text-[8px] text-[var(--cyan)] flex items-center gap-1.5">
              <span>🎮 GUÍA DE TÉCNICA PIXEL-ART</span>
              {ex && (
                <span className="border border-black bg-[#1e293b] px-1.5 py-0.5 text-[6.5px] text-[var(--gold)]">
                  {MUSCLE_LABEL[ex.muscle]}
                </span>
              )}
            </div>
            <h3 className="mono text-base sm:text-lg font-bold text-white truncate mt-0.5">
              {ex?.name ?? exId}
            </h3>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.88 }}
            transition={APPLE_TAP}
            onClick={() => {
              sfx.tap();
              onClose();
            }}
            aria-label="Cerrar guía"
            className="pixel-title flex h-8 w-8 shrink-0 items-center justify-center border border-[#2c3350] bg-[#141826] text-xs text-[#8b93b8] active:text-white"
          >
            ✕
          </motion.button>
        </div>

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3.5 space-y-3.5">
          {/* Arcade Monitor Stage */}
          <div className="flex flex-col items-center gap-2.5 border-2 border-[#2c3350] bg-[#090c16] p-3 shadow-[inset_0_0_24px_rgba(0,0,0,0.85),2px_2px_0_#000]">
            <div className="relative border-4 border-[#1e2642] bg-[#0c0f1b] p-1 shadow-[0_0_18px_rgba(61,242,255,0.16)]">
              <ExerciseAnimationCanvas
                exId={exId}
                exName={ex?.name}
                size={156}
                speed={speed}
                paused={paused}
                showMuscleGlow
              />
              <span className="pointer-events-none absolute top-1.5 left-1.5 border border-black bg-black/75 px-1.5 py-0.5 pixel-title text-[6px] text-[var(--gold)]">
                {speed === 0.5 ? "0.5x LENTO" : "1x TEMPO"}
              </span>
            </div>

            {/* Phase legend */}
            <div className="flex items-center justify-center gap-3 pixel-title text-[6px] text-[#8b93b8]">
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-2.5 bg-[#ffe14d]" /> IMPULSO
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-2.5 bg-[#ff3f6c]" /> PICO / CONTRACCIÓN
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-2.5 bg-[#3df2ff]" /> BAJADA CONTROLADA
              </span>
            </div>

            {/* Playback controls */}
            <div className="flex w-full gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                transition={APPLE_TAP}
                onClick={() => {
                  sfx.tick();
                  haptic(5);
                  setPaused((v) => !v);
                }}
                className={`pixel-title flex-1 border-2 py-2 text-[8px] font-bold shadow-[2px_2px_0_#000] ${
                  paused
                    ? "border-[var(--green)] bg-[#15291a] text-[#7dff6a]"
                    : "border-[#2c3350] bg-[#141826] text-white"
                }`}
              >
                {paused ? "▶ REANUDAR" : "⏸ PAUSAR"}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                transition={APPLE_TAP}
                onClick={() => {
                  sfx.tick();
                  haptic(5);
                  setSpeed((s) => (s === 1 ? 0.5 : 1));
                }}
                className={`pixel-title flex-1 border-2 py-2 text-[8px] font-bold shadow-[2px_2px_0_#000] ${
                  speed === 0.5
                    ? "border-[var(--gold)] bg-[#241e0a] text-[var(--gold)]"
                    : "border-[#2c3350] bg-[#141826] text-[var(--cyan)]"
                }`}
              >
                {speed === 0.5 ? "⚡ VOLVER A 1x" : "🐢 CÁMARA LENTA (0.5x)"}
              </motion.button>
            </div>
          </div>

          {/* Muscle & Tempo Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="border-2 border-[#2c3350] bg-[#10131f] p-2">
              <div className="pixel-title text-[6.5px] text-[var(--gold)]">🎯 MÚSCULO OBJETIVO</div>
              <div className="mono text-xs font-bold text-white mt-0.5 leading-snug">
                {guide.targetLabel}
              </div>
              <div className="mono text-[10.5px] text-[#8b93b8] leading-tight mt-0.5">
                +{guide.synergists}
              </div>
            </div>
            <div className="border-2 border-[#2c3350] bg-[#10131f] p-2">
              <div className="pixel-title text-[6.5px] text-[var(--cyan)]">⏱ RITMO & RESPIRACIÓN</div>
              <div className="mono text-xs font-bold text-white mt-0.5 leading-snug">
                {guide.tempo}
              </div>
              <div className="mono text-[10.5px] text-[#8b93b8] leading-tight mt-0.5">
                {guide.breathing}
              </div>
            </div>
          </div>

          {/* 3 Biomechanical Cues */}
          <div className="border-2 border-[#2c3350] bg-[#10131f] p-3 space-y-2">
            <div className="pixel-title text-[7.5px] text-[var(--green)]">
              ✓ CLAVES DE EJECUCIÓN CORRECTA
            </div>
            <div className="space-y-1.5">
              {guide.cues.map((cue, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="pixel-title mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-[#3a7a30] bg-[#15291a] text-[7px] text-[#7dff6a]">
                    {idx + 1}
                  </span>
                  <p className="mono text-xs text-[#e2e8f0] leading-snug">{cue}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Common Mistakes */}
          <div className="border-2 border-[#4c1d2a] bg-[#1c0b12] p-3 space-y-1.5">
            <div className="pixel-title text-[7.5px] text-[#ff3f6c]">
              ⚠ ERRORES COMUNES A EVITAR
            </div>
            {guide.mistakes.map((err, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="pixel-title text-[8px] text-[#ff3f6c] mt-0.5 shrink-0">✕</span>
                <p className="mono text-xs text-[#fecdd3] leading-snug">{err}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t-4 border-black bg-[#10131f] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
          <PixelButton
            variant="cyan"
            className="w-full py-3 text-[10px] font-bold shadow-[3px_3px_0_#000]"
            onClick={() => {
              sfx.tap();
              onClose();
            }}
          >
            ✓ ENTENDIDO · VOLVER A LA SERIE
          </PixelButton>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
