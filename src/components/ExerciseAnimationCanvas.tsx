"use client";
import React, { useEffect, useMemo, useRef } from "react";
import { ANH, ANW, drawExerciseFrame, getExerciseGuide } from "@/lib/exerciseAnimations";

interface Props {
  exId: string;
  exName?: string;
  size?: number;
  speed?: number;
  paused?: boolean;
  showMuscleGlow?: boolean;
  className?: string;
}

/** Crisp 48x48 pixel-art animated exercise demonstration. Pauses offscreen automatically. */
export default function ExerciseAnimationCanvas({
  exId,
  exName,
  size = 44,
  speed = 1,
  paused = false,
  showMuscleGlow = true,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guide = useMemo(() => getExerciseGuide(exId, exName), [exId, exName]);

  const guideRef = useRef(guide);
  const speedRef = useRef(speed);
  const pausedRef = useRef(paused);
  const glowRef = useRef(showMuscleGlow);
  const elapsedRef = useRef(0);

  guideRef.current = guide;
  speedRef.current = speed;
  pausedRef.current = paused;
  glowRef.current = showMuscleGlow;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let visible = true;
    let lastNow = performance.now();

    const paint = (now: number) => {
      raf = 0;
      const dt = Math.min(80, Math.max(0, now - lastNow));
      lastNow = now;
      if (!pausedRef.current) {
        elapsedRef.current += dt * speedRef.current;
      }
      drawExerciseFrame(ctx, guideRef.current, elapsedRef.current, {
        speed: 1,
        showMuscleGlow: glowRef.current,
      });
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

    // Draw first frame immediately even if paused
    drawExerciseFrame(ctx, guideRef.current, elapsedRef.current, {
      speed: 1,
      showMuscleGlow: glowRef.current,
    });
    if (!paused) kick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [paused, guide]);

  return (
    <canvas
      ref={canvasRef}
      width={ANW}
      height={ANH}
      className={`pixelated block shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label={`Animación pixel-art: ${exName ?? exId}`}
    />
  );
}
