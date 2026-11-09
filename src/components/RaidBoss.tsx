"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useGame } from "@/lib/store";
import { Quest, RaidBoss, getWeeklyBoss, getTimeUntilWeeklyReset, weekOfUtc } from "@/lib/data";
import { fx, fxAt, haptic, sfx } from "@/lib/fx";
import { Bar, Panel, PixelButton, APPLE_SPRING, APPLE_TAP, APPLE_BOUNCE } from "./ui";
import BossPixelCanvas from "./BossPixelCanvas";

export default function RaidBossView() {
  const { bossDmgDealt, bossClaimed, quests, claimQuest, claimBossVictory } = useGame(
    useShallow((s) => ({
      bossDmgDealt: s.bossDmgDealt || 0,
      bossClaimed: !!s.bossDefeated,
      quests: s.quests || [],
      claimQuest: s.claimQuest,
      claimBossVictory: s.claimBossVictory,
    }))
  );

  const [victoryOpen, setVictoryOpen] = useState(false);

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

  const handleClaimVictory = (e: React.MouseEvent<HTMLButtonElement>) => {
    const claimed = claimBossVictory(boss.rewardGold, boss.rewardExp);
    sfx.levelUp();
    haptic([30, 40, 30, 40, 80]);
    fxAt(e.currentTarget, (x, y) => [
      { kind: "burst" as const, x, y, color: "#ffe14d", count: 48, big: true },
      { kind: "burst" as const, x: x - 50, y: y - 40, color: "#7dff6a", count: 24 },
      { kind: "burst" as const, x: x + 50, y: y - 40, color: "#3df2ff", count: 24 },
      ...(claimed
        ? [{ kind: "text" as const, x, y: y - 20, text: `+${boss.rewardGold}G +${boss.rewardExp}XP`, color: "#ffe14d" }]
        : []),
      { kind: "shake" as const, power: 3 },
    ]);
    setVictoryOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* RAID BOSS CARD */}
      <Panel
        className="relative overflow-hidden p-4 border-2 bg-[#120a10]"
        style={{
          borderColor: bossDefeated ? "#7dff6a" : boss.color,
          boxShadow: bossDefeated ? "0 0 18px rgba(125,255,106,0.28)" : `0 0 16px ${boss.color}35`,
        }}
      >
        <div className="flex items-center justify-between border-b-2 border-[#2c3350] pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl animate-pulse">{bossDefeated ? "🏆" : boss.icon}</span>
            <div>
              <div className="pixel-title text-[9px]" style={{ color: bossDefeated ? "#7dff6a" : boss.color }}>
                {bossDefeated ? "RAID BOSS DERROTADO" : "RAID BOSS SEMANAL"}
              </div>
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
                  text: bossDefeated ? "¡DERROTADO!" : boss.attackName,
                  color: bossDefeated ? "#7dff6a" : boss.color,
                });
              }
            }}
          />

          {bossDefeated && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={APPLE_BOUNCE}
              className="pixel-title border-2 border-[#7dff6a] bg-[#15291a] px-2.5 py-1 text-[8px] text-[#7dff6a] shadow-[2px_2px_0_#000]"
            >
              ☠ ¡JEFE VENCIDO ESTA SEMANA! ☠
            </motion.div>
          )}

          <h3 className="pixel-title text-sm text-white">
            {boss.name}
          </h3>
          <p className="pixel-title text-[8px]" style={{ color: bossDefeated ? "#7dff6a" : boss.color }}>
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

        {/* VICTORY REWARD / CELEBRATION TRIGGER */}
        {bossDefeated && (
          <div className="mt-3 pt-3 border-t-2 border-[#2c3350] flex flex-col gap-2">
            {!bossClaimed ? (
              <PixelButton
                variant="gold"
                className="w-full py-3.5 text-[9.5px] font-bold shadow-[3px_3px_0_#000] animate-pulse"
                onClick={handleClaimVictory}
              >
                🎁 ¡RECLAMAR BOTÍN DE VICTORIA! (+{boss.rewardGold}G · +{boss.rewardExp}XP)
              </PixelButton>
            ) : (
              <div className="flex items-center justify-between gap-2 border-2 border-[#7dff6a]/60 bg-[#15291a] px-3 py-2">
                <span className="pixel-title text-[8px] text-[#7dff6a]">
                  ✓ BOTÍN RECLAMADO (+{boss.rewardGold}G)
                </span>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  transition={APPLE_TAP}
                  onClick={() => {
                    sfx.coin();
                    haptic(12);
                    setVictoryOpen(true);
                  }}
                  className="pixel-title border border-[var(--gold)] bg-[#241e0a] px-2 py-1 text-[7.5px] text-[var(--gold)] shadow-[1px_1px_0_#000]"
                >
                  🎉 CELEBRAR
                </motion.button>
              </div>
            )}
          </div>
        )}
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

      <AnimatePresence>
        {victoryOpen && (
          <BossVictoryModal
            boss={boss}
            damageDealt={bossDmgDealt}
            onClose={() => {
              sfx.tap();
              setVictoryOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BossVictoryModal({
  boss,
  damageDealt,
  onClose,
}: {
  boss: RaidBoss;
  damageDealt: number;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!mounted) return null;

  const confetti = [
    { x: -120, y: -150, color: "#ffe14d", delay: 0.05 },
    { x: 115, y: -145, color: "#7dff6a", delay: 0.08 },
    { x: -95, y: -185, color: "#3df2ff", delay: 0.12 },
    { x: 95, y: -180, color: "#ff3f6c", delay: 0.14 },
    { x: -145, y: -90, color: "#ffe14d", delay: 0.1 },
    { x: 145, y: -95, color: "#c06cff", delay: 0.11 },
    { x: -55, y: -200, color: "#7dff6a", delay: 0.16 },
    { x: 55, y: -205, color: "#ffe14d", delay: 0.18 },
  ];

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.72, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={APPLE_BOUNCE}
        className="panel relative w-full max-w-sm overflow-visible border-4 border-[var(--gold)] bg-[#14111c] p-5 text-center shadow-[0_0_40px_rgba(255,225,77,0.35)]"
      >
        {/* Pixel firework confetti sparks */}
        <div className="pointer-events-none absolute left-1/2 top-1/2">
          {confetti.map((c, idx) => (
            <motion.span
              key={idx}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: [0, c.x],
                y: [0, c.y, c.y + 45],
                scale: [0, 1.4, 0],
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 1.4, delay: c.delay, repeat: Infinity, repeatDelay: 1.2 }}
              className="absolute h-2.5 w-2.5 border border-black"
              style={{ backgroundColor: c.color }}
            />
          ))}
        </div>

        <div className="pixel-title text-[9px] text-[#7dff6a] tracking-wider">
          ★ VICTORIA DE RAID SEMANAL ★
        </div>

        {/* Slain boss + Golden Crown / Chest Emblem */}
        <div className="relative mx-auto my-4 flex h-28 w-28 items-center justify-center border-4 border-[var(--gold)] bg-gradient-to-b from-[#2a2208] to-[#10131f] shadow-[4px_4px_0_#000,0_0_24px_rgba(255,225,77,0.4)]">
          <motion.span
            animate={{ y: [0, -6, 0], rotate: [0, -3, 3, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            className="pixelated text-5xl"
          >
            🏆
          </motion.span>
          <span className="absolute -left-3 -top-3 flex h-9 w-9 items-center justify-center border-2 border-black bg-[#161a2b] text-xl shadow-[2px_2px_0_#000] grayscale opacity-85">
            {boss.icon}
          </span>
          <span className="pixel-title absolute -bottom-2.5 border-2 border-black bg-[#7dff6a] px-2 py-0.5 text-[7.5px] font-bold text-black shadow-[2px_2px_0_#000]">
            DERROTADO
          </span>
        </div>

        <h3 className="pixel-title text-sm text-white mt-2">{boss.name}</h3>
        <p className="pixel-title text-[7.5px] text-[var(--gold)] mt-0.5">{boss.title}</p>

        <p className="mono mt-2 text-xs text-[#cbd5e1]">
          ¡El coloso semanal ha caído gracias al esfuerzo del gremio y tus series de hierro!
        </p>

        {/* Reward Summary Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 text-center">
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...APPLE_SPRING, delay: 0.12 }}
            className="border-2 border-[var(--gold)] bg-[#241e0a] p-2.5 shadow-[2px_2px_0_#000]"
          >
            <div className="pixel-title text-[7px] text-[#ffe14d]">BOTÍN ORO</div>
            <div className="mono text-xl font-bold text-white tabular-nums">
              +{boss.rewardGold}G
            </div>
          </motion.div>
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...APPLE_SPRING, delay: 0.18 }}
            className="border-2 border-[var(--cyan)] bg-[#0d2330] p-2.5 shadow-[2px_2px_0_#000]"
          >
            <div className="pixel-title text-[7px] text-[#3df2ff]">EXP DE COMBATE</div>
            <div className="mono text-xl font-bold text-white tabular-nums">
              +{boss.rewardExp}XP
            </div>
          </motion.div>
        </div>

        <div className="mt-3 border-2 border-[#2c3350] bg-[#10131f] px-3 py-2 flex items-center justify-between">
          <span className="pixel-title text-[7.5px] text-[#8b93b8]">TU DAÑO TOTAL</span>
          <span className="mono text-sm font-bold text-[var(--cyan)] tabular-nums">
            {damageDealt.toLocaleString("es")} kg
          </span>
        </div>

        <PixelButton
          variant="gold"
          className="mt-4 w-full py-3.5 text-[10px] font-bold shadow-[3px_3px_0_#000]"
          onClick={onClose}
        >
          ✓ RECOGER BOTÍN Y VOLVER
        </PixelButton>
      </motion.div>
    </motion.div>,
    document.body
  );
}
