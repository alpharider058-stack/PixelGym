"use client";
import { Equipped, HeroTraits, ITEM, Muscle, SKIN_PALETTES, HAIR_COLORS } from "./data";
import { drawPetSprite } from "./pixelSprites";

export { drawPetSprite };

export interface AvatarCfg {
  tiers: Record<Muscle, number>; // 0..4
  equipped: Equipped;
  level: number;
  pump?: Partial<Record<Muscle, boolean>>;
  traits?: Partial<HeroTraits>;
  berserk?: boolean;
  timeOverrideHour?: number;
}

export const AW = 64;
export const AH = 72;

export const DEFAULT_SKIN = "#e0a370", DEFAULT_SHADE = "#b2703f", DEFAULT_HI = "#f6c99c", OUT = "#24150e", DEFAULT_VEIN = "#9a5a34";

function drawGripFist(
  r: (x: number, y: number, w: number, h: number, col: string) => void,
  fx: number,
  fy: number,
  skinCol: string,
  shadeCol: string,
  hiCol: string,
  horizontalBar = false
) {
  if (horizontalBar) {
    // 4 fingers curling tightly OVER a horizontal dumbbell bar + knuckle highlight
    r(fx - 2, fy - 2, 5, 4, OUT);
    r(fx - 1, fy - 1, 3, 2, skinCol);
    r(fx - 1, fy - 1, 2, 1, hiCol);
    r(fx, fy + 1, 1, 1, shadeCol);
  } else {
    // Closed warrior fist + curled fingers + clamped thumb OVER the weapon grip
    r(fx - 2, fy - 2, 4, 4, OUT);
    r(fx - 1, fy - 1, 3, 3, skinCol);
    r(fx, fy - 1, 2, 1, hiCol);      // crisp top knuckle highlight
    r(fx, fy + 1, 2, 1, shadeCol);   // bottom curled pinky finger shade
    // Thumb clamping upper-inner side of hilt
    r(fx - 2, fy - 2, 2, 2, OUT);
    r(fx - 2, fy - 1, 1, 1, hiCol);
  }
}

