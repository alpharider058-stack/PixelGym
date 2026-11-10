"use client";

/**
 * Pure 16-bit SNES/GBA RPG Pixel-Art Sprite Matrices & Cached Canvas Blit Engine.
 * Zero network dependencies (100% offline PWA compatible), strict integer pixel grid,
 * pre-compiled RLE horizontal spans + offscreen stamp caching for 120 FPS performance.
 */

export type PixelPlotter = (x: number, y: number, w: number, h: number, color: string) => void;

export interface CompiledSpan {
  x: number;
  y: number;
  w: number;
  color: string;
}

export interface CompiledSprite {
  w: number;
  h: number;
  spans: CompiledSpan[];
  silhouettes: CompiledSpan[];
}

export function compileSprite(rows: readonly string[], palette: Record<string, string>): CompiledSprite {
  let w = 0;
  for (const row of rows) {
    if (row.length > w) w = row.length;
  }
  const h = rows.length;
  const spans: CompiledSpan[] = [];
  const silhouettes: CompiledSpan[] = [];

  for (let y = 0; y < h; y++) {
    const row = rows[y];
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      const col = ch === "." || ch === " " ? "" : palette[ch] || "";
      if (!col) {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      spans.push({ x, y, w: end - x, color: col });

      // Merge contiguous non-transparent runs for solid silhouette flash stamps
      const prevSil = silhouettes[silhouettes.length - 1];
      if (prevSil && prevSil.y === y && prevSil.x + prevSil.w === x) {
        prevSil.w += end - x;
      } else {
        silhouettes.push({ x, y, w: end - x, color: "#ffffff" });
      }
      x = end;
    }
  }

  return { w, h, spans, silhouettes };
}

/** Direct plotter helper (used inside 64x72 hero Avatar canvas & mini crisp icons). */
export function drawCompiledWithPlotter(
  r: PixelPlotter,
  sprite: CompiledSprite,
  left: number,
  top: number,
  u = 1
) {
  for (let i = 0; i < sprite.spans.length; i++) {
    const sp = sprite.spans[i];
    r(left + sp.x * u, top + sp.y * u, sp.w * u, u, sp.color);
  }
}

/* ---------------- Cached Offscreen Stamp Blitter (Boss Arena 120 FPS) ---------------- */
const stampCache = new Map<string, HTMLCanvasElement>();

function getStamp(
  key: string,
  sprite: CompiledSprite,
  pxScale: number,
  flashColor?: string
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const fullKey = `${key}|${pxScale}|${flashColor || ""}`;
  const hit = stampCache.get(fullKey);
  if (hit) return hit;

  const cv = document.createElement("canvas");
  cv.width = Math.max(1, sprite.w * pxScale);
  cv.height = Math.max(1, sprite.h * pxScale);
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;

  if (flashColor) {
    ctx.fillStyle = flashColor;
    for (let i = 0; i < sprite.silhouettes.length; i++) {
      const s = sprite.silhouettes[i];
      ctx.fillRect(s.x * pxScale, s.y * pxScale, s.w * pxScale, pxScale);
    }
  } else {
    for (let i = 0; i < sprite.spans.length; i++) {
      const s = sprite.spans[i];
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x * pxScale, s.y * pxScale, s.w * pxScale, pxScale);
    }
  }

  stampCache.set(fullKey, cv);
  return cv;
}

export function drawSpriteStamped(
  ctx: CanvasRenderingContext2D,
  key: string,
  sprite: CompiledSprite | undefined,
  dx: number,
  dy: number,
  pxScale = 2,
  flashColor?: string
) {
  if (!sprite) return;
  const stamp = getStamp(key, sprite, pxScale, flashColor);
  if (!stamp) return;
  ctx.drawImage(stamp, Math.round(dx), Math.round(dy));
}

/* ============================================================================
 *  COMPANION PETS (16-bit SNES/GBA Sprites — 20-22w x 16-18h)
 * ========================================================================== */

const OWL_PAL: Record<string, string> = {
  k: "#120826", // deep ink outline
  p: "#4c1d95", // shadow plumage
  v: "#7c3aed", // violet midtone
  l: "#c4b5fd", // lavender rim highlight
  w: "#fef3c7", // cream chest & disc
  s: "#b45309", // amber chest speck
  y: "#ffe14d", // glowing golden eye
  o: "#f97316", // orange beak & talons
};

const OWL_BASE_FRAMES = [
  // Frame 0: Wings tucked / proud perch
  compileSprite(
    [
      "...kk..........kk...",
      "..klpk........kplk..",
      "...kpvkkkkkkkkvpk...",
      "...kpvvllvvllvvpk...",
      "..kpvwwkppppkwwvpk..",
      "..kpwyykwkkwkyywpk..",
      "..kpwyywkookwyywpk..",
      "...kpwwwwkkwwwwpk...",
      "..kpvlwwwwwwwwlvpk..",
      ".kplvlwwswwswwlvlpk.",
      ".kpvlwwwswwswwwlvpk.",
      ".kppvlwwswwswwlvppk.",
      "..kppvlwwwwwwlvppk..",
      "...kppkkoookookppk..",
      "....kk.ko..ok.kk....",
      "......kppvvppk......",
      ".......kkkkkk.......",
    ],
    OWL_PAL
  ),
  // Frame 1: Wings wide spread in flight!
  compileSprite(
    [
      "k..kk..........kk..k",
      "klpkpk........kpkplk",
      "klvppvkkkkkkkkvppvlk",
      "kpvlvvllvvvvllvvlvpk",
      "kpvlvwwkppppkwwvlvpk",
      ".kppwyykwkkwkyywppk.",
      ".kppwyywkookwyywppk.",
      "..kppwwwwkkwwwwppk..",
      "...kpvlwwwwwwlvpk...",
      "...kpvlwwswwswwvk...",
      "....kppwwwswwwpk....",
      ".....kppwwwwppk.....",
      "......kpkppkpk......",
      "......kkoookko......",
      ".......ko..ok.......",
      "......kppvvppk......",
      ".......kkkkkk.......",
    ],
    OWL_PAL
  ),
];

