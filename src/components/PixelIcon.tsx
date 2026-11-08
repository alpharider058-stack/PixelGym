"use client";
import React from "react";

export interface PixelIconDef {
  id: string;
  label: string;
  category: "muscle" | "equipment" | "attribute";
}

export const PIXEL_ROUTINE_ICONS: PixelIconDef[] = [
  { id: "biceps", label: "BÍCEPS", category: "muscle" },
  { id: "triceps", label: "TRÍCEPS", category: "muscle" },
  { id: "chest", label: "PECHO", category: "muscle" },
  { id: "back", label: "ESPALDA", category: "muscle" },
  { id: "legs", label: "PIERNA", category: "muscle" },
  { id: "shoulders", label: "HOMBRO", category: "muscle" },
  { id: "abs", label: "ABDOMEN", category: "muscle" },
  { id: "glutes", label: "GLÚTEO", category: "muscle" },
  { id: "dumbbell", label: "MANCUERNA", category: "equipment" },
  { id: "barbell", label: "BARRA", category: "equipment" },
  { id: "kettlebell", label: "KETTLEBELL", category: "equipment" },
  { id: "heart", label: "CARDIO", category: "attribute" },
  { id: "flame", label: "FUERZA", category: "attribute" },
  { id: "lightning", label: "POTENCIA", category: "attribute" },
  { id: "shield", label: "DEFENSA", category: "attribute" },
  { id: "skull", label: "FALLO", category: "attribute" },
];

interface Props {
  name: string;
  size?: number;
  className?: string;
}

/**
 * 16x16 Pixel-Art SVG Icon Renderer with crisp edges.
 * Falls back to text / emoji if not a recognized pixel-art ID.
 */