function drawWeaponSprite(
  r: (x: number, y: number, w: number, h: number, col: string) => void,
  weaponId: string | undefined,
  fx: number,
  fy: number,
  t: number,
  skinCol: string,
  shadeCol: string,
  hiCol: string
) {
  if (!weaponId || weaponId === "weapon_none") return;

  if (weaponId === "weapon_dumbbell") {
    // Horizontal Olympic Iron Dumbbell held firmly inside the fist (`fx, fy`)
    r(fx - 4, fy - 1, 9, 2, "#334155"); // dark knurled bar
    r(fx - 3, fy - 1, 7, 1, "#94a3b8"); // bar highlight
    // Left hex weight plates
    r(fx - 6, fy - 4, 3, 8, "#0f172a");
    r(fx - 5, fy - 3, 2, 6, "#475569");
    r(fx - 5, fy - 3, 1, 5, "#e2e8f0");
    // Right hex weight plates
    r(fx + 4, fy - 4, 3, 8, "#0f172a");
    r(fx + 4, fy - 3, 2, 6, "#475569");
    r(fx + 5, fy - 3, 1, 5, "#e2e8f0");
    // Draw fingers OVER the center bar so the hand physically holds the dumbbell
    drawGripFist(r, fx, fy, skinCol, shadeCol, hiCol, true);
  } else if (weaponId === "weapon_greatsword") {
    // Barbell Greatsword angled slightly outward-up (`↗`) in open air beside shoulder
    // Bottom handle + weighted pommel peeking below fist
    r(fx - 1, fy + 1, 3, 4, "#0f172a");
    r(fx - 1, fy + 1, 2, 3, "#475569");
    r(fx - 2, fy + 4, 3, 2, "#94a3b8");
    // Handle inside fist
    r(fx - 1, fy - 2, 3, 4, "#334155");
    // Barbell Weighted Crossguard cleanly above thumb
    r(fx - 3, fy - 4, 7, 3, "#0f172a");
    r(fx - 2, fy - 3, 5, 1, "#3df2ff");
    r(fx - 4, fy - 5, 2, 4, "#475569");
    r(fx + 3, fy - 5, 2, 4, "#475569");
    // Tapered Heroic Steel Broadblade rising cleanly in open sky (`↗`)
    for (let step = 0; step < 12; step++) {
      const bx = fx + Math.floor(step * 0.2);
      const by = fy - 5 - step;
      const bw = step >= 10 ? 2 : 4;
      r(bx - 1, by, bw + 1, 1, "#1e293b");
      r(bx, by, Math.max(1, bw - 1), 1, "#cbd5e1");
      if (step < 11) r(bx + 1, by, 1, 1, "#ffffff");
    }
    r(fx + 2, fy - 17, 2, 1, "#ffffff"); // razor tip
    drawGripFist(r, fx, fy, skinCol, shadeCol, hiCol, false);
  } else if (weaponId === "weapon_axe") {
    // Crimson Battle Axe held upright/slight-diagonal in open space above fist
    // Pommel peeking below hand
    r(fx - 1, fy + 2, 3, 4, "#1c060c");
    r(fx - 1, fy + 2, 2, 3, "#78350f");
    r(fx - 2, fy + 4, 3, 2, "#b45309");
    // Oak haft passing cleanly upward-right through fist
    for (let step = 0; step <= 13; step++) {
      const hx = fx + Math.floor(step * 0.16);
      const hy = fy - step;
      r(hx - 1, hy, 3, 1, "#1c060c");
      r(hx, hy, 2, 1, step % 2 ? "#b45309" : "#78350f");
    }
    // Twin Crimson Crescent Axe Blades at top of haft (`fx + 1, fy - 12`)
    const ax = fx + 1;
    const ay = fy - 12;
    r(ax - 4, ay - 4, 10, 9, "#090a12");
    r(ax - 3, ay - 3, 8, 7, "#9f1239");
    r(ax - 2, ay - 2, 6, 5, "#ff3f6c");
    // Razor crescent edges left & right
    r(ax - 4, ay - 2, 2, 5, "#ffe14d");
    r(ax + 4, ay - 2, 2, 5, "#ffe14d");
    r(ax + 5, ay - 1, 1, 3, "#ffffff");
    // Center bronze collar
    r(ax, ay - 3, 2, 7, "#b45309");
    drawGripFist(r, fx, fy, skinCol, shadeCol, hiCol, false);
  } else if (weaponId === "weapon_hammer") {
    // Titan Lightning War-Hammer held heroically in fist (`fx, fy`)
    // Pommel below fist
    r(fx - 1, fy + 2, 3, 4, "#1c060c");
    r(fx - 1, fy + 2, 2, 3, "#78350f");
    r(fx - 2, fy + 4, 3, 2, "#ffe14d");
    // Heavy oak shaft rising through fist up to hammer block
    for (let step = 0; step <= 11; step++) {
      const hx = fx + Math.floor(step * 0.15);
      const hy = fy - step;
      r(hx - 1, hy, 3, 1, "#090a12");
      r(hx, hy, 2, 1, step % 2 ? "#b45309" : "#78350f");
    }
    // Massive Gold & Storm-Cyan Titan Hammer Head clear in open sky
    const mx = fx + 1;
    const my = fy - 14;
    r(mx - 4, my - 3, 10, 8, "#0f172a"); // deep obsidian border
    r(mx - 3, my - 2, 8, 6, "#d97706"); // warm bronze body
    r(mx - 3, my - 2, 8, 4, "#ffe14d"); // bright gold upper face
    r(mx - 2, my - 1, 5, 2, "#ffffff"); // specular highlight
    // Cyan rune end-caps
    r(mx - 4, my - 1, 2, 4, "#3df2ff");
    r(mx + 4, my - 1, 2, 4, "#3df2ff");
    if (Math.sin(t / 100) > 0.25) {
      r(mx - 5, my - 4, 2, 2, "#3df2ff");
      r(mx + 5, my + 2, 2, 2, "#ffffff");
    }
    drawGripFist(r, fx, fy, skinCol, shadeCol, hiCol, false);
  }
}