const WOLF_PAL: Record<string, string> = {
  k: "#090d16", // ink black outline
  d: "#334155", // steel dark shade
  m: "#64748b", // slate mid
  s: "#94a3b8", // silver coat
  h: "#e2e8f0", // bright rim silver
  c: "#3df2ff", // glowing cyber cyan
  b: "#0891b2", // deep cyan edge
  w: "#ffffff", // gleam
};

const WOLF_FRAMES = [
  // Frame 0: Tail high & ready stance
  compileSprite(
    [
      "............kk..kk....",
      "...........kshkkhsk...",
      "...........ksmssmsk...",
      ".kk.......ksssmssshk..",
      "khhk......ksmkcccshwk.",
      "ksshk.....ksmkbcckssk.",
      ".ksssk...kkckksmmmkk..",
      ".kmmsskkkkkcmkshmmhk..",
      "..kkmmsssshkksmhhssk..",
      "...ksssssssmmshhssmk..",
      "...kmsssssdssshhmmmk..",
      "...kmmmskkddmmmsmk....",
      "...ksmk....ksmk.ksmk..",
      "...kdk.....kdk...kdk..",
      "...khk.....khk...khk..",
      "...kkk.....kkk...kkk..",
    ],
    WOLF_PAL
  ),
  // Frame 1: Tail wagging slightly forward + paw lift
  compileSprite(
    [
      ".............kk..kk...",
      "..kk........kshkkhsk..",
      ".khhk.......ksmssmsk..",
      ".ksshk.....ksssmssshk.",
      "..ksssk....ksmkcccshwk",
      "..kmmssk...ksmkbcckssk",
      "...kmmsskkkckksmmmkk..",
      "...kkmmssskcmkshmmhk..",
      "....ksssssshksmhhssk..",
      "....ksssssssmshhssmk..",
      "....kmmsssdssshhmmmk..",
      "....kmmskkddmmmsmk....",
      "....ksmk...ksmk..ksmk.",
      "....kdk....kdk....kdk.",
      "....khk....khk....khk.",
      "....kkk....kkk....kkk.",
    ],
    WOLF_PAL
  ),
];

const DRAGON_PAL: Record<string, string> = {
  k: "#1c060c", // dark burgundy outline
  r: "#881337", // deep crimson shade
  d: "#e11d48", // vibrant crimson
  x: "#ff3f6c", // coral highlight
  o: "#ff7a1a", // flame orange membrane
  y: "#ffe14d", // golden horn & belly
  g: "#b45309", // amber ridge
  w: "#ffffff", // white eye glint & fang
};

const DRAGON_FRAMES = [
  // Frame 0: Wings perched + poised claws
  compileSprite(
    [
      "..........kyk..kyk....",
      "..........kgykkgyk....",
      "..........kddddddk....",
      "..kkkk...kxdxxxdxxk...",
      ".kkoook..kddkywkddxk..",
      "kkooookk.kdxkddkddddk.",
      "kkoorookkkdxxddddwkdk.",
      ".kkrdddkkddgyddkkkk...",
      "..kkdddddggyygdk......",
      "....kddddgyyyydk......",
      "...kdddddgyyyydxk.....",
      "..krrddddggyyddrk.....",
      ".krddrrrddyydddk......",
      "kdk.krrdddddrrdk......",
      "kk...krrk..kddk.......",
      ".....kyk...kyk........",
      ".....kkk...kkk........",
    ],
    DRAGON_PAL
  ),
  // Frame 1: Wings flared high!
  compileSprite(
    [
      "kkkk......kyk..kyk....",
      "koookk....kgykkgyk....",
      "koorookk..kddddddk....",
      "kkooroookkxdxxxdxxk...",
      ".kkorooddkddkywkddxk..",
      "..kkrdddddxkddkddddk..",
      "...kkddddxxddddwkdk...",
      "....kkdddddgyddkkkk...",
      "....kddddggyygdk......",
      "....kddddgyyyydk......",
      "...kdddddgyyyydxk.....",
      "..krrddddggyyddrk.....",
      ".krddrrrddyydddk......",
      "kdk.krrdddddrrdk......",
      "kk...krrk..kddk.......",
      ".....kyk...kyk........",
      ".....kkk...kkk........",
    ],
    DRAGON_PAL
  ),
];

const GOLEM_PAL: Record<string, string> = {
  k: "#140d04", // dark outline
  b: "#78350f", // deep bronze plate rim
  m: "#d97706", // warm Olympic gold
  y: "#ffe14d", // bright gold highlight
  w: "#fef9c3", // specular rim
  e: "#064e3b", // dark emerald ring
  g: "#22c55e", // crystal mid
  l: "#7dff6a", // neon lime core / runes
  s: "#64748b", // stone gauntlet
  h: "#cbd5e1", // gauntlet light
};

