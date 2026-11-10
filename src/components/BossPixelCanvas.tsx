"use client";
import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ITEM, RaidBoss } from "@/lib/data";
import {
  drawPetSprite,
  drawSpriteStamped,
  FIRE_BODY,
  FIRE_DEFEATED,
  FIRE_FIST_FRAMES,
  FIRE_WINGS_FRAMES,
  IRON_BARBELL,
  IRON_CHEST_LEGS,
  IRON_DEFEATED,
  IRON_EXHAUST,
  IRON_FURNACE_FRAME,
  IRON_HELM,
  SPECTRAL_BARBELL_SCYTHE,
  SPECTRAL_BODY,
  SPECTRAL_CLOAK,
  SPECTRAL_DEFEATED,
  TOXIC_BODY,
  TOXIC_CLAW_L,
  TOXIC_CLAW_R,
  TOXIC_DEFEATED,
  TOXIC_WINGS_FRAMES,
} from "@/lib/pixelSprites";
import { haptic, sfx } from "@/lib/fx";
import { APPLE_TAP } from "./ui";

interface Props {
  boss: RaidBoss;
  hpRemaining: number;
  isDefeated: boolean;
  petId?: string;
  weaponId?: string;
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

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  petId: string;
  color: string;
  color2: string;
  age: number;
}

interface SlashFx {
  life: number;
  maxLife: number;
  color: string;
  angle: number;
}

// 240x180 buffer with locked S=2 pixel grid => 120x90 logical pixels (no mixels; crisp, heroic scale!)
const CW = 240;
const CH = 180;
const S = 2;

const wrapIdx = (v: number, n: number) => ((Math.floor(v) % n) + n) % n;

