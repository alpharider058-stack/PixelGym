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

// 180x140 buffer with locked S=2 pixel grid => 90x70 logical pixels (boss fills ~80% of chamber!)
const CW = 180;
const CH = 140;
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
    const targetX = hasPet ? 116 : 90;
    const targetY = 74;

    if (hasPet && !defeated && curPet) {
      const petItem = ITEM[curPet];
      projectilesRef.current.push({
        x: 38,
        y: 110,
        vx: 215,
        vy: -76,
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

      const rad = ctx.createRadialGradient(cx, 72, 12, cx, 74, 96);
      rad.addColorStop(0, stageCol);
      rad.addColorStop(1, "rgba(11,13,23,0)");
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, CW, CH);

      // Subtle 16-bit biome chamber framing on left/right margins (90x70 logical arena)
      if (theme === "iron") {
        // Dark iron pillars & hanging forge chains
        pGrid(2, 0, 5, 53, "#131724");
        pGrid(6, 0, 1, 53, "#20283d");
        pGrid(83, 0, 5, 53, "#131724");
        pGrid(83, 0, 1, 53, "#20283d");
        for (let y = 3; y < 24; y += 4) {
          pGrid(15, y, 2, 2, "#242c42");
          pGrid(73, y, 2, 2, "#242c42");
        }
      } else if (theme === "toxic") {
        // Cavern stalactites & toxic slime drops
        pGrid(4, 0, 5, 10, "#13231a");
        pGrid(6, 10, 2, 4, "#1b3325");
        pGrid(11, 0, 4, 6, "#13231a");
        pGrid(75, 0, 4, 7, "#13231a");
        pGrid(80, 0, 5, 11, "#13231a");
        pGrid(82, 11, 2, 4, "#1b3325");
      } else if (theme === "fire") {
        // Basalt jagged cavern columns + subtle distant ember cracks
        pGrid(2, 0, 5, 53, "#1b0d0a");
        pGrid(6, 10, 1, 9, "#4a1b10");
        pGrid(83, 0, 5, 53, "#1b0d0a");
        pGrid(83, 15, 1, 10, "#4a1b10");
      } else if (theme === "spectral") {
        // Crypt Gothic ruined arches
        pGrid(2, 0, 5, 53, "#161229");
        pGrid(6, 0, 1, 53, "#262047");
        pGrid(7, 4, 8, 2, "#161229");
        pGrid(83, 0, 5, 53, "#161229");
        pGrid(83, 0, 1, 53, "#262047");
        pGrid(75, 4, 8, 2, "#161229");
      }

      // Stone Dungeon Horizon (logical y 53..69 out of 70)
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

      pGrid(0, 54, 90, 16, floorBase);
      pGrid(0, 53, 90, 1, floorLine);

      for (let i = 0; i < 4; i++) {
        pGrid(0, 57 + i * 4, 90, 1, floorLine);
      }
      for (let x = 9; x < 90; x += 16) {
        pGrid(x, 54, 1, 16, floorLine);
      }

      if (theme === "iron") {
        pGrid(7, 60, 8, 2, "#3b141e");
        pGrid(72, 62, 8, 2, "#3b141e");
        if (Math.sin(tSec * 4) > 0 && !defeated) {
          pGrid(9, 60, 4, 1, "#ff7a1a");
          pGrid(74, 62, 4, 1, "#ff3f6c");
        }
      } else if (theme === "toxic") {
        pGrid(27, 65, 11, 2, "#14532d");
        pGrid(29, 65, 6, 1, "#7dff6a");
        pGrid(73, 58, 9, 2, "#14532d");
        pGrid(75, 58, 4, 1, "#7dff6a");
      } else if (theme === "fire") {
        pGrid(20, 65, 15, 1, "#ff7a1a");
        pGrid(24, 66, 7, 1, "#ffe14d");
        pGrid(69, 58, 11, 1, "#ff7a1a");
      } else if (theme === "spectral") {
        const gx = Math.round(cx / S);
        pGrid(gx - 18, 62, 36, 1, "#0891b2");
        pGrid(gx - 14, 65, 28, 1, Math.sin(tSec * 4) > 0 ? "#3df2ff" : "#0e7490");
        pGrid(gx - 22, 59, 44, 1, "#1e1b4b");
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
      const cx = hasPet ? 116 : 90;
      const baseFloorY = 128;

      ctx.clearRect(0, 0, CW, CH);
      drawArenaBackdrop(curBoss.theme, enraged, defeated, animTime, cx);

      const breathFreq = critical ? 5.0 : enraged ? 3.8 : 2.5;
      const breath = Math.round(Math.sin(animTime * breathFreq) * (enraged ? 1.8 : 1.3)) * S;
      const shakeX = hitShakeRef.current > 0 ? Math.round((Math.random() - 0.5) * hitShakeRef.current * 2) * S : 0;
      const shakeY = hitShakeRef.current > 0 ? Math.round((Math.random() - 0.5) * hitShakeRef.current * 2) * S : 0;

      // Ground shadow anchored right under boss feet
      if (!defeated) {
        const shSpread = curBoss.theme === "spectral" ? Math.round(Math.sin(animTime * 2.4) * 3) : 0;
        px(cx - 38 + shSpread, baseFloorY - 2, 76 - shSpread * 2, 8, "rgba(0,0,0,0.48)");
      } else {
        px(cx - 30, baseFloorY - 2, 60, 6, "rgba(0,0,0,0.42)");
      }

      // Periodic auto-pet combat bolt
      if (hasPet && !defeated && curPet) {
        if (animTime - petAttackAtRef.current > 2.35) {
          petAttackAtRef.current = animTime;
          const petItem = ITEM[curPet];
          projectilesRef.current.push({
            x: 38,
            y: baseFloorY - 20,
            vx: 205,
            vy: -68,
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
        let vx = (Math.random() - 0.5) * 24;
        const sx = cx + (Math.random() - 0.5) * 80;
        let sy = baseFloorY - 10 - Math.random() * 90;

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
          if (Math.random() > 0.5) sy = baseFloorY - 82;
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
        drawPetSprite(px, curPet, Math.round((26 + lunge) / S) * S, baseFloorY - celeb, Math.max(0, now), S);
      }

      /* ---------------- DRAW TOWERING BOSS OR DEFEATED MONUMENT ---------------- */
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
            const bodyY = by - IRON_CHEST_LEGS.h * S + Math.round(breath * 0.4);
            const helmY = bodyY - 14 * S + Math.round(breath * 0.4);
            const barbellLift = Math.round(Math.sin(animTime * 2.6) * 2) * S + Math.round(slamRef.current * 5);

            drawSpriteStamped(ctx, "iron_exhaust", IRON_EXHAUST, bx - (IRON_EXHAUST.w * S) / 2, bodyY - 9 * S, S, flashCol);
            drawSpriteStamped(ctx, "iron_chest", IRON_CHEST_LEGS, bx - (IRON_CHEST_LEGS.w * S) / 2, bodyY, S, flashCol);
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
            drawSpriteStamped(ctx, "iron_helm", IRON_HELM, bx - (IRON_HELM.w * S) / 2, helmY, S, flashCol);
            drawSpriteStamped(ctx, "iron_barbell", IRON_BARBELL, bx - (IRON_BARBELL.w * S) / 2, bodyY + 17 * S + barbellLift, S, flashCol);
            break;
          }

          case "toxic": {
            const wingSp = TOXIC_WINGS_FRAMES[flap];
            const torsoY = by - TOXIC_BODY.h * S + breath;
            const clawSwing = Math.round(Math.sin(animTime * 3.6) * 2) * S;

            // Soaring Gothic Bat-Chimera Wings rising above skull & draping behind shoulders
            drawSpriteStamped(ctx, `toxic_wings_${flap}`, wingSp, bx - (wingSp.w * S) / 2, torsoY + (flap ? 2 : -1) * S, S, flashCol);
            if (!flashCol) {
              const tailW = Math.round(Math.sin(animTime * 4) * 2) * S;
              px(bx - 18 * S, by - 13 * S + tailW, 8, 4, "#4d3528");
              px(bx - 22 * S, by - 16 * S + tailW, 8, 4, "#7a523c");
              px(bx - 25 * S, by - 18 * S + tailW, 4, 4, "#7dff6a");
            }
            drawSpriteStamped(ctx, "toxic_body", TOXIC_BODY, bx - (TOXIC_BODY.w * S) / 2, torsoY, S, flashCol);
            if (!flashCol && (enraged || fFrame === 1)) {
              px(bx - 5 * S, torsoY + 10 * S, 2, 2, "#ecfccb");
              px(bx + 4 * S, torsoY + 10 * S, 2, 2, "#ecfccb");
            }
            drawSpriteStamped(ctx, "toxic_clawl", TOXIC_CLAW_L, bx - 21 * S, torsoY + 18 * S + clawSwing, S, flashCol);
            drawSpriteStamped(ctx, "toxic_clawr", TOXIC_CLAW_R, bx + 11 * S, torsoY + 18 * S - clawSwing, S, flashCol);
            break;
          }

          case "fire": {
            const wingSp = FIRE_WINGS_FRAMES[flap];
            const bodyY = by - FIRE_BODY.h * S + breath;
            const fistSp = FIRE_FIST_FRAMES[fFrame];
            const fistBob = Math.round(Math.sin(animTime * 4.2) * 2) * S;

            // Towering Balrog Flame Wings arching behind demon shoulders
            drawSpriteStamped(ctx, `fire_wings_${flap}`, wingSp, bx - (wingSp.w * S) / 2, bodyY + (flap ? 3 : 1) * S, S, flashCol);
            const armColor = flashCol || "#451e18";
            const armRim = flashCol || "#100605";
            px(bx - 20 * S, bodyY + 19 * S, 10, 14 + Math.max(0, fistBob), armRim);
            px(bx - 19 * S, bodyY + 20 * S, 6, 10 + Math.max(0, fistBob), armColor);
            px(bx + 15 * S, bodyY + 19 * S, 10, 14 + Math.max(0, -fistBob), armRim);
            px(bx + 16 * S, bodyY + 20 * S, 6, 10 + Math.max(0, -fistBob), armColor);

            drawSpriteStamped(ctx, "fire_body", FIRE_BODY, bx - (FIRE_BODY.w * S) / 2, bodyY, S, flashCol);
            drawSpriteStamped(ctx, `fire_fist_${fFrame}`, fistSp, bx - 22 * S, bodyY + 25 * S + fistBob, S, flashCol);
            drawSpriteStamped(ctx, `fire_fist_${fFrame}`, fistSp, bx + 13 * S, bodyY + 25 * S - fistBob, S, flashCol);
            break;
          }

          case "spectral": {
            // Levitates high & regal with long flowing violet Lich robe!
            const floatY = Math.round(Math.sin(animTime * 2.4) * 3) * S;
            const bodyY = by - (SPECTRAL_BODY.h + 15) * S + floatY;
            const scytheY = bodyY + 22 * S + Math.round(Math.sin(animTime * 3.8) * 1.5) * S;

            drawSpriteStamped(ctx, "spec_cloak", SPECTRAL_CLOAK, bx - (SPECTRAL_CLOAK.w * S) / 2, bodyY + 12 * S, S, flashCol);
            drawSpriteStamped(ctx, "spec_body", SPECTRAL_BODY, bx - (SPECTRAL_BODY.w * S) / 2, bodyY, S, flashCol);
            const boneCol = flashCol || "#cbd5e1";
            const boneEdge = flashCol || "#070812";
            px(bx - 12 * S, bodyY + 19 * S, 6, 12, boneEdge);
            px(bx - 11 * S, bodyY + 19 * S, 4, 10, boneCol);
            px(bx + 9 * S, bodyY + 19 * S, 6, 12, boneEdge);
            px(bx + 10 * S, bodyY + 19 * S, 4, 10, boneCol);
            if (!flashCol && fFrame === 1) {
              px(bx - 2 * S, bodyY + 10 * S, 2, 2, "#ffffff");
              px(bx + 2 * S, bodyY + 10 * S, 2, 2, "#ffffff");
              px(bx - 14 * S, bodyY + 13 * S, 4, 4, "#3df2ff");
              px(bx + 12 * S, bodyY + 13 * S, 4, 4, "#3df2ff");
            }
            drawSpriteStamped(
              ctx,
              "spec_scythe",
              SPECTRAL_BARBELL_SCYTHE,
              bx - (SPECTRAL_BARBELL_SCYTHE.w * S) / 2,
              scytheY,
              S,
              flashCol
            );
            px(bx - 12 * S, scytheY + 6 * S, 6, 6, boneEdge);
            px(bx - 11 * S, scytheY + 7 * S, 4, 4, boneCol);
            px(bx + 9 * S, scytheY + 6 * S, 6, 6, boneEdge);
            px(bx + 10 * S, scytheY + 7 * S, 4, 4, boneCol);
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
          const sy = by - 50 + step * (sl.angle * 4);
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
      className="relative flex w-full max-w-[304px] cursor-pointer items-center justify-center border-2 border-[#2c3350] bg-[#0b0d17] drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] select-none overflow-hidden"
      title="¡Toca al jefe para desafiarlo!"
    >
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        aria-label="Raid Boss Arena"
        className="pixelated block w-full h-auto"
        style={{ aspectRatio: `${CW} / ${CH}` }}
      />
      <div className="pointer-events-none absolute bottom-1.5 right-2 pixel-title text-[6px] text-[#8b93b8] opacity-75">
        [TOCA PARA ATACAR]
      </div>
    </motion.div>
  );
}