const GOLEM_CORE = compileSprite(
  [
    ".....kkkkkkkk....",
    "...kkwwwwwwwwkk..",
    "..kwyyyyyyyyyymk.",
    ".kwyyykeleklyyymk",
    ".kyyykmgllgmyyymk",
    "kwwykmmkekkmmymbk",
    "kwyykmmklwkmmymbk",
    "kyyykmkkllkkmymbk",
    "kyyykmmkegkmmymbk",
    ".kyymmmkekkmmmbk.",
    ".kymmmmmmmmmmbbk.",
    "..kmmmmmmmmmbbk..",
    "...kkmmbbbbbbkk..",
    ".....kkkkkkkk....",
  ],
  GOLEM_PAL
);

const GOLEM_FIST_L = compileSprite(
  [
    ".kkkk.",
    "khhllk",
    "khsssk",
    "khklsk",
    ".kssk.",
  ],
  GOLEM_PAL
);

const GOLEM_FIST_R = compileSprite(
  [
    ".kkkk.",
    "kllhhk",
    "kssshk",
    "kslkhk",
    ".kssk.",
  ],
  GOLEM_PAL
);

const WEAPON_PAL: Record<string, string> = {
  k: "#090a12",
  d: "#334155",
  s: "#64748b",
  m: "#94a3b8",
  h: "#e2e8f0",
  w: "#ffffff",
  c: "#3df2ff",
  r: "#9f1239",
  p: "#ff3f6c",
  y: "#ffe14d",
  b: "#78350f",
  g: "#b45309",
};

const WEAPON_SPRITES: Record<string, CompiledSprite> = {
  weapon_dumbbell: compileSprite(
    [
      "....kkkk....",
      "...khhhhk...",
      "..kddmmddk..",
      "..kddmmddk..",
      "....kssk....",
      "....kmmk....",
      "....kmmk....",
      "....kssk....",
      "..kddmmddk..",
      "..kddmmddk..",
      "...kddddk...",
      "....kkkk....",
    ],
    WEAPON_PAL
  ),
  weapon_greatsword: compileSprite(
    [
      ".....kk.....",
      "....kwwk....",
      "....khwk....",
      "....khwk....",
      "....khwk....",
      "....kmwk....",
      "....kmwk....",
      "....kmwk....",
      ".kkkcccckkk.",
      ".kddmmmmddk.",
      "....kggk....",
      "....kddk....",
    ],
    WEAPON_PAL
  ),
  weapon_axe: compileSprite(
    [
      "..kkk..kkk..",
      ".kpppkbpk...",
      "kpwwkkbbk...",
      "kpppwkpppk..",
      "krrrrkrrpk..",
      ".kkkkgkkkk..",
      ".....kbbk...",
      ".....kggk...",
      ".....kbbk...",
      ".....kggk...",
      ".....kbbk...",
      ".....kkkk...",
    ],
    WEAPON_PAL
  ),
  weapon_hammer: compileSprite(
    [
      ".kkkkkkkkkk.",
      "kcyyyyyyyymk",
      "kcyywwwwyymk",
      "kdyyyyyyybdk",
      ".kkkkkkkkkk.",
      ".....kggk...",
      ".....kbbk...",
      ".....kggk...",
      ".....kbbk...",
      ".....kggk...",
      ".....kbbk...",
      ".....kkkk...",
    ],
    WEAPON_PAL
  ),
};

/**
 * Draws the equipped 16-bit pixel-art Pet sprite anchored around bottom-center (ax, ay).
 * Works smoothly both in Hero 64x72 Canvas (u = 1), Armory cards (u = 3), and Boss Arena (u = 2).
 */