export function PixelArtIcon({ name, size = 24, className = "" }: Props) {
  const norm = name.trim().toLowerCase();

  switch (norm) {
    case "biceps":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* Fist and forearm going into high flexed bicep peak */}
          <rect x="5" y="1" width="4" height="3" fill="#fbbf24" />
          <rect x="6" y="2" width="2" height="1" fill="#fff" />
          <rect x="4" y="3" width="6" height="2" fill="#d97706" />
          {/* Bicep muscle peak */}
          <rect x="7" y="4" width="5" height="4" fill="#f59e0b" />
          <rect x="9" y="5" width="2" height="2" fill="#fef08a" />
          <rect x="12" y="6" width="2" height="3" fill="#b45309" />
          {/* Forearm & Elbow curve */}
          <rect x="3" y="5" width="4" height="6" fill="#f59e0b" />
          <rect x="2" y="7" width="2" height="5" fill="#d97706" />
          <rect x="4" y="11" width="6" height="3" fill="#f59e0b" />
          <rect x="7" y="8" width="4" height="4" fill="#d97706" />
          <rect x="10" y="10" width="3" height="4" fill="#b45309" />
          {/* Muscle fiber lines */}
          <rect x="8" y="7" width="3" height="1" fill="#78350f" />
          <rect x="5" y="8" width="1" height="2" fill="#78350f" />
          {/* Black shadow border */}
          <path
            d="M5 0h4v1h1v2h1v1h2v2h2v4h-2v2h-1v2h-3v2H4v-2H2v-1H1v-5h1V5h2V3h1V1z"
            fill="none"
            stroke="#000"
            strokeWidth="1"
          />
        </svg>
      );

    case "triceps":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* Posterior arm view with horseshoe tricep definition */}
          <rect x="4" y="2" width="8" height="3" fill="#d97706" />
          {/* Long head & Lateral head */}
          <rect x="3" y="5" width="4" height="6" fill="#f59e0b" />
          <rect x="9" y="5" width="4" height="6" fill="#f59e0b" />
          <rect x="4" y="6" width="2" height="4" fill="#fef08a" />
          <rect x="10" y="6" width="2" height="4" fill="#fef08a" />
          {/* Horseshoe tendon groove in center */}
          <rect x="7" y="5" width="2" height="5" fill="#78350f" />
          <rect x="6" y="9" width="4" height="2" fill="#b45309" />
          {/* Olecranon (elbow) */}
          <rect x="6" y="11" width="4" height="3" fill="#f59e0b" />
          <rect x="7" y="12" width="2" height="1" fill="#fff" />
          <rect x="5" y="14" width="6" height="2" fill="#d97706" />
        </svg>
      );

    case "chest":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* Left Pectoral plate */}
          <rect x="1" y="4" width="6" height="7" fill="#f59e0b" />
          <rect x="2" y="5" width="4" height="3" fill="#fef08a" />
          <rect x="1" y="9" width="6" height="3" fill="#d97706" />
          {/* Right Pectoral plate */}
          <rect x="9" y="4" width="6" height="7" fill="#f59e0b" />
          <rect x="10" y="5" width="4" height="3" fill="#fef08a" />
          <rect x="9" y="9" width="6" height="3" fill="#d97706" />
          {/* Sternum groove (center cleft) */}
          <rect x="7" y="3" width="2" height="11" fill="#78350f" />
          {/* Clavicles */}
          <rect x="2" y="3" width="4" height="1" fill="#fff" />
          <rect x="10" y="3" width="4" height="1" fill="#fff" />
          {/* Lower pectoral cut */}
          <rect x="2" y="12" width="4" height="1" fill="#000" />
          <rect x="10" y="12" width="4" height="1" fill="#000" />
        </svg>
      );

    case "back":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* Trapezius diamond top */}
          <rect x="6" y="1" width="4" height="4" fill="#fef08a" />
          <rect x="5" y="3" width="6" height="2" fill="#f59e0b" />
          {/* Broad V-taper Lat wings */}
          <rect x="1" y="4" width="4" height="7" fill="#f59e0b" />
          <rect x="11" y="4" width="4" height="7" fill="#f59e0b" />
          <rect x="2" y="5" width="2" height="4" fill="#fbbf24" />
          <rect x="12" y="5" width="2" height="4" fill="#fbbf24" />
          {/* Spine and mid-back rhomboids */}
          <rect x="5" y="5" width="6" height="5" fill="#d97706" />
          <rect x="7" y="4" width="2" height="9" fill="#78350f" />
          {/* Narrow waist & spinal erectors */}
          <rect x="4" y="11" width="8" height="3" fill="#b45309" />
          <rect x="6" y="11" width="4" height="4" fill="#d97706" />
        </svg>
      );

    case "legs":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* Left Quad Teardrop */}
          <rect x="2" y="2" width="5" height="7" fill="#f59e0b" />
          <rect x="3" y="3" width="3" height="4" fill="#fef08a" />
          <rect x="2" y="7" width="5" height="3" fill="#d97706" />
          <rect x="3" y="9" width="4" height="2" fill="#fbbf24" />
          {/* Right Quad Teardrop */}
          <rect x="9" y="2" width="5" height="7" fill="#f59e0b" />
          <rect x="10" y="3" width="3" height="4" fill="#fef08a" />
          <rect x="9" y="7" width="5" height="3" fill="#d97706" />
          <rect x="9" y="9" width="4" height="2" fill="#fbbf24" />
          {/* Knee joints */}
          <rect x="3" y="12" width="3" height="2" fill="#fff" />
          <rect x="10" y="12" width="3" height="2" fill="#fff" />
          <rect x="4" y="14" width="2" height="2" fill="#d97706" />
          <rect x="10" y="14" width="2" height="2" fill="#d97706" />
          {/* Center space separation */}
          <rect x="7" y="1" width="2" height="15" fill="#090a0f" />
        </svg>
      );

    case "shoulders":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* 3D Boulder Deltoid (round cannonball cap) */}
          <rect x="3" y="3" width="10" height="9" fill="#f59e0b" />
          {/* Anterior head highlight */}
          <rect x="4" y="4" width="3" height="4" fill="#fef08a" />
          {/* Lateral head middle */}
          <rect x="7" y="4" width="3" height="5" fill="#fbbf24" />
          {/* Posterior head shadow */}
          <rect x="10" y="4" width="2" height="6" fill="#d97706" />
          {/* Rounded contour shading */}
          <rect x="4" y="2" width="8" height="1" fill="#fff" />
          <rect x="2" y="5" width="1" height="5" fill="#b45309" />
          <rect x="13" y="5" width="1" height="5" fill="#78350f" />
          <rect x="5" y="12" width="6" height="2" fill="#b45309" />
        </svg>
      );

    case "abs":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* 6-Pack grid */}
          <rect x="3" y="2" width="4" height="3" fill="#f59e0b" />
          <rect x="9" y="2" width="4" height="3" fill="#f59e0b" />
          <rect x="4" y="3" width="2" height="1" fill="#fff" />
          <rect x="10" y="3" width="2" height="1" fill="#fff" />

          <rect x="3" y="6" width="4" height="3" fill="#f59e0b" />
          <rect x="9" y="6" width="4" height="3" fill="#f59e0b" />
          <rect x="4" y="7" width="2" height="1" fill="#fef08a" />
          <rect x="10" y="7" width="2" height="1" fill="#fef08a" />

          <rect x="4" y="10" width="3" height="3" fill="#d97706" />
          <rect x="9" y="10" width="3" height="3" fill="#d97706" />

          {/* Linea alba (center vertical line) and horizontal tendons */}
          <rect x="7" y="1" width="2" height="14" fill="#78350f" />
          <rect x="2" y="5" width="12" height="1" fill="#78350f" />
          <rect x="2" y="9" width="12" height="1" fill="#78350f" />
          <rect x="3" y="13" width="10" height="1" fill="#78350f" />
        </svg>
      );

    case "glutes":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* Left Glute curve */}
          <rect x="2" y="4" width="5" height="7" fill="#f59e0b" />
          <rect x="3" y="5" width="3" height="4" fill="#fef08a" />
          <rect x="2" y="9" width="5" height="3" fill="#d97706" />
          {/* Right Glute curve */}
          <rect x="9" y="4" width="5" height="7" fill="#f59e0b" />
          <rect x="10" y="5" width="3" height="4" fill="#fef08a" />
          <rect x="9" y="9" width="5" height="3" fill="#d97706" />
          {/* Center cleft & upper waist */}
          <rect x="7" y="3" width="2" height="10" fill="#78350f" />
          <rect x="4" y="2" width="8" height="2" fill="#d97706" />
          {/* Hamstring tie-in */}
          <rect x="3" y="12" width="3" height="3" fill="#b45309" />
          <rect x="10" y="12" width="3" height="3" fill="#b45309" />
        </svg>
      );

    case "dumbbell":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* Left Plate Stack */}
          <rect x="1" y="4" width="2" height="8" fill="#3b82f6" />
          <rect x="3" y="3" width="2" height="10" fill="#2563eb" />
          <rect x="2" y="5" width="1" height="6" fill="#93c5fd" />
          {/* Center Chrome Grip */}
          <rect x="5" y="7" width="6" height="2" fill="#e2e8f0" />
          <rect x="6" y="7" width="4" height="1" fill="#ffffff" />
          <rect x="5" y="9" width="6" height="1" fill="#475569" />
          {/* Right Plate Stack */}
          <rect x="11" y="3" width="2" height="10" fill="#2563eb" />
          <rect x="13" y="4" width="2" height="8" fill="#3b82f6" />
          <rect x="13" y="5" width="1" height="6" fill="#93c5fd" />
        </svg>
      );

    case "barbell":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* Steel Olympic Bar */}
          <rect x="0" y="7" width="16" height="2" fill="#cbd5e1" />
          <rect x="4" y="7" width="8" height="1" fill="#ffffff" />
          <rect x="4" y="8" width="8" height="1" fill="#64748b" />
          {/* Left Bumper Plates */}
          <rect x="2" y="2" width="2" height="12" fill="#dc2626" />
          <rect x="2" y="4" width="1" height="8" fill="#fca5a5" />
          <rect x="1" y="4" width="1" height="8" fill="#2563eb" />
          {/* Right Bumper Plates */}
          <rect x="12" y="2" width="2" height="12" fill="#dc2626" />
          <rect x="12" y="4" width="1" height="8" fill="#fca5a5" />
          <rect x="14" y="4" width="1" height="8" fill="#2563eb" />
        </svg>
      );

    case "kettlebell":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* Top Handle */}
          <rect x="5" y="1" width="6" height="2" fill="#64748b" />
          <rect x="4" y="3" width="2" height="3" fill="#64748b" />
          <rect x="10" y="3" width="2" height="3" fill="#64748b" />
          {/* Cast Iron Sphere */}
          <rect x="3" y="5" width="10" height="9" fill="#1e293b" />
          <rect x="4" y="6" width="3" height="3" fill="#94a3b8" />
          <rect x="4" y="5" width="8" height="1" fill="#475569" />
          <rect x="2" y="7" width="1" height="5" fill="#0f172a" />
          <rect x="13" y="7" width="1" height="5" fill="#0f172a" />
          {/* Flat base */}
          <rect x="5" y="14" width="6" height="1" fill="#0f172a" />
        </svg>
      );

    case "heart":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* Pixel Heart */}
          <rect x="2" y="3" width="4" height="4" fill="#ff3f6c" />
          <rect x="10" y="3" width="4" height="4" fill="#ff3f6c" />
          <rect x="3" y="4" width="2" height="2" fill="#fff" />
          <rect x="1" y="4" width="14" height="5" fill="#ff3f6c" />
          <rect x="2" y="9" width="12" height="2" fill="#e11d48" />
          <rect x="4" y="11" width="8" height="2" fill="#be123c" />
          <rect x="6" y="13" width="4" height="2" fill="#9f1239" />
          <rect x="7" y="15" width="2" height="1" fill="#881337" />
        </svg>
      );

    case "flame":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* 8-bit Fire */}
          <rect x="7" y="1" width="2" height="2" fill="#fef08a" />
          <rect x="6" y="3" width="4" height="3" fill="#facc15" />
          <rect x="4" y="6" width="8" height="4" fill="#fb923c" />
          <rect x="3" y="8" width="10" height="5" fill="#ea580c" />
          <rect x="2" y="10" width="12" height="4" fill="#dc2626" />
          {/* White hot flame core */}
          <rect x="7" y="7" width="2" height="5" fill="#fff" />
          <rect x="6" y="8" width="4" height="4" fill="#fef08a" />
        </svg>
      );

    case "lightning":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* Electric Neon Bolt */}
          <rect x="7" y="0" width="4" height="3" fill="#3df2ff" />
          <rect x="5" y="3" width="5" height="3" fill="#3df2ff" />
          <rect x="3" y="6" width="6" height="3" fill="#3df2ff" />
          <rect x="1" y="8" width="14" height="2" fill="#3df2ff" />
          <rect x="7" y="10" width="6" height="2" fill="#3df2ff" />
          <rect x="6" y="12" width="4" height="2" fill="#3df2ff" />
          <rect x="5" y="14" width="2" height="2" fill="#3df2ff" />
          {/* White interior core */}
          <rect x="8" y="1" width="2" height="2" fill="#fff" />
          <rect x="6" y="4" width="3" height="2" fill="#fff" />
          <rect x="4" y="7" width="8" height="2" fill="#fff" />
          <rect x="7" y="10" width="3" height="2" fill="#fff" />
        </svg>
      );

    case "shield":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* Iron shield body */}
          <rect x="2" y="1" width="12" height="2" fill="#ffe14d" />
          <rect x="1" y="3" width="14" height="6" fill="#1e293b" />
          <rect x="2" y="9" width="12" height="3" fill="#1e293b" />
          <rect x="4" y="12" width="8" height="2" fill="#1e293b" />
          <rect x="6" y="14" width="4" height="2" fill="#1e293b" />
          {/* Gold cross emblem */}
          <rect x="7" y="3" width="2" height="10" fill="#ffe14d" />
          <rect x="3" y="5" width="10" height="2" fill="#ffe14d" />
          {/* Specular shine */}
          <rect x="3" y="3" width="3" height="1" fill="#fff" />
        </svg>
      );

    case "skull":
      return (
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className={`pixelated inline-block shrink-0 ${className}`}
        >
          {/* Arcade Skull */}
          <rect x="4" y="1" width="8" height="2" fill="#e2e8f0" />
          <rect x="2" y="3" width="12" height="7" fill="#e2e8f0" />
          <rect x="4" y="3" width="3" height="1" fill="#fff" />
          {/* Dark glowing eyes */}
          <rect x="3" y="5" width="3" height="3" fill="#ff3f6c" />
          <rect x="10" y="5" width="3" height="3" fill="#ff3f6c" />
          <rect x="4" y="6" width="1" height="1" fill="#000" />
          <rect x="11" y="6" width="1" height="1" fill="#000" />
          {/* Nose cavity */}
          <rect x="7" y="8" width="2" height="2" fill="#000" />
          {/* Teeth jaw */}
          <rect x="4" y="11" width="8" height="4" fill="#cbd5e1" />
          <rect x="5" y="11" width="1" height="3" fill="#000" />
          <rect x="7" y="11" width="1" height="3" fill="#000" />
          <rect x="9" y="11" width="1" height="3" fill="#000" />
          <rect x="11" y="11" width="1" height="3" fill="#000" />
        </svg>
      );

    default:
      // Fallback: render text/emoji directly with neat pixel alignment
      return (
        <span
          style={{ fontSize: size * 0.85, width: size, height: size }}
          className={`inline-flex items-center justify-center leading-none select-none ${className}`}
        >
          {name || "★"}
        </span>
      );
  }
}
