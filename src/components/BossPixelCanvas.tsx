"use client";
import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { RaidBoss } from "@/lib/data";
import { haptic, sfx } from "@/lib/fx";
import { APPLE_TAP } from "./ui";

interface Props {
  boss: RaidBoss;
  hpRemaining: number;
  isDefeated: boolean;
  onHit?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export default function BossPixelCanvas({
  boss,
  hpRemaining,
  isDefeated,
  onHit,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitShakeRef = useRef(0);
  const hitFlashRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  // Interactive tap on boss
  const handleTap = () => {
    hitShakeRef.current = 6;
    hitFlashRef.current = 5;
    sfx.bossRoar();
    haptic([30, 20, 50]);

    // Spawn 16 impact burst particles
    const cv = canvasRef.current;
    if (cv) {
      const cx = cv.width / 2;
      const cy = cv.height / 2;
      for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 120;
        particlesRef.current.push({
          x: cx + Math.cos(angle) * 12,
          y: cy + Math.sin(angle) * 12,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: Math.random() > 0.4 ? 4 : 3,
          color: i % 2 === 0 ? boss.color : "#ffffff",
          alpha: 1,
          life: 0,
          maxLife: 0.45 + Math.random() * 0.3,
        });
      }
    }

    onHit?.();
  };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let lastTime = performance.now();
    let animTime = 0;

    // Helper: draw a crisp pixel rectangle
    const px = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };

