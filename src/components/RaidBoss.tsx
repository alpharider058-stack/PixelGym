"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useGame } from "@/lib/store";
import { Quest, getWeeklyBoss, getTimeUntilWeeklyReset, weekOfUtc } from "@/lib/data";
import { fx, fxAt, haptic, sfx } from "@/lib/fx";
import { Bar, Panel, PixelButton, SPRING, APPLE_SPRING, APPLE_TAP, APPLE_BOUNCE, APPLE_FLUID } from "./ui";
import BossPixelCanvas from "./BossPixelCanvas";

export default function RaidBossView() {
  const { bossDmgDealt, quests, claimQuest } = useGame(
    useShallow((s) => ({
      bossDmgDealt: s.bossDmgDealt || 0,
      quests: s.quests || [],
      claimQuest: s.claimQuest,
    }))
  );

  const timeLeft = getTimeUntilWeeklyReset();
  const currentWeek = weekOfUtc();
  const boss = getWeeklyBoss(currentWeek);

  // Simulated live community damage based on time through week + player contribution
  const hoursIntoWeek = ((Date.now() / 36e5) % 168);
  const communityDrift = Math.round((hoursIntoWeek / 168) * (boss.totalHp * 0.65));
  const totalDamage = Math.min(boss.totalHp, communityDrift + bossDmgDealt);
  const bossHpRemaining = Math.max(0, boss.totalHp - totalDamage);
  const bossDefeated = bossHpRemaining === 0;

  const handleClaim = (q: Quest, e: React.MouseEvent<HTMLButtonElement>) => {
    if (claimQuest(q.id)) {
      sfx.coin();
      haptic([20, 30, 40, 50]);
      fxAt(e.currentTarget, (x, y) => [
        { kind: "burst", x, y, color: "#ffe14d", count: 28 },
        { kind: "text", x, y, text: `+${q.rewardGold}G +${q.rewardExp}XP`, color: "#ffe14d" },
      ]);
    }
  };

  return (
    <div className="space-y-4">
      {/* RAID BOSS CARD */}
      <Panel
        className="relative overflow-hidden p-4 border-2 bg-[#120a10]"
        style={{ borderColor: boss.color, boxShadow: `0 0 16px ${boss.color}35` }}
      >
        <div className="flex items-center justify-between border-b-2 border-[#2c3350] pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl animate-pulse">{boss.icon}</span>
            <div>
              <div className="pixel-title text-[9px]" style={{ color: boss.color }}>RAID BOSS SEMANAL</div>
              <div className="pixel-title text-[7px] text-[#8b93b8]">EVENTO COOPERATIVO GLOBAL</div>
            </div>
          </div>
          <span className="mono text-xs tabular-nums text-[var(--gold)]">
            CIERRA EN: {timeLeft}
          </span>
        </div>

        <motion.div
          whileTap={{ scale: 0.98 }}
          transition={APPLE_TAP}
          className="flex flex-col items-center gap-1.5 text-center cursor-pointer"
        >
          {/* Animated 120 FPS Pixel-Art Canvas Boss */}
          <BossPixelCanvas
            boss={boss}
            hpRemaining={bossHpRemaining}
            isDefeated={bossDefeated}
            onHit={() => {
              if (typeof window !== "undefined") {
                fx({
                  kind: "text",
                  x: window.innerWidth / 2,
                  y: window.innerHeight / 2 - 40,
                  text: bossDefeated ? "¡EN EL SUELO!" : boss.attackName,
                  color: boss.color,
                });
              }
            }}
          />

          <h3 className="pixel-title text-sm text-white">
            {boss.name}
          </h3>
          <p className="pixel-title text-[8px]" style={{ color: boss.color }}>
            {boss.title}
          </p>

          <p className="mono max-w-xs text-[11px] text-[#a0aec0]">
            {boss.lore}
          </p>

          {/* BOSS HP BAR */}
          <div className="w-full mt-2 space-y-1">
            <div className="flex justify-between items-center text-[11px] mono">
              <span className="font-bold" style={{ color: bossDefeated ? "#7dff6a" : boss.color }}>
                VIDA: {bossHpRemaining.toLocaleString("es")} kg
              </span>
              <span className="text-[#8b93b8]">
                MAX: {boss.totalHp.toLocaleString("es")} kg
              </span>
            </div>
            <Bar
              value={bossHpRemaining}
              max={boss.totalHp}
              color={bossDefeated ? "#7dff6a" : boss.color}
              h={12}
            />
          </div>

          <div className="grid w-full grid-cols-2 gap-2 mt-2 text-center">
            <div className="border border-[#2c3350] bg-[#10131f] p-2">
              <div className="pixel-title text-[7px] text-[#8b93b8]">TU DAÑO APORTADO</div>
              <div className="mono text-base tabular-nums font-bold text-[var(--cyan)]">
                {bossDmgDealt.toLocaleString("es")} kg
              </div>
            </div>
            <div className="border border-[#2c3350] bg-[#10131f] p-2">
              <div className="pixel-title text-[7px] text-[#8b93b8]">BOTÍN POR VICTORIA</div>
              <div className="mono text-base tabular-nums font-bold text-[var(--gold)]">
                +{boss.rewardGold}G / +{boss.rewardExp}XP
              </div>
            </div>
          </div>
        </motion.div>
      </Panel>

      {/* GUILD QUESTS (TABLÓN DE MISIONES) */}
      <Panel className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b-2 border-[#2c3350] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📜</span>
            <div>
              <h3 className="pixel-title text-[10px] text-[var(--gold)]">TABLÓN DE MISIONES</h3>
              <span className="pixel-title text-[7px] text-[#8b93b8]">DESAFÍOS SEMANALES DEL GREMIO</span>
            </div>
          </div>
          <span className="mono text-xs tabular-nums text-[var(--cyan)]">
            {quests.filter((q) => q.claimed).length}/{quests.length} HECHAS
          </span>
        </div>

        <div className="space-y-2">
          {quests.map((q, idx) => {
            const isDone = q.current >= q.target;
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...APPLE_SPRING, delay: idx * 0.04 }}
                whileHover={{ scale: 1.015, x: 2 }}
                className={`flex flex-col gap-2 border-2 p-3 transition-colors ${
                  q.claimed
                    ? "border-[#1e2336] bg-[#0c0e17] opacity-60"
                    : isDone
                    ? "border-[var(--gold)] bg-[#241e0a] shadow-[2px_2px_0_#000]"
                    : "border-[#2c3350] bg-[#10131f] shadow-[2px_2px_0_#000]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none">{q.icon}</span>
                    <div>
                      <div className="pixel-title text-[8px] text-white">{q.title}</div>
                      <div className="mono text-xs text-[#a0aec0]">{q.desc}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="pixel-title text-[8px] text-[var(--gold)]">
                      +{q.rewardGold}G
                    </span>
                    <div className="pixel-title text-[7px] text-[var(--cyan)]">
                      +{q.rewardExp}XP
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] mono">
                    <span className="text-[#8b93b8]">Progreso</span>
                    <span className="tabular-nums text-white">
                      {q.current.toLocaleString("es")} / {q.target.toLocaleString("es")}
                    </span>
                  </div>
                  <Bar
                    value={q.current}
                    max={q.target}
                    color={isDone ? "var(--gold)" : "var(--cyan)"}
                    h={8}
                  />
                </div>

                {isDone && !q.claimed ? (
                  <PixelButton
                    variant="gold"
                    className="w-full py-3 text-[9px] font-bold shadow-[2px_2px_0_#000]"
                    onClick={(e) => handleClaim(q, e)}
                  >
                    ★ ¡RECLAMAR RECOMPENSA!
                  </PixelButton>
                ) : q.claimed ? (
                  <div className="pixel-title text-center text-[7px] text-[#7dff6a]">
                    ✓ RECOMPENSA COBRADA
                  </div>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
