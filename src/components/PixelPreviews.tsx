"use client";
import React, { useEffect, useRef } from "react";
import {
  BOSS_MINI_EMBLEMS,
  BOSS_MINI_SKULL_DEFEATED,
  drawCompiledWithPlotter,
  drawPetSprite,
  drawWeaponIcon,
} from "@/lib/pixelSprites";
import type { RaidBoss } from "@/lib/data";

/**
 * Crisp live pixel-art preview canvas for Companion Pets (used in Armory & equipped badges).
 * Pauses offscreen via IntersectionObserver just like Hero Avatar.
 */
export function PetPreviewCanvas({
  petId,
  size = 48,
  animate = true,
  className = "",
}: {
  petId: string;
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const petRef = useRef(petId);
  petRef.current = petId;

  // Fixed logical 28x24 grid scaled neatly into canvas
  const LW = 28;
  const LH = 24;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let visible = true;
    let last = -1;

    const r = (x: number, y: number, w: number, h: number, col: string) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, LW, LH);
      drawPetSprite(r, petRef.current, Math.floor(LW / 2), LH - 3, now, 1);
    };

    const frame = (now: number) => {
      raf = 0;
      if (now - last > 30) {
        draw(now);
        last = now;
      }
      if (animate && visible && !document.hidden) {
        raf = requestAnimationFrame(frame);
      }
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    if (!animate) {
      draw(200);
      return;
    }

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) kick();
    });
    io.observe(cv);
    const vis = () => !document.hidden && kick();
    document.addEventListener("visibilitychange", vis);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [animate, petId]);

  if (petId === "pet_none") {
    return (
      <span
        style={{ width: size, height: size }}
        className={`inline-flex shrink-0 items-center justify-center border-2 border-black bg-[#0d101b] text-[#636c8f] pixel-title text-[8px] ${className}`}
      >
        —
      </span>
    );
  }

  return (
    <canvas
      ref={ref}
      width={LW}
      height={LH}
      style={{ width: size, height: Math.round((size * LH) / LW) }}
      className={`pixelated shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Crisp 16x16 pixel-art Weapon preview canvas for Armory cards.
 */
export function WeaponPreviewCanvas({
  weaponId,
  size = 36,
  className = "",
}: {
  weaponId: string;
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 16, 16);
    drawWeaponIcon(
      (x, y, w, h, col) => {
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
      },
      weaponId,
      2,
      2,
      1
    );
  }, [weaponId]);

  if (weaponId === "weapon_none") {
    return (
      <span
        style={{ width: size, height: size }}
        className={`inline-flex shrink-0 items-center justify-center border-2 border-black bg-[#0d101b] text-[#636c8f] text-sm ${className}`}
      >
        ✊
      </span>
    );
  }

  return (
    <canvas
      ref={ref}
      width={16}
      height={16}
      style={{ width: size, height: size }}
      className={`pixelated shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Crisp 16x16 miniature Boss emblem portrait (used in RaidBoss header, Victory Modal, and Gym tab).
 */
export function BossEmblemCanvas({
  theme,
  isDefeated = false,
  size = 28,
  className = "",
}: {
  theme: RaidBoss["theme"];
  isDefeated?: boolean;
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 16, 16);
    const sp = isDefeated ? BOSS_MINI_SKULL_DEFEATED : BOSS_MINI_EMBLEMS[theme];
    const left = Math.floor((16 - sp.w) / 2);
    const top = Math.floor((16 - sp.h) / 2);
    drawCompiledWithPlotter(
      (x, y, w, h, col) => {
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
      },
      sp,
      left,
      top,
      1
    );
  }, [theme, isDefeated]);

  return (
    <canvas
      ref={ref}
      width={16}
      height={16}
      style={{ width: size, height: size }}
      className={`pixelated shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
}
