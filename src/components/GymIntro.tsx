"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useGame } from "@/lib/store";
import { useMyAvatar, useStats } from "@/lib/hooks";
import { haptic, setSoundEnabled, sfx } from "@/lib/fx";
import Avatar from "./Avatar";
import { SPRING } from "./ui";

interface Props {
  onMorph: () => void;
  onDone: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

type IntroPhase = "crt" | "drop" | "impact" | "morph" | "done";

export default function GymIntro({ onMorph, onDone }: Props) {
  const avatarCfg = useMyAvatar();
  const stats = useStats();
  const streak = useGame((s) => s.streak);

  const [phase, setPhase] = useState<IntroPhase>("crt");
  const [shakeY, setShakeY] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const impactedRef = useRef(false);
  const morphedRef = useRef(false);
  const finishedRef = useRef(false);

  const onMorphRef = useRef(onMorph);
  const onDoneRef = useRef(onDone);
  onMorphRef.current = onMorph;
  onDoneRef.current = onDone;

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
    // 1. 0.00s – 0.25s: CRT Turn-On + synthesized short beep
    sfx.crtTurnOn();

    // 2. 0.25s – 0.70s: Free-fall & Barbell Slam
    const tDrop = setTimeout(() => {
      setPhase("drop");
    }, 250);

    // 3. 0.70s – 1.00s: Exact impact frame -> Screen Shake, Haptics, Magnesium & Streak Flash
    const tImpact = setTimeout(() => {
      setPhase("impact");
      if (!impactedRef.current) {
        impactedRef.current = true;
        sfx.barbellSlam();
        haptic([35, 20, 60]);
        setShakeY(4);
        setTimeout(() => setShakeY(0), 60);

        // Spawn 28 square 8-bit magnesium particles (white & gold) bursting from floor
        const parts: Particle[] = [];
        const palette = ["#ffffff", "#ffffff", "#ffe14d", "#fef08a", "#e2e8f0"];
        for (let i = 0; i < 28; i++) {
          const side = i % 2 === 0 ? -1 : 1;
          const spread = (0.15 + Math.random() * 0.75) * side;
          const angle = -Math.PI / 2 + spread;
          const speed = 130 + Math.random() * 190;
          parts.push({
            x: 160 + side * (16 + Math.random() * 28),
            y: 195,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() > 0.35 ? 5 : 4,
            color: palette[i % palette.length],
            alpha: 1,
          });
        }
        particlesRef.current = parts;
      }
    }, 700);

    // 4. 1.00s – 1.40s: Morphing directly into Dashboard
    const tMorph = setTimeout(() => {
      if (!morphedRef.current) {
        morphedRef.current = true;
        setPhase("morph");
        onMorphRef.current();
      }
    }, 1000);

    // 5. 1.40s: Complete
    const tDone = setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        setPhase("done");
        onDoneRef.current();
      }
    }, 1400);

    return () => {
      clearTimeout(tDrop);
      clearTimeout(tImpact);
      clearTimeout(tMorph);
      clearTimeout(tDone);
    };
  }, []); // Run strictly once on mount!

  // 120fps Canvas particle loop for 8-bit magnesium explosion
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      ctx.clearRect(0, 0, cv.width, cv.height);
      const parts = particlesRef.current;

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.vy += 680 * dt; // realistic gravity
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // Bounce slightly off the floor line at y=200
        if (p.y > 200 && p.vy > 0) {
          p.y = 200;
          p.vy *= -0.35;
          p.vx *= 0.7;
        }
        p.alpha -= dt * 1.65;

        if (p.alpha <= 0) {
          parts.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = "#000000";
        ctx.fillRect(Math.round(p.x) + 1, Math.round(p.y) + 1, p.size, p.size);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      ctx.globalAlpha = 1;

      if (parts.length > 0) {
        raf = requestAnimationFrame(tick);
      }
    };

    if (phase === "impact" || phase === "morph") {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

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
        phase === "morph" ? "pointer-events-none" : "pointer-events-auto"
      }`}
      onClick={handleSkip}
    >
      {/* Solid #090A0F backdrop during 0.00s – 1.00s, smoothly revealing Dashboard at 1.00s */}
      <motion.div
        className="absolute inset-0 bg-[#090A0F]"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "morph" ? 0 : 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      />

      {/* 1. CRT Turn-On Beam (0.00s – 0.25s) */}
      <AnimatePresence>
        {phase === "crt" && (
          <motion.div
            key="crt-beam"
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
          >
            {/* Cyan neon horizontal line crossing center, then opening vertically at 120Hz */}
            <motion.div
              className="w-full bg-[#3df2ff]"
              style={{
                height: 3,
                boxShadow: "0 0 16px #3df2ff, 0 0 36px #3df2ff, 0 0 64px #ffffff",
              }}
              initial={{ scaleX: 0, scaleY: 1 }}
              animate={{
                scaleX: [0, 1, 1],
                scaleY: [1, 1, 90],
                opacity: [1, 1, 0.15],
              }}
              transition={{
                duration: 0.25,
                times: [0, 0.48, 1],
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Stage (0.00s – 1.00s): Shield + Falling Avatar + Barbell Slam */}
      <motion.div
        className="relative z-20 flex flex-col items-center justify-center"
        animate={{ y: shakeY }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
      >
        {phase !== "morph" && (
          <div className="relative flex flex-col items-center justify-center">
            {/* 6. Flash de Racha / Nivel (0.70s – 1.00s) - Positioned cleanly ABOVE with zero overlap */}
            <div className="h-12 flex items-center justify-center mb-3">
              <AnimatePresence>
                {phase === "impact" && (
                  <motion.div
                    key="streak-flash"
                    initial={{ scale: 0.3, y: 14, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.85, y: -8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className="whitespace-nowrap border-2 border-[var(--gold)] bg-[#120c00] px-3.5 py-1.5 shadow-[4px_4px_0_#000]"
                  >
                    <span
                      className="pixel-title text-[11px] sm:text-xs text-[var(--gold)]"
                      style={{ textShadow: "2px 2px 0 #000, 0 0 12px #ff3f6c" }}
                    >
                      {streak > 0
                        ? streak === 1 ? "🔥 RACHA: 1 DÍA" : `🔥 RACHA: ${streak} DÍAS`
                        : `⚡ LVL ${stats.level} - LISTO`}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Shield Emblem Container -> Morphs into Hero Profile Card at 1.00s */}
            <motion.div
              layoutId="hero-shield-panel"
              transition={SPRING}
              className="relative flex flex-col items-center justify-center p-5"
            >
              {/* Pixel-Art Shield SVG in background */}
              <motion.svg
                width="210"
                height="220"
                viewBox="0 0 28 30"
                shapeRendering="crispEdges"
                className="pixelated absolute inset-0 m-auto pointer-events-none"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{
                  scale: phase === "impact" ? [1, 1.06, 1] : 1,
                  opacity: 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {/* Outer black pixel border */}
                <path
                  d="M4 1h20v2h2v13h-2v4h-2v3h-3v3h-3v2h-4v-2h-3v-3h-3v-3h-2v-4h-2v-13h2z"
                  fill="#000000"
                />
                {/* Gold shield rim */}
                <path
                  d="M5 2h18v2h2v11h-2v4h-2v3h-3v3h-2v2h-4v-2h-2v-3h-3v-3h-2v-4h-2v-11h2z"
                  fill="#ffe14d"
                />
                {/* Inner dark orange/crimson shield core */}
                <path
                  d="M7 4h14v11h-2v4h-2v3h-2v2h-2v-2h-2v-3h-2v-4h-2z"
                  fill="#1a1f35"
                />
                {/* Pixel highlight */}
                <path d="M7 4h6v2h-4v5h-2z" fill="#3df2ff" opacity="0.45" />
              </motion.svg>

              {/* 2. Free-falling Avatar + Heavy Olympic Barbell (0.25s – 0.70s) */}
              <motion.div
                className="relative z-20 flex flex-col items-center"
                initial={{ y: -260, opacity: 0 }}
                animate={
                  phase === "crt"
                    ? { y: -260, opacity: 0 }
                    : phase === "drop"
                    ? { y: 0, opacity: 1 }
                    : { y: 0, opacity: 1 }
                }
                transition={
                  phase === "drop"
                    ? { duration: 0.44, ease: [0.42, 0, 0.92, 0.65] }
                    : { type: "spring", stiffness: 500, damping: 20 }
                }
              >
                {/* Heavy Olympic Barbell clamped across traps/shoulders */}
                <motion.div
                  className="absolute top-[22px] z-30 flex w-64 items-center justify-center pointer-events-none"
                  animate={
                    phase === "impact"
                      ? { y: [0, 5, -1, 0], scaleX: [1, 1.03, 1] }
                      : { y: 0, scaleX: 1 }
                  }
                  transition={{ duration: 0.22 }}
                >
                  {/* Left Olympic Plates (Collar + 15kg Blue + 25kg Red) */}
                  <div className="flex items-center">
                    <div className="h-4 w-2 border border-black bg-[#111]" />
                    <div className="h-6 w-2 border border-black bg-[#cbd5e1]" />
                    <div className="h-11 w-2.5 border-2 border-black bg-[#16a34a] shadow-[2px_2px_0_#000]" />
                    <div className="h-14 w-3 border-2 border-black bg-[#2563eb] shadow-[2px_2px_0_#000]" />
                    <div className="h-16 w-3.5 border-2 border-black bg-[#dc2626] shadow-[2px_2px_0_#000]" />
                  </div>

                  {/* Knurled Steel Bar */}
                  <div className="h-3 flex-1 border-y-2 border-black bg-gradient-to-b from-[#e2e8f0] via-[#ffffff] to-[#64748b] shadow-[0_3px_0_#000]" />

                  {/* Right Olympic Plates (25kg Red + 15kg Blue + Collar) */}
                  <div className="flex items-center">
                    <div className="h-16 w-3.5 border-2 border-black bg-[#dc2626] shadow-[2px_2px_0_#000]" />
                    <div className="h-14 w-3 border-2 border-black bg-[#2563eb] shadow-[2px_2px_0_#000]" />
                    <div className="h-11 w-2.5 border-2 border-black bg-[#16a34a] shadow-[2px_2px_0_#000]" />
                    <div className="h-6 w-2 border border-black bg-[#cbd5e1]" />
                    <div className="h-4 w-2 border border-black bg-[#111]" />
                  </div>
                </motion.div>

                {/* Real-time User Avatar -> Morphs into Profile Card Avatar at 1.00s */}
                <motion.div
                  layoutId="hero-avatar-box"
                  transition={SPRING}
                  className="frame9 relative z-20 overflow-hidden bg-black"
                >
                  <Avatar
                    cfg={avatarCfg}
                    scale={2.5}
                    interactive={false}
                    animate={phase === "impact"}
                  />
                </motion.div>
              </motion.div>

              {/* Impact Shockwave Platform Floor */}
              <div className="relative mt-2 flex h-3 w-52 items-center justify-center">
                <div className="h-2 w-full border-2 border-black bg-[#2c3350] shadow-[0_3px_0_#000]" />
                {phase === "impact" && (
                  <motion.div
                    initial={{ scaleX: 0.2, opacity: 1 }}
                    animate={{ scaleX: 1.35, opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="absolute inset-x-0 h-1.5 bg-[#3df2ff] shadow-[0_0_12px_#3df2ff]"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* 5. 8-bit Magnesium Particle Canvas (persists through 0.70s – 1.40s) */}
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          className="pointer-events-none pixelated absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
        />
      </motion.div>
    </div>
  );
}