    const render = (now: number) => {
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;
      animTime += dt;

      // Shake dampening
      if (hitShakeRef.current > 0) {
        hitShakeRef.current = Math.max(0, hitShakeRef.current - dt * 25);
      }
      if (hitFlashRef.current > 0) {
        hitFlashRef.current--;
      }

      ctx.clearRect(0, 0, cv.width, cv.height);

      const cx = cv.width / 2;
      const cy = cv.height / 2 + 10;
      const shakeX = hitShakeRef.current > 0 ? (Math.random() - 0.5) * hitShakeRef.current * 2 : 0;
      const shakeY = hitShakeRef.current > 0 ? (Math.random() - 0.5) * hitShakeRef.current * 2 : 0;

      // Breathing oscillation (sine wave)
      const breath = Math.sin(animTime * 2.6) * 3.5;
      const eyePulse = (Math.sin(animTime * 5.0) + 1) * 0.5;

      // Spawn ambient elemental particles based on theme
      if (Math.random() < 0.45 && !isDefeated) {
        const theme = boss.theme;
        let pColor = boss.color;
        let vy = -30 - Math.random() * 40;
        let vx = (Math.random() - 0.5) * 30;

        if (theme === "fire") {
          pColor = Math.random() > 0.5 ? "#ff7a1a" : Math.random() > 0.3 ? "#ffe14d" : "#ef4444";
          vy = -50 - Math.random() * 60;
        } else if (theme === "toxic") {
          pColor = Math.random() > 0.5 ? "#7dff6a" : "#22c55e";
          vy = -20 - Math.random() * 30;
          vx = (Math.random() - 0.5) * 45;
        } else if (theme === "spectral") {
          pColor = Math.random() > 0.5 ? "#3df2ff" : "#c06cff";
          vy = -25 - Math.random() * 35;
        } else {
          // Iron sparks
          pColor = Math.random() > 0.5 ? "#ffe14d" : "#e2e8f0";
          vy = 20 + Math.random() * 50;
        }

        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 90,
          y: theme === "iron" ? cy - 35 : cy + 35,
          vx,
          vy,
          size: Math.random() > 0.4 ? 3 : 2,
          color: pColor,
          alpha: 0.9,
          life: 0,
          maxLife: 0.8 + Math.random() * 0.6,
        });
      }

      // Update & Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (p.life >= p.maxLife || p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.alpha;
        px(p.x, p.y, p.size, p.size, p.color);
      }
      ctx.globalAlpha = 1;

      // Draw Boss Center Position
      const bx = cx + shakeX;
      const by = cy + shakeY + (isDefeated ? 14 : breath);

      const isFlash = hitFlashRef.current > 0;

      if (isDefeated) {
        // Defeated Gravestone / Crumbled Skull
        px(bx - 26, by - 12, 52, 42, "#181a26");
        px(bx - 24, by - 10, 48, 38, "#2c3350");
        px(bx - 12, by + 4, 24, 6, "#ff3f6c");
        // Cross / R.I.P.
        px(bx - 3, by - 4, 6, 16, "#cbd5e1");
        px(bx - 8, by + 1, 16, 6, "#cbd5e1");
        // Skull eyes dark
        px(bx - 14, by - 18, 28, 16, "#475569");
        px(bx - 8, by - 14, 5, 5, "#000");
        px(bx + 3, by - 14, 5, 5, "#000");
        raf = requestAnimationFrame(render);
        return;
      }

      /* ---------------- RENDER 4 BOSS THEMES ---------------- */
      switch (boss.theme) {
        case "iron": {
          // 1. EL COLOSO DE HIERRO
          const cArm = isFlash ? "#ffffff" : "#1e2438";
          const cSteel = isFlash ? "#ffe14d" : "#475569";
          const cLight = isFlash ? "#ffffff" : "#94a3b8";
          const cGlow = isFlash ? "#ffffff" : "#ff3f6c";

          // Heavy Spiked Pauldrons (Left & Right)
          px(bx - 56, by - 6, 26, 28, cArm);
          px(bx - 52, by - 12, 18, 8, cSteel);
          px(bx - 48, by - 18, 10, 8, "#000");
          px(bx - 50, by - 2, 14, 4, cLight);

          px(bx + 30, by - 6, 26, 28, cArm);
          px(bx + 34, by - 12, 18, 8, cSteel);
          px(bx + 38, by - 18, 10, 8, "#000");
          px(bx + 36, by - 2, 14, 4, cLight);

          // Armored Torso & Furnace Core
          px(bx - 32, by - 2, 64, 46, cArm);
          px(bx - 26, by + 4, 52, 34, cSteel);
          px(bx - 14, by + 12, 28, 20, "#090a0f");
          // Furnace glowing grates
          px(bx - 10, by + 16, 20, 12, cGlow);
          px(bx - 6, by + 19, 12, 6, "#ffe14d");
          px(bx - 8, by + 16, 2, 12, "#000");
          px(bx - 1, by + 16, 2, 12, "#000");
          px(bx + 6, by + 16, 2, 12, "#000");

          // Horned Iron Helmet
          px(bx - 28, by - 44, 56, 44, cArm);
          px(bx - 24, by - 40, 48, 36, cSteel);
          px(bx - 18, by - 48, 36, 10, cArm);
          // Metallic horn spikes
          px(bx - 36, by - 56, 12, 24, cSteel);
          px(bx - 40, by - 64, 8, 12, cArm);
          px(bx + 24, by - 56, 12, 24, cSteel);
          px(bx + 32, by - 64, 8, 12, cArm);

          // Visor slit with pulsing crimson flame eyes
          px(bx - 20, by - 22, 40, 10, "#000000");
          const eyeW = 9 + Math.round(eyePulse * 2);
          px(bx - 16, by - 20, eyeW, 6, cGlow);
          px(bx + 7, by - 20, eyeW, 6, cGlow);
          px(bx - 13, by - 18, 4, 2, "#fff");
          px(bx + 10, by - 18, 4, 2, "#fff");

          // Rivets & Plate seams
          px(bx - 22, by - 38, 4, 4, cLight);
          px(bx + 18, by - 38, 4, 4, cLight);
          px(bx - 22, by - 8, 4, 4, cLight);
          px(bx + 18, by - 8, 4, 4, cLight);
          break;
        }

        case "toxic": {
          // 2. QUIMERA HIPERTRÓFICA
          const cSkin = isFlash ? "#ffffff" : "#14532d";
          const cMid = isFlash ? "#86efac" : "#16a34a";
          const cGlow = isFlash ? "#ffffff" : "#7dff6a";
          const cTox = isFlash ? "#ffffff" : "#a855f7";

          // Spiked Toxic Shoulders
          px(bx - 58, by - 8, 28, 32, cSkin);
          px(bx - 54, by - 16, 8, 12, cTox);
          px(bx - 44, by - 20, 10, 16, cGlow);

          px(bx + 30, by - 8, 28, 32, cSkin);
          px(bx + 46, by - 16, 8, 12, cTox);
          px(bx + 34, by - 20, 10, 16, cGlow);

          // Bulging Muscular Chest & Neck with pulsating veins
          px(bx - 32, by - 4, 64, 48, cSkin);
          px(bx - 26, by + 2, 52, 36, cMid);

          // Pulsing acid veins
          const veinAlpha = eyePulse;
          if (veinAlpha > 0.3) {
            px(bx - 20, by + 8, 12, 3, cGlow);
            px(bx - 16, by + 11, 4, 12, cGlow);
            px(bx + 8, by + 8, 12, 3, cGlow);
            px(bx + 12, by + 11, 4, 12, cGlow);
            px(bx - 6, by + 22, 12, 4, cGlow);
          }

          // Dragon / Chimera Horned Head
          px(bx - 26, by - 48, 52, 46, cSkin);
          px(bx - 20, by - 42, 40, 34, cMid);
          // Curved toxic green horns
          px(bx - 34, by - 62, 10, 22, cTox);
          px(bx - 38, by - 70, 8, 14, cGlow);
          px(bx + 24, by - 62, 10, 22, cTox);
          px(bx + 30, by - 70, 8, 14, cGlow);

          // Snarl maw & White Fangs
          px(bx - 18, by - 18, 36, 14, "#0f172a");
          px(bx - 14, by - 18, 6, 7, "#ffffff");
          px(bx - 4, by - 18, 4, 5, "#ffffff");
          px(bx + 2, by - 18, 4, 5, "#ffffff");
          px(bx + 8, by - 18, 6, 7, "#ffffff");
          px(bx - 12, by - 8, 5, 5, "#ffffff");
          px(bx + 7, by - 8, 5, 5, "#ffffff");

          // Glowing Reptilian Slit Eyes
          px(bx - 16, by - 32, 11, 8, cGlow);
          px(bx + 5, by - 32, 11, 8, cGlow);
          px(bx - 11, by - 32, 3, 8, "#000");
          px(bx + 9, by - 32, 3, 8, "#000");
          break;
        }

        case "fire": {
          // 3. IGNIS, SEÑOR DEL CALOR
          const cRock = isFlash ? "#ffffff" : "#1c100c";
          const cBasalt = isFlash ? "#fed7aa" : "#451a03";
          const cLava = isFlash ? "#ffffff" : "#ff7a1a";
          const cGold = isFlash ? "#ffffff" : "#ffe14d";

          // Volcanic Boulder Shoulders
          px(bx - 56, by - 6, 26, 30, cRock);
          px(bx - 52, by - 12, 16, 10, cBasalt);
          px(bx - 48, by - 4, 12, 4, cLava);

          px(bx + 30, by - 6, 26, 30, cRock);
          px(bx + 36, by - 12, 16, 10, cBasalt);
          px(bx + 36, by - 4, 12, 4, cLava);

          // Cracked Magma Chest
          px(bx - 32, by - 4, 64, 48, cRock);
          px(bx - 26, by + 2, 52, 38, cBasalt);

          // Pulsing Magma Seams in chest
          px(bx - 22, by + 12, 44, 4, cLava);
          px(bx - 18, by + 13, 36, 2, cGold);
          px(bx - 14, by + 22, 28, 4, cLava);
          px(bx - 10, by + 23, 20, 2, cGold);
          px(bx - 2, by + 6, 4, 26, cLava);

          // Demon Skull & Magma Horns
          px(bx - 26, by - 46, 52, 44, cRock);
          px(bx - 22, by - 42, 44, 36, cBasalt);
          // Jagged Volcanic Horns
          px(bx - 36, by - 60, 14, 24, cRock);
          px(bx - 42, by - 68, 10, 16, cLava);
          px(bx - 44, by - 74, 6, 8, cGold);

          px(bx + 22, by - 60, 14, 24, cRock);
          px(bx + 32, by - 68, 10, 16, cLava);
          px(bx + 38, by - 74, 6, 8, cGold);

          // Fiery Roaring Mouth
          px(bx - 16, by - 16, 32, 12, "#7f1d1d");
          px(bx - 12, by - 14, 24, 8, cLava);
          px(bx - 8, by - 12, 16, 4, cGold);

          // Fiery White-Hot Eyes
          px(bx - 18, by - 28, 12, 7, cLava);
          px(bx + 6, by - 28, 12, 7, cLava);
          px(bx - 15, by - 27, 8, 4, cGold);
          px(bx + 8, by - 27, 8, 4, cGold);
          px(bx - 13, by - 26, 4, 2, "#ffffff");
          px(bx + 10, by - 26, 4, 2, "#ffffff");
          break;
        }

        case "spectral": {
          // 4. REY NECROLIFT
          const cBone = isFlash ? "#ffffff" : "#94a3b8";
          const cRobe = isFlash ? "#ffffff" : "#3b0764";
          const cGhost = isFlash ? "#ffffff" : "#3df2ff";
          const cGold = isFlash ? "#ffffff" : "#ffe14d";

          // Spectral Floating Chains & Robe Drape
          px(bx - 54, by - 4, 24, 30, cRobe);
          px(bx - 48, by - 10, 10, 8, cGhost);
          px(bx - 46, by + 4, 6, 18, "#cbd5e1");

          px(bx + 30, by - 4, 24, 30, cRobe);
          px(bx + 38, by - 10, 10, 8, cGhost);
          px(bx + 40, by + 4, 6, 18, "#cbd5e1");

          // Phantom Ribs & Soul Gem Core
          px(bx - 28, by - 2, 56, 44, "#0f172a");
          px(bx - 24, by + 4, 48, 6, cBone);
          px(bx - 20, by + 14, 40, 6, cBone);
          px(bx - 16, by + 24, 32, 6, cBone);
          // Soul flame in ribcage
          px(bx - 8, by + 8, 16, 16, cGhost);
          px(bx - 4, by + 12, 8, 8, "#ffffff");

          // Sovereign Lich Skull
          px(bx - 24, by - 44, 48, 42, cBone);
          px(bx - 20, by - 40, 40, 34, "#e2e8f0");
          // Temple hollows
          px(bx - 24, by - 24, 6, 10, "#475569");
          px(bx + 18, by - 24, 6, 10, "#475569");

          // Jagged Golden Crown with Cyan Soul Gem
          px(bx - 28, by - 58, 56, 18, cGold);
          px(bx - 26, by - 68, 8, 14, cGold);
          px(bx - 10, by - 72, 8, 18, cGold);
          px(bx + 2, by - 72, 8, 18, cGold);
          px(bx + 18, by - 68, 8, 14, cGold);
          // Crown Jewel
          px(bx - 5, by - 56, 10, 10, cGhost);
          px(bx - 2, by - 54, 4, 4, "#ffffff");

          // Empty Sockets with Cyan Soul Flame Eyes
          px(bx - 18, by - 28, 12, 11, "#020617");
          px(bx + 6, by - 28, 12, 11, "#020617");
          const flameH = 6 + Math.round(eyePulse * 4);
          px(bx - 15, by - 26, 7, flameH, cGhost);
          px(bx + 8, by - 26, 7, flameH, cGhost);
          px(bx - 13, by - 24, 3, 3, "#ffffff");
          px(bx + 10, by - 24, 3, 3, "#ffffff");

          // Skull Teeth Jaw
          px(bx - 14, by - 10, 28, 8, cBone);
          px(bx - 11, by - 9, 3, 6, "#0f172a");
          px(bx - 5, by - 9, 3, 6, "#0f172a");
          px(bx + 1, by - 9, 3, 6, "#0f172a");
          px(bx + 7, by - 9, 3, 6, "#0f172a");
          break;
        }
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [boss, isDefeated]);

  return (
    <motion.div
      onClick={handleTap}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.94 }}
      transition={APPLE_TAP}
      className="relative flex cursor-pointer items-center justify-center select-none"
      title="¡Toca al jefe para desafiarlo!"
    >
      <canvas
        ref={canvasRef}
        width={240}
        height={180}
        className="pixelated block h-[180px] w-[240px] max-w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
      />
      <div className="absolute bottom-1 right-2 pixel-title text-[6px] text-[#8b93b8] opacity-60">
        [TOCA PARA GOLPEAR]
      </div>
    </motion.div>
  );
}