export function drawPetSprite(
  r: PixelPlotter,
  petId: string | undefined,
  ax: number,
  ay: number,
  t: number,
  u = 1
) {
  if (!petId || petId === "pet_none") return;

  const snap = (v: number) => Math.round(v);
  const p = (dx: number, dy: number, w: number, h: number, col: string) =>
    r(snap(ax + dx * u), snap(ay + dy * u), Math.max(1, snap(w * u)), Math.max(1, snap(h * u)), col);

  const bob = Math.round(Math.sin(t / 290));
  const flap = Math.sin(t / 160) > 0 ? 1 : 0;

  if (petId === "pet_owl") {
    const sp = OWL_BASE_FRAMES[flap];
    const top = ay + (bob - sp.h - 1) * u;
    const left = ax - Math.floor(sp.w / 2) * u;
    p(-6, 0, 12, 1, "rgba(0,0,0,0.4)");
    drawCompiledWithPlotter(r, sp, left, top, u);
    // Occasional gentle blink
    if (Math.sin(t / 1500) > 0.94) {
      p(-5, bob - sp.h + 4, 2, 1, "#4c1d95");
      p(3, bob - sp.h + 4, 2, 1, "#4c1d95");
    }
    // Orbiting arcane star-rune motes (animated subtly)
    const stPhase = Math.abs(Math.floor(t / 240)) % 4;
    if (stPhase % 2 === 0) {
      p(-9, bob - 14, 1, 1, "#ffe14d");
      p(8, bob - 11, 1, 1, "#c4b5fd");
    } else {
      p(-8, bob - 7, 1, 1, "#c4b5fd");
      p(8, bob - 15, 1, 1, "#ffe14d");
    }
    return;
  }

  if (petId === "pet_wolf") {
    const step = Math.sin(t / 240) > 0.25 ? 1 : 0;
    const sp = WOLF_FRAMES[step];
    const top = ay + (-sp.h + (Math.sin(t / 350) > 0.7 ? -1 : 0)) * u;
    const left = ax - Math.floor(sp.w / 2) * u;
    p(-8, 0, 16, 1, "rgba(0,0,0,0.42)");
    drawCompiledWithPlotter(r, sp, left, top, u);
    // Pulsing cyan visor shine when cyber charged
    if (Math.sin(t / 210) > 0.4) {
      p(4, -12, 2, 1, "#ffffff");
    }
    return;
  }

  if (petId === "pet_dragon") {
    const sp = DRAGON_FRAMES[flap];
    const dy = bob - 1;
    const top = ay + (dy - sp.h) * u;
    const left = ax - Math.floor(sp.w / 2) * u;
    p(-6, 0, 13, 1, "rgba(0,0,0,0.4)");
    drawCompiledWithPlotter(r, sp, left, top, u);
    // Animated flame puff emitted from snout
    const fCycle = Math.abs(Math.floor(t / 150)) % 6;
    if (fCycle < 4) {
      const fx = 9 + (fCycle > 1 ? 1 : 0);
      p(fx, dy - 12, 2, 2, "#ff7a1a");
      p(fx + 1, dy - 12, 1, 1, "#ffe14d");
      if (fCycle === 2) p(fx + 2, dy - 13, 1, 1, "#fff7ed");
    }
    return;
  }

  if (petId === "pet_golem") {
    const gy = bob - 3;
    const top = ay + (gy - GOLEM_CORE.h) * u;
    const left = ax - Math.floor(GOLEM_CORE.w / 2) * u;
    p(-7, 0, 14, 1, "rgba(0,0,0,0.38)");
    drawCompiledWithPlotter(r, GOLEM_CORE, left, top, u);
    // Independently hovering rune gauntlets
    const fL = Math.round(Math.sin(t / 220));
    const fR = Math.round(Math.sin(t / 220 + Math.PI));
    drawCompiledWithPlotter(r, GOLEM_FIST_L, left - 4 * u, top + (8 + fL) * u, u);
    drawCompiledWithPlotter(r, GOLEM_FIST_R, left + (GOLEM_CORE.w - 2) * u, top + (8 + fR) * u, u);
    // Pulsing emerald reactor core flash
    if (Math.sin(t / 180) > 0.3) {
      p(-1, gy - 8, 2, 2, "#d9f99d");
    }
  }
}

export function drawWeaponIcon(r: PixelPlotter, weaponId: string | undefined, left: number, top: number, u = 2) {
  const sp = weaponId ? WEAPON_SPRITES[weaponId] : undefined;
  if (!sp) return;
  drawCompiledWithPlotter(r, sp, left, top, u);
}

/* ============================================================================
 *  RAID BOSSES (16-bit Multi-Layer Articulated Bosses on 2px Pixel Grid)
 * ========================================================================== */

// ---------------- 1. EL COLOSO DE HIERRO ("iron") ----------------
const IRON_PAL: Record<string, string> = {
  k: "#080a12", // deep obsidian ink
  o: "#131726", // obsidian shadow armor
  a: "#1e263b", // dark steel armor
  s: "#475569", // brushed iron midtone
  m: "#64748b", // cool iron light
  h: "#cbd5e1", // bright steel highlight
  w: "#ffffff", // specular rim
  b: "#7f1d1d", // furnace casing / red plate shade
  r: "#e11d48", // olympic crimson plate & eyes
  p: "#ff3f6c", // furnace crimson glow
  f: "#ff7a1a", // forge orange glow
  y: "#ffe14d", // molten white-gold core & champion trim
  g: "#b45309", // warm bronze shade
};

export const IRON_EXHAUST = compileSprite(
  [
    "..kkk....................kkk..",
    ".khhkk..................kkhhk.",
    ".kmmak..................kammk.",
    ".ksssk..................ksssk.",
    ".kbbak..................kabbk.",
  ],
  IRON_PAL
);

export const IRON_CHEST_LEGS = compileSprite(
  [
    ".......kkkkkk............kkkkkk.......",
    ".....kkhhsssmkk........kkmssshhkk.....",
    "...kkhmmmmssaaakk....kkaaassmmmmhkk...",
    "..khmmssssaaasssskkkkssssaaassssmmhk..",
    ".khsmaaaaaaamsssksssskssmmaaaaaaamshk.",
    "khmskaaaaaamssskkkkkkkkaassmaaaaaaksam",
    "kssk.kssmmmssskbfyyyyfbksssmmmsssk.ksk",
    ".kk...kssssssskbfwwwwfbkssssssssk...kk",
    "......kssasssskbfrffrfbksssssassk.....",
    "......ksaaasssskbppppbbkssssaaask.....",
    ".......kssshhsskkkkkkkkkssshhssk......",
    "........kaaaaasssmmmmsssaasssak.......",
    "........kssyyggggyyyyggggyysssk.......",
    ".........ksssyyyywwwwyyyysssk.........",
    ".........kksssssssssssssssskk.........",
    "..........ksmmmmsssssssmmmsk..........",
    "..........kssaaaakkkkaaaassk..........",
    ".........khsssaaak..kaaassshk.........",
    ".........kssssssak..kassssssk.........",
    "........khssssaaak..kaaasssshk........",
    "........ksssssssk....ksssssssk........",
    "........kssaaassk....kssaaassk........",
    ".......khhsssssk......kssssshhk.......",
    ".......ksmmmsssk......ksssmmmsk.......",
    "......kssaaaassk......kssaaaassk......",
    "......khhmmssshk......khsssmmhhk......",
    "......kssssssssk......kssssssssk......",
    "......koooooooook....koooooooook......",
    "......kkkkkkkkkkk....kkkkkkkkkkk......",
  ],
  IRON_PAL
);

