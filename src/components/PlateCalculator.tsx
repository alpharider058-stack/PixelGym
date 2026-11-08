"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { PLATES, calculatePlates } from "@/lib/data";
import { sfx } from "@/lib/fx";
import { PixelButton, SPRING, APPLE_SPRING, APPLE_TAP, APPLE_BOUNCE, APPLE_FLUID } from "./ui";
import { Sheet } from "./GymView";

interface Props {
  initialKg: number;
  onClose: () => void;
}

export default function PlateCalculator({ initialKg, onClose }: Props) {
  const [targetKg, setTargetKg] = useState<number>(Math.max(20, initialKg));
  const [barKg, setBarKg] = useState<number>(20);

  const { platesPerSide, remainder } = calculatePlates(targetKg, barKg);
  const totalPerSide = platesPerSide.reduce((sum, p) => sum + p.kg, 0);

  const step = (delta: number) => {
    setTargetKg((prev) => Math.max(barKg, Math.round((prev + delta) * 4) / 4));
    sfx.tick();
  };

  // Group plates count per side
  const counts: Record<number, number> = {};
  for (const p of platesPerSide) {
    counts[p.kg] = (counts[p.kg] || 0) + 1;
  }

  return (
    <Sheet
      title="CALCULADORA DE DISCOS"
      onClose={onClose}
      footer={
        <PixelButton variant="gold" className="w-full py-3 text-[9px]" onClick={onClose}>
          LISTO PARA LEVANTAR
        </PixelButton>
      }
    >
      <div className="space-y-4 text-center">
        {/* Target display and stepper */}
        <div className="border-2 border-[#2c3350] bg-[#10131f] p-3">
          <div className="pixel-title text-[8px] text-[var(--gold)]">PESO TOTAL EN BARRA</div>
          <div className="my-2 flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.84 }}
              transition={APPLE_TAP}
              onClick={() => step(-5)}
              className="step-btn h-11 w-11 text-base font-bold shadow-[2px_2px_0_#000] cursor-pointer"
              aria-label="-5kg"
            >
              −5
            </motion.button>
            <motion.span
              key={targetKg}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={APPLE_BOUNCE}
              className="mono text-4xl tabular-nums font-bold text-white"
            >
              {targetKg}
              <span className="text-sm text-[#8b93b8]"> kg</span>
            </motion.span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.84 }}
              transition={APPLE_TAP}
              onClick={() => step(5)}
              className="step-btn h-11 w-11 text-base font-bold shadow-[2px_2px_0_#000] cursor-pointer"
              aria-label="+5kg"
            >
              +5
            </motion.button>
          </div>
          <div className="flex justify-center gap-1.5 flex-wrap">
            {[-2.5, -1.25, 1.25, 2.5].map((delta) => (
              <motion.button
                key={delta}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                transition={APPLE_TAP}
                onClick={() => step(delta)}
                className="pixel-title border border-[#2c3350] bg-[#141826] px-2.5 py-1.5 text-[8px] text-[#cbd5e1] active:border-[var(--gold)] active:text-white cursor-pointer shadow-[1px_1px_0_#000]"
              >
                {delta > 0 ? `+${delta}` : delta}kg
              </motion.button>
            ))}
          </div>
        </div>

        {/* Barbell selection */}
        <div className="flex items-center justify-between border-b-2 border-[#2c3350] pb-2">
          <span className="pixel-title text-[8px] text-[#8b93b8]">PESO DE BARRA:</span>
          <div className="flex gap-1.5">
            {[20, 15, 10].map((b) => (
              <motion.button
                key={b}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                transition={APPLE_TAP}
                onClick={() => {
                  setBarKg(b);
                  sfx.tap();
                }}
                className={`pixel-title border px-3 py-1.5 text-[8px] font-bold cursor-pointer transition-colors ${
                  barKg === b
                    ? "border-[var(--gold)] bg-[var(--gold)] text-black shadow-[1px_1px_0_#000]"
                    : "border-[#2c3350] bg-[#10131f] text-[#8b93b8]"
                }`}
              >
                {b} KG
              </motion.button>
            ))}
          </div>
        </div>

        {/* Visual Barbell Sleeve & Plates */}
        <div className="relative flex h-36 w-full items-center justify-start sm:justify-center overflow-x-auto rounded border-2 border-[#2c3350] bg-[#0c0e17] px-4 py-2">
          {/* Bar collar & shaft */}
          <div className="relative flex items-center min-w-fit mx-auto">
            {/* Inner shaft coming from center */}
            <div className="h-4 w-12 border-y-2 border-black bg-[#64748b] shadow-inner" />
            {/* Big collar */}
            <div className="h-14 w-4 border-2 border-black bg-[#334155] shadow-md" />
            {/* Sleeve holding plates */}
            <div className="relative flex h-6 min-w-[140px] items-center border-y-2 border-black bg-[#94a3b8] px-1">
              {/* Stacked plates on this side */}
              <div className="flex items-center gap-0.5">
                {platesPerSide.map((p, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    whileHover={{ scale: 1.15, y: -4 }}
                    whileTap={{ scale: 1.25, y: -8 }}
                    transition={{ ...APPLE_SPRING, delay: idx * 0.03 }}
                    style={{
                      height: p.h * 2.2,
                      width: 14,
                      backgroundColor: p.color,
                      color: p.textColor,
                    }}
                    className="relative flex items-center justify-center border border-black shadow-[2px_0_0_#000] cursor-pointer"
                  >
                    <span className="pixel-title rotate-90 text-[7px] font-bold select-none">
                      {p.kg}
                    </span>
                  </motion.div>
                ))}
              </div>
              {/* Sleeve tip */}
              <div className="h-6 w-3 border border-black bg-[#475569]" />
            </div>
          </div>
        </div>

        {/* Breakdown per side */}
        <div className="border-2 border-[#2c3350] bg-[#10131f] p-3 text-left">
          <div className="flex justify-between items-center mb-2">
            <span className="pixel-title text-[8px] text-[var(--gold)]">DISCOS POR LADO:</span>
            <span className="mono text-xs text-[var(--cyan)] font-bold">{totalPerSide} kg / lado</span>
          </div>
          {platesPerSide.length === 0 ? (
            <div className="mono text-xs text-[#8b93b8]">Solo la barra vacía ({barKg} kg).</div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(counts).map(([kgStr, count]) => {
                const kg = parseFloat(kgStr);
                const pl = PLATES.find((x) => x.kg === kg);
                return (
                  <motion.div
                    key={kg}
                    whileHover={{ scale: 1.02 }}
                    transition={APPLE_SPRING}
                    className="flex items-center gap-2 border border-[#2c3350] bg-[#141826] p-1.5"
                  >
                    <span
                      className="inline-block h-3.5 w-3.5 border border-black"
                      style={{ backgroundColor: pl?.color }}
                    />
                    <span className="mono text-sm text-white font-bold">
                      {count}× {kg} kg
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
          {remainder > 0 && (
            <div className="mt-2 pixel-title text-[7px] text-[var(--red)]">
              ⚠️ REMANENTE INEXACTO: {remainder} kg (requiere microdiscos menores a 1.25kg)
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
