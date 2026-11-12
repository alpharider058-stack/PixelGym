import {
  AnimPattern,
  EquipKind,
  ExerciseAnimSpec,
  resolveExerciseAnim,
} from "./exerciseGuides";

export type { AnimPattern, EquipKind, ExerciseAnimSpec };
export type ExerciseGuide = ExerciseAnimSpec;
export const getExerciseGuide = resolveExerciseAnim;
export { resolveExerciseAnim };

/** 80x64 (5:4 arcade ratio) -> exact 1x (80x64), 2x (160x128), 3x (240x192) integer scale */
export const ANW = 80;
export const ANH = 64;

/* ============================================================================
 * 16-Bit Arcade Gym Palette
 * ============================================================================ */
const P_BG = "#0a0d18";
const P_GRID = "#12182b";
const P_FLOOR = "#111626";
const P_FLOOR_RIM = "#2a3556";

const P_OUT = "#07090f";
const P_SKIN = "#e6a774";
const P_SKIN_DK = "#b87442";
const P_HEADBAND = "#3df2ff";
const P_HAIR = "#3a2214";

const P_SHIRT = "#38bdf8";
const P_SHIRT_DK = "#0284c7";
const P_SHORTS = "#1e293b";
const P_SHORTS_DK = "#0f172a";
const P_SHOE = "#f8fafc";
const P_SHOE_TRIM = "#38bdf8";

const P_FRAME = "#1e293b";
const P_FRAME_LT = "#475569";
const P_STEEL = "#cbd5e1";
const P_STEEL_DK = "#64748b";
const P_PAD = "#334155";
const P_PAD_HI = "#4f627d";

const P_PLATE = "#ef4444";
const P_PLATE_HI = "#f87171";
const P_PLATE_DK = "#991b1b";
const P_STACK = "#27324a";
const P_STACK_HI = "#435377";
const P_PIN = "#ffe14d";
const P_CABLE = "#ffe14d";
const P_BAND = "#4ade80";
const P_RING = "#fbbf24";

export type RepPhase = "CON" | "HOLD" | "EXC";

/** Normalized cyclic repetition progress: returns 0 (stretch/start) -> 1 (peak) -> 0 */
export function repCycle(
  tMs: number,
  speed = 1
): { p: number; phase: RepPhase; cyclePct: number } {
  const period = 2800 / Math.max(0.25, speed);
  const f = (((tMs % period) + period) % period) / period; // safe positive 0..1
  if (f < 0.36) {
    const u = f / 0.36;
    return { p: 0.5 - 0.5 * Math.cos(u * Math.PI), phase: "CON", cyclePct: f };
  }
  if (f < 0.54) {
    return { p: 1, phase: "HOLD", cyclePct: f };
  }
  if (f < 0.90) {
    const u = (f - 0.54) / 0.36;
    return { p: 0.5 + 0.5 * Math.cos(u * Math.PI), phase: "EXC", cyclePct: f };
  }
  return { p: 0, phase: "HOLD", cyclePct: f };
}

type RectFn = (x: number, y: number, w: number, h: number, col: string) => void;
type SegFn = (x1: number, y1: number, x2: number, y2: number, thick: number, col: string) => void;

type MuscleGroupTarget =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quads"
  | "hams"
  | "glutes"
  | "calves"
  | "core"
  | "full";

function targetGroupOf(pat: AnimPattern): MuscleGroupTarget {
  switch (pat) {
    case "chest_press_machine":
    case "pec_deck":
    case "cable_crossover":
    case "bench_press":
    case "db_fly":
    case "pullover":
    case "landmine_press":
    case "svend_press":
    case "pushup":
    case "dips_parallel":
      return "chest";
    case "dips_bench":
    case "dips_machine":
    case "triceps_pushdown":
    case "triceps_skullcrusher":
    case "triceps_overhead":
    case "triceps_kickback":
      return "triceps";
    case "ohp_bar":
    case "ohp_machine":
    case "ohp_arnold":
    case "handstand_pushup":
    case "front_raise":
    case "lateral_raise":
    case "lateral_machine":
    case "reverse_pec_deck":
    case "rear_delt_bent":
    case "facepull":
    case "upright_row":
      return "shoulders";
    case "shrug":
    case "pullup":
    case "muscle_up":
    case "pulldown_cable":
    case "pulldown_machine":
    case "row_bent":
    case "row_one_arm":
    case "row_cable":
    case "row_machine":
    case "row_tbar":
    case "row_inverted":
    case "back_ext":
      return "back";
    case "biceps_standing":
    case "biceps_preacher":
    case "biceps_incline":
    case "biceps_high_cable":
      return "biceps";
    case "forearm_curl":
      return "forearms";
    case "squat":
    case "squat_hack":
    case "squat_pistol":
    case "leg_press":
    case "leg_extension":
    case "lunge":
    case "step_up":
      return "quads";
    case "deadlift":
    case "leg_curl_prone":
    case "leg_curl_seated":
    case "kettlebell_swing":
      return "hams";
    case "hip_thrust":
    case "glute_kickback":
    case "hip_abduction":
      return "glutes";
    case "calf_standing":
    case "calf_seated":
      return "calves";
    case "core_wheel":
    case "core_hanging":
    case "core_cable_crunch":
    case "core_machine_crunch":
    case "core_plank":
    case "core_floor":
      return "core";
    default:
      return "full";
  }
}

