"use client";
import { useEffect, useRef } from "react";
import { AH, AW, AvatarCfg, drawAvatar } from "@/lib/avatar";
import { fxAt, haptic, sfx } from "@/lib/fx";

interface Props { cfg: AvatarCfg; scale?: number; interactive?: boolean; animate?: boolean; className?: string }

/** Canvas avatar: 64x72 logical px, upscaled with image-rendering: pixelated. rAF loop pauses offscreen/hidden. */
export default function Avatar({ cfg, scale = 4, interactive = false, animate = true, className = "" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cfgRef = useRef(cfg);
  const flexUntil = useRef(0);
  cfgRef.current = cfg;

  useEffect(() => {
    const cv = ref.current!;
    const c = cv.getContext("2d", { alpha: false })!;
    c.imageSmoothingEnabled = false;
    let raf = 0, visible = true, last = -1;
    const frame = (now: number) => {
      raf = 0;
      const flex = now < flexUntil.current ? 1 : 0;
      // breathing only changes ~ every 16ms in logical pixel space; draw each frame (cheap) for 120Hz smoothness
      if (now - last > 7) { drawAvatar(c, cfgRef.current, now, flex); last = now; }
      if (animate && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); });
    io.observe(cv);
    const vis = () => !document.hidden && kick();
    document.addEventListener("visibilitychange", vis);
    kick();
    return () => { cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, [animate]);

  // redraw static avatars when cfg changes
  useEffect(() => {
    if (!animate && ref.current) drawAvatar(ref.current.getContext("2d")!, cfg, 0, 0);
  }, [cfg, animate]);

  const onTap = () => {
    if (!interactive) return;
    flexUntil.current = performance.now() + 1100;
    sfx.flex(); haptic([10, 30, 10]);
    fxAt(ref.current, (x, y) => [
      { kind: "burst", x, y: y - 20, color: "#ffe14d", count: 18 },
      { kind: "text", x, y: y - 60, text: ["¡FLEX!", "💪 PUMP!", "¡BESTIA!", "+1 EGO"][Math.floor(Math.random() * 4)], color: "#ffe14d" },
      { kind: "shake", power: 2 },
    ]);
  };

  return (
    <canvas
      ref={ref}
      width={AW}
      height={AH}
      onPointerDown={onTap}
      className={`pixelated ${interactive ? "cursor-pointer" : ""} ${className}`}
      style={{ width: AW * scale, height: AH * scale, touchAction: "manipulation" }}
      aria-label="Avatar pixel-art"
    />
  );
}
