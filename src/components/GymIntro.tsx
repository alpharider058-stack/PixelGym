"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useGame } from "@/lib/store";
import { useMyAvatar, useStats } from "@/lib/hooks";
import { haptic, setSoundEnabled, sfx } from "@/lib/fx";
import Avatar from "./Avatar";
import { SPRING, APPLE_SPRING } from "./ui";

interface Props {
  onMorph: () => void;
  onDone: () => void;
}

interface SummonParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  phase: number;
}

type IntroPhase = "flash" | "summon" | "morph" | "done";

export default function GymIntro({ onMorph, onDone }: Props) {
  const avatarCfg = useMyAvatar();
  const stats = useStats();
  const streak = useGame((s) => s.streak);
  const name = useGame((s) => s.name);

  const [phase, setPhase] = useState<IntroPhase>("flash");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<SummonParticle[]>([]);
  const morphedRef = useRef(false);
  const finishedRef = useRef(false);

  const onMorphRef = useRef(onMorph);
  const onDoneRef = useRef(onDone);
  onMorphRef.current = onMorph;
  onDoneRef.current = onDone;

  const hour = new Date().getHours();
  const timeBadge =
    hour >= 6 && hour < 14
      ? "☀ LUZ DE ALBA"
      : hour >= 14 && hour < 21
      ? "🌅 ATARDECER RETRO"
      : "🌙 MODO NOCTURNO";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pixelgym-rpg-v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { sound?: boolean } };
        if (typeof parsed?.state?.sound === "boolean") {
          setSoundEnabled(parsed.state.sound);
        }
      }
    } catch {}

    // 1. 0.00s – 0.24s: Portal starflash & summon chime
    sfx.summon();
    haptic([10, 20]);

    // Seed ascending 8-bit portal particles
    const colors = ["#3df2ff", "#ffe14d", "#ffffff", "#ff3f6c", "#7dff6a"];
    const seeded: SummonParticle[] = [];
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const dist = 26 + Math.random() * 68;
      seeded.push({
        x: 160 + Math.cos(angle) * dist,
        y: 205 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 28,
        vy: -75 - Math.random() * 115,
        size: i % 3 === 0 ? 5 : 3,
        color: colors[i % colors.length],
        alpha: 0.75 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = seeded;

    // 2. 0.22s – 0.80s: Champion Crest & Avatar Summon reveal
    const tSummon = setTimeout(() => {
      setPhase("summon");
    }, 220);

    // 3. 0.82s – 1.20s: Smooth shared-layout morph directly into Dashboard Hero Card
    const tMorph = setTimeout(() => {
      if (!morphedRef.current) {
        morphedRef.current = true;
        setPhase("morph");
        onMorphRef.current();
      }
    }, 820);

    // 4. 1.20s: Intro Finished
    const tDone = setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        setPhase("done");
        onDoneRef.current();
      }
    }, 1200);

    return () => {
      clearTimeout(tSummon);
      clearTimeout(tMorph);
      clearTimeout(tDone);
    };
  }, []);

  // Crisp 8-bit portal particle & rotating rune pixel canvas
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      elapsed += dt;

      ctx.clearRect(0, 0, cv.width, cv.height);

      // Rotating 8-bit pixel rune halo behind crest
      if (phase === "flash" || phase === "summon") {
        const ringAlpha = phase === "flash" ? Math.min(1, elapsed * 5) : 0.9;
        ctx.globalAlpha = ringAlpha;
        const runes = 12;
        for (let i = 0; i < runes; i++) {
          const a = (i / runes) * Math.PI * 2 + elapsed * 2.4;
          const rx = 160 + Math.cos(a) * 92;
          const ry = 160 + Math.sin(a) * 92;
          ctx.fillStyle = "#000";
          ctx.fillRect(Math.round(rx) - 2, Math.round(ry) - 2, 7, 7);
          ctx.fillStyle = i % 2 === 0 ? "#ffe14d" : "#3df2ff";
          ctx.fillRect(Math.round(rx) - 3, Math.round(ry) - 3, 5, 5);
        }
        ctx.globalAlpha = 1;
      }

      // Ascending summon energy pixels
      const parts = particlesRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += (p.vx + Math.sin(elapsed * 6 + p.phase) * 18) * dt;
        p.y += p.vy * dt;
        p.alpha -= dt * (phase === "morph" ? 2.4 : 0.85);
        if (p.alpha <= 0) {
          parts.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = "#000";
        ctx.fillRect(Math.round(p.x) + 1, Math.round(p.y) + 1, p.size, p.size);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      ctx.globalAlpha = 1;

      if (parts.length > 0 || phase === "flash" || phase === "summon") {
        raf = requestAnimationFrame(tick);
      }
    };

    last = performance.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const handleSkip = () => {
    if (finishedRef.current) return;
    if (!morphedRef.current) {
      morphedRef.current = true;
      onMorphRef.current();
    }
    finishedRef.current = true;
    setPhase("done");
    onDoneRef.current();
  };

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center select-none overflow-hidden ${
        phase === "morph" ? "pointer-events-none" : "pointer-events-auto cursor-pointer"
      }`}
      onClick={handleSkip}
    >
      {/* Portal backdrop fading cleanly during morph */}
      <motion.div
        className="absolute inset-0 bg-[#090A0F]"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "morph" ? 0 : 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      />

      {/* Crisp radial cyber vignette glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "morph" ? 0 : 0.85 }}
        transition={{ duration: 0.25 }}
        style={{
          background:
            "radial-gradient(circle at 50% 48%, rgba(61,242,255,0.16) 0%, rgba(255,225,77,0.08) 28%, rgba(9,10,15,0) 64%)",
        }}
      />

      {/* Phase 1: Radial Pixel Starflash & Portal Gate (0.00s - 0.22s, cleanly behind card) */}
      <AnimatePresence>
        {phase === "flash" && (
          <motion.div
            key="portal-flash"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <motion.div
              initial={{ scale: 0.2, rotate: 0, opacity: 0.9 }}
              animate={{ scale: 1.4, rotate: 45, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="h-32 w-32 border-4 border-[#3df2ff] bg-[#ffe14d]/15 shadow-[0_0_28px_#3df2ff]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Summon Stage */}
      <div className="relative z-20 flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="pointer-events-none pixelated absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        />

        {phase !== "morph" && (
          <div className="relative z-20 flex flex-col items-center">
            {/* Top Luminance Badge: Time of Day + Hero Name */}
            <motion.div
              initial={{ y: 12, opacity: 0, scale: 0.85 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={APPLE_SPRING}
              className="mb-3 flex flex-col items-center gap-1.5"
            >
              <div className="pixel-title border border-[#3df2ff]/60 bg-[#0d1d2a] px-2.5 py-1 text-[7px] text-[#3df2ff] shadow-[2px_2px_0_#000]">
                {timeBadge}
              </div>
              <div className="pixel-title text-xs sm:text-sm text-[var(--gold)] tracking-wider" style={{ textShadow: "2px 2px 0 #000" }}>
                {name} · LV {stats.level}
              </div>
            </motion.div>

            {/* Champion Crest Frame -> morphs seamlessly into Dashboard Hero Card */}
            <motion.div
              layoutId="hero-shield-panel"
              transition={SPRING}
              className="panel relative flex flex-col items-center justify-center border-2 border-[var(--gold)] bg-[#121626] p-4 shadow-[0_0_28px_rgba(255,225,77,0.28),4px_4px_0_#000]"
            >
              <motion.div
                layoutId="hero-avatar-box"
                initial={{ scale: 0.55, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="frame9 relative z-20 overflow-hidden bg-black"
              >
                <Avatar
                  cfg={avatarCfg}
                  scale={2}
                  interactive={false}
                  animate={phase === "summon"}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.18 }}
                className="mt-2.5 flex items-center gap-2"
              >
                <span className="pixel-title border border-black bg-[var(--gold)] px-2 py-0.5 text-[7.5px] font-bold text-black">
                  {streak > 0 ? `🔥 RACHA ${streak}D` : "⚡ LISTO"}
                </span>
                <span className="pixel-title text-[7px] text-[#3df2ff]">
                  STR {stats.str}
                </span>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.25 }}
              className="mt-4 pixel-title text-[6.5px] text-[#8b93b8]"
            >
              TOCA PARA SALTAR
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
