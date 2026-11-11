"use client";
/** 8-bit sound synth (Web Audio API), haptics and a tiny FX event bus. */

let ctx: AudioContext | null = null;
let enabled = true;
export const setSoundEnabled = (v: boolean) => { enabled = v; };

function ac() {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = "square", vol = 0.08, delay = 0, slideTo?: number) {
  const c = ac(); if (!c || !enabled) return;
  try {
    const t = c.currentTime + delay;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  } catch {}
}

function noise(dur: number, vol = 0.06) {
  const c = ac(); if (!c || !enabled) return;
  try {
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(); const g = c.createGain();
    g.gain.value = vol; s.buffer = buf; s.connect(g).connect(c.destination); s.start();
  } catch {}
}

export const sfx = {
  tap: () => tone(880, 0.04, "square", 0.04),
  tick: () => tone(1320, 0.03, "triangle", 0.05),
  set: () => { tone(523, 0.07); tone(784, 0.09, "square", 0.08, 0.06); },
  coin: () => { tone(988, 0.06, "square", 0.06); tone(1319, 0.18, "square", 0.06, 0.06); },
  pr: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, "square", 0.08, i * 0.07)),
  levelUp: () => { [392, 523, 659, 784, 1047, 784, 1047, 1568].forEach((f, i) => tone(f, 0.16, i % 2 ? "triangle" : "square", 0.08, i * 0.09)); noise(0.3, 0.03); },
  error: () => tone(160, 0.18, "sawtooth", 0.06, 0, 90),
  whoosh: () => tone(300, 0.12, "triangle", 0.05, 0, 900),
  restDone: () => [0, 0.25, 0.5].forEach((d) => { tone(1047, 0.12, "square", 0.08, d); tone(1568, 0.1, "square", 0.05, d + 0.1); }),
  flex: () => { tone(110, 0.2, "sawtooth", 0.05, 0, 220); noise(0.12, 0.03); },
  ironClank: () => {
    tone(220, 0.09, "triangle", 0.14);
    tone(880, 0.14, "square", 0.09, 0.02, 440);
    noise(0.12, 0.08);
  },
  doorOpen: () => {
    tone(160, 0.28, "sawtooth", 0.06, 0, 600);
    noise(0.18, 0.04);
  },
  chalk: () => {
    noise(0.09, 0.07);
    tone(440, 0.04, "triangle", 0.04);
  },
  liftTension: () => {
    tone(110, 0.35, "sawtooth", 0.06, 0, 240);
  },
  crtTurnOn: () => {
    tone(1800, 0.05, "sine", 0.09, 0, 900);
    tone(110, 0.14, "sawtooth", 0.07, 0.02, 50);
  },
  barbellSlam: () => {
    tone(180, 0.18, "triangle", 0.2, 0, 45);
    tone(880, 0.14, "square", 0.12, 0.01, 320);
    noise(0.2, 0.14);
  },
  bossRoar: () => {
    tone(75, 0.45, "sawtooth", 0.15, 0, 40);
    noise(0.35, 0.08);
  },
  bossHit: () => {
    tone(120, 0.12, "triangle", 0.18, 0, 50);
    noise(0.15, 0.12);
  },
  petHit: () => {
    tone(660, 0.06, "square", 0.05, 0, 990);
    tone(320, 0.08, "triangle", 0.05, 0.04, 160);
  },
  achievement: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, "square", 0.07, i * 0.08));
  },
  summon: () => {
    [440, 554, 659, 880].forEach((f, i) => tone(f, 0.12, "triangle", 0.07, i * 0.055));
  },
  lightning: () => {
    noise(0.18, 0.12);
    tone(980, 0.09, "sawtooth", 0.09, 0, 220);
    tone(1560, 0.07, "square", 0.07, 0.03, 420);
  },
  cataclysm: () => {
    noise(0.35, 0.18);
    tone(170, 0.3, "sawtooth", 0.17, 0, 38);
    tone(1320, 0.14, "square", 0.1, 0.02, 240);
    tone(659, 0.22, "square", 0.09, 0.12, 95);
  },
};

export const haptic = (p: number | number[] = 8) => {
  try { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(p); } catch { /* noop */ }
};

/* ---------- FX bus ---------- */
export type FxEvent =
  | { kind: "burst"; x: number; y: number; color?: string; count?: number; big?: boolean }
  | { kind: "text"; x: number; y: number; text: string; color?: string }
  | { kind: "shake"; power?: number }
  | { kind: "levelup"; level: number }
  | { kind: "pr"; name: string }
  | { kind: "surge"; mode?: "lightning" | "flame" | "both"; intensity?: 1 | 2 | 3 };

type L = (e: FxEvent) => void;
const listeners = new Set<L>();
export const onFx = (l: L) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const fx = (e: FxEvent) => listeners.forEach((l) => l(e));

/** helper: emit at an element's center */
export const fxAt = (el: Element | null, make: (x: number, y: number) => FxEvent[]) => {
  const r = el?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
  const y = r ? r.top + r.height / 2 : window.innerHeight / 2;
  make(x, y).forEach(fx);
};