export const IRON_HELM = compileSprite(
  [
    "kk......................kk",
    "kwhk..................khwk",
    ".ksmk...kkkkkkkkkk...kmsk.",
    "..ksakkkhhhhhhhhhhkkkaask.",
    "..ksskmssssssssssssmksssk.",
    "...kkssssaaassssaasssskk..",
    "....kssakkkkkkkkkkkaassk..",
    "....kssakpyykkkkkypkassk..",
    "....ksaskpwwkkkkwwpkssak..",
    "....kssakkkkkkkkkkkaassk..",
    ".....ksmssssssysssssmsk...",
    "......ksmmssssssssmmskk...",
    ".......kkkkkkkkkkkkkkk....",
  ],
  IRON_PAL
);

export const IRON_FURNACE_FRAME = [
  compileSprite(
    [
      "bfyyyyfb",
      "bfwwwwfb",
      "bfrffrfb",
      "bppppppb",
    ],
    IRON_PAL
  ),
  compileSprite(
    [
      "pfwwwwfp",
      "fyyyyyyf",
      "bfywwyfb",
      "rpfppfpr",
    ],
    IRON_PAL
  ),
];

export const IRON_BARBELL = compileSprite(
  [
    ".kkkk..........................................kkkk.",
    "krrrrkk......................................kkrrrrk",
    "kryyyrrkkk................................kkkrryyyyk",
    "krrwwrrshskkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkshsrrrwwrrk",
    "krrrrrrhshkssshhhhhhhhhhhhhhhhhhhhhhhhssskhshrrrrrrk",
    "krrbyrrsshkssmmmssssssssssssssssssssmmmskkhssrrbyrrk",
    "krrbyrrssakssaak....................kaasskassrrbyrrk",
    "krrbyrrssakhhssk....................ksshhkassrrbyrrk",
    "krrbrrrssakssak......................kasskassrrrbrrk",
    "kbbbbbbssk.kkk........................kkk.kssbbbbbbk",
    ".kbbbbskk..................................kksbbbbk.",
    "..kkkk........................................kkkk..",
  ],
  IRON_PAL
);

export const IRON_DEFEATED = compileSprite(
  [
    "............kk........kk............",
    "...........kshk......khsk...........",
    "............ksmk.kkkkkmsk...........",
    "......kkk....ksakhssshka............",
    ".....khmskk..kssksmssksk.....kkk....",
    "....khmssskkkkssakkkkaaskkkkkmhhk...",
    "....kssaaasshhsskkppkksshhsssaassk..",
    "...kssaassssaaasskppkssaaassssaaask.",
    "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    ".kssshhssssmssssaaaassssmmsssshhssk.",
    "..kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..",
  ],
  IRON_PAL
);

// ---------------- 2. QUIMERA HIPERTRÓFICA ("toxic") ----------------
const TOXIC_PAL: Record<string, string> = {
  k: "#0a0f0c", // dark forest-ink
  b: "#2e1f27", // wing-bone plum shadow
  m: "#4a2c35", // tattered wing membrane
  s: "#4d3528", // muscular hide shadow
  d: "#7a523c", // chimera bronze hide mid
  h: "#a87758", // muscular deltoid highlight
  v: "#22c55e", // deep lactic venom glow
  g: "#7dff6a", // neon lactic acid green!
  w: "#ecfccb", // brightest acid/fang specular
  p: "#7e22ce", // chimera plum crest/horn root
  u: "#c084fc", // bright violet horn shade
};

export const TOXIC_WINGS_FRAMES = [
  // Frame 0: Towering raised bat-dragon wings
  compileSprite(
    [
      "....kkk............................................kkk....",
      "...kgggk..........................................kgggk...",
      "..kkbbbkk........................................kkbbbkk..",
      ".kbbmmmbbkkkk................................kkkkbbmmmbbk.",
      "kbmssmmmmbbbbkkkk........................kkkkbbbbmmmmssmbk",
      "kbmmsssssmmmmbbbbkk....................kkbbbbmmmmsssssmmbk",
      "kbmmmssssssssmmmbbbk..................kbbbmmmssssssssmmmbk",
      ".kbmsssmmmmmmmmmmbk....................kbmmsmmmmmmmmsssmbk",
      ".kbmmskkmmmmmmmmmbk....................kbmmsmmmmmmmkkmmsbk",
      "..kbbk..kkmmmmmmmbk....................kbmmmmmmmk..kkbkbk.",
      "...kk.....kmmmmmbbk....................kbbmmmmmk.....kk...",
      "...........kmmbbkk......................kkbbmmk...........",
      "............kkkk..........................kkkk............",
    ],
    TOXIC_PAL
  ),
  // Frame 1: Sweeping downbeat wings!
  compileSprite(
    [
      "..........................................................",
      "......kkk........................................kkk......",
      ".....kgggk......................................kgggk.....",
      "...kkbbbbbkk..................................kkbbbbbkk...",
      "..kbmmmmmmbbbkkkk........................kkkkbbbmmmmmmmbk.",
      ".kbmmsssssmmmbbbbkk....................kkbbbbmmssssssmmbk.",
      "kbmssssssssmmmbbbbk....................kbbbbmmmssssssssmbk",
      "kbmmmssssssssmmmmmkk..................kkmmmmmssssssssmmmbk",
      "kbmmskkkkkmmmmmmmmk....................kmmmmmmmmkkkmksmmbk",
      ".kbbk....kmmmmmmbk......................kbmmmmmmk....kbbk.",
      "..kk......kmmmmbk........................kbmmmmk......kk..",
      "...........kmmkk..........................kkmmk...........",
      "............kk..............................kk............",
    ],
    TOXIC_PAL
  ),
];

