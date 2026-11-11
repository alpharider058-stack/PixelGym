"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useGame } from "@/lib/store";
import { Quest, RaidBoss, getCombatBonus, getHoursIntoUtcWeek, getWeeklyBoss, getTimeUntilWeeklyReset, weekOfUtc } from "@/lib/data";
import { fx, fxAt, haptic, sfx } from "@/lib/fx";
import { Bar, Panel, PixelButton, APPLE_SPRING, APPLE_TAP, APPLE_BOUNCE } from "./ui";
import BossPixelCanvas from "./BossPixelCanvas";
import { BossEmblemCanvas, PetPreviewCanvas, WeaponPreviewCanvas } from "./PixelPreviews";

const EMPTY_QUESTS: Quest[] = [];

export default function RaidBossView() {
  const { bossDmgDealt, pendingBossDmg, bossClaimed, equipped, quests, claimQuest, claimBossVictory, unleashBossAttack } = useGame(
    useShallow((s) => ({
      bossDmgDealt: s.bossDmgDealt || 0,
      pendingBossDmg: s.pendingBossDmg || 0,
      bossClaimed: !!s.bossDefeated,
      equipped: s.equipped,
      quests: s.quests ?? EMPTY_QUESTS,
      claimQuest: s.claimQuest,
      claimBossVictory: s.claimBossVictory,
      unleashBossAttack: s.unleashBossAttack,
    }))
  );

  const combat = getCombatBonus(equipped);

  const [victoryOpen, setVictoryOpen] = useState(false);
  const [attackTrigger, setAttackTrigger] = useState<{ id: number; dmg: number } | null>(null);
  const [attacking, setAttacking] = useState(false);
  const [lastStrike, setLastStrike] = useState<{ id: number; dmg: number; tier: 1 | 2 | 3 } | null>(null);

  const timeLeft = getTimeUntilWeeklyReset();
  const currentWeek = weekOfUtc();
  const boss = getWeeklyBoss(currentWeek);

  // Simulated live community damage based on elapsed hours since Monday 00:00 UTC + player unleashed contribution
  const hoursIntoWeek = getHoursIntoUtcWeek();
  const communityDrift = Math.round((hoursIntoWeek / 168) * (boss.totalHp * 0.85));
  const totalDamage = Math.min(boss.totalHp, communityDrift + bossDmgDealt);
  const bossHpRemaining = Math.max(0, boss.totalHp - totalDamage);
  const bossDefeated = bossHpRemaining === 0;

  useEffect(() => {
    if (!lastStrike) return;
    const t = setTimeout(() => setLastStrike(null), 1600);
    return () => clearTimeout(t);
  }, [lastStrike]);

  const attackTier: 0 | 1 | 2 | 3 =
    pendingBossDmg <= 0 ? 0 : pendingBossDmg >= 5000 ? 3 : pendingBossDmg >= 1500 ? 2 : 1;

  const handleUnleashAttack = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (attacking || pendingBossDmg <= 0) return;
    const prevHpRemaining = bossHpRemaining;
    const dmg = unleashBossAttack();
    if (dmg <= 0) return;

    const tier: 1 | 2 | 3 = dmg >= 5000 ? 3 : dmg >= 1500 ? 2 : 1;
    const triggerId = Date.now();
    setAttacking(true);
    setAttackTrigger({ id: triggerId, dmg });
    setLastStrike({ id: triggerId, dmg, tier });
    setTimeout(() => setAttacking(false), 520);

    if (tier === 3) {
      sfx.cataclysm();
      haptic([45, 20, 80, 20, 110]);
      fx({ kind: "surge", mode: "both", intensity: 3 });
      fxAt(e.currentTarget, (x, y) => [
        { kind: "burst", x, y: y - 120, color: "#ff3f6c", count: 55, big: true },
        { kind: "burst", x: x - 40, y: y - 150, color: "#ffe14d", count: 30, big: true },
        { kind: "text", x, y: y - 135, text: `💥 -${dmg.toLocaleString("es")} HP!!`, color: "#ff3f6c" },
      ]);
    } else if (tier === 2) {
      sfx.lightning();
      haptic([35, 25, 70]);
      fx({ kind: "surge", mode: "lightning", intensity: 2 });
      fxAt(e.currentTarget, (x, y) => [
        { kind: "burst", x, y: y - 120, color: "#ffe14d", count: 38, big: true },
        { kind: "text", x, y: y - 135, text: `⚡ -${dmg.toLocaleString("es")} HP!`, color: "#ffe14d" },
      ]);
    } else {
      sfx.bossHit();
      haptic([25, 15, 40]);
      fxAt(e.currentTarget, (x, y) => [
        { kind: "burst", x, y: y - 120, color: "#3df2ff", count: 22 },
        { kind: "text", x, y: y - 135, text: `⚔ -${dmg.toLocaleString("es")} HP`, color: "#3df2ff" },
        { kind: "shake", power: 2 },
      ]);
    }

    if (prevHpRemaining > 0 && dmg >= prevHpRemaining) {
      setTimeout(() => {
        sfx.pr();
        fx({ kind: "text", x: window.innerWidth / 2, y: window.innerHeight / 2 - 60, text: "☠ ¡JEFE DERROTADO!", color: "#7dff6a" });
      }, 360);
    }
  };

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
        className="relative overflow-hidden p-3 sm:p-4 border-2 bg-[#120a10]"
        style={{
          borderColor: bossDefeated ? "#7dff6a" : boss.color,
          boxShadow: bossDefeated ? "0 0 18px rgba(125,255,106,0.28)" : `0 0 16px ${boss.color}35`,
        }}
      >
        <div className="flex items-center justify-between border-b-2 border-[#2c3350] pb-1.5 mb-1.5 sm:pb-2 sm:mb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-9 sm:h-9 sm:w-10 items-center justify-center border border-[#2c3350] bg-[#0b0d17] shrink-0">
              <BossEmblemCanvas theme={boss.theme} isDefeated={bossDefeated} size={26} />
            </span>
            <div>
              <div className="pixel-title text-[8.5px] sm:text-[9px] flex items-center gap-1.5" style={{ color: bossDefeated ? "#7dff6a" : boss.color }}>
                <span>{bossDefeated ? "RAID BOSS DERROTADO" : "RAID BOSS SEMANAL"}</span>
                {!bossDefeated && bossHpRemaining < boss.totalHp * 0.5 && (
                  <span className="border border-black bg-[#ff3f6c] px-1 py-0.5 text-[6.5px] font-bold text-white animate-pulse">
                    ⚡ FURIOSO
                  </span>
                )}
              </div>
              <div className="pixel-title text-[6.5px] sm:text-[7px] text-[#8b93b8]">EVENTO COOPERATIVO GLOBAL</div>
            </div>
          </div>
          <span className="mono text-[11px] sm:text-xs tabular-nums text-[var(--gold)]">
            CIERRA EN: {timeLeft}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 sm:gap-1.5 text-center">
          {/* Animated 120 FPS Pixel-Art Canvas Boss */}
          <div className="relative flex w-full justify-center">
            <BossPixelCanvas
              boss={boss}
              hpRemaining={bossHpRemaining}
              isDefeated={bossDefeated}
              petId={equipped?.pet}
              weaponId={equipped?.weapon}
              attackTrigger={attackTrigger}
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

            <AnimatePresence>
              {lastStrike && (
                <motion.div
                  key={lastStrike.id}
                  initial={{ y: 16, scale: 0.65, opacity: 0 }}
                  animate={{ y: -22, scale: 1.05, opacity: 1 }}
                  exit={{ y: -42, opacity: 0 }}
                  transition={APPLE_BOUNCE}
                  className="pointer-events-none absolute top-4 z-20 border-2 border-black px-2.5 py-1 shadow-[3px_3px_0_#000]"
                  style={{
                    backgroundColor:
                      lastStrike.tier === 3 ? "#9f1239" : lastStrike.tier === 2 ? "#78350f" : "#0d2330",
                  }}
                >
                  <span
                    className="pixel-title text-[9px] font-bold"
                    style={{
                      color:
                        lastStrike.tier === 3 ? "#ffe14d" : lastStrike.tier === 2 ? "#ffe14d" : "#3df2ff",
                    }}
                  >
                    {lastStrike.tier === 3
                      ? "💥 CATACLISMO "
                      : lastStrike.tier === 2
                      ? "⚡ CRÍTICO "
                      : "⚔ IMPACTO "}
                    -{lastStrike.dmg.toLocaleString("es")} KG
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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

          <h3 className="pixel-title text-sm text-white leading-tight">
            {boss.name}
          </h3>
          <p className="pixel-title text-[7.5px]" style={{ color: bossDefeated ? "#7dff6a" : boss.color }}>
            {boss.title}
          </p>

          {/* BOSS HP BAR */}
          <div className="w-full mt-0.5 space-y-0.5 sm:space-y-1">
            <div className="flex justify-between items-center text-[10.5px] sm:text-[11px] mono">
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
              h={10}
            />
          </div>

          {/* ACCUMULATED PLAYER DAMAGE & SPECIAL ATTACK TRIGGER (RIGHT BELOW BOSS & HP BAR) */}
          <div
            className={`w-full mt-1 border-2 p-2 sm:p-2.5 space-y-1.5 sm:space-y-2 transition-colors ${
              attackTier === 3
                ? "border-[#ff3f6c] bg-[#260b14] shadow-[0_0_18px_rgba(255,63,108,0.35),2px_2px_0_#000]"
                : attackTier === 2
                ? "border-[var(--gold)] bg-[#211b08] shadow-[0_0_14px_rgba(255,225,77,0.25),2px_2px_0_#000]"
                : attackTier === 1
                ? "border-[var(--cyan)] bg-[#0b1f29] shadow-[2px_2px_0_#000]"
                : "border-[#2c3350] bg-[#0e111c]"
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-left">
              <div className="min-w-0">
                <div className="pixel-title text-[6.5px] sm:text-[7px] text-[#8b93b8] truncate">
                  DAÑO ACUMULADO · TUS ENTRENOS
                </div>
                <div
                  className={`mono text-sm sm:text-base font-bold tabular-nums leading-tight ${
                    attackTier === 3
                      ? "text-[#ff3f6c]"
                      : attackTier === 2
                      ? "text-[var(--gold)]"
                      : attackTier === 1
                      ? "text-[var(--cyan)]"
                      : "text-[#636c8f]"
                  }`}
                >
                  {pendingBossDmg.toLocaleString("es")} kg cargados
                </div>
              </div>
              <span
                className={`pixel-title shrink-0 border border-black px-2 py-0.5 text-[6px] sm:text-[6.5px] font-bold ${
                  attackTier === 3
                    ? "bg-[#ff3f6c] text-white animate-pulse"
                    : attackTier === 2
                    ? "bg-[var(--gold)] text-black"
                    : attackTier === 1
                    ? "bg-[var(--cyan)] text-black"
                    : "bg-[#1b2033] text-[#8b93b8]"
                }`}
              >
                {attackTier === 3
                  ? "💥 CATACLISMO"
                  : attackTier === 2
                  ? "⚡ CRÍTICO"
                  : attackTier === 1
                  ? "⚔ NORMAL"
                  : "SIN CARGA"}
              </span>
            </div>

            {/* 3-Tier Charge Meter: 0 -> 1.5k (Crítico) -> 5k (Cataclismo) */}
            <div className="space-y-0.5">
              <Bar
                value={Math.min(5000, pendingBossDmg)}
                max={5000}
                color={
                  attackTier === 3
                    ? "#ff3f6c"
                    : attackTier === 2
                    ? "var(--gold)"
                    : "var(--cyan)"
                }
                h={5}
              />
              <div className="flex justify-between pixel-title text-[5.5px] text-[#636c8f]">
                <span>0</span>
                <span className={pendingBossDmg >= 1500 ? "text-[var(--gold)]" : ""}>⚡ 1.5K CRÍTICO</span>
                <span className={pendingBossDmg >= 5000 ? "text-[#ff3f6c]" : ""}>💥 5K+ CATACLISMO</span>
              </div>
            </div>

            <PixelButton
              variant={attackTier === 3 ? "danger" : attackTier === 2 ? "gold" : attackTier === 1 ? "cyan" : "ghost"}
              disabled={pendingBossDmg <= 0 || attacking}
              onClick={handleUnleashAttack}
              className={`w-full py-2.5 sm:py-3 text-[8.5px] sm:text-[9px] font-bold shadow-[3px_3px_0_#000] ${
                attackTier >= 2 ? "animate-pulse" : ""
              }`}
            >
              {pendingBossDmg <= 0
                ? "⚔ ENTRENA PARA ACUMULAR DAÑO"
                : attackTier === 3
                ? `💥 DESATAR CATACLISMO (${pendingBossDmg.toLocaleString("es")} KG)`
                : attackTier === 2
                ? `⚡ DESATAR GOLPE CRÍTICO (${pendingBossDmg.toLocaleString("es")} KG)`
                : `⚔️ DESATAR ATAQUE (${pendingBossDmg.toLocaleString("es")} KG)`}
            </PixelButton>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 mt-1.5 text-center">
            <div className="border border-[#2c3350] bg-[#10131f] p-2">
              <div className="pixel-title text-[7px] text-[#8b93b8]">TU DAÑO IMPACTO</div>
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

          <p className="mono max-w-xs text-[11px] text-[#a0aec0] mt-1">
            {boss.lore}
          </p>

          {(combat.weapon || combat.pet) ? (
            <div className="w-full mt-1 border border-[var(--cyan)]/40 bg-[#0d2330]/70 px-2.5 py-1.5 flex items-center justify-between gap-2 text-left">
              <div className="flex items-center gap-2 min-w-0">
                {combat.weapon && (
                  <WeaponPreviewCanvas weaponId={combat.weapon.id} size={20} />
                )}
                {combat.pet && (
                  <PetPreviewCanvas petId={combat.pet.id} size={24} animate={false} />
                )}
                <div className="pixel-title text-[7px] text-[#cbd5e1] truncate">
                  {combat.weapon ? combat.weapon.name.toUpperCase() : ""}
                  {combat.weapon && combat.pet ? " · " : ""}
                  {combat.pet ? combat.pet.name.toUpperCase() : ""}
                </div>
              </div>
              <span className="pixel-title text-[7px] text-[var(--green)] font-bold shrink-0">
                +{combat.bossDmgPct}% DAÑO BOSS
              </span>
            </div>
          ) : (
            <div className="pixel-title text-[6.5px] text-[#636c8f] mt-1">
              TIP: EQUIPA ARMAS Y MASCOTAS EN AVATAR → ARMERÍA PARA ATACAR AL BOSS
            </div>
          )}
        </div>

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
          <span className="absolute -left-3 -top-3 flex h-10 w-10 items-center justify-center border-2 border-black bg-[#161a2b] shadow-[2px_2px_0_#000]">
            <BossEmblemCanvas theme={boss.theme} isDefeated size={26} />
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