/** Draws the modular pixel avatar into a 64x72 logical canvas. Pure + cheap (~220 fillRects). */
export function drawAvatar(c: CanvasRenderingContext2D, cfg: AvatarCfg, t: number, flex: number) {
  const { tiers, equipped } = cfg;
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  };
  const disc = (x: number, y: number, rad: number, col: string) => {
    for (let dy = -rad; dy <= rad; dy++) {
      const hw = Math.sqrt(Math.max(0, rad * rad - dy * dy));
      r(x - hw, y + dy, hw * 2 + 1, 1, col);
    }
  };

  /* ---------- skin & hair palette selection ---------- */
  const skinPal = SKIN_PALETTES.find((p) => p.id === cfg.traits?.skinTone) ?? SKIN_PALETTES[0];
  const SKIN = skinPal.skin;
  const SHADE = skinPal.shade;
  const HI = skinPal.hi;
  const VEIN = skinPal.vein;

  const customHairColor = HAIR_COLORS.find((hc) => hc.id === cfg.traits?.hairColor)?.color;
  const facialHair = cfg.traits?.facialHair || "clean";

  /* ---------- background with time-of-day dynamic lighting ---------- */
  const bg = ITEM[equipped.bg] ?? ITEM.bg_garage;
  const hour = cfg.timeOverrideHour !== undefined ? cfg.timeOverrideHour : new Date().getHours();
  const timeOfDay = hour >= 6 && hour < 14 ? "morning" : hour >= 14 && hour < 21 ? "evening" : "night";

  if (bg.id === "bg_cyber") {
    const skyCol = timeOfDay === "morning" ? "#1d1042" : timeOfDay === "evening" ? "#260a38" : "#0b031a";
    const gridCol = timeOfDay === "morning" ? "#3df2ff" : timeOfDay === "evening" ? "#ff7a1a" : "#ff2bd6";
    r(0, 0, AW, AH, skyCol);
    for (let i = 0; i < 6; i++) r(0, 52 + i * 3, AW, 3, i % 2 ? skyCol : "#1f0836");
    for (let x = 0; x < AW; x += 8) r(x + ((t / 60) % 8), 52, 1, 20, gridCol);
    for (let y = 0; y < 50; y += 6) r(0, y, AW, 1, "#2a0a50");
    r(4, 6, 6, 6, timeOfDay === "night" ? "#3df2ff" : "#ffe14d");
  } else if (bg.id === "bg_beach") {
    const sky = timeOfDay === "morning" ? "#6ec6ff" : timeOfDay === "evening" ? "#d95b72" : "#101633";
    const sea = timeOfDay === "morning" ? "#2589d8" : timeOfDay === "evening" ? "#452e70" : "#091836";
    const sand1 = timeOfDay === "morning" ? "#f6d796" : timeOfDay === "evening" ? "#c27a56" : "#4a4359";
    const sand2 = timeOfDay === "morning" ? "#e0b86e" : timeOfDay === "evening" ? "#995344" : "#342f42";
    r(0, 0, AW, 30, sky);
    if (timeOfDay === "evening") r(0, 18, AW, 12, "#ff8b4a");
    if (timeOfDay === "night") {
      r(8, 6, 1, 1, "#fff"); r(18, 12, 1, 1, "#3df2ff"); r(36, 5, 1, 1, "#fff"); r(56, 20, 1, 1, "#fff");
      disc(50, 12, 5, "#e2e8f0");
    } else {
      disc(50, timeOfDay === "morning" ? 10 : 18, 6, timeOfDay === "morning" ? "#fff1a8" : "#ffe14d");
    }
    r(0, 30, AW, 22, sea);
    // water shimmer
    r(46, 33, 8, 1, timeOfDay === "evening" ? "#ff7a1a" : "#ffffff");
    for (let i = 0; i < 6; i++) r(0, 52 + i * 3, AW, 3, i % 2 ? sand1 : sand2);
  } else if (bg.id === "bg_gym") {
    const wall = timeOfDay === "morning" ? "#23364a" : timeOfDay === "evening" ? "#28223d" : "#101724";
    const floor1 = timeOfDay === "morning" ? "#3a5a7a" : timeOfDay === "evening" ? "#3a2e52" : "#172030";
    const floor2 = timeOfDay === "morning" ? "#2a445e" : timeOfDay === "evening" ? "#271f38" : "#0f1521";
    r(0, 0, AW, 52, wall);
    for (let i = 0; i < 6; i++) r(0, 52 + i * 3, AW, 3, i % 2 ? floor1 : floor2);
    const winSky = timeOfDay === "morning" ? "#8be0ff" : timeOfDay === "evening" ? "#ff7e5f" : "#0b1124";
    for (let x = 2; x < AW; x += 14) {
      r(x, 6, 10, 18, "#0f1a26");
      r(x + 1, 7, 8, 16, winSky);
      if (timeOfDay === "night") r(x + 1, 7, 8, 2, "#3df2ff"); // night cyber neon strip
      if (timeOfDay === "morning") {
        // soft diagonal sunlight beam
        r(x + 2, 24, 6, 14, "rgba(255, 240, 170, 0.14)");
      }
    }
  } else {
    // bg_garage
    const wall = timeOfDay === "morning" ? "#362720" : timeOfDay === "evening" ? "#331c28" : "#181622";
    const slat = timeOfDay === "morning" ? "#4d3629" : timeOfDay === "evening" ? "#472536" : "#221f30";
    const floor1 = timeOfDay === "morning" ? "#5a3a2a" : timeOfDay === "evening" ? "#4f2a38" : "#262335";
    const floor2 = timeOfDay === "morning" ? "#3d261c" : timeOfDay === "evening" ? "#361a26" : "#1a1826";
    r(0, 0, AW, 52, wall);
    for (let i = 0; i < 6; i++) r(0, 52 + i * 3, AW, 3, i % 2 ? floor1 : floor2);
    for (let x = 0; x < AW; x += 10) r(x, 0, 1, 52, slat);
    r(4, 38, 10, 2, "#777"); disc(4, 39, 3, "#333"); disc(14, 39, 3, "#333");
    if (timeOfDay === "morning") {
      r(0, 0, AW, 8, "rgba(255, 225, 130, 0.15)");
    } else if (timeOfDay === "evening") {
      r(0, 0, AW, 12, "rgba(255, 110, 80, 0.14)");
    } else if (timeOfDay === "night") {
      // neon garage tube
      r(18, 4, 28, 2, "#3df2ff");
      r(18, 6, 28, 3, "rgba(61, 242, 255, 0.16)");
    }
  }
  // floor shadow
  r(14, 66, 36, 2, "rgba(0,0,0,.35)");

  const breath = Math.sin(t / 650);
  const bob = flex > 0 ? -1 : breath > 0.6 ? -1 : 0;
  const cx = 32;
  const p = cfg.pump || {};
  const chP = p.chest ? 0.6 : 0;
  const shP = p.shoulders ? 0.5 : 0;
  const bkP = p.back ? 0.5 : 0;
  const arP = p.arms ? 0.6 : 0;
  const lgP = p.legs ? 0.5 : 0;
  const crP = p.core ? 0.5 : 0;

  const sh = tiers.shoulders + shP, ch = tiers.chest + chP, bk = tiers.back + bkP, ar = tiers.arms + arP, lg = tiers.legs + lgP, cr = (tiers.core ?? 0) + crP;
  const shW = 7 + ch * 0.8 + bk * 0.9 + sh * 0.4 + (breath > 0 ? 0.4 : 0) + flex * 1;
  const waistW = 5.5 + Math.max(0, ch - 2) * 0.3;
  const armW = 3 + ar * 0.8;
  const deltR = 2 + sh * 0.7;
  const thigh = 4.5 + lg * 0.9;
  const topY = 24 + bob;
  const shInt = Math.round(shW);
  const waistInt = Math.floor(waistW);
  const armInt = Math.max(3, Math.round(armW));
  const forearmInt = Math.max(2, armInt - (armInt > 3 ? 1 : 0));
  const thighInt = Math.max(4, Math.round(thigh));

  /* ---------- aura & reactive PR/high-tonnage berserk surge ---------- */
  const aura = ITEM[equipped.aura];
  const tierSum = sh + ch + bk + ar + lg;
  const isBerserk = Boolean(cfg.berserk);
  if ((aura && aura.color) || tierSum >= 17 || isBerserk) {
    const col = isBerserk ? "#ff3f6c" : aura?.color || "#ffe14d";
    const col2 = isBerserk ? "#3df2ff" : aura?.color2 || "#fff";
    const particleCount = isBerserk ? 34 : 26;
    for (let i = 0; i < particleCount; i++) {
      const a = (i / particleCount) * Math.PI * 2 + (isBerserk ? t / 500 : 0);
      const fl = Math.sin(t / (isBerserk ? 60 : 90) + i * 1.7) * 2.5 + Math.sin(t / 200 + i) * 1.5;
      const rx = 20 + fl, ry = 28 + fl;
      const x = cx + Math.cos(a) * rx;
      const y = 40 + Math.sin(a) * ry - ((aura?.id === "aura_fire" || isBerserk) ? Math.abs(Math.sin(t / 100 + i)) * 5 : 0);
      r(x, y, 2, 2, i % 3 === 0 ? "#ffe14d" : i % 2 ? col : col2);
    }
    if ((aura?.id === "aura_bolt" || isBerserk) && Math.sin(t / (isBerserk ? 45 : 70)) > (isBerserk ? 0.45 : 0.85)) {
      const lx = isBerserk && Math.sin(t / 120) > 0 ? cx + 14 : cx - 18;
      let x = lx, y = 6;
      for (let k = 0; k < 8; k++) {
        r(x, y, 1, 4, isBerserk && k % 2 ? "#3df2ff" : "#fff");
        x += k % 2 ? 2 : -1;
        y += 4;
      }
    }
  }

  const weaponId = equipped.weapon;
  const hasHeavyWeapon =
    weaponId === "weapon_greatsword" || weaponId === "weapon_axe" || weaponId === "weapon_hammer";
  const rightAx = cx + shInt;
  const rightFxNormal = cx + shInt - 1 + (armInt - forearmInt);
  const rightFlexUx = cx + shInt - 1;
  const rightFlexFx = cx + shInt + 8 - Math.max(2, armInt - 1);
  const rightForearmW = Math.max(2.5, Math.min(3.5, armW - 0.5));
  const weaponGripX =
    flex > 0 && !hasHeavyWeapon
      ? Math.min(54, rightFlexFx + 1)
      : hasHeavyWeapon
      ? Math.min(55, rightAx + 7)
      : Math.min(54, rightFxNormal + Math.floor(forearmInt / 2));
  const weaponGripY =
    hasHeavyWeapon
      ? flex > 0
        ? topY - 4
        : topY + 9
      : flex > 0
      ? topY - 12
      : topY + 23;

  /* ---------- outline + fill passes (strictly integer-symmetric around cx=32) ---------- */
  for (let pass = 0; pass < 2; pass++) {
    const e = pass === 0 ? 1 : 0;
    const S = pass === 0 ? OUT : SKIN;
    const shorts = pass === 0 ? OUT : "#2b2f4a";
    // legs (mirrored across cx=32)
    for (const s of [-1, 1]) {
      const lx = s < 0 ? cx - 1 - thighInt : cx + 1;
      r(lx - e, 46 + bob - e, thighInt + e * 2, 9 + e * 2, shorts);
      r(lx - e, 55 + bob - e, thighInt + e * 2, 9 - bob + e * 2, S);
      r(lx - (s < 0 ? 1 : 0) - e, 64 - e, thighInt + 1 + e * 2, 2 + e * 2, pass ? "#e8e8e8" : OUT);
    }
    // torso (always symmetric [cx - hw, cx + hw))
    for (let y = topY; y <= 46 + bob; y++) {
      const f = (y - topY) / Math.max(1, 46 + bob - topY);
      const hw = Math.round(shInt + (waistInt - shInt) * Math.pow(f, 0.85));
      r(cx - hw - e, y, (hw + e) * 2, 1, S);
    }
    if (pass === 0) r(cx - shInt - 1, topY - 1, (shInt + 1) * 2, 1, OUT);
    // neck + head
    r(cx - 2 - e, 18 + bob, 4 + e * 2, 7, S);
    r(cx - 5 - e, 7 + bob - e, 10 + e * 2, 12 + e * 2, S);
    // arms
    for (const s of [-1, 1]) {
      if (s === 1 && hasHeavyWeapon) {
        const ax = cx + shInt - 1;
        if (flex > 0) {
          const upperSpan = Math.max(4, weaponGripX - ax);
          const bicepsPeakR = Math.round(armW / 2 + 0.3 + ar * 0.25);
          r(ax - e, topY + 1 - e, upperSpan + 1.5 + e * 2, armW * 0.78 + e * 2, S);
          disc(Math.round((ax + weaponGripX) / 2), topY + 1, bicepsPeakR + e, S);
          r(weaponGripX - 1.5 - e, weaponGripY - e, 3.5 + e * 2, topY + 3 - weaponGripY + e * 2, S);
        } else {
          const ux = ax;
          const uW = Math.min(armInt, 4);
          r(ux - e, topY + 1 - e, uW + e * 2, 9.5 + e * 2, S);
          const fStart = Math.min(ux + 1, weaponGripX - 4.5);
          const fLen = Math.max(4, weaponGripX - fStart);
          r(fStart - e, weaponGripY - 1.5 - e, fLen + e * 2, rightForearmW + e * 2, S);
        }
        r(weaponGripX - 1.5 - e, weaponGripY - 1.5 - e, 3.5 + e * 2, 3.5 + e * 2, S);
        r(ax - e, topY - e, armInt + e * 2, Math.max(2, Math.round(deltR)) + e * 2, S);
      } else if (flex > 0) {
        const ux = s < 0 ? cx - shInt - 8 : rightFlexUx;
        r(ux - e, topY + 1 - e, 9 + e * 2, armInt + e * 2, S);
        const fArmW = Math.max(2, armInt - 1);
        const fx = s < 0 ? cx - shInt - 8 : rightFlexFx;
        r(fx - e, topY - 10 - e, fArmW + e * 2, 12 + e * 2, S);
        disc(cx + s * (shInt + 4), topY + 1, Math.round(armW / 2 + 0.5 + ar * 0.3) + e, S);
        r(fx - e, topY - 13 - e, Math.max(3, fArmW + 1) + e * 2, 3 + e * 2, S);
        r((s < 0 ? cx - shInt - armInt + 1 : cx + shInt - 1) - e, topY - e, armInt + e * 2, Math.max(2, Math.round(deltR)) + e * 2, S);
      } else {
        const ux = s < 0 ? cx - shInt - armInt + 1 : cx + shInt - 1;
        r(ux - e, topY + 1 - e, armInt + e * 2, 12 + e * 2, S);
        const fx = s < 0 ? ux : ux + (armInt - forearmInt);
        r(fx - e, topY + 13 - e, forearmInt + e * 2, 9 + e * 2, S);
        r(fx - e, topY + 22 - e, forearmInt + e * 2, 3 + e * 2, S);
        r(ux - e, topY - e, armInt + e * 2, Math.max(2, Math.round(deltR)) + e * 2, S);
      }
    }
  }

  /* ---------- muscle shading & definition ---------- */
  // delts highlight (symmetric, tucked strictly inside skin shoulder cap)
  for (const s of [-1, 1]) {
    const ux = s < 0 ? cx - shInt - armInt + 1 : cx + shInt - 1;
    r(ux + (s < 0 ? 1 : armInt - 2), topY + 1, 1, Math.max(1, Math.round(deltR) - 1), HI);
  }
  // pecs
  const pecW = shInt - 2;
  r(cx - pecW, topY + 6 + ch * 0.6, pecW * 2, 1, SHADE);
  if (ch >= 1 || p.chest) {
    r(cx - 1, topY + 2, 2, 5 + ch * 0.6, SHADE);
    r(cx - pecW + 1, topY + 2, Math.max(1, pecW - 2), 1, p.chest ? "#ff8ba7" : HI);
    r(cx + 1, topY + 2, Math.max(1, pecW - 2), 1, p.chest ? "#ff8ba7" : HI);
  }
  if (p.chest) {
    r(cx - 4, topY + 4, 3, 1, VEIN);
    r(cx + 1, topY + 4, 3, 1, VEIN);
  }
  if (ch >= 3) { r(cx - pecW, topY + 7 + ch * 0.6, pecW * 2, 1, OUT); }
  // lats shading
  if (bk >= 1) for (const s of [-1, 1]) r(s < 0 ? cx - shInt + 1 : cx + shInt - 2, topY + 5, 1, 6 + bk, SHADE);
  // abs
  const absTier = Math.max(cr, ch, bk, lg);
  if (absTier >= 2 || p.core) {
    const absCol = p.core ? VEIN : SHADE;
    for (let k = 0; k < 3; k++) { r(cx - 3, topY + 11 + k * 3.5, 2, 1, absCol); r(cx + 1, topY + 11 + k * 3.5, 2, 1, absCol); }
    r(cx - 1, topY + 10, 2, 11, absCol);
  }
  // arms definition / vascularity
  for (const s of [-1, 1]) {
    const ux = s < 0 ? cx - shInt - armInt + 1 : cx + shInt - 1;
    if (s === 1 && hasHeavyWeapon) {
      if (flex > 0) {
        if (ar >= 1 || p.arms) r(ux + 2, topY, 3, 1, p.arms ? "#ff8ba7" : HI);
        if (ar >= 3 || p.arms) r(weaponGripX - 1, weaponGripY + 4, 1, 2, VEIN);
      } else {
        if (ar >= 1 || p.arms) r(ux + 1, topY + 3, 1, 5, p.arms ? "#ff8ba7" : HI);
        if (ar >= 3 || p.arms) r(weaponGripX - 6, weaponGripY - 1, 2, 1, VEIN);
      }
    } else if (flex > 0) {
      if (ar >= 1 || p.arms) r(cx + s * (shInt + 2), topY + 1, 3, 1, p.arms ? "#ff8ba7" : HI);
      if (ar >= 3 || p.arms) { r(cx + s * (shInt + 5), topY + 3, 1, 1, VEIN); r(cx + s * (shInt + 4), topY + 4, 2, 1, VEIN); }
    } else {
      const fx = s < 0 ? ux : ux + (armInt - forearmInt);
      if (ar >= 1 || p.arms) r(ux + (s < 0 ? 1 : armInt - 2), topY + 4, 1, 6, p.arms ? "#ff8ba7" : HI);
      r(ux, topY + 12, armInt, 1, SHADE);
      if (ar >= 3 || p.arms) { r(fx + Math.floor(forearmInt / 2), topY + 14, 1, 4, VEIN); r(fx, topY + 17, 1, 3, VEIN); }
    }
  }
  // quads
  if (lg >= 2) for (const s of [-1, 1]) { const lx = s < 0 ? cx - 1 - thighInt : cx + 1; r(lx + Math.floor(thighInt / 2), 56 + bob, 1, 4, SHADE); }

  /* ---------- equipment ---------- */
  const shirt = ITEM[equipped.shirt];
  if (shirt?.color) {
    const strap = shirt.id === "shirt_stringer" ? 1 : shirt.id === "shirt_comp" ? 99 : 2;
    const inset = strap === 99 ? 0 : strap === 1 ? 3 : 2;
    for (let y = topY + (strap === 99 ? 0 : 4); y <= 46 + bob; y++) {
      const f = (y - topY) / Math.max(1, 46 + bob - topY);
      const hw = Math.max(2, Math.round(shInt + (waistInt - shInt) * Math.pow(f, 0.85)) - inset);
      r(cx - hw, y, hw * 2, 1, shirt.color);
    }
    if (strap !== 99) {
      const topShirtHw = Math.max(4, shInt - inset);
      const strapDist = Math.min(Math.max(4, Math.round(topShirtHw * 0.6)), Math.max(4, topShirtHw));
      r(cx - strapDist, topY, strap, 4, shirt.color);
      r(cx + strapDist - strap, topY, strap, 4, shirt.color);
    }
    if (shirt.color2) { r(cx - 3, topY + 8, 6, 1, shirt.color2); r(cx - 1, topY + 7, 2, 3, shirt.color2); }
    if (strap === 99) r(cx - pecW, topY + 6 + ch * 0.6, pecW * 2, 1, "rgba(0,0,0,.35)");
  }
  const belt = ITEM[equipped.belt];
  if (belt?.color) { r(cx - waistInt - 1, 43 + bob, (waistInt + 1) * 2, 3, belt.color); r(cx - 2, 43 + bob, 4, 3, belt.color2!); }
  const wrist = ITEM[equipped.wrist];
  if (wrist?.color) for (const s of [-1, 1]) {
    if (s === 1 && hasHeavyWeapon) {
      if (flex > 0) {
        r(weaponGripX - 1.5, weaponGripY + 2, 3.5, 2, wrist.color);
      } else {
        r(weaponGripX - 3.5, weaponGripY - 1.5, 2, rightForearmW, wrist.color);
      }
    } else if (flex > 0) {
      const fArmW = Math.max(2, armInt - 1);
      const fx = s < 0 ? cx - shInt - 8 : rightFlexFx;
      r(fx, topY - 10, fArmW, 2, wrist.color);
    } else {
      const ux = s < 0 ? cx - shInt - armInt + 1 : cx + shInt - 1;
      const fx = s < 0 ? ux : ux + (armInt - forearmInt);
      r(fx, topY + 20, forearmInt, 2, wrist.color);
    }
  }

  /* ---------- face, beard & hair ---------- */
  const blink = Math.sin(t / 1700) > 0.97;
  r(cx - 3, 12 + bob, 2, blink ? 1 : 2, OUT); r(cx + 1, 12 + bob, 2, blink ? 1 : 2, OUT);
  r(cx - 2, 16 + bob, flex > 0 ? 4 : 3, 1, flex > 0 ? "#fff" : SHADE);
  r(cx - 5, 15 + bob, 1, 2, SHADE); r(cx + 4, 15 + bob, 1, 2, SHADE);

  // Hair style determined by trait (or legacy equipped fallback), custom color or default color
  const effectiveHairId = cfg.traits?.hairStyle || equipped.hair || "hair_short";
  const defaultHairCol =
    effectiveHairId === "hair_mohawk"
      ? "#ff3fa4"
      : effectiveHairId === "hair_spiky"
      ? "#fbf236"
      : effectiveHairId === "hair_long"
      ? "#8a4b1f"
      : "#2b1d14";
  const hairCol = customHairColor || defaultHairCol;
  const beardCol = customHairColor || defaultHairCol;

  // Facial hair / beard rendering
  if (facialHair === "stubble") {
    // 3-day subtle pixel stubble around jaw & chin
    r(cx - 4, 17 + bob, 1, 1, beardCol);
    r(cx + 3, 17 + bob, 1, 1, beardCol);
    r(cx - 3, 18 + bob, 1, 1, beardCol);
    r(cx - 1, 18 + bob, 2, 1, beardCol);
    r(cx + 2, 18 + bob, 1, 1, beardCol);
  } else if (facialHair === "goatee") {
    // Warrior Goatee under mouth & chin
    r(cx - 2, 17 + bob, 4, 1, OUT);
    r(cx - 1.5, 17 + bob, 3, 1, beardCol);
    r(cx - 1, 18 + bob, 2, 2, beardCol);
  } else if (facialHair === "full") {
    // Full Spartan Warrior Beard wrapping jawline and chin
    r(cx - 5, 16 + bob, 2, 3, OUT);
    r(cx + 3, 16 + bob, 2, 3, OUT);
    r(cx - 4, 16 + bob, 1, 2, beardCol);
    r(cx + 3, 16 + bob, 1, 2, beardCol);
    r(cx - 4, 17 + bob, 8, 2, OUT);
    r(cx - 3, 17 + bob, 6, 2, beardCol);
    r(cx - 2, 19 + bob, 4, 1, beardCol);
    r(cx - 1, 20 + bob, 2, 1, beardCol);
  }

  const hb = 7 + bob;
  if (effectiveHairId === "hair_mohawk") { r(cx - 1.5, hb - 5, 3, 7, hairCol); r(cx - 5, hb, 10, 1, SHADE); }
  else if (effectiveHairId === "hair_spiky") {
    r(cx - 6, hb - 1, 12, 4, hairCol);
    for (let k = 0; k < 5; k++) r(cx - 6 + k * 2.5, hb - 4 - (k % 2) * 2, 2, 4, hairCol);
    r(cx - 6, hb + 3, 2, 3, hairCol); r(cx + 4, hb + 3, 2, 3, hairCol);
  } else if (effectiveHairId === "hair_long") {
    r(cx - 6, hb - 2, 12, 4, hairCol); r(cx - 7, hb, 3, 14, hairCol); r(cx + 4, hb, 3, 14, hairCol);
  } else { r(cx - 5, hb - 1, 10, 3, hairCol); }

  // level-based headband glow
  if (cfg.level >= 15) r(cx - 5, hb + 2, 10, 1, "#ff3f6c");

  /* ---------- weapon (inside gripped right fist) & pet companion ---------- */
  drawWeaponSprite(r, equipped.weapon, weaponGripX, weaponGripY, t, SKIN, SHADE, HI);
  drawPetSprite(r, equipped.pet, 13, 66, t, 1);
}