export const TOXIC_BODY = compileSprite(
  [
    ".........kk....................kk.........",
    "........kggk..................kggk........",
    ".......kgwgk..................kgwgk.......",
    ".......kpugk...kkkkkkkkkkkk...kgupk.......",
    "........kppkkddhhhhhhhhhhhhddkkppk........",
    ".........kpkkdshddddddddddhsdkkpk.........",
    "..........kkdhdgwddddddddwgdhdkk..........",
    "..........kddhdkgddddddddgkdhhdk..........",
    ".........kdddkkdkkkkkkkkkkdkkdddk.........",
    ".........kddskkwkwkkkkwkwkwkksddk.........",
    "....kkkkkddssddkkwkkkkkkwkkddssddkkkkk....",
    "..kkhhhddhssgddddhhsssshhddddgsshddhhhkk..",
    ".khhgddhhhdsggddhsssssssshhddggsdhhhddghk.",
    "khdggddhhhhddgddddssssssddddgddhhhhddgddhk",
    "kddgddhhhhddssddgddddddddgddssddhhhhddgddk",
    "kdsddhhhhddssddddggggggggddddssddhhhhddsdk",
    ".kdddddsddsssdddddssssssddddsssdsssdddddk.",
    "..kkddddssssddhssskkkkkkssshddssssddddkk..",
    "....ksssssssddhssskkggkkssshddsssssssk....",
    ".....kdsddssddsssk..kk..ksssddssddsddk....",
    ".....kdddddssdddk........kdddssdddddk.....",
    ".....khddssddddk..........kddddssddhk.....",
    "....khddssddddk............kddddssddhk....",
    "....kddssddddk..............kddddssddk....",
    "...kdsddgddsk................ksddgddsddk..",
    "...kddggdddk..................kdddggdddk..",
    "..kggkddgkggk................kggkgddkggk..",
    "..kkk.kkk.kkk................kkk.kkk.kkk..",
  ],
  TOXIC_PAL
);

export const TOXIC_CLAW_L = compileSprite(
  [
    "..kkkkk...",
    ".khhggdk..",
    "khhdgddk..",
    "kddhgddk..",
    "kdsgddk...",
    ".kssssk...",
    "kggkggk...",
    "kwk.kwk...",
    "kk...kk...",
  ],
  TOXIC_PAL
);

export const TOXIC_CLAW_R = compileSprite(
  [
    "...kkkkk..",
    "..kdggdhhk",
    "..kddgdhhk",
    "..kddghddk",
    "...kddgsdk",
    "...kssssk.",
    "...kggkggk",
    "...kwk.kwk",
    "...kk...kk",
  ],
  TOXIC_PAL
);

export const TOXIC_DEFEATED = compileSprite(
  [
    ".........kk.....................",
    "........kggk........kkkk........",
    ".......kgwgk......kkvvvvkk......",
    ".......kpugk.....kvggggggvk.....",
    "......kppuk......kggwwwwggk.....",
    ".....ksspk.......kvggggggvk.....",
    "....kkkkk..kkk..kgggggggggk.....",
    "..kkvvvvkkkgggk.kkvvvvvvvvkk....",
    ".kvggggggggggggggggggggggggvk...",
    "..kkkkkkkkkkkkkkkkkkkkkkkkkk....",
  ],
  TOXIC_PAL
);

// ---------------- 3. IGNIS, SEÑOR DEL CALOR ("fire") ----------------
const FIRE_PAL: Record<string, string> = {
  k: "#100605", // obsidian ink
  b: "#271310", // charred basalt shadow
  c: "#451e18", // cracked magma rock
  s: "#6b2f24", // warm stone edge
  r: "#b91c1c", // deep crimson magma
  o: "#ff7a1a", // blazing lava orange
  y: "#ffe14d", // molten yellow-gold
  w: "#fff7ed", // white-hot lava spark
};

export const FIRE_WINGS_FRAMES = [
  compileSprite(
    [
      "..kkk..............................................kkk..",
      ".kbbck............................................kcbbk.",
      "kbbrrykk........................................kkyrrbbk",
      "kbboyyrrkk....................................kkrryyoobk",
      "kbooyyyorrkk................................kkrrooyyyobk",
      "kbooywyyoorrkk............................kkrrooyywyyobk",
      ".kbooyyyoooorrkk........................kkrrooooyyyyyobk",
      ".kbooyyyooookkrrk......................krrkkooooyyyyobk.",
      "..kboyoyokkk..kkk......................kkk..kkkoyoyobk..",
      "..kbookk........................................kkoobk..",
      "...kkk............................................kkk...",
    ],
    FIRE_PAL
  ),
  compileSprite(
    [
      "...kk..............................................kk...",
      ".kkbck............................................kcbkk.",
      "kbbrookk........................................kkoorbbk",
      "kbooyyrrkk....................................kkrryyyobk",
      "kboywyyoorrk................................kkrrooyywobk",
      "kbooyyyoooorrk............................kkrrooooyyyobk",
      ".kbooyyyoooorrrk........................krrroooyyyyyobk.",
      ".kbooyooookkrrk..........................krrkkooooyyobk.",
      "..kboyokkk..kkk..........................kkk..kkkyoyobk.",
      "...kbbk..........................................kbbk...",
      "....kk............................................kk....",
    ],
    FIRE_PAL
  ),
];

