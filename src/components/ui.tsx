"use client";
import { motion, HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";
import { haptic, sfx } from "@/lib/fx";

/** Apple-style fluid spring physics presets (iOS / macOS feel) */
export const APPLE_SPRING = { type: "spring", stiffness: 380, damping: 28, mass: 0.8 } as const;
export const APPLE_TAP = { type: "spring", stiffness: 500, damping: 24, mass: 0.4 } as const;
export const APPLE_BOUNCE = { type: "spring", stiffness: 340, damping: 18, mass: 0.7 } as const;
export const APPLE_FLUID = { type: "spring", stiffness: 300, damping: 32, mass: 1 } as const;

export const SPRING = APPLE_SPRING;

type BtnProps = HTMLMotionProps<"button"> & { variant?: "primary" | "ghost" | "danger" | "gold" | "cyan"; quiet?: boolean };

/** Chunky pixel button: Apple-style spring press + hover lift via transform only. */
export const PixelButton = forwardRef<HTMLButtonElement, BtnProps>(function PixelButton(
  { variant = "primary", quiet, className = "", onClick, children, ...rest }, ref,
) {
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.015, y: -1 }}
      whileTap={{ scale: 0.94, y: 2 }}
      transition={APPLE_TAP}
      onClick={(e) => { if (!quiet) { sfx.tap(); haptic(6); } onClick?.(e); }}
      className={`pbtn pbtn-${variant} ${className}`}
      {...rest}
    >{children}</motion.button>
  );
});

export function Bar({
  value,
  max,
  color = "#7dff6a",
  h = 10,
  fillDelay,
  minVisual = 0,
}: {
  value: number;
  max: number;
  color?: string;
  h?: number;
  fillDelay?: number;
  minVisual?: number;
}) {
  const raw = max ? value / max : 0;
  const p = Math.max(minVisual, Math.min(1, raw));
  return (
    <div className="pbar" style={{ height: h }}>
      <motion.div
        className="pbar-fill"
        style={{ background: color, originX: 0 }}
        initial={fillDelay !== undefined ? { scaleX: 0 } : false}
        animate={{ scaleX: p }}
        transition={
          fillDelay !== undefined
            ? { type: "spring", stiffness: 260, damping: 24, mass: 0.8, delay: fillDelay }
            : SPRING
        }
      />
    </div>
  );
}

export function Panel({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`panel ${className}`} {...rest}>{children}</div>;
}
