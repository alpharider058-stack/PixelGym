"use client";
import React, { useEffect, useMemo, useRef } from "react";
import { ANH, ANW, drawExerciseFrame, getExerciseGuide, repCycle, RepPhase } from "@/lib/exerciseAnimations";

interface Props {
  exId: string;
  exName?: string;
  /** Integer scale multiplier of 80x64 (1 -> 80x64, 2 -> 160x128, 3 -> 240x192). Overrides width/height if provided. */
  scale?: number;
  width?: number;
  height?: number;
  speed?: number;
  paused?: boolean;
  /** Monotonic millisecond offset applied for manual frame stepping (-350ms / +350ms). */
  stepOffsetMs?: number;
  showMuscleGlow?: boolean;
  onPhaseChange?: (phase: RepPhase) => void;
  className?: string;
}

/** Crisp 80x64 (5:4) 16-bit pixel-art exercise animation monitor. Pauses offscreen automatically. */
export default function ExerciseAnimationCanvas({
  exId,
  exName,
  scale,
  width = ANW,
  height = ANH,
  speed = 1,
  paused = false,
  stepOffsetMs = 0,
  showMuscleGlow = true,
  onPhaseChange,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guide = useMemo(() => getExerciseGuide(exId, exName), [exId, exName]);

  const guideRef = useRef(guide);
  const speedRef = useRef(speed);
  const pausedRef = useRef(paused);
  const stepRef = useRef(stepOffsetMs);
  const glowRef = useRef(showMuscleGlow);
  const phaseCbRef = useRef(onPhaseChange);
  const lastReportedPhase = useRef<RepPhase | null>(null);
  const elapsedRef = useRef(0);

  guideRef.current = guide;
  speedRef.current = speed;
  pausedRef.current = paused;
  stepRef.current = stepOffsetMs;
  glowRef.current = showMuscleGlow;
  phaseCbRef.current = onPhaseChange;

  const displayW = scale !== undefined ? Math.round(ANW * scale) : width;
  const displayH = scale !== undefined ? Math.round(ANH * scale) : height;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let visible = true;
    let lastNow = performance.now();

    const renderOnce = (tMs: number) => {
      drawExerciseFrame(ctx, guideRef.current, tMs, {
        speed: 1,
        showMuscleGlow: glowRef.current,
      });
      if (phaseCbRef.current) {
        const nextPhase = repCycle(tMs, 1).phase;
        if (nextPhase !== lastReportedPhase.current) {
          lastReportedPhase.current = nextPhase;
          phaseCbRef.current(nextPhase);
        }
      }
    };

    const paint = (now: number) => {
      raf = 0;
      const dt = Math.min(80, Math.max(0, now - lastNow));
      lastNow = now;
      if (!pausedRef.current) {
        elapsedRef.current += dt * speedRef.current;
      }
      renderOnce(elapsedRef.current + stepRef.current);
      if (visible && !document.hidden && !pausedRef.current) {
        raf = requestAnimationFrame(paint);
      }
    };

    const kick = () => {
      if (!raf && visible && !document.hidden) {
        lastNow = performance.now();
        raf = requestAnimationFrame(paint);
      }
    };

    const io = new IntersectionObserver(([en]) => {
      visible = !!en?.isIntersecting;
      if (visible) kick();
    });
    io.observe(cv);

    const onVis = () => {
      if (!document.hidden) kick();
    };
    document.addEventListener("visibilitychange", onVis);

    renderOnce(elapsedRef.current + stepRef.current);
    if (!paused) kick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [paused, guide, stepOffsetMs]);

  return (
    <canvas
      ref={canvasRef}
      width={ANW}
      height={ANH}
      className={`pixelated block shrink-0 ${className}`}
      style={{ width: displayW, height: displayH }}
      aria-label={`Animación pixel-art: ${exName ?? exId}`}
    />
  );
}