export function drawExerciseFrame(
  ctx: CanvasRenderingContext2D,
  spec: ExerciseAnimSpec,
  timeMs: number,
  options?: { speed?: number; showMuscleGlow?: boolean }
) {
  const speed = options?.speed ?? 1;
  const showGlow = options?.showMuscleGlow ?? true;
  const { p, phase, cyclePct } = repCycle(timeMs, speed);

  const r: RectFn = (x, y, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  };

  const seg: SegFn = (x1, y1, x2, y2, thick, col) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 1.45));
    const t = Math.max(1, Math.round(thick));
    const half = (t - 1) / 2;
    ctx.fillStyle = col;
    for (let i = 0; i <= steps; i++) {
      const px = Math.round(x1 + (dx * i) / steps - half);
      const py = Math.round(y1 + (dy * i) / steps - half);
      ctx.fillRect(px, py, t, t);
    }
  };

  const F = 55; // Floor Y baseline on 80x64 canvas

  // 1. Arcade Gym Backdrop (80x64)
  r(0, 0, ANW, ANH, P_BG);
  ctx.fillStyle = P_GRID;
  for (let gx = 0; gx < ANW; gx += 8) ctx.fillRect(gx, 0, 1, F);
  for (let gy = 0; gy < F; gy += 8) ctx.fillRect(0, gy, ANW, 1);
  // Subtle gym wall dado & neon accent line
  r(0, F - 12, ANW, 12, "#0d1221");
  r(0, F - 12, ANW, 1, "#1a233d");
  // Rubber Gym Floor
  r(0, F, ANW, ANH - F, P_FLOOR);
  r(0, F, ANW, 1, P_FLOOR_RIM);
  for (let fx = 3; fx < ANW; fx += 9) {
    r(fx, F + 3, 2, 1, "#1a2238");
    r(fx + 4, F + 6, 2, 1, "#182034");
  }

  // Muscle target pulse colors
  const target = targetGroupOf(spec.pattern);
  const pulse = showGlow && p > 0.62;
  const CHEST_C = pulse && (target === "chest" || target === "full") ? "#fb7185" : P_SHIRT;
  const BACK_C = pulse && (target === "back" || target === "full") ? "#fb923c" : P_SHIRT;
  const CORE_C = pulse && target === "core" ? "#34d399" : P_SHIRT;
  const DELT_C = pulse && target === "shoulders" ? "#facc15" : P_SKIN;
  const ARM_C =
    pulse && (target === "biceps" || target === "triceps" || target === "forearms")
      ? "#fde047"
      : P_SKIN;
  const LEG_C =
    pulse && (target === "quads" || target === "hams" || target === "glutes")
      ? "#fb7185"
      : P_SHORTS;
  const CALF_C = pulse && target === "calves" ? "#facc15" : P_SKIN;

  /* ---------- Reusable 16-bit Apparatus Helpers ---------- */
  const drawHead = (
    hx: number,
    hy: number,
    facing: "right" | "left" | "front" | "back" | "up",
    passOut: boolean
  ) => {
    const e = passOut ? 2 : 0;
    const x = Math.round(hx - 3 - e / 2);
    const y = Math.round(hy - 3 - e / 2);
    r(x, y, 7 + e, 7 + e, passOut ? P_OUT : P_SKIN);
    if (passOut) return;
    const cx = Math.round(hx - 3);
    const cy = Math.round(hy - 3);
    // Hair & headband
    if (facing === "front") {
      r(cx, cy, 7, 2, P_HAIR);
      r(cx, cy + 2, 7, 1, P_HEADBAND);
      r(cx + 1, cy + 4, 1, 1, P_OUT);
      r(cx + 5, cy + 4, 1, 1, P_OUT);
    } else if (facing === "back") {
      r(cx, cy, 7, 5, P_HAIR);
      r(cx, cy + 2, 7, 1, P_HEADBAND);
    } else if (facing === "up") {
      // Lying on back looking up
      r(cx, cy + 4, 7, 3, P_HAIR);
      r(cx, cy + 3, 7, 1, P_HEADBAND);
      r(cx + 4, cy + 1, 1, 1, P_OUT);
    } else if (facing === "right") {
      r(cx, cy, 7, 2, P_HAIR);
      r(cx, cy + 1, 3, 4, P_HAIR);
      r(cx, cy + 2, 7, 1, P_HEADBAND);
      r(cx + 5, cy + 4, 1, 1, P_OUT);
    } else {
      r(cx, cy, 7, 2, P_HAIR);
      r(cx + 4, cy + 1, 3, 4, P_HAIR);
      r(cx, cy + 2, 7, 1, P_HEADBAND);
      r(cx + 1, cy + 4, 1, 1, P_OUT);
    }
  };

  const drawShoe = (sx: number, sy: number, dir: 1 | -1 | 0, passOut: boolean) => {
    const e = passOut ? 2 : 0;
    const w = dir === 0 ? 4 : 5;
    const x = dir === -1 ? sx - 3 : dir === 1 ? sx - 1 : sx - 2;
    r(x - e / 2, sy - 1 - e / 2, w + e, 3 + e, passOut ? P_OUT : P_SHOE);
    if (!passOut) r(x, sy + 1, w, 1, P_SHOE_TRIM);
  };

  const drawPulley = (cx: number, cy: number) => {
    r(cx - 2, cy - 2, 5, 5, P_OUT);
    r(cx - 1, cy - 1, 3, 3, P_STEEL_DK);
    r(cx, cy, 1, 1, P_CABLE);
  };

  /** Vertical pin-loaded machine weight stack tower with moving top plates + golden pin */
  const drawWeightStack = (
    tx: number,
    topY: number,
    botY: number,
    liftPct: number,
    cableTargetX?: number,
    cableTargetY?: number
  ) => {
    const w = 12;
    const h = botY - topY;
    // Outer frame column
    r(tx - 1, topY - 1, w + 2, h + 2, P_OUT);
    r(tx, topY, 2, h, P_FRAME);
    r(tx + w - 2, topY, 2, h, P_FRAME);
    r(tx, topY, w, 2, P_FRAME_LT);
    r(tx - 1, botY - 2, w + 2, 2, P_FRAME_LT);
    // Twin chrome guide rods
    r(tx + 3, topY + 2, 1, h - 4, P_STEEL_DK);
    r(tx + 8, topY + 2, 1, h - 4, P_STEEL_DK);
    // Fixed bottom rest plates
    for (let k = 0; k < 2; k++) {
      const py = botY - 5 - k * 3;
      r(tx + 2, py, w - 4, 2, P_STACK);
    }
    // Moving upper stack (5 plates + yellow selector pin)
    const maxLift = Math.max(4, Math.min(10, Math.round((h - 24) * 0.45)));
    const liftPx = Math.round(liftPct * maxLift);
    const stackBot = botY - 11 - liftPx;
    for (let k = 0; k < 5; k++) {
      const py = stackBot - k * 3;
      r(tx + 1, py - 1, w - 2, 3, P_OUT);
      r(tx + 2, py, w - 4, 2, P_STACK);
      r(tx + 2, py, w - 4, 1, P_STACK_HI);
    }
    // Bright gold/red weight pin in middle lifted plate
    r(tx + 4, stackBot - 6, 4, 1, P_PIN);
    // Center lifting rod + pulley + cable wire
    const topPlateY = stackBot - 13;
    r(tx + 5, topY + 3, 2, Math.max(2, topPlateY - topY - 2), P_STEEL);
    drawPulley(tx + 6, topY + 2);
    if (cableTargetX !== undefined && cableTargetY !== undefined) {
      seg(tx + 6, topY + 2, cableTargetX, cableTargetY, 1, P_CABLE);
    }
  };

  /** Full Smith Machine / Power Rack twin rails + guided carriage */
  const drawSmithFrame = (xL: number, xR: number, barY: number) => {
    r(xL - 1, 7, 3, F - 7, P_OUT);
    r(xL, 8, 2, F - 8, P_FRAME);
    r(xL + 1, 8, 1, F - 8, P_STEEL_DK);
    r(xR - 1, 7, 3, F - 7, P_OUT);
    r(xR, 8, 2, F - 8, P_FRAME);
    r(xR + 1, 8, 1, F - 8, P_STEEL_DK);
    r(xL - 2, 6, xR - xL + 6, 3, P_OUT);
    r(xL - 1, 7, xR - xL + 4, 2, P_FRAME_LT);
    // Safety stops
    r(xL - 2, F - 18, 4, 2, P_PIN);
    r(xR, F - 18, 4, 2, P_PIN);
    // Horizontal Smith bar + plates
    r(xL - 4, barY - 1, xR - xL + 10, 3, P_OUT);
    r(xL - 3, barY, xR - xL + 8, 1, P_STEEL);
    // Plates on outer sleeves
    for (const px of [xL - 5, xR + 4]) {
      r(px, barY - 5, 4, 11, P_OUT);
      r(px + 1, barY - 4, 2, 9, P_PLATE);
      r(px + 1, barY - 4, 1, 4, P_PLATE_HI);
    }
  };

  /** Side-profile Smith Machine frame: rear structural post + vertical chrome guide rail + linear carriage */
  const drawSmithSide = (railX: number, barY: number) => {
    const postX = railX - 8;
    // Heavy rear upright post & top/bottom frame
    r(postX - 1, 6, 4, F - 6, P_OUT);
    r(postX, 7, 2, F - 7, P_FRAME);
    r(postX - 1, 6, 13, 3, P_OUT);
    r(postX, 7, 11, 2, P_FRAME_LT);
    r(postX - 2, F - 3, 16, 3, P_FRAME_LT);
    // Vertical chrome guide rail
    r(railX - 1, 8, 3, F - 10, P_OUT);
    r(railX, 8, 1, F - 10, P_STEEL);
    // Yellow safety catch hooks along column
    for (const sy of [18, 27, 36, 44]) {
      r(postX + 2, sy, 2, 1, P_PIN);
    }
    // Sliding linear bearing carriage
    r(railX - 3, barY - 2, 7, 5, P_OUT);
    r(railX - 2, barY - 1, 5, 3, P_STEEL_DK);
  };

  const drawSidePlate = (bx: number, by: number, large = true) => {
    const rad = large ? 5 : 4;
    r(bx - rad, by - rad, rad * 2 + 1, rad * 2 + 1, P_OUT);
    r(bx - rad + 1, by - rad + 1, rad * 2 - 1, rad * 2 - 1, P_PLATE);
    r(bx - rad + 1, by - rad + 1, rad * 2 - 2, 2, P_PLATE_HI);
    r(bx - 1, by - 1, 3, 3, P_OUT);
    r(bx, by, 1, 1, P_STEEL);
  };

  const drawFrontBarbell = (cx: number, cy: number, halfW = 18, ez = false) => {
    if (ez) {
      seg(cx - halfW, cy, cx - 7, cy, 2, P_STEEL);
      seg(cx - 7, cy, cx - 3, cy - 2, 2, P_STEEL);
      seg(cx - 3, cy - 2, cx + 3, cy - 2, 2, P_STEEL);
      seg(cx + 3, cy - 2, cx + 7, cy, 2, P_STEEL);
      seg(cx + 7, cy, cx + halfW, cy, 2, P_STEEL);
    } else {
      r(cx - halfW - 1, cy - 1, halfW * 2 + 3, 3, P_OUT);
      r(cx - halfW, cy, halfW * 2 + 1, 1, P_STEEL);
    }
    for (const s of [-1, 1]) {
      const px = cx + s * (halfW - 3);
      r(px - 2, cy - 5, 4, 11, P_OUT);
      r(px - 1, cy - 4, 2, 9, P_PLATE);
      r(px - 1, cy - 4, 1, 4, P_PLATE_HI);
    }
  };

  const drawDumbbell = (dx: number, dy: number, vertical = false) => {
    if (vertical) {
      r(dx - 2, dy - 4, 5, 9, P_OUT);
      r(dx - 1, dy - 3, 3, 2, P_STEEL_DK);
      r(dx - 1, dy - 3, 3, 1, P_STEEL);
      r(dx - 1, dy + 2, 3, 2, P_STEEL_DK);
      r(dx - 1, dy + 2, 3, 1, P_STEEL);
      r(dx, dy - 1, 1, 3, P_STEEL);
    } else {
      r(dx - 4, dy - 2, 9, 5, P_OUT);
      r(dx - 3, dy - 1, 2, 3, P_STEEL_DK);
      r(dx - 3, dy - 1, 2, 1, P_STEEL);
      r(dx + 2, dy - 1, 2, 3, P_STEEL_DK);
      r(dx + 2, dy - 1, 2, 1, P_STEEL);
      r(dx - 1, dy, 3, 1, P_STEEL);
    }
  };

  const drawKettlebell = (kx: number, ky: number) => {
    r(kx - 2, ky - 4, 5, 3, P_OUT);
    r(kx - 1, ky - 3, 3, 2, P_STEEL_DK);
    r(kx - 3, ky - 1, 7, 6, P_OUT);
    r(kx - 2, ky, 5, 4, P_FRAME_LT);
    r(kx - 2, ky, 4, 1, P_STEEL);
  };

  const drawSpark = (sx: number, sy: number, col = P_PIN) => {
    if (!pulse) return;
    r(sx - 2, sy, 1, 1, col);
    r(sx + 2, sy, 1, 1, col);
    r(sx, sy - 2, 1, 1, col);
    r(sx, sy + 2, 1, 1, col);
  };

  const drawArrow = (x: number, y: number, dir: "up" | "down" | "left" | "right", col: string) => {
    ctx.fillStyle = col;
    if (dir === "up") {
      ctx.fillRect(x, y, 2, 1);
      ctx.fillRect(x - 1, y + 1, 4, 1);
      ctx.fillRect(x - 2, y + 2, 6, 1);
    } else if (dir === "down") {
      ctx.fillRect(x - 2, y, 6, 1);
      ctx.fillRect(x - 1, y + 1, 4, 1);
      ctx.fillRect(x, y + 2, 2, 1);
    } else if (dir === "left") {
      ctx.fillRect(x, y, 1, 2);
      ctx.fillRect(x + 1, y - 1, 1, 4);
      ctx.fillRect(x + 2, y - 2, 1, 6);
    } else {
      ctx.fillRect(x, y - 2, 1, 6);
      ctx.fillRect(x + 1, y - 1, 1, 4);
      ctx.fillRect(x + 2, y, 1, 2);
    }
  };

  /* ============================================================================
   * 58 Biomechanically Distinct Animations + Dedicated Machines/Apparatus
   * ============================================================================ */
  switch (spec.pattern) {
    /* 1. CHEST PRESS MACHINE (Seated upright pushing lever arm forward, moving rear weight stack) */
    case "chest_press_machine": {
      const pushX = 39 + p * 11;
      // Rear machine tower & weight stack
      drawWeightStack(10, 12, F, p, 24, 16);
      r(21, 15, 3, F - 15, P_FRAME);
      r(18, F - 3, 28, 3, P_FRAME_LT);
      // Machine seat & backrest
      r(25, 38, 12, 3, P_PAD);
      r(29, 41, 3, F - 41, P_FRAME);
      r(23, 21, 3, 18, P_PAD_HI);
      // Lever arm pivoted from top frame down to handles
      seg(23, 14, pushX + 1, 29, 3, P_STEEL_DK);
      r(pushX, 27, 3, 6, P_PLATE);

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        // Back & hip
        seg(29, 25, 30, 36, 6 + e, o ? P_OUT : CHEST_C);
        seg(30, 36, 40, 38, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(40, 38, 41, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(41, F - 2, 1, o);
        drawHead(30, 18, "right", o);
        const shX = 31, shY = 26;
        const elX = shX - 2 + p * 7, elY = 30 - p * 1;
        seg(shX, shY, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, pushX, 30, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(54, 24);
      drawArrow(55, 29, phase === "EXC" ? "left" : "right", phase === "CON" ? P_PIN : "#3df2ff");
      break;
    }

    /* 2. PEC DECK / CONTRACTOR MACHINE (Front view seated inside twin curved machine pads + overhead stack) */
    case "pec_deck": {
      const open = 1 - p;
      const hxOff = 4 + open * 15;
      // Overhead twin-column machine frame behind seated athlete connected to stack
      drawWeightStack(63, 12, F, p, 40, 12);
      r(28, 10, 41, 3, P_FRAME_LT);
      r(38, F - 3, 30, 3, P_FRAME_LT);
      r(38, 13, 4, 30, P_FRAME);
      r(33, 43, 14, 3, P_PAD);
      r(38, 46, 4, F - 46, P_FRAME);
      // Machine swinging overhead boom arms
      for (const s of [-1, 1]) {
        const armTopX = 40 + s * (7 + open * 13);
        const hx = 40 + s * hxOff;
        seg(armTopX, 12, hx, 25, 2.5, P_STEEL_DK);
      }
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, 16, "front", o);
        r(34 - e / 2, 21 - e / 2, 12 + e, 16 + e, o ? P_OUT : CHEST_C);
        r(35 - e / 2, 37 - e / 2, 10 + e, 8 + e, o ? P_OUT : P_SHORTS);
        r(35 - e / 2, 45 - e / 2, 3 + e, 9 + e, o ? P_OUT : P_SKIN);
        r(42 - e / 2, 45 - e / 2, 3 + e, 9 + e, o ? P_OUT : P_SKIN);
        drawShoe(36, F - 2, 0, o);
        drawShoe(44, F - 2, 0, o);
        for (const s of [-1, 1]) {
          const shX = 40 + s * 6, shY = 23;
          const elX = 40 + s * (6 + open * 12), elY = 27 + open * 2;
          const hx = 40 + s * hxOff, hy = 27;
          seg(shX, shY, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
          seg(elX, elY, hx, hy, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }
      // Vertical Pec-Deck pads + grips in front of forearms
      for (const s of [-1, 1]) {
        const hx = 40 + s * hxOff;
        r(hx - 2, 23, 4, 9, P_OUT);
        r(hx - 1, 24, 2, 7, P_PAD_HI);
        r(hx - 1, 26, 2, 3, P_PLATE);
      }
      drawSpark(40, 24);
      break;
    }

    /* 3. CABLE CROSSOVER (Standing front-view between twin cable towers + glowing yellow cables) */
    case "cable_crossover": {
      const low = spec.subVariant === "low";
      const high = spec.subVariant === "high";
      // Twin weight towers at left & right edges
      drawWeightStack(4, 10, F, p);
      drawWeightStack(64, 10, F, p);
      r(4, 9, 72, 2, P_FRAME_LT);
      const pulY = low ? 48 : high ? 13 : 28;
      drawPulley(16, pulY);
      drawPulley(63, pulY);

      const spread = 1 - p;
      const hxOff = 2 + spread * 14;
      const hy = low ? 34 - p * 8 : high ? 24 + p * 12 : 28 + p * 4;

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, 15, "front", o);
        r(34 - e / 2, 20 - e / 2, 12 + e, 15 + e, o ? P_OUT : CHEST_C);
        r(35 - e / 2, 35 - e / 2, 10 + e, 8 + e, o ? P_OUT : P_SHORTS);
        seg(37, 43, 35, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        seg(43, 43, 45, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(35, F - 2, 0, o);
        drawShoe(45, F - 2, 0, o);
        for (const s of [-1, 1]) {
          const shX = 40 + s * 6, shY = 22;
          const elX = 40 + s * (6 + spread * 11), elY = 25 + (low ? 4 : -1);
          seg(shX, shY, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
          seg(elX, elY, 40 + s * hxOff, hy, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }
      // Glowing cables & D-handles in front of arms
      seg(16, pulY, 40 - hxOff, hy, 1, P_CABLE);
      seg(63, pulY, 40 + hxOff, hy, 1, P_CABLE);
      r(40 - hxOff - 1, hy - 1, 3, 3, P_PIN);
      r(40 + hxOff - 1, hy - 1, 3, 3, P_PIN);
      drawSpark(40, hy - 2);
      break;
    }

    /* 4. BENCH PRESS (Flat / Incline / Decline / Floor + Barbell, Dumbbell, or Side Smith Cage!) */
    case "bench_press": {
      const v = spec.subVariant ?? "flat";
      const isSmith = spec.equip === "smith";
      const isDb = spec.equip === "dumbbell";
      const isBand = spec.equip === "band";
      const floor = v === "floor";
      const bx = v === "incline" ? 31 : 29;
      const pressY = v === "incline" ? 28 - p * 14 : floor ? 43 - p * 13 : 31 - p * 15;

      // Apparatus behind athlete
      if (isSmith) {
        drawSmithSide(bx, pressY);
      } else if (!floor) {
        // Bench Rack uprights if barbell
        if (!isDb && !isBand) {
          r(21, 20, 2, F - 20, P_FRAME);
          r(19, 22, 4, 2, P_FRAME_LT);
        }
      }

      if (!floor) {
        if (v === "incline") {
          r(24, 44, 3, F - 44, P_FRAME);
          r(46, 44, 3, F - 44, P_FRAME);
          seg(21, 42, 38, 32, 4, P_PAD_HI);
          r(38, 42, 13, 3, P_PAD);
        } else if (v === "decline") {
          r(24, 44, 3, F - 44, P_FRAME);
          r(48, 40, 3, F - 40, P_FRAME);
          seg(20, 44, 49, 39, 4, P_PAD_HI);
        } else {
          r(22, 43, 3, F - 43, P_FRAME);
          r(48, 43, 3, F - 43, P_FRAME);
          r(18, 40, 35, 3, P_PAD_HI);
        }
      } else {
        r(14, F - 2, 44, 2, P_PAD);
      }

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        if (v === "incline") {
          seg(27, 35, 39, 42, 6 + e, o ? P_OUT : CHEST_C);
          seg(39, 42, 51, 42, 4.5 + e, o ? P_OUT : P_SHORTS);
          seg(51, 42, 54, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
          drawShoe(54, F - 2, 1, o);
          drawHead(23, 27, "right", o);
          const shX = 30, shY = 34;
          const elX = shX - 2 + p * 3, elY = shY + 4 - p * 9;
          seg(shX, shY, elX, elY, 3 + e, o ? P_OUT : ARM_C);
          seg(elX, elY, 31, pressY, 2.8 + e, o ? P_OUT : P_SKIN);
        } else {
          const baseY = floor ? F - 4 : v === "decline" ? 40 : 37;
          drawHead(18, baseY - 1, "up", o);
          seg(23, baseY, 39, baseY + (v === "decline" ? -2 : 0), 6 + e, o ? P_OUT : CHEST_C);
          seg(39, baseY + (v === "decline" ? -2 : 0), 50, baseY + (v === "decline" ? -3 : 1), 4.5 + e, o ? P_OUT : P_SHORTS);
          seg(50, baseY, 54, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
          drawShoe(54, F - 2, 1, o);
          const shX = 28, shY = baseY - 2;
          const elX = 27 + p * 2, elY = shY + (floor ? 1 : v === "decline" ? 0 : 3) - p * 9;
          seg(shX, shY, elX, elY, 3 + e, o ? P_OUT : ARM_C);
          seg(elX, elY, 29, pressY, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }

      if (isBand) {
        seg(20, 41, bx, pressY, 1.5, P_BAND);
        seg(38, 41, bx, pressY, 1.5, P_BAND);
      } else if (isDb) {
        drawDumbbell(bx, pressY, false);
      } else {
        drawSidePlate(bx, pressY, true);
      }
      drawSpark(bx, pressY - 7);
      drawArrow(11, 20, phase === "EXC" ? "down" : "up", phase === "CON" ? P_PIN : "#3df2ff");
      break;
    }

    /* 5. DUMBBELL / CABLE FLY */
    case "db_fly": {
      const open = 1 - p;
      const hxOff = 4 + open * 15;
      r(30, 42, 20, 4, P_PAD);
      r(38, 46, 4, F - 46, P_FRAME);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, 16, "front", o);
        r(34 - e / 2, 21 - e / 2, 12 + e, 14 + e, o ? P_OUT : CHEST_C);
        r(35 - e / 2, 35 - e / 2, 10 + e, 8 + e, o ? P_OUT : P_SHORTS);
        r(34 - e / 2, 43 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        r(43 - e / 2, 43 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        drawShoe(35, F - 2, 0, o);
        drawShoe(45, F - 2, 0, o);
        for (const s of [-1, 1]) {
          const shX = 40 + s * 6, shY = 23;
          const elX = 40 + s * (6 + open * 12), elY = 26 + open * 4;
          const hx = 40 + s * hxOff, hy = 22 + open * 3;
          seg(shX, shY, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
          seg(elX, elY, hx, hy, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }
      for (const s of [-1, 1]) {
        drawDumbbell(40 + s * hxOff, 22 + open * 3, true);
      }
      drawSpark(40, 17);
      break;
    }

    /* 6. PULLOVER (Upper back across bench, sweeping plate/dumbbell arc behind head to chest) */
    case "pullover": {
      r(31, 41, 14, 3, P_PAD_HI);
      r(36, 44, 4, F - 44, P_FRAME);
      // Angle sweeps from behind head up over chest, with slight elbow bend clearing forehead
      const ang = -2.25 + p * 1.35;
      const hx = 34 + Math.cos(ang) * 18;
      const hy = 35 + Math.sin(ang) * 18;
      const elX = (34 + hx) / 2 + (1 - p) * 2;
      const elY = (35 + hy) / 2 - 4;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(25, 37, "up", o);
        seg(32, 38, 46, 41, 6 + e, o ? P_OUT : CHEST_C);
        seg(46, 41, 56, 42, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(56, 42, 57, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(57, F - 2, 1, o);
        seg(34, 36, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, hx, hy, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawDumbbell(hx, hy, true);
      drawSpark(hx, hy - 5);
      break;
    }

    /* 7. LANDMINE PRESS (Pivoted barbell sleeve on floor plate pushed diagonally overhead) */
    case "landmine_press": {
      r(14, F - 3, 7, 3, P_FRAME_LT); // floor anchor pivot
      const hx = 45 - p * 5;
      const hy = 30 - p * 15;
      // Angled barbell shaft from floor pivot (17, F-2) through hand
      seg(17, F - 2, hx - 4, hy + 4, 2, P_STEEL);
      drawSidePlate(hx - 2, hy + 2, false);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(48, F - 2, -1, o);
        drawShoe(56, F - 2, -1, o);
        seg(49, F - 2, 52, 42, 3.2 + e, o ? P_OUT : P_SKIN);
        seg(55, F - 2, 53, 42, 3.2 + e, o ? P_OUT : P_SKIN);
        seg(52, 42, 50, 26, 5.5 + e, o ? P_OUT : CHEST_C);
        drawHead(49, 19, "left", o);
        const elX = 52 - p * 4, elY = 34 - p * 7;
        seg(50, 27, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, hx, hy, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(hx, hy - 6);
      break;
    }

    /* 8. SVEND PRESS (Side view crushing red plate between palms and extending straight ahead!) */
    case "svend_press": {
      const hx = 42 + p * 11;
      const py = 26;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(37, F - 2, 1, o);
        seg(38, F - 2, 38, 43, 3.4 + e, o ? P_OUT : P_SKIN);
        seg(38, 43, 38, 36, 4.5 + e, o ? P_OUT : P_SHORTS);
        r(35 - e / 2, 21 - e / 2, 6 + e, 16 + e, o ? P_OUT : CHEST_C);
        drawHead(38, 16, "right", o);
        const elX = 39 + p * 5, elY = 29 - p * 3;
        seg(38, 25, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, hx, py, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      // Crushed vertical iron plate
      r(hx - 1, py - 5, 4, 11, P_OUT);
      r(hx, py - 4, 2, 9, P_PLATE);
      r(hx, py - 4, 1, 4, P_PLATE_HI);
      drawSpark(hx + 3, py - 6);
      drawArrow(59, 25, phase === "EXC" ? "left" : "right", phase === "CON" ? P_PIN : "#3df2ff");
      break;
    }

    /* 9. PUSHUP (Flat / Incline / Decline / Diamond / Clap) */
    case "pushup": {
      const v = spec.subVariant ?? "flat";
      const clap = v === "clap";
      const inc = v === "incline";
      const dec = v === "decline";
      if (inc) {
        r(50, F - 12, 16, 12, P_FRAME);
        r(50, F - 12, 16, 2, P_PAD_HI);
      } else if (dec) {
        r(10, F - 12, 16, 12, P_FRAME);
        r(10, F - 12, 16, 2, P_PAD_HI);
      } else {
        r(12, F - 2, 56, 2, P_PAD);
      }
      const handY = inc ? F - 13 : F - 2;
      const footY = dec ? F - 13 : F - 2;
      const clapLift = clap && p > 0.72 ? (p - 0.72) * 18 : 0;
      const drop = (1 - p) * 10;
      const shY = handY - 16 + drop - clapLift;
      const hipY = (footY + shY) / 2 - 1;

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(16, footY, 1, o);
        seg(17, footY - 1, 35, hipY, 4 + e, o ? P_OUT : P_SHORTS);
        seg(35, hipY, 54, shY, 6 + e, o ? P_OUT : CHEST_C);
        drawHead(57, shY - 5, "right", o);
        const hPos = clap && p > 0.75 ? shY + 9 : handY;
        const elX = 53 - (1 - p) * 7;
        const elY = (shY + hPos) / 2;
        seg(54, shY + 1, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, 54, hPos, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      if (clap && p > 0.75) drawSpark(54, handY - 4);
      drawArrow(68, 28, phase === "EXC" ? "down" : "up", phase === "CON" ? P_PIN : "#3df2ff");
      break;
    }

    /* 10. PARALLEL / RING DIPS */
    case "dips_parallel": {
      const rings = spec.equip === "rings";
      const dipDrop = (1 - p) * 10;
      if (rings) {
        r(14, 4, 52, 2, P_FRAME_LT);
        r(30, 6, 2, 24, P_PAD_HI);
        r(48, 6, 2, 24, P_PAD_HI);
        r(29, 30, 4, 4, P_RING);
        r(47, 30, 4, 4, P_RING);
      } else {
        r(28, 30, 3, F - 30, P_FRAME);
        r(49, 30, 3, F - 30, P_FRAME);
        r(26, 29, 9, 3, P_STEEL_DK);
        r(45, 29, 9, 3, P_STEEL_DK);
      }

      const shY = 18 + dipDrop;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, shY - 6, "front", o);
        r(34 - e / 2, shY - e / 2, 12 + e, 14 + e, o ? P_OUT : CHEST_C);
        r(35 - e / 2, shY + 14 - e / 2, 10 + e, 7 + e, o ? P_OUT : P_SHORTS);
        seg(37, shY + 21, 37, shY + 30, 3 + e, o ? P_OUT : P_SKIN);
        seg(43, shY + 21, 43, shY + 30, 3 + e, o ? P_OUT : P_SKIN);
        for (const s of [-1, 1]) {
          const elX = 40 + s * (7.5 + (1 - p) * 3.5);
          const elY = (shY + 2 + 30) / 2 - (1 - p) * 4;
          seg(40 + s * 6, shY + 2, elX, elY, 3 + e, o ? P_OUT : ARM_C);
          seg(elX, elY, 40 + s * 9, 30, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }
      drawSpark(40, 12);
      break;
    }

    /* 11. BENCH DIPS (Hands on bench edge, lowering hips toward floor) */
    case "dips_bench": {
      r(14, 36, 18, 4, P_PAD_HI);
      r(16, 40, 3, F - 40, P_FRAME);
      r(28, 40, 3, F - 40, P_FRAME);
      const drop = (1 - p) * 9;
      const shY = 25 + drop;
      const hipY = 36 + drop;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(36, shY - 6, "right", o);
        seg(35, shY, 37, hipY, 6 + e, o ? P_OUT : P_SHIRT);
        seg(37, hipY, 54, F - 3, 4.2 + e, o ? P_OUT : P_SHORTS);
        drawShoe(56, F - 2, 1, o);
        const elX = 28 - (1 - p) * 3, elY = 31 + (1 - p) * 1;
        seg(34, shY + 1, elX, elY, 3 + e, o ? P_OUT : ARM_C);
        seg(elX, elY, 31, 36, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(27, 25);
      break;
    }

    /* 12. TRICEPS DIP MACHINE (Seated machine with twin pressing levers & weight stack) */
    case "dips_machine": {
      drawWeightStack(10, 12, F, p, 24, 24);
      r(25, 38, 12, 3, P_PAD);
      r(29, 41, 3, F - 41, P_FRAME);
      r(23, 21, 3, 18, P_PAD_HI);
      const handY = 27 + p * 11;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        seg(29, 24, 30, 36, 6 + e, o ? P_OUT : P_SHIRT);
        seg(30, 36, 40, 38, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(40, 38, 41, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(41, F - 2, 1, o);
        drawHead(30, 17, "right", o);
        const elX = 27, elY = 26 - (1 - p) * 4;
        seg(30, 25, elX, elY, 3 + e, o ? P_OUT : ARM_C);
        seg(elX, elY, 35, handY, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      seg(24, 27, 36, handY, 2.5, P_STEEL_DK);
      r(34, handY - 1, 4, 3, P_PLATE);
      drawSpark(36, 39);
      break;
    }

    /* 13. OVERHEAD PRESS / MILITARY / SMITH / KB / DUMBBELL */
    case "ohp_bar": {
      const barY = 22 - p * 14;
      if (spec.equip === "smith") drawSmithFrame(24, 56, barY);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, 15, "front", o);
        r(34 - e / 2, 20 - e / 2, 12 + e, 16 + e, o ? P_OUT : P_SHIRT);
        r(35 - e / 2, 36 - e / 2, 10 + e, 8 + e, o ? P_OUT : P_SHORTS);
        r(35 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        r(42 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        drawShoe(36, F - 2, 0, o);
        drawShoe(44, F - 2, 0, o);
        for (const s of [-1, 1]) {
          const shX = 40 + s * 6, shY = 22;
          const elX = 40 + s * (9 - p * 1), elY = 26 - p * 10;
          const hx = 40 + s * 8, hy = barY;
          seg(shX, shY, elX, elY, 3 + e, o ? P_OUT : DELT_C);
          seg(elX, elY, hx, hy, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }
      if (spec.equip === "dumbbell") {
        drawDumbbell(31, barY, false);
        drawDumbbell(49, barY, false);
      } else if (spec.equip === "kettlebell") {
        drawKettlebell(31, barY);
        drawKettlebell(49, barY);
      } else if (spec.equip !== "smith") {
        drawFrontBarbell(40, barY, 17);
      }
      drawSpark(40, 6);
      drawArrow(7, 15, phase === "EXC" ? "down" : "up", phase === "CON" ? P_PIN : "#3df2ff");
      break;
    }

    /* 14. MACHINE SHOULDER PRESS (Seated overhead lever arm + weight tower) */
    case "ohp_machine": {
      drawWeightStack(11, 12, F, p, 29, 14);
      r(26, 39, 13, 3, P_PAD);
      r(30, 42, 3, F - 42, P_FRAME);
      r(24, 22, 3, 18, P_PAD_HI);
      const hy = 22 - p * 13;
      seg(26, 14, 41, hy, 3, P_STEEL_DK);
      r(39, hy - 1, 5, 3, P_PLATE);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        seg(30, 25, 31, 37, 6 + e, o ? P_OUT : P_SHIRT);
        seg(31, 37, 41, 39, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(41, 39, 42, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(42, F - 2, 1, o);
        drawHead(31, 18, "right", o);
        const elX = 36, elY = 28 - p * 10;
        seg(31, 25, elX, elY, 3 + e, o ? P_OUT : DELT_C);
        seg(elX, elY, 40, hy, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(41, 8);
      break;
    }

    /* 15. ARNOLD PRESS (Seated, rotating dumbbells from front chest out & up overhead) */
    case "ohp_arnold": {
      r(33, 42, 14, 3, P_PAD);
      r(38, 45, 4, F - 45, P_FRAME);
      const wide = 3 + p * 6;
      const hy = 23 - p * 15;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, 15, "front", o);
        r(34 - e / 2, 20 - e / 2, 12 + e, 16 + e, o ? P_OUT : P_SHIRT);
        r(35 - e / 2, 36 - e / 2, 10 + e, 7 + e, o ? P_OUT : P_SHORTS);
        r(34 - e / 2, 43 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        r(43 - e / 2, 43 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        drawShoe(35, F - 2, 0, o);
        drawShoe(45, F - 2, 0, o);
        for (const s of [-1, 1]) {
          const shX = 40 + s * 6, shY = 22;
          const elX = 40 + s * (4 + p * 6), elY = 27 - p * 11;
          seg(shX, shY, elX, elY, 3 + e, o ? P_OUT : DELT_C);
          seg(elX, elY, 40 + s * wide, hy, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }
      drawDumbbell(40 - wide, hy, p < 0.35);
      drawDumbbell(40 + wide, hy, p < 0.35);
      drawSpark(40, 6);
      break;
    }

    /* 16. HANDSTAND PUSHUP (Inverted athlete against gym wall pressing vertical onto cushioned mat) */
    case "handstand_pushup": {
      r(14, 8, 4, F - 8, P_FRAME); // wall column
      r(22, F - 2, 18, 2, P_PAD); // head/hand mat
      const drop = (1 - p) * 7;
      const shY = 38 + drop;
      const hipY = 22 + drop;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(28, 9 + drop, -1, o);
        seg(27, 10 + drop, 28, hipY - 4, 4 + e, o ? P_OUT : P_SKIN);
        seg(28, hipY - 4, 28, hipY + 2, 4.8 + e, o ? P_OUT : P_SHORTS);
        seg(28, hipY + 2, 29, shY, 6 + e, o ? P_OUT : P_SHIRT);
        drawHead(31, shY + 4, "right", o);
        const elX = 33 + (1 - p) * 5, elY = (shY + F - 2) / 2;
        seg(29, shY, elX, elY, 3 + e, o ? P_OUT : DELT_C);
        seg(elX, elY, 30, F - 3, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(30, 31);
      break;
    }

    /* 17. FRONT RAISE (Side view raising barbell/dumbbell/cable/plate forward to eye level) */
    case "front_raise": {
      const ang = 1.45 - p * 1.45; // down (83°) -> horizontal straight front (0°)
      const hx = 37 + Math.cos(ang) * 16;
      const hy = 25 + Math.sin(ang) * 16;
      if (spec.equip === "cable") {
        drawWeightStack(10, 12, F, p);
        drawPulley(21, F - 5);
        seg(21, F - 5, hx, hy, 1, P_CABLE);
      }
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(37, 17, "right", o);
        r(34 - e / 2, 22 - e / 2, 6 + e, 16 + e, o ? P_OUT : P_SHIRT);
        r(34 - e / 2, 38 - e / 2, 5 + e, 7 + e, o ? P_OUT : P_SHORTS);
        seg(36, 45, 36, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(37, F - 2, 1, o);
        seg(37, 25, hx, hy, 3 + e, o ? P_OUT : DELT_C);
      }
      if (spec.equip === "plate") drawSidePlate(hx, hy, true);
      else drawDumbbell(hx, hy, true);
      drawSpark(hx + 4, hy - 3);
      break;
    }

    /* 18. LATERAL RAISE (Standing T-raise w/ dumbbells or bands; unilateral standing beside tower w/ cable) */
    case "lateral_raise": {
      const ang = 1.35 - p * 1.3;
      if (spec.equip === "cable") {
        drawWeightStack(6, 12, F, p);
        drawPulley(17, F - 5);
        const cx = 44;
        const rx = cx + 7 + Math.cos(ang) * 14;
        const ry = 22 + Math.sin(ang) * 14;
        // Cable routed behind legs/hips so it doesn't slice across the blue torso
        seg(17, F - 5, rx, ry, 1.2, P_CABLE);
        for (let pass = 0; pass < 2; pass++) {
          const o = pass === 0;
          const e = o ? 2 : 0;
          drawHead(cx, 15, "front", o);
          r(cx - 6 - e / 2, 20 - e / 2, 12 + e, 16 + e, o ? P_OUT : P_SHIRT);
          r(cx - 5 - e / 2, 36 - e / 2, 10 + e, 8 + e, o ? P_OUT : P_SHORTS);
          r(cx - 5 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
          r(cx + 2 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
          drawShoe(cx - 4, F - 2, 0, o);
          drawShoe(cx + 4, F - 2, 0, o);
          // Left hand braces tower post; right arm sweeps wide!
          seg(cx - 6, 22, 22, 27, 2.8 + e, o ? P_OUT : P_SKIN);
          seg(cx + 6, 22, rx, ry, 3 + e, o ? P_OUT : DELT_C);
        }
        r(rx - 1, ry - 1, 3, 3, P_PIN);
        drawSpark(cx + 6, 18);
      } else {
        for (let pass = 0; pass < 2; pass++) {
          const o = pass === 0;
          const e = o ? 2 : 0;
          drawHead(40, 15, "front", o);
          r(34 - e / 2, 20 - e / 2, 12 + e, 16 + e, o ? P_OUT : P_SHIRT);
          r(35 - e / 2, 36 - e / 2, 10 + e, 8 + e, o ? P_OUT : P_SHORTS);
          r(35 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
          r(42 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
          drawShoe(36, F - 2, 0, o);
          drawShoe(44, F - 2, 0, o);
          for (const s of [-1, 1]) {
            const hx = 40 + s * (7 + Math.cos(ang) * 14);
            const hy = 22 + Math.sin(ang) * 14;
            seg(40 + s * 6, 22, hx, hy, 3 + e, o ? P_OUT : DELT_C);
          }
        }
        for (const s of [-1, 1]) {
          const hx = 40 + s * (7 + Math.cos(ang) * 14);
          const hy = 22 + Math.sin(ang) * 14;
          if (spec.equip === "band") seg(40 + s * 3, F - 2, hx, hy, 1, P_BAND);
          else drawDumbbell(hx, hy, true);
        }
        drawSpark(40, 17);
      }
      break;
    }

    /* 19. LATERAL RAISE MACHINE (Seated inside articulated shoulder pad wings + linked weight tower) */
    case "lateral_machine": {
      drawWeightStack(62, 14, F, p);
      r(38, 11, 29, 2, P_FRAME_LT);
      drawPulley(68, 14);
      seg(40, 12, 68, 14, 1, P_CABLE);
      r(38, 12, 4, 30, P_FRAME);
      r(33, 42, 14, 3, P_PAD);
      r(38, 45, 4, F - 45, P_FRAME);
      const ang = 1.3 - p * 1.25;
      // Hinged pads at shoulders
      for (const s of [-1, 1]) {
        const elbowX = 40 + s * (7 + Math.cos(ang) * 12);
        const elbowY = 23 + Math.sin(ang) * 12;
        seg(40 + s * 6, 22, elbowX, elbowY, 2.5, P_STEEL);
        r(elbowX - 2, elbowY - 2, 5, 5, P_PAD_HI);
      }
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, 15, "front", o);
        r(34 - e / 2, 20 - e / 2, 12 + e, 15 + e, o ? P_OUT : P_SHIRT);
        r(35 - e / 2, 35 - e / 2, 10 + e, 8 + e, o ? P_OUT : P_SHORTS);
        r(35 - e / 2, 43 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        r(42 - e / 2, 43 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        drawShoe(36, F - 2, 0, o);
        drawShoe(44, F - 2, 0, o);
        for (const s of [-1, 1]) {
          const elX = 40 + s * (7 + Math.cos(ang) * 12);
          const elY = 23 + Math.sin(ang) * 12;
          seg(40 + s * 6, 22, elX, elY, 3 + e, o ? P_OUT : DELT_C);
          seg(elX, elY, elX - s * 4, elY + 3, 2.6 + e, o ? P_OUT : P_SKIN);
        }
      }
      drawSpark(40, 16);
      break;
    }

    /* 20. REVERSE PEC DECK (Seated facing the machine chest pad, sweeping arms back!) */
    case "reverse_pec_deck": {
      drawWeightStack(10, 12, F, p, 31, 14);
      r(28, 12, 3, F - 12, P_FRAME);
      r(30, 21, 3, 14, P_PAD_HI); // chest pad in front of torso
      r(33, 39, 12, 3, P_PAD);
      r(37, 42, 3, F - 42, P_FRAME);
      // p=0: reaching forward toward pivot tower (hx=25); p=1: sweeping wide backward (hx=44)!
      const hx = 25 + p * 19;
      seg(29, 13, hx, 25, 2.5, P_STEEL_DK); // overhead swinging machine arm behind athlete's head
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(36, 17, "left", o);
        seg(37, 24, 38, 37, 6 + e, o ? P_OUT : P_SHIRT);
        seg(38, 37, 29, 39, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(29, 39, 28, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(27, F - 2, -1, o);
        seg(37, 25, hx, 25, 3 + e, o ? P_OUT : DELT_C);
      }
      r(hx - 1, 22, 3, 6, P_PLATE);
      drawSpark(hx + 2, 23);
      break;
    }

    /* 21. REAR DELT BENT-OVER FLY / BAND PULL-APART */
    case "rear_delt_bent": {
      const elX = 43 - p * 3, elY = 35 - p * 8;
      const hx = 43 - p * 6, hy = 42 - p * 12;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(30, F - 2, 1, o);
        seg(31, F - 2, 33, 44, 3.5 + e, o ? P_OUT : P_SKIN);
        seg(33, 44, 29, 36, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(29, 36, 45, 29, 6 + e, o ? P_OUT : P_SHIRT);
        drawHead(49, 27, "right", o);
        seg(43, 30, elX, elY, 3 + e, o ? P_OUT : DELT_C);
        seg(elX, elY, hx, hy, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      if (spec.equip === "band") seg(43, 30, hx, hy, 1.5, P_BAND);
      else drawDumbbell(hx, hy, true);
      drawSpark(39, 24);
      break;
    }

    /* 22. FACE PULL (Standing facing cable tower pulling yellow rope toward forehead) */
    case "facepull": {
      drawWeightStack(10, 12, F, p);
      drawPulley(21, 18);
      const hx = 34 + p * 12;
      const hy = 22 - p * 2;
      seg(21, 18, hx, hy, 1.3, P_CABLE);
      r(hx - 1, hy - 2, 3, 5, P_PAD_HI);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(46, F - 2, -1, o);
        drawShoe(53, F - 2, -1, o);
        seg(47, F - 2, 50, 41, 3.2 + e, o ? P_OUT : P_SKIN);
        seg(53, F - 2, 50, 41, 3.2 + e, o ? P_OUT : P_SKIN);
        seg(50, 41, 50, 25, 6 + e, o ? P_OUT : P_SHIRT);
        drawHead(49, 18, "left", o);
        const elX = 41 + p * 12, elY = 25 - p * 2;
        seg(48, 25, elX, elY, 3 + e, o ? P_OUT : DELT_C);
        seg(elX, elY, hx, hy, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(49, 22);
      break;
    }

    /* 23. SHRUGS / FARMER'S WALK */
    case "shrug": {
      const shrugY = p * 3.5;
      const hx = spec.subVariant === "farmer" ? 13 : 0;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, 15, "front", o);
        r(34 - e / 2, 20 - shrugY * 0.5 - e / 2, 12 + e, 16 + e, o ? P_OUT : BACK_C);
        r(35 - e / 2, 36 - e / 2, 10 + e, 8 + e, o ? P_OUT : P_SHORTS);
        r(35 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        r(42 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        drawShoe(36, F - 2, 0, o);
        drawShoe(44, F - 2, 0, o);
        for (const s of [-1, 1]) {
          seg(40 + s * 6, 22 - shrugY, 40 + s * 8, 39 - shrugY, 3 + e, o ? P_OUT : P_SKIN);
        }
      }
      if (spec.equip === "dumbbell" || hx > 0) {
        drawDumbbell(31, 40 - shrugY, true);
        drawDumbbell(49, 40 - shrugY, true);
      } else {
        drawFrontBarbell(40, 40 - shrugY, 17);
      }
      drawSpark(40, 17);
      break;
    }

    /* 24. UPRIGHT ROW (Front view pulling barbell/EZ/cable up chest with high elbows) */
    case "upright_row": {
      const barY = 39 - p * 16;
      if (spec.equip === "cable") {
        drawWeightStack(10, 12, F, p);
        drawPulley(21, F - 4);
        seg(21, F - 4, 40, barY, 1, P_CABLE);
      }
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, 15, "front", o);
        r(34 - e / 2, 20 - e / 2, 12 + e, 16 + e, o ? P_OUT : P_SHIRT);
        r(35 - e / 2, 36 - e / 2, 10 + e, 8 + e, o ? P_OUT : P_SHORTS);
        r(35 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        r(42 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        drawShoe(36, F - 2, 0, o);
        drawShoe(44, F - 2, 0, o);
        for (const s of [-1, 1]) {
          const elX = 40 + s * (7 + p * 6);
          const elY = 30 - p * 11;
          seg(40 + s * 6, 22, elX, elY, 3 + e, o ? P_OUT : DELT_C);
          seg(elX, elY, 40 + s * 5, barY, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }
      drawFrontBarbell(40, barY, 14, spec.equip === "ezbar");
      drawSpark(40, 19);
      break;
    }

    /* 25. PULL-UP / CHIN-UP / RING PULL-UP */
    case "pullup": {
      const rings = spec.equip === "rings";
      const barY = 10;
      r(14, 4, 2, F - 4, P_FRAME);
      r(64, 4, 2, F - 4, P_FRAME);
      r(13, barY - 1, 54, 3, P_OUT);
      r(14, barY, 52, 1, P_STEEL);
      if (rings) {
        r(31, barY + 1, 2, 6, P_PAD_HI);
        r(47, barY + 1, 2, 6, P_PAD_HI);
        r(30, barY + 7, 4, 4, P_RING);
        r(46, barY + 7, 4, 4, P_RING);
      }
      const gripY = rings ? barY + 9 : barY + 1;
      const bodyTop = 27 - p * 12;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, bodyTop - 5, "back", o);
        r(34 - e / 2, bodyTop - e / 2, 12 + e, 15 + e, o ? P_OUT : BACK_C);
        r(35 - e / 2, bodyTop + 15 - e / 2, 10 + e, 7 + e, o ? P_OUT : P_SHORTS);
        seg(37, bodyTop + 22, 37, bodyTop + 29, 3 + e, o ? P_OUT : P_SKIN);
        seg(43, bodyTop + 22, 43, bodyTop + 29, 3 + e, o ? P_OUT : P_SKIN);
        for (const s of [-1, 1]) {
          const elX = 40 + s * (10 + p * 3);
          const elY = (bodyTop + gripY) / 2 + p * 4;
          seg(40 + s * 6, bodyTop + 2, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
          seg(elX, elY, 40 + s * 9, gripY, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }
      drawSpark(40, bodyTop + 3);
      drawArrow(7, 18, phase === "EXC" ? "down" : "up", phase === "CON" ? P_PIN : "#3df2ff");
      break;
    }

    /* 26. MUSCLE-UP (Explosive pull-up transitioning chest above high bar & locking out dip!) */
    case "muscle_up": {
      const barY = 25;
      r(18, 4, 2, F - 4, P_FRAME);
      r(60, 4, 2, F - 4, P_FRAME);
      r(17, barY, 46, 2, P_STEEL);
      const bodyY = p < 0.55 ? 36 - (p / 0.55) * 16 : 20 - ((p - 0.55) / 0.45) * 8;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, bodyY - 5, "back", o);
        r(34 - e / 2, bodyY - e / 2, 12 + e, 14 + e, o ? P_OUT : BACK_C);
        r(35 - e / 2, bodyY + 14 - e / 2, 10 + e, 6 + e, o ? P_OUT : P_SHORTS);
        seg(37, bodyY + 20, 38, bodyY + 27, 3 + e, o ? P_OUT : P_SKIN);
        seg(43, bodyY + 20, 42, bodyY + 27, 3 + e, o ? P_OUT : P_SKIN);
        for (const s of [-1, 1]) {
          const elX = 40 + s * (11 - p * 2.5);
          const elY = (bodyY + barY) / 2;
          seg(40 + s * 6, bodyY + 2, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
          seg(elX, elY, 40 + s * 8, barY, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }
      drawSpark(40, bodyY - 6);
      break;
    }

    /* 27. LAT PULLDOWN (Seated under high pulley tower + knee hold-down pad + moving weight stack!) */
    case "pulldown_cable": {
      drawWeightStack(10, 9, F, p);
      // High overhead boom + pulley
      r(15, 7, 31, 3, P_FRAME_LT);
      drawPulley(42, 10);
      // Seat & knee hold-down pad
      r(38, 41, 14, 3, P_PAD);
      r(43, 44, 3, F - 44, P_FRAME);
      r(34, 33, 6, 3, P_PAD_HI); // thigh pad
      const barY = 14 + p * 14;
      seg(42, 10, 42, barY, 1.3, spec.equip === "band" ? P_BAND : P_CABLE);
      r(32, barY - 1, 20, 2, P_STEEL); // wide lat bar

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        seg(49, 26, 45, 39, 6 + e, o ? P_OUT : BACK_C);
        seg(45, 39, 36, 39, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(36, 39, 35, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(34, F - 2, -1, o);
        drawHead(50, 19, "left", o);
        const elX = 44, elY = 20 + p * 11;
        seg(48, 26, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, 42, barY, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(51, 30);
      drawArrow(62, 20, phase === "EXC" ? "up" : "down", phase === "CON" ? P_PIN : "#3df2ff");
      break;
    }

    /* 28. LAT PULLDOWN MACHINE (Converging overhead iso-lateral machine arms + rear weight stack) */
    case "pulldown_machine": {
      drawWeightStack(10, 9, F, p, 31, 12);
      r(27, 10, 4, F - 10, P_FRAME);
      r(38, 40, 14, 3, P_PAD);
      r(43, 43, 3, F - 43, P_FRAME);
      r(34, 33, 6, 3, P_PAD_HI);
      const hy = 15 + p * 13;
      seg(30, 11, 42, hy, 3, P_STEEL_DK);
      r(40, hy - 1, 5, 3, P_PLATE);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        seg(49, 25, 45, 38, 6 + e, o ? P_OUT : BACK_C);
        seg(45, 38, 36, 38, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(36, 38, 35, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(34, F - 2, -1, o);
        drawHead(50, 18, "left", o);
        const elX = 45, elY = 21 + p * 11;
        seg(48, 25, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, 42, hy, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(51, 30);
      break;
    }

    /* 29. BENT-OVER ROW (Barbell / Dumbbell / EZ-Bar side view) */
    case "row_bent": {
      const pull = p * 9;
      const barY = 44 - pull;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(28, F - 2, 1, o);
        seg(28, F - 2, 32, 44, 3.5 + e, o ? P_OUT : P_SKIN);
        seg(32, 44, 27, 36, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(27, 36, 45, 29, 6 + e, o ? P_OUT : BACK_C);
        drawHead(49, 26, "right", o);
        const elX = 42 - p * 6, elY = 35 - p * 9;
        seg(44, 30, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, 45, barY, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      if (spec.equip === "dumbbell") drawDumbbell(45, barY, false);
      else drawSidePlate(45, barY, true);
      drawSpark(36, 26);
      drawArrow(60, 34, phase === "EXC" ? "down" : "up", phase === "CON" ? P_PIN : "#3df2ff");
      break;
    }

    /* 30. ONE-ARM DUMBBELL ROW (Hand & knee planted on flat bench, rowing dumbbell to hip) */
    case "row_one_arm": {
      r(24, 38, 34, 3, P_PAD_HI);
      r(27, 41, 3, F - 41, P_FRAME);
      r(52, 41, 3, F - 41, P_FRAME);
      const hy = 46 - p * 12;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(20, F - 2, 1, o);
        seg(21, F - 2, 26, 36, 4 + e, o ? P_OUT : P_SKIN);
        seg(32, 37, 29, 30, 4.2 + e, o ? P_OUT : P_SHORTS); // knee on bench anchored cleanly to hip
        seg(28, 30, 48, 28, 6 + e, o ? P_OUT : BACK_C);
        drawHead(54, 26, "right", o);
        seg(49, 29, 51, 38, 2.8 + e, o ? P_OUT : P_SKIN); // bracing hand
        const elX = 40 - p * 6, elY = 36 - p * 12;
        seg(45, 30, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, 44 - p * 4, hy, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawDumbbell(44 - p * 4, hy, false);
      drawSpark(37, 24);
      break;
    }

    /* 31. SEATED CABLE ROW / GIRONDA (Long low bench, feet braced, weight stack pulling horizontal) */
    case "row_cable": {
      drawWeightStack(8, 12, F, p);
      drawPulley(21, 36);
      r(20, 42, 43, 3, P_PAD_HI);
      r(25, 45, 3, F - 45, P_FRAME);
      r(57, 45, 3, F - 45, P_FRAME);
      r(24, 36, 4, 8, P_STEEL_DK); // footplate
      const hx = 33 + p * 12;
      seg(21, 36, hx, 34, 1.3, P_CABLE);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(29, 40, -1, o);
        seg(29, 40, 50, 40, 4.2 + e, o ? P_OUT : P_SHORTS);
        const lean = p * 5;
        seg(50, 40, 49 + lean, 25, 6 + e, o ? P_OUT : BACK_C);
        drawHead(49 + lean, 18, "left", o);
        const elX = 43 + p * 13, elY = 33;
        seg(49 + lean, 27, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, hx, 34, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(53, 29);
      drawArrow(62, 25, phase === "EXC" ? "left" : "right", phase === "CON" ? P_PIN : "#3df2ff");
      break;
    }

    /* 32. CHEST-SUPPORTED ROW MACHINE (Hammer Strength / Plate/Stack Machine w/ chest pad) */
    case "row_machine": {
      drawWeightStack(10, 12, F, p, 29, 24);
      r(28, 22, 3, F - 22, P_FRAME);
      r(30, 23, 3, 12, P_PAD_HI); // chest support pad
      r(34, 41, 12, 3, P_PAD);
      r(38, 44, 3, F - 44, P_FRAME);
      const hx = 29 + p * 15;
      seg(26, 17, hx, 28, 3, P_STEEL_DK);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        seg(35, 25, 38, 39, 6 + e, o ? P_OUT : BACK_C);
        seg(38, 39, 30, 41, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(30, 41, 29, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(28, F - 2, -1, o);
        drawHead(35, 18, "left", o);
        const elX = 36 + p * 11, elY = 28;
        seg(35, 26, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, hx, 28, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      r(hx - 1, 26, 3, 5, P_PLATE);
      drawSpark(42, 26);
      break;
    }

    /* 33. T-BAR ROW (Anchored floor pivot + chest/bent hinge pulling loaded front bar sleeve!) */
    case "row_tbar": {
      r(14, F - 3, 7, 3, P_FRAME_LT);
      const hx = 43;
      const hy = 40 - p * 11;
      seg(17, F - 2, hx + 2, hy, 2, P_STEEL);
      drawSidePlate(hx + 3, hy, false);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(28, F - 2, 1, o);
        seg(29, F - 2, 33, 44, 3.5 + e, o ? P_OUT : P_SKIN);
        seg(33, 44, 28, 36, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(28, 36, 45, 28, 6 + e, o ? P_OUT : BACK_C);
        drawHead(49, 25, "right", o);
        const elX = 40 - p * 6, elY = 34 - p * 9;
        seg(44, 29, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, hx, hy, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(36, 25);
      break;
    }

    /* 34. INVERTED / AUSTRALIAN ROW (Horizontal rack bar, heels on floor pulling chest up) */
    case "row_inverted": {
      r(50, 18, 3, F - 18, P_FRAME);
      const lift = p * 8;
      const shY = 36 - lift;
      const hipY = 44 - lift * 0.55;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(16, F - 2, -1, o);
        seg(17, F - 2, 34, hipY, 4 + e, o ? P_OUT : P_SHORTS);
        seg(34, hipY, 50, shY, 6 + e, o ? P_OUT : BACK_C);
        drawHead(54, shY - 2, "up", o);
        const elX = 47 + p * 2, elY = (shY + 21) / 2;
        seg(50, shY, elX, elY, 3 + e, o ? P_OUT : P_SKIN);
        seg(elX, elY, 51, 21, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      // Draw horizontal bar & J-cup over hands so bar anchor is always crystal clear
      r(48, 20, 6, 3, P_STEEL);
      r(49, 21, 4, 2, P_PIN);
      drawSpark(48, 30);
      break;
    }

    /* 35. DEADLIFT / RDL / SUMO / TRAP BAR / SMITH */
    case "deadlift": {
      const rdl = spec.subVariant === "rdl";
      const sumo = spec.subVariant === "sumo";
      const isSmith = spec.equip === "smith";

      if (sumo) {
        // Distinct wide-stance front view: wide toes out, upright torso, narrow grip inside thighs!
        const drop = (1 - p) * 11;
        const hipY = 34 + drop;
        const shY = 20 + drop * 0.85;
        const barY = 38 + drop * 1.1;
        for (let pass = 0; pass < 2; pass++) {
          const o = pass === 0;
          const e = o ? 2 : 0;
          drawShoe(24, F - 2, -1, o);
          drawShoe(56, F - 2, 1, o);
          const kneeLX = 28 + (1 - p) * 2, kneeRX = 52 - (1 - p) * 2;
          const kneeY = 44 + (1 - p) * 3;
          seg(24, F - 2, kneeLX, kneeY, 3.6 + e, o ? P_OUT : P_SKIN);
          seg(56, F - 2, kneeRX, kneeY, 3.6 + e, o ? P_OUT : P_SKIN);
          seg(kneeLX, kneeY, 36, hipY, 4.6 + e, o ? P_OUT : LEG_C);
          seg(kneeRX, kneeY, 44, hipY, 4.6 + e, o ? P_OUT : LEG_C);
          r(34 - e / 2, hipY - 3 - e / 2, 12 + e, 5 + e, o ? P_OUT : LEG_C);
          r(34 - e / 2, shY - e / 2, 12 + e, Math.max(9, hipY - shY - 2) + e, o ? P_OUT : BACK_C);
          drawHead(40, shY - 5, "front", o);
          seg(36, shY + 2, 37, barY, 2.8 + e, o ? P_OUT : P_SKIN);
          seg(44, shY + 2, 43, barY, 2.8 + e, o ? P_OUT : P_SKIN);
        }
        drawFrontBarbell(40, barY, 20);
        drawSpark(40, hipY - 2);
        drawArrow(7, 28, phase === "EXC" ? "down" : "up", phase === "CON" ? P_PIN : "#3df2ff");
        break;
      }

      const hipBack = (1 - p) * (rdl ? 11 : 10);
      const shY = 23 + (1 - p) * (rdl ? 15 : 11);
      const shX = 40 + (1 - p) * (rdl ? 8 : 6);
      const hipX = 36 - hipBack;
      const hipY = 39 + (1 - p) * (rdl ? 1 : 5);
      const kneeX = rdl ? 39 : 40 + (1 - p) * 3;
      const barY = rdl ? 39 + (1 - p) * 8 : 41 + (1 - p) * 11;
      if (isSmith) drawSmithSide(42, barY);

      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(39, F - 2, 1, o);
        seg(38, F - 2, kneeX, 46, 3.6 + e, o ? P_OUT : P_SKIN);
        seg(kneeX, 46, hipX, hipY, 4.5 + e, o ? P_OUT : LEG_C);
        seg(hipX, hipY, shX, shY, 6 + e, o ? P_OUT : BACK_C);
        drawHead(shX + 2, shY - 5, "right", o);
        seg(shX, shY + 2, isSmith ? 42 : shX + 1, barY, 3 + e, o ? P_OUT : P_SKIN);
      }
      if (spec.equip === "dumbbell") drawDumbbell(shX + 1, barY, false);
      else if (spec.equip === "kettlebell") drawKettlebell(shX + 1, barY);
      else drawSidePlate(isSmith ? 42 : shX + 1, barY, true);
      drawSpark(hipX, hipY - 3);
      drawArrow(64, 28, phase === "EXC" ? "down" : "up", phase === "CON" ? P_PIN : "#3df2ff");
      break;
    }

    /* 36. BACK EXTENSION / HYPEREXTENSION / GOOD MORNING */
    case "back_ext": {
      // 45° Roman chair apparatus
      r(18, F - 2, 24, 2, P_FRAME_LT);
      seg(21, F - 2, 34, 38, 3, P_FRAME);
      r(33, 35, 8, 4, P_PAD_HI);
      r(20, 48, 5, 4, P_PAD);
      const ang = 0.65 - p * 0.65; // bent down -> flat aligned
      const shX = 37 + Math.cos(ang) * 16;
      const shY = 36 + Math.sin(ang) * 18;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(21, F - 2, 1, o);
        seg(22, F - 2, 36, 39, 4.2 + e, o ? P_OUT : LEG_C);
        seg(36, 39, shX, shY, 6 + e, o ? P_OUT : BACK_C);
        drawHead(shX + 4, shY - 2, "right", o);
        seg(shX - 1, shY + 2, shX - 4, shY + 6, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(36, 34);
      break;
    }

    /* 37. BICEPS STANDING CURL (Facing right so curls lift cleanly FORWARD & UP!) */
    case "biceps_standing": {
      const isCable = spec.equip === "cable";
      const cx = isCable ? 32 : 38;
      const ang = 1.45 - p * 2.15;
      const hx = cx + 1 + Math.cos(ang) * 13;
      const hy = 35 + Math.sin(ang) * 13;
      if (isCable) {
        drawWeightStack(60, 12, F, p);
        drawPulley(59, F - 5);
        seg(59, F - 5, hx, hy, 1.3, P_CABLE);
      }
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(cx, 15, "right", o);
        r(cx - 3 - e / 2, 20 - e / 2, 6 + e, 16 + e, o ? P_OUT : P_SHIRT);
        r(cx - 2 - e / 2, 36 - e / 2, 5 + e, 8 + e, o ? P_OUT : P_SHORTS);
        r(cx - 1 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        drawShoe(cx + 1, F - 2, 1, o);
        seg(cx + 1, 24, cx + 1, 35, 3.2 + e, o ? P_OUT : ARM_C); // locked upper arm!
        seg(cx + 1, 35, hx, hy, 2.8 + e, o ? P_OUT : ARM_C);
      }
      if (spec.equip === "band") seg(cx + 1, F - 2, hx, hy, 1.4, P_BAND);
      else if (spec.equip === "dumbbell") drawDumbbell(hx, hy, false);
      else if (spec.equip === "ezbar" || spec.equip === "barbell") drawSidePlate(hx, hy, false);
      else if (isCable) r(hx - 1, hy - 1, 3, 3, P_PIN);
      drawSpark(cx + 3, 29);
      break;
    }

    /* 38. PREACHER CURL / SCOTT BENCH (Angled preacher pad pinning elbows steady, curling forward-up) */
    case "biceps_preacher": {
      // Scott Bench: seat on right, angled pad on left
      r(44, 41, 12, 3, P_PAD);
      r(48, 44, 3, F - 44, P_FRAME);
      r(31, 35, 3, F - 35, P_FRAME);
      seg(29, 36, 37, 29, 4, P_PAD_HI); // angled Scott pad
      const ang = 2.05 - p * 2.8; // extended down pad -> curled crisp up in front of chest!
      const hx = 31 + Math.cos(ang) * 11;
      const hy = 35 + Math.sin(ang) * 11;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(46, 19, "left", o);
        seg(47, 25, 49, 39, 6 + e, o ? P_OUT : P_SHIRT);
        seg(49, 39, 39, 41, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(39, 41, 38, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(37, F - 2, -1, o);
        seg(45, 27, 31, 35, 3.2 + e, o ? P_OUT : ARM_C); // pinned along pad
        seg(31, 35, hx, hy, 2.8 + e, o ? P_OUT : ARM_C);
      }
      if (spec.equip === "dumbbell") drawDumbbell(hx, hy, false);
      else drawSidePlate(hx, hy, false);
      drawSpark(34, 28);
      break;
    }

    /* 39. INCLINE / SPIDER BICEPS CURL (Back resting on 45° incline pad, arms hanging & curling cleanly in front of chest!) */
    case "biceps_incline": {
      r(26, 33, 3, F - 33, P_FRAME);
      r(45, 43, 3, F - 43, P_FRAME);
      seg(26, 26, 39, 41, 4, P_PAD_HI); // 45° backrest parallel behind athlete's back!
      r(39, 41, 12, 3, P_PAD);
      const ang = 1.48 - p * 2.32;
      const hx = 35 + Math.cos(ang) * 12;
      const hy = 36 + Math.sin(ang) * 12;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(28, 20, "right", o);
        seg(31, 27, 40, 39, 6 + e, o ? P_OUT : P_SHIRT);
        seg(40, 39, 50, 39, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(50, 39, 51, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(52, F - 2, 1, o);
        seg(32, 28, 35, 36, 3.2 + e, o ? P_OUT : ARM_C); // upper arm locked at side
        seg(35, 36, hx, hy, 2.8 + e, o ? P_OUT : ARM_C);
      }
      drawDumbbell(hx, hy, false);
      drawSpark(42, 23);
      break;
    }

    /* 40. HIGH CABLE / BAYESIAN BICEPS CURL (Standing with twin high cables curling toward ears) */
    case "biceps_high_cable": {
      drawWeightStack(4, 10, F, p);
      drawWeightStack(64, 10, F, p);
      drawPulley(16, 15);
      drawPulley(63, 15);
      const handDist = 11 - p * 5;
      const hy = 21 - p * 4;
      seg(16, 15, 40 - handDist, hy, 1.2, P_CABLE);
      seg(63, 15, 40 + handDist, hy, 1.2, P_CABLE);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, 15, "front", o);
        r(34 - e / 2, 20 - e / 2, 12 + e, 16 + e, o ? P_OUT : P_SHIRT);
        r(35 - e / 2, 36 - e / 2, 10 + e, 8 + e, o ? P_OUT : P_SHORTS);
        r(35 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        r(42 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        drawShoe(36, F - 2, 0, o);
        drawShoe(44, F - 2, 0, o);
        for (const s of [-1, 1]) {
          seg(40 + s * 6, 22, 40 + s * 13, 21, 3 + e, o ? P_OUT : ARM_C);
          seg(40 + s * 13, 21, 40 + s * handDist, hy, 2.8 + e, o ? P_OUT : ARM_C);
        }
      }
      drawSpark(40, 14);
      break;
    }

    /* 41. TRICEPS PUSHDOWN (High cable pulley tower + rope/V-bar extending elbows down) */
    case "triceps_pushdown": {
      drawWeightStack(10, 9, F, p);
      r(18, 7, 17, 3, P_FRAME_LT);
      drawPulley(33, 10);
      const ang = -0.45 + p * 1.85; // bent up -> straight down lockout!
      const hx = 44 + Math.cos(ang) * 11;
      const hy = 30 + Math.sin(ang) * 11;
      seg(33, 10, hx, hy, 1.3, spec.equip === "band" ? P_BAND : P_CABLE);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(49, 16, "left", o);
        seg(50, 22, 50, 37, 6 + e, o ? P_OUT : P_SHIRT);
        r(47 - e / 2, 37 - e / 2, 5 + e, 7 + e, o ? P_OUT : P_SHORTS);
        r(48 - e / 2, 44 - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
        drawShoe(47, F - 2, -1, o);
        seg(49, 24, 44, 30, 3.2 + e, o ? P_OUT : ARM_C);
        seg(44, 30, hx, hy, 2.8 + e, o ? P_OUT : ARM_C);
      }
      r(hx - 1, hy - 1, 3, 3, P_PIN);
      drawSpark(46, 27);
      break;
    }

    /* 42. SKULLCRUSHER / FRENCH PRESS (Flat bench lying down extending bar overhead from forehead) */
    case "triceps_skullcrusher": {
      r(22, 43, 3, F - 43, P_FRAME);
      r(48, 43, 3, F - 43, P_FRAME);
      r(18, 40, 35, 3, P_PAD_HI);
      const ang = -2.35 + p * 0.9; // behind head -> vertical lockout
      const hx = 28 + Math.cos(ang) * 12;
      const hy = 29 + Math.sin(ang) * 12;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(18, 36, "up", o);
        seg(23, 37, 39, 37, 6 + e, o ? P_OUT : P_SHIRT);
        seg(39, 37, 50, 38, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(50, 38, 54, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(54, F - 2, 1, o);
        seg(28, 36, 28, 29, 3.2 + e, o ? P_OUT : ARM_C); // vertical upper arm!
        seg(28, 29, hx, hy, 2.8 + e, o ? P_OUT : ARM_C);
      }
      if (spec.equip === "dumbbell") drawDumbbell(hx, hy, false);
      else drawSidePlate(hx, hy, false);
      drawSpark(28, 22);
      break;
    }

    /* 43. OVERHEAD TRICEPS EXTENSION (Seated/Standing behind-head stretch -> vertical lock) */
    case "triceps_overhead": {
      const hx = 35 + p * 4;
      const hy = 21 - p * 14;
      if (spec.equip === "cable") {
        drawWeightStack(10, 12, F, p);
        drawPulley(21, F - 5);
        seg(21, F - 5, hx, hy, 1.2, P_CABLE);
      }
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(44, 18, "right", o);
        r(40 - e / 2, 23 - e / 2, 6 + e, 16 + e, o ? P_OUT : P_SHIRT);
        r(40 - e / 2, 39 - e / 2, 5 + e, 6 + e, o ? P_OUT : P_SHORTS);
        r(41 - e / 2, 45 - e / 2, 3 + e, 9 + e, o ? P_OUT : P_SKIN);
        drawShoe(42, F - 2, 1, o);
        seg(42, 24, 38, 14, 3.2 + e, o ? P_OUT : ARM_C);
        seg(38, 14, hx, hy, 2.8 + e, o ? P_OUT : ARM_C);
      }
      drawDumbbell(hx, hy, true);
      drawSpark(39, 6);
      break;
    }

    /* 44. TRICEPS KICKBACK (Torso parallel, upper arm pinned back, kicking forearm straight behind) */
    case "triceps_kickback": {
      const ang = 1.45 + p * 1.4; // 90 deg -> horizontal backward lock!
      const hx = 39 + Math.cos(ang) * 11;
      const hy = 31 + Math.sin(ang) * 11;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(30, F - 2, 1, o);
        seg(31, F - 2, 33, 44, 3.5 + e, o ? P_OUT : P_SKIN);
        seg(33, 44, 29, 36, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(29, 36, 46, 31, 6 + e, o ? P_OUT : P_SHIRT);
        drawHead(50, 29, "right", o);
        seg(45, 32, 39, 31, 3.2 + e, o ? P_OUT : ARM_C);
        seg(39, 31, hx, hy, 2.8 + e, o ? P_OUT : ARM_C);
      }
      drawDumbbell(hx, hy, false);
      drawSpark(28, 28);
      break;
    }

    /* 45. FOREARM WRIST CURL (Forearms resting flat across bench, flexing wrists up & down) */
    case "forearm_curl": {
      r(38, 39, 20, 3, P_PAD);
      r(41, 42, 3, F - 42, P_FRAME);
      r(53, 42, 3, F - 42, P_FRAME);
      const hy = 38 - p * 4;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(47, 19, "left", o);
        seg(46, 25, 48, 38, 6 + e, o ? P_OUT : P_SHIRT);
        seg(48, 38, 37, 40, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(37, 40, 36, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(35, F - 2, -1, o);
        seg(45, 27, 42, 38, 3 + e, o ? P_OUT : P_SKIN);
        seg(42, 38, 31, 38, 2.8 + e, o ? P_OUT : ARM_C); // forearm horizontal on leg/bench
        seg(31, 38, 28, hy, 2.4 + e, o ? P_OUT : P_SKIN);
      }
      drawDumbbell(28, hy, false);
      drawSpark(28, 33);
      break;
    }

    /* 46. SQUAT (Back / Front / Goblet / Smith / Band + Rack Uprights!) */
    case "squat": {
      const drop = (1 - p) * 12; // p=1 top standing, p=0 deep squat!
      const isSmith = spec.equip === "smith";
      const front = spec.subVariant === "incline" || spec.equip === "dumbbell";
      const shX = 41, shY = 20 + drop;
      const bx = front ? shX + 5 : shX - 3;
      const barY = shY - 1 + (front ? 3 : 0);
      if (isSmith) {
        drawSmithSide(bx, barY);
      } else if (spec.equip === "barbell") {
        // Power rack upright beside athlete
        r(24, 12, 2, F - 12, P_FRAME);
        r(24, 34, 6, 2, P_PIN);
      }
      const hipX = 36 - (1 - p) * 5, hipY = 34 + drop;
      const kneeX = 44 + (1 - p) * 4, kneeY = 44 + (1 - p) * 2;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(40, F - 2, 1, o);
        seg(40, F - 2, kneeX, kneeY, 3.6 + e, o ? P_OUT : P_SKIN);
        seg(kneeX, kneeY, hipX, hipY, 4.8 + e, o ? P_OUT : LEG_C);
        seg(hipX, hipY, shX, shY, 6 + e, o ? P_OUT : P_SHIRT);
        drawHead(43, shY - 6, "right", o);
        seg(shX + (front ? 3 : -1), shY + 1, bx, barY, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      if (spec.equip === "dumbbell" || spec.equip === "kettlebell") {
        drawDumbbell(bx, barY, true);
      } else if (spec.equip === "barbell" || isSmith) {
        drawSidePlate(bx, barY, true);
      }
      if (spec.equip === "band") seg(39, kneeY, 45, kneeY, 1.5, P_BAND);
      drawSpark(hipX - 2, hipY - 3);
      drawArrow(12, 24, phase === "EXC" ? "down" : "up", phase === "CON" ? P_PIN : "#3df2ff");
      break;
    }

    /* 47. HACK SQUAT / PENDULUM MACHINE (45° angled sled with rails, shoulder pads & moving weight plates!) */
    case "squat_hack": {
      // Footplate + angled twin Hack Squat track
      seg(47, F - 1, 58, F - 10, 4, P_FRAME_LT);
      seg(12, 20, 48, F - 2, 3, P_FRAME);
      seg(15, 18, 51, F - 4, 2, P_STEEL_DK);
      const slide = (1 - p) * 11;
      const shX = 32 - slide * 0.7;
      const shY = 23 + slide * 0.7;
      const hipX = 38 - slide * 0.7;
      const hipY = 36 + slide * 0.7;
      // Moving sled backrest + shoulder pads + loaded plates!
      seg(shX - 5, shY + 2, hipX - 4, hipY + 3, 4, P_PAD_HI);
      r(shX - 3, shY - 2, 5, 4, P_PAD);
      drawSidePlate(shX - 7, shY - 1, true);
      const kneeX = 48 + (1 - p) * 1, kneeY = 42 + (1 - p) * 3;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(53, F - 7, -1, o);
        seg(52, F - 7, kneeX, kneeY, 3.6 + e, o ? P_OUT : P_SKIN);
        seg(kneeX, kneeY, hipX, hipY, 4.8 + e, o ? P_OUT : LEG_C);
        seg(hipX, hipY, shX, shY, 6 + e, o ? P_OUT : P_SHIRT);
        drawHead(shX + 3, shY - 6, "right", o);
      }
      drawSpark(44, 38);
      break;
    }

    /* 48. PISTOL SQUAT (Single-leg squat with other leg relaxed on top -> kicked straight horizontal at bottom!) */
    case "squat_pistol": {
      const drop = (1 - p) * 12;
      const hipX = 37 - (1 - p) * 4, hipY = 35 + drop;
      const kneeX = 42 + (1 - p) * 4, kneeY = 44 + (1 - p) * 2;
      const shX = 40, shY = 20 + drop;
      const freeX = hipX + 11 + (1 - p) * 6;
      const freeY = hipY + 13 - (1 - p) * 15;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(40, F - 2, 1, o);
        seg(40, F - 2, kneeX, kneeY, 3.6 + e, o ? P_OUT : P_SKIN);
        seg(kneeX, kneeY, hipX, hipY, 4.8 + e, o ? P_OUT : LEG_C);
        seg(hipX, hipY, freeX, freeY, 3.4 + e, o ? P_OUT : P_SKIN);
        drawShoe(freeX + 1, freeY, 1, o);
        seg(hipX, hipY, shX, shY, 6 + e, o ? P_OUT : P_SHIRT);
        drawHead(shX + 1, shY - 6, "right", o);
        seg(shX + 2, shY + 2, shX + 13, shY + 2, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(hipX + 2, hipY - 2);
      break;
    }

    /* 49. LEG PRESS 45° / HORIZONTAL (Reclined seat + angled rails + support tower + heavy moving plate sled!) */
    case "leg_press": {
      const horiz = spec.subVariant === "flat";
      const sledShift = p * 11;
      // Reclined press base, heavy support frame & twin angled carriage rails
      r(14, 38, 22, 4, P_PAD);
      r(17, 42, 3, F - 42, P_FRAME);
      r(32, 42, 3, F - 42, P_FRAME);
      r(14, F - 3, 52, 3, P_FRAME_LT);
      r(60, horiz ? 28 : 17, 4, F - (horiz ? 30 : 19), P_FRAME); // front A-frame upright support for both 45° & horizontal!
      seg(11, 27, 23, 39, 4, P_PAD_HI);
      const sledX = 46 + sledShift;
      const sledY = horiz ? 34 : 28 - sledShift * 0.6;
      // Twin guide rails passing straight through sled center!
      seg(34, 36, 61, horiz ? 36 : 19, 3, P_FRAME_LT);
      seg(34, 36, 61, horiz ? 36 : 19, 1, P_STEEL_DK);
      // Heavy moving footplate sled + stacked 20kg red plates
      seg(sledX - 2, sledY + 7, sledX + 5, sledY - 4, 4, P_STEEL_DK);
      drawSidePlate(sledX + 4, sledY - 5, true);

      const footX = sledX - 1, footY = sledY + 1;
      const kneeX = 37 + p * 6, kneeY = 34 - p * 2;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(14, 23, "right", o);
        seg(17, 29, 27, 37, 6 + e, o ? P_OUT : P_SHIRT);
        seg(27, 37, kneeX, kneeY, 4.8 + e, o ? P_OUT : LEG_C);
        seg(kneeX, kneeY, footX, footY, 3.6 + e, o ? P_OUT : P_SKIN);
        drawShoe(footX, footY, 1, o);
      }
      drawSpark(sledX, sledY - 12);
      break;
    }

    /* 50. LEG EXTENSION MACHINE (Seated machine kicking shin roller forward + weight stack!) */
    case "leg_extension": {
      drawWeightStack(10, 12, F, p, 30, 36);
      r(28, 22, 3, 18, P_PAD_HI);
      r(28, 38, 15, 4, P_PAD);
      r(32, 42, 3, F - 42, P_FRAME);
      r(40, 42, 3, F - 42, P_FRAME);
      const ang = 1.45 - p * 1.45; // down vertical -> extended straight horizontal!
      const ankleX = 43 + Math.cos(ang) * 14;
      const ankleY = 40 + Math.sin(ang) * 14;
      seg(43, 40, ankleX, ankleY, 2.5, P_STEEL); // machine lever arm
      r(ankleX - 2, ankleY - 2, 4, 4, P_PLATE); // roller pad
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(32, 16, "right", o);
        seg(32, 23, 33, 37, 6 + e, o ? P_OUT : P_SHIRT);
        seg(33, 37, 43, 39, 4.8 + e, o ? P_OUT : LEG_C);
        seg(43, 39, ankleX, ankleY, 3.6 + e, o ? P_OUT : P_SKIN);
        drawShoe(ankleX + 1, ankleY, 1, o);
      }
      drawSpark(38, 35);
      break;
    }

    /* 51. PRONE LEG CURL MACHINE (Lying face down on angled bench curling roller to glutes + weight stack) */
    case "leg_curl_prone": {
      drawWeightStack(10, 14, F, p, 29, 34);
      r(26, 36, 34, 4, P_PAD_HI);
      r(29, 40, 3, F - 40, P_FRAME);
      r(54, 40, 3, F - 40, P_FRAME);
      r(59, 37, 3, 5, P_STEEL_DK); // front grip handle
      const ang = 0.05 + p * 1.65;
      const ankleX = 32 - Math.cos(ang) * 13;
      const ankleY = 34 - Math.sin(ang) * 13;
      seg(32, 34, ankleX, ankleY, 2.5, P_STEEL);
      r(ankleX - 2, ankleY - 2, 4, 4, P_PLATE);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(58, 29, "right", o);
        seg(54, 33, 43, 34, 6 + e, o ? P_OUT : P_SHIRT);
        seg(43, 34, 32, 34, 4.8 + e, o ? P_OUT : LEG_C);
        seg(32, 34, ankleX, ankleY, 3.6 + e, o ? P_OUT : P_SKIN);
        drawShoe(ankleX, ankleY - 1, -1, o);
        seg(53, 34, 60, 38, 2.6 + e, o ? P_OUT : P_SKIN); // arm gripping front bench handle!
      }
      drawSpark(37, 30);
      break;
    }

    /* 52. SEATED LEG CURL MACHINE (Seated upright w/ thigh clamp pulling roller under seat + weight stack) */
    case "leg_curl_seated": {
      drawWeightStack(10, 12, F, p, 30, 36);
      r(28, 22, 3, 18, P_PAD_HI);
      r(28, 38, 15, 4, P_PAD);
      r(40, 33, 5, 3, P_PLATE); // upper thigh hold-down pad!
      r(32, 42, 3, F - 42, P_FRAME);
      const ang = 0.05 + p * 1.45; // extended straight forward -> curled tightly under seat!
      const ankleX = 43 + Math.cos(ang) * 13;
      const ankleY = 40 + Math.sin(ang) * 13;
      seg(43, 40, ankleX, ankleY, 2.5, P_STEEL);
      r(ankleX - 2, ankleY - 2, 4, 4, P_PAD_HI);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(32, 16, "right", o);
        seg(32, 23, 33, 37, 6 + e, o ? P_OUT : P_SHIRT);
        seg(33, 37, 43, 39, 4.8 + e, o ? P_OUT : LEG_C);
        seg(43, 39, ankleX, ankleY, 3.6 + e, o ? P_OUT : P_SKIN);
        drawShoe(ankleX, ankleY, 1, o);
      }
      drawSpark(38, 41);
      break;
    }

    /* 53. LUNGE / BULGARIAN SPLIT SQUAT (Rear bench if bulgarian + front lunge knee bend) */
    case "lunge": {
      const bulg = spec.subVariant === "bulgarian";
      const isSmith = spec.equip === "smith";
      const drop = (1 - p) * 9; // p=0 bottom lunge stretch, p=1 top drive!
      if (bulg) {
        r(11, 41, 14, 4, P_PAD_HI);
        r(13, 45, 3, F - 45, P_FRAME);
        r(20, 45, 3, F - 45, P_FRAME);
      }
      const hipX = 38, hipY = 33 + drop;
      const shX = 40, shY = 19 + drop;
      if (isSmith) drawSmithSide(shX - 3, shY - 1);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        const rFootY = bulg ? 40 : F - 2;
        const rFootX = bulg ? 20 : 25;
        drawShoe(rFootX, rFootY, 1, o);
        seg(rFootX, rFootY - 1, 30, 42 + drop * 0.8, 3.4 + e, o ? P_OUT : P_SKIN);
        seg(30, 42 + drop * 0.8, hipX, hipY, 4.5 + e, o ? P_OUT : LEG_C);
        drawShoe(52, F - 2, 1, o);
        seg(51, F - 2, 50, 42 + drop * 0.4, 3.6 + e, o ? P_OUT : P_SKIN);
        seg(50, 42 + drop * 0.4, hipX, hipY, 4.8 + e, o ? P_OUT : LEG_C);
        seg(hipX, hipY, shX, shY, 6 + e, o ? P_OUT : P_SHIRT);
        drawHead(shX + 2, shY - 6, "right", o);
        if (spec.equip === "barbell" || isSmith) {
          seg(shX, shY + 1, shX - 3, shY - 1, 2.8 + e, o ? P_OUT : P_SKIN);
        } else {
          seg(shX, shY + 2, shX - 1, shY + 14, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }
      if (spec.equip === "dumbbell") drawDumbbell(39, shY + 14, false);
      else if (spec.equip === "barbell" || isSmith) drawSidePlate(shX - 3, shY - 1, false);
      drawSpark(48, 37);
      break;
    }

    /* 54. STEP-UP (Stepping up onto plyo box & standing tall cleanly inside viewport!) */
    case "step_up": {
      r(40, F - 11, 22, 11, P_FRAME);
      r(40, F - 11, 22, 3, P_PAD_HI);
      const lift = p * 9;
      const hipX = 36 + p * 11, hipY = 36 - lift;
      const shX = hipX + 1, shY = hipY - 13;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(50, F - 12, 1, o);
        seg(49, F - 12, 48, (F - 12 + hipY) / 2, 3.6 + e, o ? P_OUT : P_SKIN);
        seg(48, (F - 12 + hipY) / 2, hipX, hipY, 4.8 + e, o ? P_OUT : LEG_C);
        const f2X = 31 + p * 14, f2Y = F - 2 - lift;
        drawShoe(f2X, f2Y, 1, o);
        seg(f2X, f2Y, hipX, hipY, 4 + e, o ? P_OUT : P_SHORTS_DK);
        seg(hipX, hipY, shX, shY, 6 + e, o ? P_OUT : P_SHIRT);
        drawHead(shX + 1, shY - 6, "right", o);
        if (spec.equip === "barbell") {
          seg(shX, shY + 1, shX - 3, shY - 1, 2.6 + e, o ? P_OUT : P_SKIN);
        } else {
          seg(shX, shY + 2, shX, shY + 13, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }
      if (spec.equip === "dumbbell") drawDumbbell(shX, shY + 13, false);
      else if (spec.equip === "kettlebell") drawKettlebell(shX, shY + 13);
      else if (spec.equip === "barbell") drawSidePlate(shX - 3, shY - 1, false);
      drawSpark(hipX, hipY - 3);
      break;
    }

    /* 55. HIP THRUST / GLUTE BRIDGE (Upper back against bench pressing loaded barbell on hips) */
    case "hip_thrust": {
      const floor = spec.subVariant === "floor";
      if (!floor) {
        r(14, 41, 14, 14, P_FRAME);
        r(14, 39, 15, 3, P_PAD_HI);
      }
      const hipY = floor ? F - 4 - p * 11 : 47 - p * 12;
      const shY = floor ? F - 4 : 38;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(21, shY - 5, "up", o);
        seg(26, shY, 39, hipY, 6 + e, o ? P_OUT : P_SHIRT);
        seg(39, hipY, 53, hipY - (1 - p) * 5, 4.8 + e, o ? P_OUT : LEG_C);
        seg(53, hipY - (1 - p) * 5, 55, F - 2, 3.6 + e, o ? P_OUT : P_SKIN);
        drawShoe(55, F - 2, 1, o);
        seg(29, shY + 1, 38, hipY - 2, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      if (!floor) drawSidePlate(39, hipY - 2, true);
      drawSpark(39, hipY - 10);
      drawArrow(40, 18, phase === "EXC" ? "down" : "up", phase === "CON" ? P_PIN : "#3df2ff");
      break;
    }

    /* 56. GLUTE KICKBACK (Ankle cuff connected to low cable pulley kicking leg straight back) */
    case "glute_kickback": {
      drawWeightStack(10, 12, F, p);
      drawPulley(21, F - 5);
      const ang = 1.45 - p * 1.1; // down -> kicking backward cleanly!
      const footX = 43 - Math.cos(ang) * 16;
      const footY = 39 + Math.sin(ang) * 16;
      seg(21, F - 5, footX, footY, 1.3, P_CABLE);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(44, F - 2, -1, o);
        seg(43, F - 2, 43, 38, 3.8 + e, o ? P_OUT : P_SKIN);
        seg(43, 38, footX, footY, 4.4 + e, o ? P_OUT : LEG_C);
        drawShoe(footX, footY, -1, o);
        seg(43, 37, 34, 24, 6 + e, o ? P_OUT : P_SHIRT);
        drawHead(31, 20, "left", o);
        seg(35, 25, 22, 31, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(41, 34);
      break;
    }

    /* 57. HIP ABDUCTION / ADDUCTION MACHINE (Seated front view opening/closing leg pads + linked weight stack) */
    case "hip_abduction": {
      const add = spec.subVariant === "adduction";
      drawWeightStack(63, 14, F, p);
      r(38, F - 3, 30, 3, P_FRAME_LT);
      seg(40, 20, 68, 15, 2, P_FRAME);
      seg(40, 21, 68, 16, 1, P_CABLE);
      r(33, 41, 14, 3, P_PAD);
      r(38, 44, 4, F - 44, P_FRAME);
      const open = add ? 1 - p : p;
      const kneeSpread = 4 + open * 13;
      // Moving thigh pads!
      for (const s of [-1, 1]) {
        r(40 + s * (kneeSpread + 2) - 1, 39, 3, 6, P_PAD_HI);
      }
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, 16, "front", o);
        r(34 - e / 2, 21 - e / 2, 12 + e, 15 + e, o ? P_OUT : P_SHIRT);
        r(34 - e / 2, 36 - e / 2, 12 + e, 6 + e, o ? P_OUT : LEG_C);
        for (const s of [-1, 1]) {
          const kx = 40 + s * kneeSpread;
          seg(40 + s * 4, 40, kx, 42, 4.4 + e, o ? P_OUT : LEG_C);
          seg(kx, 42, kx, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
          drawShoe(kx, F - 2, 0, o);
        }
      }
      drawSpark(40, 41);
      break;
    }

    /* 58. STANDING CALF RAISE / MACHINE (Block step + vertical heel rise) */
    case "calf_standing": {
      r(33, F - 5, 13, 5, P_FRAME_LT); // calf step block
      const lift = p * 5;
      const isSmith = spec.equip === "smith";
      if (spec.equip === "machine") {
        drawWeightStack(10, 12, F, p, 39, 19);
        r(36, 17 - lift, 8, 4, P_PAD_HI);
      } else if (isSmith) {
        drawSmithSide(37, 19 - lift);
      }
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(41, 14 - lift, "right", o);
        r(38 - e / 2, 19 - lift - e / 2, 6 + e, 15 + e, o ? P_OUT : P_SHIRT);
        r(38 - e / 2, 34 - lift - e / 2, 5 + e, 8 + e, o ? P_OUT : P_SHORTS);
        seg(40, 42 - lift, 40, 50 - lift, 3.4 + e, o ? P_OUT : CALF_C);
        // Foot pivoted on ball of foot!
        seg(38, F - 3 - lift, 43, F - 5, 2.5 + e, o ? P_OUT : P_SHOE);
        if (spec.equip === "dumbbell") {
          seg(41, 21 - lift, 41, 32 - lift, 2.6 + e, o ? P_OUT : P_SKIN);
        } else {
          seg(41, 21 - lift, 39, 18 - lift, 2.6 + e, o ? P_OUT : P_SKIN);
        }
      }
      if (spec.equip === "dumbbell") drawDumbbell(41, 32 - lift, false);
      else if (spec.equip === "barbell" || isSmith) drawSidePlate(37, 19 - lift, false);
      drawSpark(37, 45);
      drawArrow(55, 42, phase === "EXC" ? "down" : "up", phase === "CON" ? P_PIN : "#3df2ff");
      break;
    }

    /* 59. SEATED CALF RAISE MACHINE (Seated knee pad pressing weight plate stack up from toes!) */
    case "calf_seated": {
      r(24, 40, 12, 3, P_PAD);
      r(28, 43, 3, F - 43, P_FRAME);
      r(44, F - 5, 10, 5, P_FRAME_LT);
      const lift = p * 4;
      // Hinged knee-pad arm + top plate horn
      seg(29, 44, 45, 36 - lift, 3, P_STEEL_DK);
      r(41, 33 - lift, 7, 4, P_PAD_HI);
      drawSidePlate(47, 29 - lift, false);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(30, 18, "right", o);
        seg(29, 24, 30, 38, 6 + e, o ? P_OUT : P_SHIRT);
        seg(30, 38, 44, 38 - lift, 4.8 + e, o ? P_OUT : P_SHORTS);
        seg(44, 38 - lift, 45, 50 - lift, 3.6 + e, o ? P_OUT : CALF_C);
        seg(43, F - 3 - lift, 48, F - 5, 2.5 + e, o ? P_OUT : P_SHOE);
        seg(31, 26, 40, 34 - lift, 2.6 + e, o ? P_OUT : P_SKIN); // hand holding knee lever handle!
      }
      drawSpark(48, 44);
      break;
    }

    /* 60. KETTLEBELL SWING (Crisp hip hinge snap swinging kettlebell from legs to shoulder height!) */
    case "kettlebell_swing": {
      const ang = 1.65 - p * 1.55; // between knees -> straight out front
      const hipBack = (1 - p) * 10;
      const shX = 41 + (1 - p) * 5;
      const shY = 23 + (1 - p) * 8;
      const hx = shX + Math.cos(ang) * 16;
      const hy = shY + Math.sin(ang) * 16;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(39, F - 2, 1, o);
        seg(39, F - 2, 40, 44, 3.6 + e, o ? P_OUT : P_SKIN);
        seg(40, 44, 36 - hipBack, 38 + (1 - p) * 3, 4.8 + e, o ? P_OUT : LEG_C);
        seg(36 - hipBack, 38 + (1 - p) * 3, shX, shY, 6 + e, o ? P_OUT : P_SHIRT);
        drawHead(shX + 2, shY - 6, "right", o);
        seg(shX, shY + 2, hx, hy, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawKettlebell(hx, hy);
      drawSpark(hx + 4, hy - 3);
      break;
    }

    /* 61. AB WHEEL ROLLOUT (Kneeling on mat, rolling yellow-hub wheel forward & pulling back) */
    case "core_wheel": {
      r(14, F - 2, 54, 2, P_PAD);
      const reach = (1 - p) * 20; // p=0 stretched flat forward, p=1 pulled knees-up!
      const wx = 44 + reach;
      const shX = 36 + reach * 0.8;
      const shY = 38 + (1 - p) * 7;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(18, F - 2, -1, o);
        seg(19, F - 2, 26, F - 3, 3.5 + e, o ? P_OUT : P_SKIN);
        seg(26, F - 3, 28, 41 + (1 - p) * 4, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(28, 41 + (1 - p) * 4, shX, shY, 5.5 + e, o ? P_OUT : CORE_C);
        drawHead(shX + 3, shY - 4, "right", o);
        seg(shX, shY + 1, wx, F - 5, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      // Ab Wheel (rubber tire + bright rim + handle)
      r(wx - 4, F - 9, 9, 9, P_OUT);
      r(wx - 3, F - 8, 7, 7, P_FRAME);
      r(wx - 2, F - 7, 5, 5, P_PIN);
      r(wx - 1, F - 6, 3, 3, P_STEEL);
      drawSpark(34, 42);
      break;
    }

    /* 62. HANGING LEG RAISE / TOES-TO-BAR (Hanging from pullup rack, curling toes up toward bar!) */
    case "core_hanging": {
      r(19, 6, 2, F - 6, P_FRAME);
      r(59, 6, 2, F - 6, P_FRAME);
      r(19, 6, 42, 2, P_STEEL);
      const legAng = 1.5 - p * 1.9; // straight down -> kicked up near bar!
      const footX = 36 + Math.cos(legAng) * 16;
      const footY = 34 + Math.sin(legAng) * 16;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        seg(36, 17, 36, 7, 2.8 + e, o ? P_OUT : P_SKIN);
        drawHead(38, 14, "right", o);
        seg(36, 18, 36, 34, 6 + e, o ? P_OUT : CORE_C);
        seg(36, 34, footX, footY, 4 + e, o ? P_OUT : P_SHORTS);
        drawShoe(footX + 1, footY, 1, o);
      }
      drawSpark(36, 32);
      break;
    }

    /* 63. CABLE CRUNCH / WOODCHOPPER (Kneeling below pulley crunching yellow rope down!) */
    case "core_cable_crunch": {
      drawWeightStack(10, 12, F, p);
      drawPulley(24, 16);
      const chop = spec.subVariant === "woodchop";
      if (chop) {
        const hx = 28 + p * 23, hy = 25 + p * 15;
        const twist = -2 + p * 5;
        seg(24, 16, hx, hy, 1.3, P_CABLE);
        for (let pass = 0; pass < 2; pass++) {
          const o = pass === 0;
          const e = o ? 2 : 0;
          drawHead(43 + twist * 0.4, 15, "front", o);
          r(38 - e / 2, 20 - e / 2, 10 + e, 16 + e, o ? P_OUT : CORE_C);
          r(39 - e / 2, 36 - e / 2, 8 + e, 7 + e, o ? P_OUT : P_SHORTS);
          r(39 - e / 2, 43 - e / 2, 3 + e, 11 + e, o ? P_OUT : P_SKIN);
          r(44 - e / 2, 43 - e / 2, 3 + e, 11 + e, o ? P_OUT : P_SKIN);
          drawShoe(40, F - 2, 0, o);
          drawShoe(45, F - 2, 0, o);
          seg(39 + twist * 0.3, 23, hx, hy, 2.8 + e, o ? P_OUT : P_SKIN);
          seg(47 + twist * 0.3, 23, hx, hy, 2.8 + e, o ? P_OUT : P_SKIN);
        }
        r(hx - 1, hy - 1, 3, 3, P_PIN);
      } else {
        const lean = p * 10;
        const hx = 37 - lean * 0.4, hy = 25 + lean * 1.1;
        seg(24, 16, hx, hy, 1.3, P_CABLE);
        for (let pass = 0; pass < 2; pass++) {
          const o = pass === 0;
          const e = o ? 2 : 0;
          drawShoe(50, F - 2, 1, o);
          seg(49, F - 2, 41, F - 2, 3.5 + e, o ? P_OUT : P_SKIN);
          seg(41, F - 2, 42, 41, 4.5 + e, o ? P_OUT : P_SHORTS);
          seg(42, 41, 39 - lean * 0.4, 27 + lean * 0.8, 6 + e, o ? P_OUT : CORE_C);
          drawHead(38 - lean * 0.5, 22 + lean, "left", o);
          seg(39 - lean * 0.4, 27 + lean * 0.8, hx, hy, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }
      drawSpark(39, 34);
      break;
    }

    /* 64. AB CRUNCH MACHINE (Seated overhead pads + weight stack tower flexing torso forward) */
    case "core_machine_crunch": {
      drawWeightStack(10, 12, F, p, 30, 14);
      r(28, 12, 10, 2, P_FRAME_LT);
      r(33, 39, 13, 3, P_PAD);
      r(38, 42, 3, F - 42, P_FRAME);
      r(28, 22, 3, 18, P_PAD_HI);
      const lean = p * 9;
      const shX = 34 + lean, shY = 25 + p * 6;
      seg(36, 13, shX + 4, shY - 1, 2.5, P_STEEL_DK); // machine pad arm pivoting cleanly clear of head!
      r(shX + 2, shY - 2, 4, 4, P_PLATE);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        seg(35, 38, shX, shY, 6 + e, o ? P_OUT : CORE_C);
        seg(35, 38, 45, 40, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(45, 40, 46, F - 2, 3.2 + e, o ? P_OUT : P_SKIN);
        drawShoe(46, F - 2, 1, o);
        drawHead(shX + 1, shY - 6, "right", o);
        seg(shX, shY + 1, shX + 3, shY - 1, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(39, 32);
      break;
    }

    /* 65. PLANK / HOLLOW HOLD (Locked isometric plank w/ shimmering core tension waves!) */
    case "core_plank": {
      r(14, F - 2, 54, 2, P_PAD);
      const tremble = Math.sin(p * Math.PI * 2) * 0.6;
      const shY = 39 + tremble;
      const hipY = 42 + tremble;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(18, F - 2, 1, o);
        seg(19, F - 2, 35, hipY, 4 + e, o ? P_OUT : P_SHORTS);
        seg(35, hipY, 53, shY, 6 + e, o ? P_OUT : CORE_C);
        drawHead(58, shY - 3, "right", o);
        seg(52, shY + 2, 51, F - 2, 3 + e, o ? P_OUT : P_SKIN);
        seg(51, F - 2, 56, F - 2, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      r(37, hipY + 4, 12, 1, "#34d399");
      drawSpark(44, hipY - 3);
      break;
    }

    /* 66. FLOOR CRUNCH / V-UP / SIT-UP (Mat on floor flexing upper chest up toward knees!) */
    case "core_floor": {
      r(14, F - 2, 54, 2, P_PAD);
      const ang = 0.05 + p * 0.9;
      const shX = 38 - Math.cos(ang) * 14;
      const shY = F - 4 - Math.sin(ang) * 14;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        seg(38, F - 4, shX, shY, 6 + e, o ? P_OUT : CORE_C);
        drawHead(shX - 4, shY - 3, "up", o);
        seg(38, F - 4, 49, 43, 4.5 + e, o ? P_OUT : P_SHORTS);
        seg(49, 43, 55, F - 2, 3.4 + e, o ? P_OUT : P_SKIN);
        drawShoe(56, F - 2, 1, o);
        seg(shX + 1, shY, shX + 3, shY - 4, 2.6 + e, o ? P_OUT : P_SKIN);
      }
      if (spec.equip === "plate") drawSidePlate(shX + 3, shY - 2, false);
      drawSpark(36, 44);
      break;
    }

    /* 67. JUMP ROPE (Bouncing lightly on toes spinning bright cyan rope arc under feet & overhead!) */
    case "jump_rope": {
      const t = cyclePct * Math.PI * 2;
      const hop = Math.round((1 + Math.cos(t)) * 2.2);
      const wristDx = Math.cos(t) * 2;
      const wristDy = Math.sin(t) * 2;
      const ropeY = Math.round(3 + ((1 + Math.cos(t)) / 2) * (F - 4));
      const midY = Math.round((31 - hop + ropeY) / 2);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, 14 - hop, "front", o);
        r(35 - e / 2, 19 - hop - e / 2, 10 + e, 15 + e, o ? P_OUT : P_SHIRT);
        r(36 - e / 2, 34 - hop - e / 2, 8 + e, 8 + e, o ? P_OUT : P_SHORTS);
        r(36 - e / 2, 42 - hop - e / 2, 3 + e, 10 + e, o ? P_OUT : CALF_C);
        r(41 - e / 2, 42 - hop - e / 2, 3 + e, 10 + e, o ? P_OUT : CALF_C);
        drawShoe(37, F - 2 - hop, 0, o);
        drawShoe(43, F - 2 - hop, 0, o);
        seg(35, 22 - hop, 29 + wristDx, 31 - hop + wristDy, 2.8 + e, o ? P_OUT : P_SKIN);
        seg(45, 22 - hop, 51 - wristDx, 31 - hop + wristDy, 2.8 + e, o ? P_OUT : P_SKIN);
      }
      // Draw wide cyan rope U-arch clearing well above head or under shoes
      seg(29 + wristDx, 31 - hop + wristDy, 26, midY, 1, "#3df2ff");
      seg(26, midY, 33, ropeY, 1, "#3df2ff");
      seg(33, ropeY, 47, ropeY, 1, "#3df2ff");
      seg(47, ropeY, 54, midY, 1, "#3df2ff");
      seg(54, midY, 51 - wristDx, 31 - hop + wristDy, 1, "#3df2ff");
      drawSpark(40, F - 3);
      break;
    }

    /* 68. BURPEE (Explosive plank drop -> stand -> high jump!) */
    case "burpee": {
      if (p < 0.52) {
        // Horizontal plank phase
        const drop = (1 - p / 0.52) * 5;
        for (let pass = 0; pass < 2; pass++) {
          const o = pass === 0;
          const e = o ? 2 : 0;
          drawShoe(18, F - 2, 1, o);
          seg(19, F - 2, 36, 44 + drop, 4 + e, o ? P_OUT : P_SHORTS);
          seg(36, 44 + drop, 53, 39 + drop, 6 + e, o ? P_OUT : CHEST_C);
          drawHead(57, 35 + drop, "right", o);
          seg(53, 40 + drop, 53, F - 2, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      } else {
        // Vertical jump phase!
        const jump = Math.sin(((p - 0.52) / 0.48) * Math.PI) * 10;
        for (let pass = 0; pass < 2; pass++) {
          const o = pass === 0;
          const e = o ? 2 : 0;
          drawHead(40, 15 - jump, "front", o);
          r(35 - e / 2, 20 - jump - e / 2, 10 + e, 15 + e, o ? P_OUT : P_SHIRT);
          r(36 - e / 2, 35 - jump - e / 2, 8 + e, 8 + e, o ? P_OUT : P_SHORTS);
          r(36 - e / 2, 43 - jump - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
          r(41 - e / 2, 43 - jump - e / 2, 3 + e, 10 + e, o ? P_OUT : P_SKIN);
          drawShoe(37, F - 2 - jump, 0, o);
          drawShoe(43, F - 2 - jump, 0, o);
          seg(35, 21 - jump, 32, 9 - jump, 2.8 + e, o ? P_OUT : P_SKIN);
          seg(45, 21 - jump, 48, 9 - jump, 2.8 + e, o ? P_OUT : P_SKIN);
        }
        drawSpark(40, 5);
      }
      break;
    }

    /* 69. OLYMPIC BARBELL (Clean / Snatch / Thruster exploding bar from shins -> overhead!) */
    case "olympic_bar": {
      const barY = 42 - p * 31;
      const drop = p < 0.45 ? p * 8 : (1 - p) * 6;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawHead(40, 16 + drop, "front", o);
        r(34 - e / 2, 21 + drop - e / 2, 12 + e, 15 + e, o ? P_OUT : P_SHIRT);
        r(35 - e / 2, 36 + drop - e / 2, 10 + e, 7 + e, o ? P_OUT : P_SHORTS);
        r(35 - e / 2, 43 + drop - e / 2, 3 + e, 10 - drop * 0.8 + e, o ? P_OUT : P_SKIN);
        r(42 - e / 2, 43 + drop - e / 2, 3 + e, 10 - drop * 0.8 + e, o ? P_OUT : P_SKIN);
        drawShoe(36, F - 2, 0, o);
        drawShoe(44, F - 2, 0, o);
        for (const s of [-1, 1]) {
          seg(40 + s * 6, 22 + drop, 40 + s * 9, barY, 2.8 + e, o ? P_OUT : P_SKIN);
        }
      }
      drawFrontBarbell(40, barY, 20);
      drawSpark(40, 6);
      break;
    }

    /* 70. SLED PUSH (Athlete leaning 45° forward driving heavy iron plate-loaded prowler sled!) */
    case "sled_push": {
      const stride = Math.sin(cyclePct * Math.PI * 2) * 5;
      const sx = 46;
      // Heavy iron Prowler sled + upright push poles + bumper plates
      r(sx - 2, F - 3, 24, 3, P_STEEL_DK);
      r(sx + 1, F - 24, 3, 22, P_FRAME_LT);
      r(sx + 14, F - 19, 3, 17, P_FRAME_LT);
      drawSidePlate(sx + 12, F - 9, true);
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(25 + stride, F - 2, 1, o);
        drawShoe(25 - stride, F - 2, 1, o);
        seg(25 + stride, F - 2, 29, 39, 3.8 + e, o ? P_OUT : LEG_C);
        seg(25 - stride, F - 2, 29, 39, 3.8 + e, o ? P_OUT : P_SHORTS_DK);
        seg(29, 39, 41, 29, 6 + e, o ? P_OUT : P_SHIRT);
        drawHead(44, 26, "right", o);
        seg(40, 31, sx + 1, F - 22, 3 + e, o ? P_OUT : P_SKIN);
      }
      drawSpark(sx + 20, F - 5);
      break;
    }

    /* 71. WALL BALL (Squatting with medicine ball at chest -> throwing high up to wall target!) */
    case "wall_ball": {
      r(62, 6, 4, F - 6, P_FRAME);
      r(58, 12, 6, 6, P_PIN); // Wall target box
      const drop = (1 - p) * 11;
      const ballX = p > 0.55 ? 44 + ((p - 0.55) / 0.45) * 14 : 44;
      const ballY = p > 0.55 ? 25 - ((p - 0.55) / 0.45) * 14 : 25 + drop;
      const shY = 21 + drop;
      const hipY = 35 + drop;
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0;
        const e = o ? 2 : 0;
        drawShoe(40, F - 2, 1, o);
        seg(40, F - 2, 44 + (1 - p) * 4, 44, 3.6 + e, o ? P_OUT : P_SKIN);
        seg(44 + (1 - p) * 4, 44, 35, hipY, 4.8 + e, o ? P_OUT : LEG_C);
        seg(35, hipY, 39, shY, 6 + e, o ? P_OUT : P_SHIRT);
        drawHead(40, shY - 6, "right", o);
        seg(40, shY + 2, Math.min(48, ballX - 2), Math.max(19, ballY), 2.8 + e, o ? P_OUT : P_SKIN);
      }
      // Wall ball (orange/red stitched medicine ball)
      r(ballX - 4, ballY - 4, 9, 9, P_OUT);
      r(ballX - 3, ballY - 3, 7, 7, P_PLATE);
      r(ballX - 2, ballY - 2, 3, 3, P_PLATE_HI);
      drawSpark(57, 13);
      break;
    }
  }
}