export default function BossPixelCanvas({
  boss,
  hpRemaining,
  isDefeated,
  petId,
  weaponId,
  onHit,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ boss, hpRemaining, isDefeated, petId, weaponId, onHit });
  propsRef.current = { boss, hpRemaining, isDefeated, petId, weaponId, onHit };

  const hitShakeRef = useRef(0);
  const hitFlashRef = useRef(0);
  const slamRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const slashesRef = useRef<SlashFx[]>([]);
  const petAttackAtRef = useRef(0);
  const animTimeRef = useRef(0);

  const handleTap = () => {
    const { boss: curBoss, isDefeated: defeated, petId: curPet, weaponId: curWeapon, onHit: tapCb } = propsRef.current;
    hitShakeRef.current = 5.5;
    hitFlashRef.current = 5;
    slamRef.current = 1;
    sfx.bossRoar();
    haptic([30, 20, 50]);

    const hasPet = !!(curPet && curPet !== "pet_none");
    const targetX = hasPet ? 148 : 120;
    const targetY = 104;

    if (hasPet && !defeated && curPet) {
      const petItem = ITEM[curPet];
      projectilesRef.current.push({
        x: 50,
        y: 136,
        vx: 245,
        vy: -56,
        petId: curPet,
        color: petItem?.color || "#a78bfa",
        color2: petItem?.color2 || "#ffe14d",
        age: 0,
      });
      petAttackAtRef.current = animTimeRef.current;
      sfx.petHit();
    }

    const wItem = curWeapon && curWeapon !== "weapon_none" ? ITEM[curWeapon] : undefined;
    const wColor = wItem?.color2 || wItem?.color || curBoss.color;
    slashesRef.current.push({
      life: 0,
      maxLife: 0.24,
      color: defeated ? "#ffe14d" : wColor,
      angle: Math.random() > 0.5 ? -0.65 : 0.65,
    });

    for (let i = 0; i < 20; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 125;
      particlesRef.current.push({
        x: targetX + Math.cos(ang) * 12,
        y: targetY + Math.sin(ang) * 12,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: Math.random() > 0.45 ? 4 : 2,
        color: i % 3 === 0 ? wColor : i % 2 === 0 ? curBoss.color : "#ffffff",
        alpha: 1,
        life: 0,
        maxLife: 0.36 + Math.random() * 0.25,
      });
    }

    tapCb?.();
  };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let visible = true;
    let lastTime = 0;

    const px = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x / S) * S,
        Math.round(y / S) * S,
        Math.max(S, Math.round(w / S) * S),
        Math.max(S, Math.round(h / S) * S)
      );
    };

    const pGrid = (gx: number, gy: number, gw: number, gh: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(gx) * S, Math.round(gy) * S, Math.round(gw) * S, Math.round(gh) * S);
    };

    const drawArenaBackdrop = (theme: RaidBoss["theme"], enraged: boolean, defeated: boolean, tSec: number, cx: number) => {
      const stageCol =
        defeated
          ? "rgba(125,255,106,0.16)"
          : theme === "iron"
          ? enraged ? "rgba(255,63,108,0.28)" : "rgba(255,63,108,0.16)"
          : theme === "toxic"
          ? enraged ? "rgba(125,255,106,0.28)" : "rgba(125,255,106,0.15)"
          : theme === "fire"
          ? enraged ? "rgba(255,122,26,0.3)" : "rgba(255,122,26,0.18)"
          : enraged ? "rgba(61,242,255,0.28)" : "rgba(61,242,255,0.16)";

      const rad = ctx.createRadialGradient(cx, 94, 12, cx, 98, 114);
      rad.addColorStop(0, stageCol);
      rad.addColorStop(1, "rgba(11,13,23,0)");
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, CW, CH);

      // Subtle 16-bit biome chamber framing on left/right margins (keeps center ultra clean behind boss silhouette)
      if (theme === "iron") {
        // Dark iron pillars & hanging forge chains
        pGrid(2, 0, 5, 67, "#131724");
        pGrid(6, 0, 1, 67, "#20283d");
        pGrid(113, 0, 5, 67, "#131724");
        pGrid(113, 0, 1, 67, "#20283d");
        for (let y = 4; y < 30; y += 4) {
          pGrid(22, y, 2, 2, "#242c42");
          pGrid(96, y, 2, 2, "#242c42");
        }
      } else if (theme === "toxic") {
        // Cavern stalactites & toxic slime drops
        pGrid(6, 0, 6, 12, "#13231a");
        pGrid(8, 12, 2, 6, "#1b3325");
        pGrid(14, 0, 4, 8, "#13231a");
        pGrid(102, 0, 4, 9, "#13231a");
        pGrid(108, 0, 6, 14, "#13231a");
        pGrid(110, 14, 2, 6, "#1b3325");
      } else if (theme === "fire") {
        // Basalt jagged cavern columns + subtle distant ember cracks
        pGrid(2, 0, 6, 67, "#1b0d0a");
        pGrid(7, 14, 1, 10, "#4a1b10");
        pGrid(112, 0, 6, 67, "#1b0d0a");
        pGrid(112, 22, 1, 12, "#4a1b10");
      } else if (theme === "spectral") {
        // Crypt Gothic ruined arches
        pGrid(3, 0, 5, 67, "#161229");
        pGrid(7, 0, 1, 67, "#262047");
        pGrid(8, 6, 10, 2, "#161229");
        pGrid(112, 0, 5, 67, "#161229");
        pGrid(112, 0, 1, 67, "#262047");
        pGrid(102, 6, 10, 2, "#161229");
      }

      // Stone Dungeon Horizon (logical y 67..89 out of 90)
      const floorBase =
        theme === "iron" ? "#141826" :
        theme === "toxic" ? "#0f1c16" :
        theme === "fire" ? "#1a0f0c" :
        "#121124";
      const floorLine =
        theme === "iron" ? "#26304a" :
        theme === "toxic" ? "#1d3b29" :
        theme === "fire" ? "#3b1c12" :
        "#2b234d";

      pGrid(0, 68, 120, 22, floorBase);
      pGrid(0, 67, 120, 1, floorLine);

      for (let i = 0; i < 5; i++) {
        pGrid(0, 71 + i * 4, 120, 1, floorLine);
      }
      for (let x = 12; x < 120; x += 20) {
        pGrid(x, 68, 1, 22, floorLine);
      }

      if (theme === "iron") {
        pGrid(10, 76, 9, 2, "#3b141e");
        pGrid(96, 79, 10, 2, "#3b141e");
        if (Math.sin(tSec * 4) > 0 && !defeated) {
          pGrid(12, 76, 5, 1, "#ff7a1a");
          pGrid(98, 79, 6, 1, "#ff3f6c");
        }
      } else if (theme === "toxic") {
        pGrid(38, 81, 14, 2, "#14532d");
        pGrid(41, 81, 8, 1, "#7dff6a");
        pGrid(96, 73, 12, 2, "#14532d");
        pGrid(99, 73, 6, 1, "#7dff6a");
      } else if (theme === "fire") {
        pGrid(28, 82, 18, 1, "#ff7a1a");
        pGrid(34, 83, 8, 1, "#ffe14d");
        pGrid(92, 73, 14, 1, "#ff7a1a");
      } else if (theme === "spectral") {
        const gx = Math.round(cx / S);
        pGrid(gx - 22, 77, 44, 1, "#0891b2");
        pGrid(gx - 18, 80, 36, 1, Math.sin(tSec * 4) > 0 ? "#3df2ff" : "#0e7490");
        pGrid(gx - 26, 74, 52, 1, "#1e1b4b");
      }
    };

    const render = (now: number) => {
      raf = 0;
      const rawDt = lastTime > 0 ? (now - lastTime) / 1000 : 0.016;
      const dt = Math.min(0.05, Math.max(0, rawDt));
      lastTime = now;
      animTimeRef.current = Math.max(0, animTimeRef.current + dt);
      const animTime = animTimeRef.current;

      const { boss: curBoss, hpRemaining: curHp, isDefeated: defeated, petId: curPet } = propsRef.current;
      const hpRatio = curBoss.totalHp > 0 ? curHp / curBoss.totalHp : 0;
      const enraged = !defeated && hpRatio < 0.5;
      const critical = !defeated && hpRatio < 0.25;

      if (hitShakeRef.current > 0) hitShakeRef.current = Math.max(0, hitShakeRef.current - dt * 24);
      if (hitFlashRef.current > 0) hitFlashRef.current = Math.max(0, hitFlashRef.current - 1);
      if (slamRef.current > 0) slamRef.current = Math.max(0, slamRef.current - dt * 4.5);

      const hasPet = !!(curPet && curPet !== "pet_none");
      const cx = hasPet ? 148 : 120;
      const baseFloorY = 158;

      ctx.clearRect(0, 0, CW, CH);
      drawArenaBackdrop(curBoss.theme, enraged, defeated, animTime, cx);

      const breathFreq = critical ? 5.0 : enraged ? 3.8 : 2.5;
      const breath = Math.round(Math.sin(animTime * breathFreq) * (enraged ? 1.8 : 1.3)) * S;
      const shakeX = hitShakeRef.current > 0 ? Math.round((Math.random() - 0.5) * hitShakeRef.current * 2) * S : 0;
      const shakeY = hitShakeRef.current > 0 ? Math.round((Math.random() - 0.5) * hitShakeRef.current * 2) * S : 0;

      // Ground shadow anchored right under boss feet
      if (!defeated) {
        const shSpread = curBoss.theme === "spectral" ? Math.round(Math.sin(animTime * 2.4) * 3) : 0;
        px(cx - 46 + shSpread, baseFloorY - 2, 92 - shSpread * 2, 8, "rgba(0,0,0,0.48)");
      } else {
        px(cx - 34, baseFloorY - 2, 68, 6, "rgba(0,0,0,0.42)");
      }

      // Periodic auto-pet combat bolt
      if (hasPet && !defeated && curPet) {
        if (animTime - petAttackAtRef.current > 2.35) {
          petAttackAtRef.current = animTime;
          const petItem = ITEM[curPet];
          projectilesRef.current.push({
            x: 48,
            y: 136,
            vx: 225,
            vy: -48,
            petId: curPet,
            color: petItem?.color || "#a78bfa",
            color2: petItem?.color2 || "#ffe14d",
            age: 0,
          });
        }
      }

      // Biome ambient particles
      const spawnChance = defeated ? 0.25 : enraged ? 0.72 : 0.45;
      if (Math.random() < spawnChance) {
        let pColor = curBoss.color;
        let vy = -30 - Math.random() * 40;
        let vx = (Math.random() - 0.5) * 26;
        const sx = cx + (Math.random() - 0.5) * 96;
        let sy = baseFloorY - 8 - Math.random() * 68;

        if (defeated) {
          pColor = Math.random() > 0.5 ? "#7dff6a" : "#ffe14d";
          vy = -22 - Math.random() * 28;
          sy = baseFloorY - 6;
        } else if (curBoss.theme === "fire") {
          pColor = Math.random() > 0.45 ? "#ff7a1a" : Math.random() > 0.25 ? "#ffe14d" : "#fff7ed";
          vy = -45 - Math.random() * 55;
        } else if (curBoss.theme === "toxic") {
          pColor = Math.random() > 0.45 ? "#7dff6a" : "#c084fc";
          vy = -16 - Math.random() * 26;
          vx = (Math.random() - 0.5) * 38;
        } else if (curBoss.theme === "spectral") {
          pColor = Math.random() > 0.45 ? "#3df2ff" : "#a855f7";
          vy = -20 - Math.random() * 32;
        } else {
          pColor = Math.random() > 0.4 ? "#ffe14d" : Math.random() > 0.3 ? "#ff7a1a" : "#94a3b8";
          vy = Math.random() > 0.35 ? -32 - Math.random() * 36 : 16 + Math.random() * 28;
          if (Math.random() > 0.5) sy = baseFloorY - 84;
        }

        particlesRef.current.push({
          x: sx,
          y: sy,
          vx,
          vy,
          size: Math.random() > 0.35 ? 2 : 4,
          color: pColor,
          alpha: 0.9,
          life: 0,
          maxLife: 0.6 + Math.random() * 0.5,
        });
      }

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

      // Companion Pet standing on left arena floor
      if (hasPet && curPet) {
        const lunge = Math.max(0, 1 - (animTime - petAttackAtRef.current) * 5) * 6;
        const celeb = defeated ? Math.abs(Math.round(Math.sin(animTime * 6) * 4)) : 0;
        drawPetSprite(px, curPet, Math.round((34 + lunge) / S) * S, baseFloorY - celeb, Math.max(0, now), S);
      }

      /* ---------------- DRAW PLANTED HERO-SIZED BOSS OR DEFEATED MONUMENT ---------------- */
      const bx = cx + shakeX;
      const by = baseFloorY + shakeY;
      const flashCol = hitFlashRef.current > 0 ? (hitFlashRef.current % 2 === 1 ? "#ffffff" : "#ffe14d") : undefined;

      if (defeated) {
        const defMap = {
          iron: IRON_DEFEATED,
          toxic: TOXIC_DEFEATED,
          fire: FIRE_DEFEATED,
          spectral: SPECTRAL_DEFEATED,
        } as const;
        const sp = defMap[curBoss.theme];
        drawSpriteStamped(ctx, `def_${curBoss.theme}`, sp, bx - (sp.w * S) / 2, by - sp.h * S + 2, S, flashCol);
      } else {
        const fFrame = wrapIdx(animTime * (enraged ? 7.5 : 4.5), 2);
        const flap = Math.sin(animTime * (enraged ? 8.2 : 5.0)) > 0 ? 1 : 0;

        switch (curBoss.theme) {
          case "iron": {
            // Feet land cleanly on `by` (`IRON_CHEST_LEGS.h = 29` => 58px)!
            const bodyY = by - IRON_CHEST_LEGS.h * S + Math.round(breath * 0.4);
            const helmY = bodyY - 9 * S + Math.round(breath * 0.4);
            const barbellLift = Math.round(Math.sin(animTime * 2.6) * 2) * S + Math.round(slamRef.current * 5);

            // Smokestacks behind upper pauldrons
            drawSpriteStamped(ctx, "iron_exhaust", IRON_EXHAUST, bx - (IRON_EXHAUST.w * S) / 2, bodyY - 3 * S, S, flashCol);
            // Massive armored torso & heavy boots planted on floor
            drawSpriteStamped(ctx, "iron_chest", IRON_CHEST_LEGS, bx - (IRON_CHEST_LEGS.w * S) / 2, bodyY, S, flashCol);
            // Animated furnace core inside chest cavity (row 6..9)
            if (!flashCol) {
              drawSpriteStamped(
                ctx,
                `iron_furnace_${fFrame}`,
                IRON_FURNACE_FRAME[fFrame],
                bx - (IRON_FURNACE_FRAME[fFrame].w * S) / 2,
                bodyY + 6 * S,
                S
              );
            }
            // Horned Great-Helm overlapping top collar cleanly
            drawSpriteStamped(ctx, "iron_helm", IRON_HELM, bx - (IRON_HELM.w * S) / 2, helmY, S, flashCol);
            // Huge Red & Gold Olympic Power-Bar held across waist/thighs
            drawSpriteStamped(ctx, "iron_barbell", IRON_BARBELL, bx - (IRON_BARBELL.w * S) / 2, bodyY + 13 * S + barbellLift, S, flashCol);
            break;
          }

          case "toxic": {
            const wingSp = TOXIC_WINGS_FRAMES[flap];
            const torsoY = by - TOXIC_BODY.h * S + breath;
            const clawSwing = Math.round(Math.sin(animTime * 3.6) * 2) * S;

            // Huge sweeping wings anchored behind shoulders
            drawSpriteStamped(ctx, `toxic_wings_${flap}`, wingSp, bx - (wingSp.w * S) / 2, torsoY + (flap ? 3 : -3) * S, S, flashCol);
            // Whipping acid tail extending behind left thigh
            if (!flashCol) {
              const tailW = Math.round(Math.sin(animTime * 4) * 2) * S;
              px(bx - 19 * S, by - 11 * S + tailW, 8, 4, "#4d3528");
              px(bx - 24 * S, by - 14 * S + tailW, 8, 4, "#7a523c");
              px(bx - 27 * S, by - 16 * S + tailW, 4, 4, "#7dff6a");
            }
            // Planted muscular Chimera body
            drawSpriteStamped(ctx, "toxic_body", TOXIC_BODY, bx - (TOXIC_BODY.w * S) / 2, torsoY, S, flashCol);
            // Enraged neon lactic acid eye/vein pulse
            if (!flashCol && (enraged || fFrame === 1)) {
              px(bx - 6 * S, torsoY + 6 * S, 4, 2, "#ecfccb");
              px(bx + 4 * S, torsoY + 6 * S, 4, 2, "#ecfccb");
            }
            // Clawed forearms attached directly to outer deltoids!
            drawSpriteStamped(ctx, "toxic_clawl", TOXIC_CLAW_L, bx - 24 * S, torsoY + 12 * S + clawSwing, S, flashCol);
            drawSpriteStamped(ctx, "toxic_clawr", TOXIC_CLAW_R, bx + 14 * S, torsoY + 12 * S - clawSwing, S, flashCol);
            break;
          }

          case "fire": {
            const wingSp = FIRE_WINGS_FRAMES[flap];
            const bodyY = by - FIRE_BODY.h * S + breath;
            const fistSp = FIRE_FIST_FRAMES[fFrame];
            const fistBob = Math.round(Math.sin(animTime * 4.2) * 2) * S;

            // Blazing Demon Wings behind shoulders
            drawSpriteStamped(ctx, `fire_wings_${flap}`, wingSp, bx - (wingSp.w * S) / 2, bodyY + (flap ? 3 : -1) * S, S, flashCol);
            // Planted Obsidian Basalt Titan Body
            drawSpriteStamped(ctx, "fire_body", FIRE_BODY, bx - (FIRE_BODY.w * S) / 2, bodyY, S, flashCol);
            // Magma Gauntlets connected right to outer shoulders
            drawSpriteStamped(ctx, `fire_fist_${fFrame}`, fistSp, bx - 22 * S, bodyY + 13 * S + fistBob, S, flashCol);
            drawSpriteStamped(ctx, `fire_fist_${fFrame}`, fistSp, bx + 15 * S, bodyY + 13 * S - fistBob, S, flashCol);
            break;
          }

          case "spectral": {
            // Levitates above summoning circle with gentle float
            const floatY = Math.round(Math.sin(animTime * 2.4) * 3) * S;
            const bodyY = by - (SPECTRAL_BODY.h + 6) * S + floatY;

            // Royal Violet Cloak + soul shoulder wisps
            drawSpriteStamped(ctx, "spec_cloak", SPECTRAL_CLOAK, bx - (SPECTRAL_CLOAK.w * S) / 2, bodyY + 5 * S, S, flashCol);
            // Crowned Skull + Ribcage Phylactery
            drawSpriteStamped(ctx, "spec_body", SPECTRAL_BODY, bx - (SPECTRAL_BODY.w * S) / 2, bodyY, S, flashCol);
            // Pulsing soul eyes & crown gem
            if (!flashCol && fFrame === 1) {
              px(bx - 4 * S, bodyY + 8 * S, 2, 2, "#ffffff");
              px(bx + 3 * S, bodyY + 8 * S, 2, 2, "#ffffff");
              px(bx - 16 * S, bodyY + 6 * S, 4, 4, "#3df2ff");
              px(bx + 14 * S, bodyY + 6 * S, 4, 4, "#3df2ff");
            }
            // Levitating Spectral Barbell-Scythe held across ribcage
            drawSpriteStamped(
              ctx,
              "spec_scythe",
              SPECTRAL_BARBELL_SCYTHE,
              bx - (SPECTRAL_BARBELL_SCYTHE.w * S) / 2,
              bodyY + 15 * S + Math.round(Math.sin(animTime * 3.8) * 1.5) * S,
              S,
              flashCol
            );
            break;
          }
        }
      }

      /* ---------------- SIGNATURE PET PROJECTILES ---------------- */
      for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const pr = projectilesRef.current[i];
        pr.age += dt;
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;

        if (pr.petId === "pet_owl") {
          px(pr.x - 6, pr.y - 2, 12, 4, "#090a12");
          px(pr.x - 2, pr.y - 6, 4, 12, "#090a12");
          px(pr.x - 4, pr.y - 4, 8, 8, pr.color);
          px(pr.x - 2, pr.y - 2, 4, 4, pr.color2);
          px(pr.x - 8, pr.y, 4, 2, pr.color);
        } else if (pr.petId === "pet_wolf") {
          px(pr.x - 2, pr.y - 8, 6, 16, "#090a12");
          px(pr.x, pr.y - 6, 4, 12, "#3df2ff");
          px(pr.x + 2, pr.y - 4, 2, 8, "#ffffff");
          px(pr.x - 8, pr.y - 2, 6, 4, "#94a3b8");
        } else if (pr.petId === "pet_dragon") {
          px(pr.x - 6, pr.y - 4, 12, 8, "#881337");
          px(pr.x - 4, pr.y - 4, 10, 8, "#ff7a1a");
          px(pr.x, pr.y - 2, 6, 4, "#ffe14d");
          px(pr.x + 2, pr.y - 2, 2, 2, "#ffffff");
          px(pr.x - 10, pr.y + (Math.sin(pr.age * 40) > 0 ? -2 : 2), 4, 2, "#ff3f6c");
        } else {
          px(pr.x - 6, pr.y - 6, 12, 12, "#78350f");
          px(pr.x - 4, pr.y - 4, 8, 8, "#ffe14d");
          px(pr.x - 2, pr.y - 2, 4, 4, "#7dff6a");
        }

        if (pr.x >= bx - 16) {
          hitShakeRef.current = Math.max(hitShakeRef.current, 2.8);
          hitFlashRef.current = Math.max(hitFlashRef.current, 3);
          for (let k = 0; k < 10; k++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = 50 + Math.random() * 80;
            particlesRef.current.push({
              x: pr.x,
              y: pr.y,
              vx: Math.cos(ang) * sp,
              vy: Math.sin(ang) * sp,
              size: k % 2 ? 2 : 4,
              color: k % 3 === 0 ? "#ffffff" : k % 2 ? pr.color2 : pr.color,
              alpha: 1,
              life: 0,
              maxLife: 0.34,
            });
          }
          projectilesRef.current.splice(i, 1);
        }
      }

      /* ---------------- WEAPON SLASH ARCS ON TAP ---------------- */
      for (let i = slashesRef.current.length - 1; i >= 0; i--) {
        const sl = slashesRef.current[i];
        sl.life += dt;
        if (sl.life >= sl.maxLife) {
          slashesRef.current.splice(i, 1);
          continue;
        }
        const prog = sl.life / sl.maxLife;
        ctx.globalAlpha = 1 - prog;
        for (let step = -7; step <= 7; step++) {
          const sx = bx + step * 4;
          const sy = by - 46 + step * (sl.angle * 4);
          const thickness = step > -2 && step < 2 ? 4 : 2;
          px(sx - 2, sy - 2, thickness + 2, thickness + 2, "#ffffff");
          px(sx, sy, thickness, thickness, sl.color);
        }
        ctx.globalAlpha = 1;
      }

      if (visible && !document.hidden) {
        raf = requestAnimationFrame(render);
      }
    };

    const kick = () => {
      if (!raf && visible && !document.hidden) {
        lastTime = 0;
        raf = requestAnimationFrame(render);
      }
    };

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) kick();
    });
    io.observe(cv);

    const onVis = () => {
      if (!document.hidden) kick();
    };
    document.addEventListener("visibilitychange", onVis);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <motion.div
      onClick={handleTap}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.95 }}
      transition={APPLE_TAP}
      className="relative flex w-full cursor-pointer items-center justify-center select-none"
      title="¡Toca al jefe para desafiarlo!"
    >
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        aria-label="Raid Boss Arena"
        className="pixelated block w-full max-w-[300px] aspect-[4/3] border-2 border-[#2c3350] bg-[#0b0d17] drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]"
      />
      <div className="pointer-events-none absolute bottom-1.5 right-3 pixel-title text-[6px] text-[#8b93b8] opacity-75">
        [TOCA PARA ATACAR]
      </div>
    </motion.div>
  );
}
