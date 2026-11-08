"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FxEvent, onFx } from "@/lib/fx";
import { SPRING } from "./ui";

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string }
interface T { x: number; y: number; text: string; color: string; life: number }

const PALETTE = ["#ffe14d", "#3df2ff", "#ff3f6c", "#7dff6a", "#ffffff"];

/** Full-screen particle + floating-text canvas. Runs rAF only while particles are alive. */
export default function FxLayer() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [banner, setBanner] = useState<{ id: number; title: string; sub: string; color: string } | null>(null);

  useEffect(() => {
    const cv = ref.current!;
    const c = cv.getContext("2d")!;
    const parts: P[] = []; const texts: T[] = [];
    let raf = 0, last = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    };
    resize(); addEventListener("resize", resize);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const s = Math.ceil(p.size * Math.min(1, p.life / p.max * 2) / 2) * 2;
        c.fillStyle = p.color;
        c.fillRect(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2, s, s);
      }
      c.textAlign = "center"; c.font = "12px 'Press Start 2P', monospace";
      for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i];
        t.life -= dt; if (t.life <= 0) { texts.splice(i, 1); continue; }
        const k = 1 - t.life / 1.1;
        const y = Math.round(t.y - 50 * Math.sqrt(k));
        c.globalAlpha = Math.min(1, t.life * 2.5);
        c.fillStyle = "#000"; c.fillText(t.text, t.x + 2, y + 2);
        c.fillStyle = t.color; c.fillText(t.text, t.x, y);
        c.globalAlpha = 1;
      }
      raf = parts.length || texts.length ? requestAnimationFrame(loop) : 0;
      if (!raf) { last = 0; c.clearRect(0, 0, innerWidth, innerHeight); }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    const shell = () => document.getElementById("shell");
    const off = onFx((e: FxEvent) => {
      if (e.kind === "burst") {
        const n = e.count ?? 14;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2, sp = (e.big ? 500 : 260) * (0.4 + Math.random());
          const max = 0.5 + Math.random() * 0.5;
          parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 220, life: max, max, size: e.big ? 8 : 6, color: e.color && Math.random() > 0.35 ? e.color : PALETTE[i % PALETTE.length] });
        }
        if (parts.length > 400) parts.splice(0, parts.length - 400);
        kick();
      } else if (e.kind === "text") {
        texts.push({ x: e.x, y: e.y, text: e.text, color: e.color ?? "#fff", life: 1.1 }); kick();
      } else if (e.kind === "shake") {
        const p = e.power ?? 3;
        shell()?.animate(
          [{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(${p}px,${-p}px,0)` }, { transform: `translate3d(${-p}px,${p / 2}px,0)` }, { transform: `translate3d(${p / 2}px,${p}px,0)` }, { transform: "translate3d(0,0,0)" }],
          { duration: 180, easing: "steps(4, end)" },
        );
      } else if (e.kind === "levelup") {
        setBanner({ id: Date.now(), title: `NIVEL ${e.level}!`, sub: "LEVEL UP · +STATS", color: "#ffe14d" });
        for (let i = 0; i < 4; i++) setTimeout(() => {
          const x = innerWidth * (0.2 + Math.random() * 0.6), y = innerHeight * (0.25 + Math.random() * 0.3);
          for (let k = 0; k < 40; k++) { const a = Math.random() * 6.28, sp = 200 + Math.random() * 450, max = .8 + Math.random() * .6; parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, life: max, max, size: 8, color: PALETTE[k % 5] }); }
          kick();
        }, i * 180);
      } else if (e.kind === "pr") {
        setBanner({ id: Date.now(), title: "¡NUEVO PR!", sub: e.name.toUpperCase(), color: "#ff3f6c" });
      }
    });
    return () => { off(); cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 1900);
    return () => clearTimeout(t);
  }, [banner]);

  return (
    <>
      <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner.id}
            className="fixed inset-0 z-[55] flex flex-col items-center justify-center gap-4 bg-black/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onPointerDown={() => setBanner(null)}
          >
            <motion.div
              initial={{ scale: 0.3, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 1.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 14, mass: 0.8 }}
              className="pixel-title text-center text-3xl sm:text-5xl"
              style={{ color: banner.color, textShadow: "4px 4px 0 #000, 0 0 24px " + banner.color }}
            >{banner.title}</motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...SPRING, delay: 0.15 }} className="pixel-title text-xs text-white">
              {banner.sub}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
