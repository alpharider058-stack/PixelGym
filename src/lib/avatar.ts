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

  /* ---------- background ---------- */
  const bg = ITEM[equipped.bg] ?? ITEM.bg_garage;
  r(0, 0, AW, AH, bg.color);
  for (let i = 0; i < 6; i++) r(0, 52 + i * 3, AW, 3, i % 2 ? bg.color : bg.color2!);
  if (bg.id === "bg_cyber") {
    for (let x = 0; x < AW; x += 8) r(x + ((t / 60) % 8), 52, 1, 20, "#ff2bd6");
    for (let y = 0; y < 50; y += 6) r(0, y, AW, 1, "#2a0a50");
    r(4, 6, 6, 6, "#ffe14d");
  } else if (bg.id === "bg_beach") {
    r(0, 0, AW, 30, "#ffb27a"); r(0, 30, AW, 22, "#3a8ad6"); disc(50, 14, 6, "#fff1a8");
  } else if (bg.id === "bg_gym") {
    for (let x = 2; x < AW; x += 14) { r(x, 6, 10, 18, "#0f1a26"); r(x + 1, 7, 8, 16, "#284a6a"); }
  } else {
    for (let x = 0; x < AW; x += 10) r(x, 0, 1, 52, "#3a2a20");
    r(4, 38, 10, 2, "#777"); disc(4, 39, 3, "#333"); disc(14, 39, 3, "#333");
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

  /* ---------- aura ---------- */
  const aura = ITEM[equipped.aura];
  const tierSum = sh + ch + bk + ar + lg;
  if ((aura && aura.color) || tierSum >= 17) {
    const col = aura?.color || "#ffe14d", col2 = aura?.color2 || "#fff";
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const fl = Math.sin(t / 90 + i * 1.7) * 2 + Math.sin(t / 200 + i) * 1.5;
      const rx = 20 + fl, ry = 28 + fl;
      const x = cx + Math.cos(a) * rx;
      const y = 40 + Math.sin(a) * ry - (aura?.id === "aura_fire" ? Math.abs(Math.sin(t / 120 + i)) * 4 : 0);
      r(x, y, 2, 2, i % 3 ? col : col2);
    }
    if (aura?.id === "aura_bolt" && Math.sin(t / 70) > 0.85) {
      let x = cx - 18, y = 6;
      for (let k = 0; k < 8; k++) { r(x, y, 1, 4, "#fff"); x += k % 2 ? 2 : -1; y += 4; }
    }
  }

  const weaponId = equipped.weapon;
  const hasHeavyWeapon =
    weaponId === "weapon_greatsword" || weaponId === "weapon_axe" || weaponId === "weapon_hammer";
  const hasDumbbell = weaponId === "weapon_dumbbell";
  const rightAx = cx + shW;
  const rightForearmW = Math.max(2.5, Math.min(3.5, armW - 0.5));
  const weaponGripX =
    flex > 0 && !hasHeavyWeapon
      ? Math.min(54, Math.round(rightAx + 9 - Math.max(1, (armW - 1) / 2)))
      : hasHeavyWeapon
      ? flex > 0
        ? Math.min(55, Math.round(rightAx + 7.5))
        : Math.min(55, Math.round(rightAx + 6.5))
      : Math.min(54, Math.round(rightAx + armW * 0.5));
  const weaponGripY =
    hasHeavyWeapon
      ? flex > 0
        ? topY - 4
        : topY + 9
      : flex > 0
      ? topY - 12
      : topY + 23;

  /* ---------- outline + fill passes ---------- */
  for (let pass = 0; pass < 2; pass++) {
    const e = pass === 0 ? 1 : 0;
    const S = pass === 0 ? OUT : SKIN;
    const shorts = pass === 0 ? OUT : "#2b2f4a";
    // legs
    for (const s of [-1, 1]) {
      const lx = cx + s * (1 + thigh / 2) - thigh / 2;
      r(lx - e, 46 + bob - e, thigh + e * 2, 9 + e * 2, shorts);
      r(lx + 0.5 - e, 55 + bob - e, thigh - 1 + e * 2, 9 - bob + e * 2, S);
      r(lx - 1 - e, 64 - e, thigh + 1 + e * 2, 2 + e * 2, pass ? "#e8e8e8" : OUT);
    }
    // torso
    for (let y = topY; y <= 46 + bob; y++) {
      const f = (y - topY) / (46 + bob - topY);
      const hw = shW + (waistW - shW) * Math.pow(f, 0.85);
      r(cx - hw - e, y, hw * 2 + e * 2, 1, S);
    }
    if (pass === 0) r(cx - shW - 1, topY - 1, shW * 2 + 2, 1, OUT);
    // neck + head
    r(cx - 2.5 - e, 18 + bob, 5 + e * 2, 7, S);
    r(cx - 5 - e, 7 + bob - e, 10 + e * 2, 12 + e * 2, S);
    // arms
    for (const s of [-1, 1]) {
      const ax = cx + s * shW;
      if (s === 1 && hasHeavyWeapon) {
        if (flex > 0) {
          // L-shape heroic bicep curl holding raised weapon cleanly out & up!
          const upperSpan = Math.max(4, weaponGripX - ax);
          const bicepsPeakR = Math.round(armW / 2 + 0.3 + ar * 0.25);
          r(ax - e, topY + 1 - e, upperSpan + 1.5 + e * 2, armW * 0.78 + e * 2, S);
          disc(Math.round((ax + weaponGripX) / 2), topY + 1, bicepsPeakR + e, S);
          r(weaponGripX - 1.5 - e, weaponGripY - e, 3.5 + e * 2, topY + 3 - weaponGripY + e * 2, S);
        } else {
          // Upper arm cleanly drops to elbow, then horizontal forearm extends cleanly to fist
          const ux = ax - 1.5;
          const uW = Math.min(armW, 4.2);
          r(ux - e, topY + 1 - e, uW + e * 2, 9.5 + e * 2, S);
          const fStart = Math.min(ux + 1, weaponGripX - 4.5);
          const fLen = Math.max(4, weaponGripX - fStart);
          r(fStart - e, weaponGripY - 1.5 - e, fLen + e * 2, rightForearmW + e * 2, S);
        }
        r(weaponGripX - 1.5 - e, weaponGripY - 1.5 - e, 3.5 + e * 2, 3.5 + e * 2, S); // palm base behind hilt
      } else if (flex > 0) {
        const ux = s < 0 ? ax - 9 : ax;
        r(ux - e, topY + 1 - e, 9 + e * 2, armW + e * 2, S); // upper arm horizontal
        const fx = s < 0 ? ax - 9 : ax + 9 - (armW - 1);
        r(fx - e, topY - 10 - e, armW - 1 + e * 2, 12 + e * 2, S); // forearm up
        disc(ax + s * 5, topY + 1, Math.round(armW / 2 + 0.5 + ar * 0.3) + e, S); // biceps peak
        r(fx - 0.5 - e, topY - 13 - e, armW + e * 2, 3 + e * 2, S); // fist
      } else {
        const ux = s < 0 ? ax - armW + 0.5 : ax - 0.5;
        r(ux - e, topY + 1 - e, armW + e * 2, 12 + e * 2, S);
        const fShift = s === 1 && hasDumbbell ? 0.5 : s < 0 ? 0 : 0.5;
        r(ux + fShift - e, topY + 13 - e, armW - 0.5 + e * 2, 9 + e * 2, S);
        r(ux + (s === 1 && hasDumbbell ? 0.5 : 0) - e, topY + 22 - e, armW + e * 2, 3 + e * 2, S);
      }
      disc(ax + s * 0.5, topY + 1.5, Math.round(deltR) + e, S);
    }
  }

  /* ---------- muscle shading & definition ---------- */
  // delts highlight
  for (const s of [-1, 1]) {
    disc(cx + s * shW + s * 0.5 - s, topY + 0.5, Math.max(1, Math.round(deltR) - 2), HI);
  }
  // pecs
  const pecW = shW - 2;
  r(cx - pecW, topY + 6 + ch * 0.6, pecW * 2, 1, SHADE);
  if (ch >= 1 || p.chest) {
    r(cx - 0.5, topY + 2, 1, 5 + ch * 0.6, SHADE);
    r(cx - pecW + 1, topY + 2, pecW - 2, 1, p.chest ? "#ff8ba7" : HI);
    r(cx + 1, topY + 2, pecW - 2, 1, p.chest ? "#ff8ba7" : HI);
  }
  if (p.chest) {
    // Upper pec pump striation / vascularity
    r(cx - 4, topY + 4, 3, 1, VEIN);
    r(cx + 2, topY + 4, 3, 1, VEIN);
  }
  if (ch >= 3) { r(cx - pecW, topY + 7 + ch * 0.6, pecW * 2, 1, OUT); }
  // lats shading
  if (bk >= 1) for (const s of [-1, 1]) r(cx + s * (shW - 1) - (s > 0 ? 1 : 0), topY + 5, 1, 6 + bk, SHADE);
  // abs
  const absTier = Math.max(cr, ch, bk, lg);
  if (absTier >= 2 || p.core) {
    const absCol = p.core ? VEIN : SHADE;
    for (let k = 0; k < 3; k++) { r(cx - 3, topY + 11 + k * 3.5, 2, 1, absCol); r(cx + 1, topY + 11 + k * 3.5, 2, 1, absCol); }
    r(cx - 0.5, topY + 10, 1, 11, absCol);
  }
  // arms definition / vascularity
  for (const s of [-1, 1]) {
    const ax = cx + s * shW;
    if (s === 1 && hasHeavyWeapon) {
      if (flex > 0) {
        if (ar >= 1 || p.arms) r(ax + 2, topY, 3, 1, p.arms ? "#ff8ba7" : HI);
        if (ar >= 3 || p.arms) r(weaponGripX - 0.5, weaponGripY + 4, 1, 2, VEIN);
      } else {
        if (ar >= 1 || p.arms) r(ax, topY + 3, 1, 5, p.arms ? "#ff8ba7" : HI);
        if (ar >= 3 || p.arms) r(weaponGripX - 6, weaponGripY - 0.5, 2, 1, VEIN);
      }
    } else if (flex > 0) {
      if (ar >= 1 || p.arms) r(ax + s * 3, topY + 1, 3, 1, p.arms ? "#ff8ba7" : HI);
      if (ar >= 3 || p.arms) { r(ax + s * 6, topY + 3, 1, 1, VEIN); r(ax + s * 5, topY + 4, 2, 1, VEIN); }
    } else {
      const ux = s < 0 ? ax - armW + 0.5 : ax - 0.5;
      if (ar >= 1 || p.arms) r(ux + (s < 0 ? 1 : armW - 2), topY + 4, 1, 6, p.arms ? "#ff8ba7" : HI);
      r(ux, topY + 12, armW, 1, SHADE);
      if (ar >= 3 || p.arms) { r(ux + armW / 2, topY + 14, 1, 4, VEIN); r(ux + armW / 2 - 1, topY + 17, 1, 3, VEIN); }
    }
  }
  // quads
  if (lg >= 2) for (const s of [-1, 1]) { const lx = cx + s * (1 + thigh / 2); r(lx, 56 + bob, 1, 4, SHADE); }

  /* ---------- equipment ---------- */
  const shirt = ITEM[equipped.shirt];
  if (shirt?.color) {
    const strap = shirt.id === "shirt_stringer" ? 1 : shirt.id === "shirt_comp" ? 99 : 2;
    for (let y = topY + (strap === 99 ? 0 : 4); y <= 46 + bob; y++) {
      const f = (y - topY) / (46 + bob - topY);
      const hw = (shW + (waistW - shW) * Math.pow(f, 0.85)) - (strap === 99 ? 0 : strap === 1 ? 2.5 : 1.5);
      r(cx - hw, y, hw * 2, 1, shirt.color);
    }
    if (strap !== 99) for (const s of [-1, 1]) r(cx + s * (shW - 4) - (s > 0 ? strap : 0), topY, strap, 4, shirt.color);
    if (shirt.color2) { r(cx - 3, topY + 8, 6, 1, shirt.color2); r(cx - 1, topY + 7, 2, 3, shirt.color2); }
    if (strap === 99) r(cx - pecW, topY + 6 + ch * 0.6, pecW * 2, 1, "rgba(0,0,0,.35)");
  }
  const belt = ITEM[equipped.belt];
  if (belt?.color) { r(cx - waistW - 0.5, 43 + bob, waistW * 2 + 1, 3, belt.color); r(cx - 1.5, 43 + bob, 3, 3, belt.color2!); }
  const wrist = ITEM[equipped.wrist];
  if (wrist?.color) for (const s of [-1, 1]) {
    const ax = cx + s * shW;
    if (s === 1 && hasHeavyWeapon) {
      if (flex > 0) {
        r(weaponGripX - 1.5, weaponGripY + 2, 3.5, 2, wrist.color);
      } else {
        // Vertical wristband cleanly sitting on horizontal outstretched forearm just left of fist
        r(weaponGripX - 3.5, weaponGripY - 1.5, 2, rightForearmW, wrist.color);
      }
    } else if (flex > 0) {
      const fx = s < 0 ? ax - 9 : ax + 9 - (armW - 1);
      r(fx - 0.5, topY - 10, armW, 2, wrist.color);
    } else {
      const ux = s < 0 ? ax - armW + 0.5 : ax - 0.5;
      r(ux + (s === 1 && hasDumbbell ? 0.5 : 0), topY + 20, armW, 2, wrist.color);
    }
  }

  /* ---------- face, beard & hair ---------- */
  const blink = Math.sin(t / 1700) > 0.97;
  r(cx - 3, 12 + bob, 2, blink ? 1 : 2, OUT); r(cx + 1, 12 + bob, 2, blink ? 1 : 2, OUT);
  r(cx - 2, 16 + bob, flex > 0 ? 4 : 3, 1, flex > 0 ? "#fff" : SHADE);
  r(cx - 5, 15 + bob, 1, 2, SHADE); r(cx + 4, 15 + bob, 1, 2, SHADE);

  // Custom hair color or default item hair color
  const hairItem = ITEM[equipped.hair] ?? ITEM.hair_short;
  const hairCol = customHairColor || hairItem.color || "#2b1d14";
  const beardCol = customHairColor || hairItem.color || "#2b1d14";

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
  if (hairItem.id === "hair_mohawk") { r(cx - 1.5, hb - 5, 3, 7, hairCol); r(cx - 5, hb, 10, 1, SHADE); }
  else if (hairItem.id === "hair_spiky") {
    r(cx - 6, hb - 1, 12, 4, hairCol);
    for (let k = 0; k < 5; k++) r(cx - 6 + k * 2.5, hb - 4 - (k % 2) * 2, 2, 4, hairCol);
    r(cx - 6, hb + 3, 2, 3, hairCol); r(cx + 4, hb + 3, 2, 3, hairCol);
  } else if (hairItem.id === "hair_long") {
    r(cx - 6, hb - 2, 12, 4, hairCol); r(cx - 7, hb, 3, 14, hairCol); r(cx + 4, hb, 3, 14, hairCol);
  } else { r(cx - 5, hb - 1, 10, 3, hairCol); }

  // level-based headband glow
  if (cfg.level >= 15) r(cx - 5, hb + 2, 10, 1, "#ff3f6c");

  /* ---------- weapon (inside gripped right fist) & pet companion ---------- */
  drawWeaponSprite(r, equipped.weapon, weaponGripX, weaponGripY, t, SKIN, SHADE, HI);
  drawPetSprite(r, equipped.pet, 13, 66, t, 1);
}