export const FIRE_BODY = compileSprite(
  [
    ".......kk......................kk.......",
    "......kyyk....................kyyk......",
    ".....koywbk..................kbwyok.....",
    ".....kbcbkk..kkkkkkkkkkkkkk..kkbcbk.....",
    "......kcbkkbbcsccyywwyyccsccbkkbck......",
    ".......kbbccbbccccccccccccbbccbbk.......",
    "........kbcoywyobbbccbbboywyocbk........",
    "........kbccoorbbcywwycbbrooccbk........",
    ".........kbccccyoooorccyoccccbk.........",
    "..........kbckkoyyyyyyyokkkcbk..........",
    ".....kkkkkkbckbbbbccccbbbbkcbkkkkkk.....",
    "...kksscbbbckoooyyyyyyyyooookcbbcsskk...",
    "..ksscccbbccoywyyyyyyyyyywyocbbcccssk...",
    ".kscbbcccbbooyyyoorccrrooyyyoobccbbbck..",
    ".kcbbooooobccbbboywwwwyobbbccbooooobbck.",
    "..kkbbbbccbbbbbbcoooooocbbbbbbccbbbbkk..",
    ".....kkkbbccbbbboyywwyyobbbbccbbkkk.....",
    ".......kbbbccbbcooyyyyocbbccbbbk........",
    ".......kbbcooyybcoooooocbyyoocbbk.......",
    ".......kbbccbbccbbbbbbbbccbbccbbk.......",
    ".......kbboocbbckkkkkkkkcbbcboobk.......",
    ".......kbbccbbbk........kbbbccbbk.......",
    "......kscooobbbk........kbbbooocsk......",
    "......kbbbccbbbk........kbbbccbbbk......",
    ".....kbccssccbbk........kbbccssccbk.....",
    ".....kbbooorccbk........kbccrooobbk.....",
    "....kccbbbbbbcck........kccbbbbbbcck....",
    "....kkkkkkkkkkkk........kkkkkkkkkkkk....",
  ],
  FIRE_PAL
);

export const FIRE_FIST_FRAMES = [
  compileSprite(
    [
      "..k.k..",
      ".koyok.",
      "koywyok",
      "koyyyok",
      "kooyook",
      ".krork.",
      "..kkk..",
    ],
    FIRE_PAL
  ),
  compileSprite(
    [
      ".k.y.k.",
      "koywyok",
      "kywwwyk",
      "koyyyok",
      ".koook.",
      ".krrrk.",
      "..kkk..",
    ],
    FIRE_PAL
  ),
];

export const FIRE_DEFEATED = compileSprite(
  [
    "..........kk......kk..........",
    ".........kcbk....kbck.........",
    "....kk....kcckkkkcck..........",
    "...kcbk...kcbccccbck....kk....",
    "..kbbcckkkkbbooorbbkkkkccbbk..",
    ".kbbccsssccbooryyroobccsssccbk",
    "kbbbccccccbooroooooorbccccccbk",
    "kccbbbbccccbbbbbbbbbbccccbbbbk",
    ".kkkkkkkkkkkkkkkkkkkkkkkkkkkk.",
  ],
  FIRE_PAL
);

// ---------------- 4. REY NECROLIFT ("spectral") ----------------
const SPECTRAL_PAL: Record<string, string> = {
  k: "#070812", // void black ink
  v: "#2e1065", // deep royal violet shadow
  p: "#581c87", // regal purple cape
  m: "#7e22ce", // tattered violet fold
  l: "#a855f7", // rim purple
  d: "#475569", // shadowed bone
  b: "#94a3b8", // weathered bone
  s: "#cbd5e1", // pale skull bone
  h: "#f1f5f9", // bright bone white
  y: "#ffe14d", // royal Lich gold crown
  g: "#d97706", // shaded gold
  a: "#0891b2", // deep cyan soul
  c: "#3df2ff", // radiant spectral cyan!
  w: "#ffffff", // soul fire white core
};

export const SPECTRAL_CLOAK = compileSprite(
  [
    ".......kk......................kk.......",
    "......kcwk....................kwck......",
    ".....kaccak..................kaccak.....",
    "..kkkkccckkkk..............kkkkccckkkk..",
    ".kppllcccppppkkkkkkkkkkkkkkppppcccllppk.",
    "kpmppcccppppppvvvvvvvvvvvvppppppcccppmpk",
    "kpmppppppppppvvvvvvvvvvvvvvppppppppppmpk",
    "kpvppppppppvvvvvvvvvvvvvvvvvvppppppppvpk",
    "kvvvppppppvvvvvvvvvvvvvvvvvvvvppppppvvvk",
    ".kvvvppppvvvvvvvvvvvvvvvvvvvvvvppppvvvk.",
    ".kvvvpppvvvvvvvvvvvvvvvvvvvvvvvvpppvvvk.",
    "..kvvppvvvvvvvvvvvvvvvvvvvvvvvvvvppvvk..",
    "..kvvpvvvvvvvvvvvvvvvvvvvvvvvvvvvvpvvk..",
    "..kvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvk..",
    "..kvvpvvvvvvvvvvvvvvvvvvvvvvvvvvvvpvvk..",
    "..kvvpvvvkvvvvvvkvvvvvvkvvvvvvkvvpvvvk..",
    "..kvkkvvkkvvvvvkkvvvvvkkvvvvvkkvvkkvvk..",
    "...k..kk..kvvvk..kvvvvk..kvvvk..kk..k...",
    "...........kvk....kvvk....kvk...........",
  ],
  SPECTRAL_PAL
);

