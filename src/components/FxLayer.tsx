"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FxEvent, onFx } from "@/lib/fx";
import { SPRING } from "./ui";

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string }
interface T { x: number; y: number; text: string; color: string; life: number }
interface Bolt { pts: { x: number; y: number }[]; color: string; life: number; max: number; width: number }
interface Flame { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string }

const PALETTE = ["#ffe14d", "#3df2ff", "#ff3f6c", "#7dff6a", "#ffffff"];
const FLAME_PALETTE = ["#ff3f6c", "#ff7a1a", "#ffe14d", "#fff7ed"];

/** Full-screen particle, zigzag pixel lightning, edge flames & floating-text canvas. */
export default function FxLayer() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [banner, setBanner] = useState<{ id: number; title: string; sub: string; color: string } | null>(null);

  useEffect(() => {
    const cv = ref.current!;
    const c = cv.getContext("2d")!;
    const parts: P[] = [];
    const texts: T[] = [];
    const bolts: Bolt[] = [];
    const flames: Flame[] = [];
    let flashColor = "#ffffff";
    let flashAlpha = 0;

    let raf = 0, last = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr;
      cv.height = innerHeight * dpr;
    };
    resize();
    addEventListener("resize", resize);

    const drawPixelLine = (x0: number, y0: number, x1: number, y1: number, step: number, color: string) => {
      c.fillStyle = color;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      const steps = Math.max(1, Math.ceil(dist / Math.max(2, step * 0.6)));
      for (let i = 0; i <= steps; i++) {
        const px = Math.round((x0 + (dx * i) / steps) / step) * step;
        const py = Math.round((y0 + (dy * i) / steps) / step) * step;
        c.fillRect(px, py, step, step);
      }
    };

    const spawnLightning = (count: number) => {
      const w = innerWidth;
      const h = innerHeight;
      for (let b = 0; b < count; b++) {
        const startX = w * (0.12 + Math.random() * 0.76);
        const startY = 0;
        const endY = h * (0.55 + Math.random() * 0.4);
        const segs = 9 + Math.floor(Math.random() * 5);
        const pts: { x: number; y: number }[] = [{ x: startX, y: startY }];
        let curX = startX;
        for (let s = 1; s <= segs; s++) {
          curX += Math.round(((Math.random() - 0.5) * 90) / 4) * 4;
          curX = Math.max(16, Math.min(w - 16, curX));
          pts.push({ x: curX, y: (endY * s) / segs });
        }
        bolts.push({
          pts,
          color: b % 2 === 0 ? "#3df2ff" : "#ffe14d",
          life: 0.28 + Math.random() * 0.14,
          max: 0.36,
          width: b === 0 ? 6 : 4,
        });
      }
    };

    const spawnFlames = (count: number) => {
      const w = innerWidth;
      const h = innerHeight;
      for (let i = 0; i < count; i++) {
        const edge = i % 3;
        const x =
          edge === 0
            ? Math.random() * Math.min(64, w * 0.16)
            : edge === 1
            ? w - Math.random() * Math.min(64, w * 0.16)
            : Math.random() * w;
        const y = edge === 2 ? h - Math.random() * 24 : h * (0.45 + Math.random() * 0.52);
        const max = 0.45 + Math.random() * 0.45;
        flames.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 55,
          vy: -170 - Math.random() * 260,
          life: max,
          max,
          size: Math.random() > 0.4 ? 8 : 6,
          color: FLAME_PALETTE[i % FLAME_PALETTE.length],
        });
      }
      if (flames.length > 240) flames.splice(0, flames.length - 240);
    };

    const shell = () => document.getElementById("shell");
    const triggerShake = (power: number) => {
      shell()?.animate(
        [
          { transform: "translate3d(0,0,0)" },
          { transform: `translate3d(${power}px,${-power}px,0)` },
          { transform: `translate3d(${-power}px,${power * 0.6}px,0)` },
          { transform: `translate3d(${power * 0.6}px,${power}px,0)` },
          { transform: `translate3d(${-power * 0.4}px,${-power * 0.4}px,0)` },
          { transform: "translate3d(0,0,0)" },
        ],
        { duration: power >= 5 ? 280 : 190, easing: "steps(5, end)" }
      );
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, innerWidth, innerHeight);

      if (flashAlpha > 0.01) {
        c.globalAlpha = Math.min(0.38, flashAlpha);
        c.fillStyle = flashColor;
        c.fillRect(0, 0, innerWidth, innerHeight);
        c.globalAlpha = 1;
        flashAlpha = Math.max(0, flashAlpha - dt * 2.8);
      }

      for (let i = flames.length - 1; i >= 0; i--) {
        const f = flames[i];
        f.life -= dt;
        if (f.life <= 0) {
          flames.splice(i, 1);
          continue;
        }
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        const s = Math.max(2, Math.ceil((f.size * (f.life / f.max)) / 2) * 2);
        c.globalAlpha = Math.min(0.92, (f.life / f.max) * 1.3);
        c.fillStyle = "#000";
        c.fillRect(Math.round(f.x / 2) * 2 + 2, Math.round(f.y / 2) * 2 + 2, s, s);
        c.fillStyle = f.color;
        c.fillRect(Math.round(f.x / 2) * 2, Math.round(f.y / 2) * 2, s, s);
        c.globalAlpha = 1;
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        p.vy += 900 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const s = Math.ceil((p.size * Math.min(1, (p.life / p.max) * 2)) / 2) * 2;
        c.fillStyle = p.color;
        c.fillRect(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2, s, s);
      }

      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        b.life -= dt;
        if (b.life <= 0) {
          bolts.splice(i, 1);
          continue;
        }
        const alpha = Math.min(1, (b.life / b.max) * 1.6);
        c.globalAlpha = alpha;
        for (let k = 0; k < b.pts.length - 1; k++) {
          const p0 = b.pts[k];
          const p1 = b.pts[k + 1];
          drawPixelLine(p0.x, p0.y, p1.x, p1.y, b.width + 4, b.color);
          drawPixelLine(p0.x, p0.y, p1.x, p1.y, Math.max(2, b.width - 2), "#ffffff");
        }
        c.globalAlpha = 1;
      }

      c.textAlign = "center";
      c.font = "12px 'Press Start 2P', monospace";
      for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i];
        t.life -= dt;
        if (t.life <= 0) {
          texts.splice(i, 1);
          continue;
        }
        const k = 1 - t.life / 1.1;
        const y = Math.round(t.y - 50 * Math.sqrt(k));
        c.globalAlpha = Math.min(1, t.life * 2.5);
        c.fillStyle = "#000";
        c.fillText(t.text, t.x + 2, y + 2);
        c.fillStyle = t.color;
        c.fillText(t.text, t.x, y);
        c.globalAlpha = 1;
      }

      const alive = parts.length || texts.length || bolts.length || flames.length || flashAlpha > 0.01;
      raf = alive ? requestAnimationFrame(loop) : 0;
      if (!raf) {
        last = 0;
        c.clearRect(0, 0, innerWidth, innerHeight);
      }
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const off = onFx((e: FxEvent) => {
      if (e.kind === "burst") {
        const n = e.count ?? 14;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = (e.big ? 500 : 260) * (0.4 + Math.random());
          const max = 0.5 + Math.random() * 0.5;
          parts.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 220,
            life: max,
            max,
            size: e.big ? 8 : 6,
            color: e.color && Math.random() > 0.35 ? e.color : PALETTE[i % PALETTE.length],
          });
        }
        if (parts.length > 400) parts.splice(0, parts.length - 400);
        kick();
      } else if (e.kind === "text") {
        texts.push({ x: e.x, y: e.y, text: e.text, color: e.color ?? "#fff", life: 1.1 });
        kick();
      } else if (e.kind === "shake") {
        triggerShake(e.power ?? 3);
      } else if (e.kind === "levelup") {
        setBanner({ id: Date.now(), title: `NIVEL ${e.level}!`, sub: "LEVEL UP · +STATS", color: "#ffe14d" });
        spawnLightning(3);
        spawnFlames(36);
        flashColor = "#ffe14d";
        flashAlpha = 0.25;
        triggerShake(5);
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            const x = innerWidth * (0.2 + Math.random() * 0.6);
            const y = innerHeight * (0.25 + Math.random() * 0.3);
            for (let k = 0; k < 40; k++) {
              const a = Math.random() * 6.28;
              const sp = 200 + Math.random() * 450;
              const max = 0.8 + Math.random() * 0.6;
              parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, life: max, max, size: 8, color: PALETTE[k % 5] });
            }
            kick();
          }, i * 180);
        }
      } else if (e.kind === "pr") {
        setBanner({ id: Date.now(), title: "¡NUEVO PR!", sub: e.name.toUpperCase(), color: "#ff3f6c" });
        spawnLightning(4);
        spawnFlames(44);
        flashColor = "#ff3f6c";
        flashAlpha = 0.3;
        triggerShake(5);
        kick();
      } else if (e.kind === "surge") {
        const mode = e.mode ?? "both";
        const intensity = e.intensity ?? 2;
        if (mode === "lightning" || mode === "both") {
          spawnLightning(intensity === 3 ? 6 : intensity === 2 ? 4 : 2);
        }
        if (mode === "flame" || mode === "both") {
          spawnFlames(intensity === 3 ? 64 : intensity === 2 ? 42 : 24);
        }
        flashColor = mode === "flame" ? "#ff7a1a" : intensity === 3 ? "#ffe14d" : "#3df2ff";
        flashAlpha = intensity === 3 ? 0.34 : intensity === 2 ? 0.22 : 0.14;
        triggerShake(intensity === 3 ? 6 : intensity === 2 ? 4 : 2.5);
        kick();
      }
    });

    return () => {
      off();
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 1900);
    return () => clearTimeout(t);
  }, [banner]);

  return (
    <>
      <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[95] h-full w-full" />
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner.id}
            className="fixed inset-0 z-[94] flex flex-col items-center justify-center gap-4 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={() => setBanner(null)}
          >
            <motion.div
              initial={{ scale: 0.3, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 14, mass: 0.8 }}
              className="pixel-title text-center text-3xl sm:text-5xl"
              style={{ color: banner.color, textShadow: "4px 4px 0 #000, 0 0 24px " + banner.color }}
            >
              {banner.title}
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...SPRING, delay: 0.15 }}
              className="pixel-title text-xs text-white"
            >
              {banner.sub}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
