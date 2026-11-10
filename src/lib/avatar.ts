"use client";
import { Equipped, ITEM, Muscle } from "./data";
import { drawPetSprite } from "./pixelSprites";

export { drawPetSprite };

export interface AvatarCfg {
  tiers: Record<Muscle, number>; // 0..4
  equipped: Equipped;
  level: number;
  pump?: Partial<Record<Muscle, boolean>>;
}

export const AW = 64;
export const AH = 72;

const SKIN = "#e0a370", SHADE = "#b2703f", HI = "#f6c99c", OUT = "#24150e", VEIN = "#9a5a34";

function drawWeaponSprite(
  r: (x: number, y: number, w: number, h: number, col: string) => void,
  weaponId: string | undefined,
  fx: number,
  fy: number,
  t: number
) {
  if (!weaponId || weaponId === "weapon_none") return;

  if (weaponId === "weapon_dumbbell") {
    // held diagonally/vertically in fist
    r(fx - 1, fy - 4, 3, 9, "#64748b");
    r(fx - 3, fy - 6, 7, 3, "#1e293b");
    r(fx - 2, fy - 5, 5, 1, "#e2e8f0");
    r(fx - 3, fy + 3, 7, 3, "#1e293b");
    r(fx - 2, fy + 4, 5, 1, "#e2e8f0");
  } else if (weaponId === "weapon_greatsword") {
    // Barbell Greatsword pointing up
    r(fx - 1, fy + 1, 3, 3, "#475569"); // pommel
    r(fx - 4, fy - 2, 9, 3, "#0f172a"); // barbell guard
    r(fx - 3, fy - 1, 7, 1, "#3df2ff");
    r(fx - 2, fy - 17, 5, 15, "#475569"); // outline blade
    r(fx - 1, fy - 16, 3, 14, "#cbd5e1");
    r(fx, fy - 16, 1, 13, "#ffffff");
  } else if (weaponId === "weapon_axe") {
    // Crimson Battle Axe
    r(fx, fy - 14, 2, 18, "#78350f");
    r(fx - 5, fy - 15, 12, 8, "#4c0519");
    r(fx - 4, fy - 14, 10, 6, "#ff3f6c");
    r(fx - 5, fy - 13, 2, 4, "#ffe14d");
    r(fx + 5, fy - 13, 2, 4, "#ffe14d");
  } else if (weaponId === "weapon_hammer") {
    // Titan Lightning Hammer
    r(fx, fy - 12, 2, 16, "#78350f");
    r(fx - 5, fy - 18, 12, 7, "#1e293b");
    r(fx - 4, fy - 17, 10, 5, "#ffe14d");
    r(fx - 5, fy - 16, 2, 3, "#3df2ff");
    r(fx + 5, fy - 16, 2, 3, "#3df2ff");
    if (Math.sin(t / 100) > 0.3) {
      r(fx - 7, fy - 19, 2, 2, "#3df2ff");
      r(fx + 7, fy - 14, 2, 2, "#ffffff");
    }
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
      if (flex > 0) {
        const ux = s < 0 ? ax - 9 : ax;
        r(ux - e, topY + 1 - e, 9 + e * 2, armW + e * 2, S); // upper arm horizontal
        const fx = s < 0 ? ax - 9 : ax + 9 - (armW - 1);
        r(fx - e, topY - 10 - e, armW - 1 + e * 2, 12 + e * 2, S); // forearm up
        disc(ax + s * 5, topY + 1, Math.round(armW / 2 + 0.5 + ar * 0.3) + e, S); // biceps peak
        r(fx - 0.5 - e, topY - 13 - e, armW + e * 2, 3 + e * 2, S); // fist
      } else {
        const ux = s < 0 ? ax - armW + 0.5 : ax - 0.5;
        r(ux - e, topY + 1 - e, armW + e * 2, 12 + e * 2, S);
        r(ux + (s < 0 ? 0 : 0.5) - e, topY + 13 - e, armW - 0.5 + e * 2, 9 + e * 2, S);
        r(ux - e, topY + 22 - e, armW + e * 2, 3 + e * 2, S);
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
    if (flex > 0) {
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
    if (flex > 0) { const fx = s < 0 ? ax - 9 : ax + 9 - (armW - 1); r(fx - 0.5, topY - 10, armW, 2, wrist.color); }
    else { const ux = s < 0 ? ax - armW + 0.5 : ax - 0.5; r(ux, topY + 20, armW, 2, wrist.color); }
  }

  /* ---------- face & hair ---------- */
  const blink = Math.sin(t / 1700) > 0.97;
  r(cx - 3, 12 + bob, 2, blink ? 1 : 2, OUT); r(cx + 1, 12 + bob, 2, blink ? 1 : 2, OUT);
  r(cx - 2, 16 + bob, flex > 0 ? 4 : 3, 1, flex > 0 ? "#fff" : SHADE);
  r(cx - 5, 15 + bob, 1, 2, SHADE); r(cx + 4, 15 + bob, 1, 2, SHADE);
  const hair = ITEM[equipped.hair] ?? ITEM.hair_short;
  const hb = 7 + bob;
  if (hair.id === "hair_mohawk") { r(cx - 1.5, hb - 5, 3, 7, hair.color); r(cx - 5, hb, 10, 1, SHADE); }
  else if (hair.id === "hair_spiky") {
    r(cx - 6, hb - 1, 12, 4, hair.color);
    for (let k = 0; k < 5; k++) r(cx - 6 + k * 2.5, hb - 4 - (k % 2) * 2, 2, 4, hair.color);
    r(cx - 6, hb + 3, 2, 3, hair.color); r(cx + 4, hb + 3, 2, 3, hair.color);
  } else if (hair.id === "hair_long") {
    r(cx - 6, hb - 2, 12, 4, hair.color); r(cx - 7, hb, 3, 14, hair.color); r(cx + 4, hb, 3, 14, hair.color);
  } else { r(cx - 5, hb - 1, 10, 3, hair.color); }

  // level-based headband glow
  if (cfg.level >= 15) r(cx - 5, hb + 2, 10, 1, "#ff3f6c");

  /* ---------- weapon (right fist) & pet companion ---------- */
  const fistX = flex > 0
    ? cx + shW + 9 - Math.max(1, (armW - 1) / 2)
    : cx + shW + Math.max(1, armW * 0.45);
  const fistY = flex > 0 ? topY - 12 : topY + 23;
  drawWeaponSprite(r, equipped.weapon, Math.min(AW - 6, fistX), Math.max(16, fistY), t);
  drawPetSprite(r, equipped.pet, 13, 66, t, 1);
}