export const SPECTRAL_BODY = compileSprite(
  [
    ".......kk..kk..kk..kk.......",
    ".......kykkyykkyykkyk.......",
    ".......kygygyggygkygk.......",
    ".......kyyykccwkyyyyk.......",
    "........kggykkkygggk........",
    ".......kshhhhhhhhhsbk.......",
    "......kshhbbbbbbbhhbsk......",
    "......kshbkkkkkkkbhbsk......",
    "......kshbkcwwkkwwckbk......",
    "......kshbkacccaccakbk......",
    ".......kshbbkddbhhsk........",
    "........kshhbbbbhsk.........",
    "........ksbkbkbkbkk.........",
    ".........kkkkkkkkk..........",
    ".....kkkkvybbbbbyvkkkk......",
    "...ksssssbkkccwkkbsssssk....",
    "..kshhhbbbbkawwakbbbbhhsk...",
    "..kddbbbkkkacwwcakkbbbddk...",
    "...kkkssbbbkawwakbbbsskkk...",
    "....kssbbbbkkcckkbbbbssk....",
    ".....kkbbbbbbkkbbbbbbkk.....",
    ".......kddbbbbbbbbddk.......",
    "........kkddddddddkk........",
    "..........kkkkkkkk..........",
  ],
  SPECTRAL_PAL
);

export const SPECTRAL_BARBELL_SCYTHE = compileSprite(
  [
    "...kk..............................................kk...",
    "..kcwk............................................kwck..",
    ".kccwk............................................kwcck.",
    "kccawk............................................kwacck",
    "kcaakhhk........................................khhkaack",
    "kcakkhshkk....................................kkhshkkack",
    "kcakhshshkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkhshshkack",
    "kcakhshshsssssssssssssssssssssssssssssssssssssshshshkack",
    "kcakkhshkshhkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkhshkhshkkack",
    "kcaakkhhkshk................................kshkhhkkaack",
    ".kcawk.k..k..................................k..k.kwack.",
    "..kcck............................................kcck..",
    "...kk..............................................kk...",
  ],
  SPECTRAL_PAL
);

export const SPECTRAL_DEFEATED = compileSprite(
  [
    ".........kk..kk..kk.........",
    ".........kykkyykkyk.........",
    "....kk...kygyccwgyk...kk....",
    "...kcak..kyyyyyyyyk..kack...",
    "..kcwck...kggggggk..kcwck...",
    ".kccwck..kkshhhhskk.kcwcck..",
    "kcaackk.kshbbkkbbhskkkcaack.",
    "kkvvppvvvvppkkkkppvvvvppvvkk",
    ".kkkkkkkkkkkkkkkkkkkkkkkkkk.",
  ],
  SPECTRAL_PAL
);

/* ============================================================================
 *  MINI UI BOSS EMBLEMS (Crisp 14x14 Boss Portraits for Cards, Tabs & Victory)
 * ========================================================================== */

export const BOSS_MINI_EMBLEMS: Record<"iron" | "toxic" | "fire" | "spectral", CompiledSprite> = {
  iron: compileSprite(
    [
      "kk..........kk",
      "ksk.kkkkkk.ksk",
      ".kakhmmmmhkak.",
      ".kssssssssssk.",
      ".kssakkkkassk.",
      ".ksakryyrkask.",
      ".ksakfwwfkask.",
      ".kssakkkkassk.",
      "..ksmssssmsk..",
      "...kkkkkkkk...",
    ],
    IRON_PAL
  ),
  toxic: compileSprite(
    [
      ".kk........kk.",
      "kggk......kggk",
      ".kpukkkkkkupk.",
      "..kddhhhhddk..",
      "..kdgwddwgdk..",
      "..kddkddkddk..",
      "..kdkwwwwkdk..",
      "...kdwwwwdk...",
      "...kddkkddk...",
      "....kkkkkk....",
    ],
    TOXIC_PAL
  ),
  fire: compileSprite(
    [
      ".kk........kk.",
      "kyok......koyk",
      ".kcbkkkkkkbck.",
      "..kbbccccbbk..",
      "..kcoybbyock..",
      "..kbcywwycbk..",
      "..kbbroorbbk..",
      "...kbywwybk...",
      "...kbbccbbk...",
      "....kkkkkk....",
    ],
    FIRE_PAL
  ),
  spectral: compileSprite(
    [
      "..kk.kkkk.kk..",
      "..kykyyykyyk..",
      "..kyykcckyyk..",
      "..kshhhhhhsk..",
      ".kshbbbbbbhsk.",
      ".kskcwkkwcksk.",
      ".kskackkacksk.",
      "..kshbbbbhsk..",
      "..kskbkbbksk..",
      "...kkkkkkkk...",
    ],
    SPECTRAL_PAL
  ),
};

export const BOSS_MINI_SKULL_DEFEATED = compileSprite(
  [
    "...kkkkkkkk...",
    "..kshhhhhhsk..",
    ".kshbbbbbbhsk.",
    ".kshkkkkkkhsk.",
    ".kshkckkckhsk.",
    "..kshbkkbhsk..",
    "...ksbbbbssk..",
    "...kskbkbsk...",
    "....kkkkkk....",
  ],
  SPECTRAL_PAL
);
