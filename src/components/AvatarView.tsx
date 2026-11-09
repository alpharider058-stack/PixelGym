"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useGame } from "@/lib/store";
import { ITEMS, MUSCLE_LABEL, Muscle, Slot, TIER_KG, Trophy, TrophyGrade, expForLevel, getCombatBonus, tierOf, titleOf } from "@/lib/data";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { useMyAvatar, useStats } from "@/lib/hooks";
import { fxAt, haptic, sfx } from "@/lib/fx";
import Avatar from "./Avatar";
import { Bar, Panel, PixelButton, SPRING, APPLE_SPRING, APPLE_TAP, APPLE_BOUNCE, APPLE_FLUID } from "./ui";
import { Sheet } from "./GymView";
import MuscleHeatmap from "./MuscleHeatmap";
import PushPanel from "./PushPanel";

const SLOTS: { id: Slot; label: string }[] = [
  { id: "shirt", label: "ROPA" },
  { id: "weapon", label: "ARMAS" },
  { id: "pet", label: "MASCOTAS" },
  { id: "belt", label: "CINTO" },
  { id: "wrist", label: "MUÑECA" },
  { id: "hair", label: "PELO" },
  { id: "aura", label: "AURA" },
  { id: "bg", label: "FONDO" },
];

export default function AvatarView() {
  const cfg = useMyAvatar();
  const st = useStats();
  const { name, gold, muscleVol, sound, trophies, bodyweight, activeTitle, equipped } = useGame(
    useShallow((s) => ({
      name: s.name,
      gold: s.gold,
      muscleVol: s.muscleVol,
      sound: s.sound,
      trophies: s.trophies || [],
      bodyweight: s.bodyweight ?? 75,
      activeTitle: s.activeTitle,
      equipped: s.equipped,
    }))
  );
  const setName = useGame((s) => s.setName);
  const setBodyweight = useGame((s) => s.setBodyweight);
  const toggleSound = useGame((s) => s.toggleSound);
  const prev = st.level > 1 ? expForLevel(st.level - 1) : 0;
  const next = expForLevel(st.level);
  const combat = getCombatBonus(equipped);
  const displayTitle = (activeTitle || titleOf(st.level)).toUpperCase();

  return (
    <div className="flex flex-col gap-5">
      <Panel className="flex flex-col items-center gap-3 p-4">
        <div className="flex w-full items-center justify-between">
          <input className="pixel-title w-40 bg-transparent text-xs text-white outline-none" defaultValue={name} onBlur={(e) => setName(e.target.value)} maxLength={12} aria-label="Nombre" />
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={APPLE_TAP}
            className="pixel-title text-[9px] text-[#8b93b8] hover:text-[var(--gold)] transition-colors border border-transparent hover:border-[#2c3350] px-1.5 py-0.5"
            onClick={toggleSound}
          >
            {sound ? "♪ ON" : "♪ OFF"}
          </motion.button>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={APPLE_TAP}
          className="frame9 cursor-pointer"
        >
          <Avatar cfg={cfg} scale={4} interactive />
        </motion.div>
        <div className="pixel-title text-[9px] text-[#8b93b8]">TOCA PARA FLEXIONAR</div>
        <div className="w-full">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="pixel-title text-[9.5px] text-[var(--gold)] truncate">LV {st.level} · {displayTitle}</span>
            <span className="mono text-sm tabular-nums shrink-0">{st.exp - prev}/{next - prev}</span>
          </div>
          <Bar value={st.exp - prev} max={next - prev} color="var(--green)" h={12} />
        </div>
        {(combat.weapon || combat.pet) && (
          <div className="w-full border border-[#2c3350] bg-[#10131f] px-2.5 py-1.5 flex items-center justify-between text-[7px] pixel-title">
            <span className="text-[#cbd5e1] truncate">
              {combat.weapon ? `⚔ ${combat.weapon.name.toUpperCase()}` : ""}
              {combat.weapon && combat.pet ? " · " : ""}
              {combat.pet ? `🐾 ${combat.pet.name.toUpperCase()}` : ""}
            </span>
            <span className="text-[var(--green)] font-bold shrink-0 ml-2">+{combat.bossDmgPct}% BOSS</span>
          </div>
        )}
        <div className="grid w-full grid-cols-4 gap-2 text-center">
          {[["STR", st.str, "#ff3f6c"], ["HYP", st.hyp, "#c06cff"], ["STA", st.sta, "#3df2ff"], ["ORO", gold, "#ffe14d"]].map(([k, v, c]) => (
            <motion.div
              key={k as string}
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={APPLE_TAP}
              className="border-2 border-[#2c3350] bg-[#10131f] p-2 cursor-pointer shadow-[2px_2px_0_#000]"
            >
              <div className="pixel-title text-[8px]" style={{ color: c as string }}>{k}</div>
              <div className="mono text-lg tabular-nums">{v}</div>
            </motion.div>
          ))}
        </div>
        <div className="flex w-full items-center justify-between border-t border-[#2c3350] pt-2 px-1">
          <span className="pixel-title text-[8px] text-[#8b93b8]">PESO CORPORAL</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.5"
              min="30"
              max="250"
              defaultValue={bodyweight}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setBodyweight(val);
              }}
              className="mono w-16 bg-[#10131f] border-2 border-[#2c3350] px-1.5 py-1 text-center text-sm font-bold text-white tabular-nums outline-none focus:border-[var(--gold)] shadow-inner"
              aria-label="Peso corporal en kg"
            />
            <span className="mono text-xs text-[var(--gold)] font-bold">kg</span>
          </div>
        </div>
        <div className="mono w-full text-center text-sm text-[#8b93b8]">TONELAJE TOTAL: <b className="text-white tabular-nums">{Math.round(st.tonnage).toLocaleString("es")} kg</b></div>
      </Panel>

      {/* NOTIFICACIONES PUSH REMOTAS (VAPID) */}
      <PushPanel />

      {/* VITRINA DE TROFEOS SEMANALES */}
      <TrophyCabinet trophies={trophies} />

      {/* MEDALLAS DE CARRERA & LOGROS PERMANENTES */}
      <AchievementHall />

      {/* MAPA DE CALOR MUSCULAR ANATÓMICO (RECUPERACIÓN & FATIGA 7 DÍAS) */}
      <Panel className="p-4">
        <MuscleHeatmap />
      </Panel>

      <Panel className="space-y-2 p-4">
        <h3 className="pixel-title text-[10px] text-[var(--gold)]">HIPERTROFIA</h3>
        {(Object.keys(MUSCLE_LABEL) as Muscle[]).map((m) => {
          const v = muscleVol[m], t = tierOf(v), nx = TIER_KG[t + 1];
          return (
            <div key={m}>
              <div className="flex justify-between"><span className="pixel-title text-[8px]">{MUSCLE_LABEL[m]} · T{t + 1}</span><span className="mono text-xs tabular-nums text-[#8b93b8]">{Math.round(v)}{nx ? `/${nx}` : " MAX"} kg</span></div>
              <Bar value={nx ? v - TIER_KG[t] : 1} max={nx ? nx - TIER_KG[t] : 1} color={["#7dff6a", "#3df2ff", "#ffe14d", "#ff7a1a", "#ff3f6c"][t]} h={8} />
            </div>
          );
        })}
      </Panel>

      <Armory level={st.level} />
    </div>
  );
}

function TrophyCabinet({ trophies }: { trophies: Trophy[] }) {
  const [inspect, setInspect] = useState<Trophy | null>(null);

  const gradeColors: Record<TrophyGrade, { border: string; bg: string; text: string; glow: string }> = {
    gold: { border: "#ffe14d", bg: "#2a2208", text: "#ffe14d", glow: "rgba(255,225,77,0.4)" },
    silver: { border: "#c8d0dc", bg: "#161b26", text: "#e2e8f0", glow: "rgba(200,208,220,0.3)" },
    bronze: { border: "#c47a3a", bg: "#24160e", text: "#f6ad55", glow: "rgba(196,122,58,0.3)" },
    diamond: { border: "#3df2ff", bg: "#0d2430", text: "#3df2ff", glow: "rgba(61,242,255,0.4)" },
    medal: { border: "#a0aec0", bg: "#141724", text: "#cbd5e1", glow: "rgba(160,174,192,0.2)" },
  };

  return (
    <Panel className="relative overflow-hidden p-4">
      {/* Wooden / Obsidian shelf headers */}
      <div className="mb-3 flex items-center justify-between border-b-2 border-[#2c3350] pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🏆</span>
          <div>
            <h3 className="pixel-title text-[10px] text-[var(--gold)]">VITRINA DE TROFEOS</h3>
            <span className="pixel-title text-[7px] text-[#8b93b8]">HISTORIAL DE LIGAS SEMANALES</span>
          </div>
        </div>
        <span className="mono text-xs tabular-nums text-[var(--gold)]">
          {trophies.length} {trophies.length === 1 ? "TROFEO" : "TROFEOS"}
        </span>
      </div>

      {trophies.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded border-2 border-dashed border-[#2c3350] bg-[#0c0e17] py-6 px-4 text-center">
          <div className="flex gap-3 text-2xl opacity-40">
            <span className="pixelated">🏆</span>
            <span className="pixelated">🥈</span>
            <span className="pixelated">🥉</span>
          </div>
          <div className="pixel-title text-[9px] text-[#8b93b8]">VITRINA VACÍA</div>
          <p className="mono max-w-xs text-xs text-[#636c8f]">
            Compite entrenando cada semana en las <b className="text-white">LIGAS</b>. Cada lunes se cierra la clasificación y recibirás un trofeo permanente según tu posición.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Obsidian shelf shelf-grid */}
          <div className="grid grid-cols-3 gap-2">
            {trophies.map((t, idx) => {
              const theme = gradeColors[t.grade] || gradeColors.medal;
              return (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...APPLE_SPRING, delay: idx * 0.04 }}
                  whileHover={{ y: -3, scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    setInspect(t);
                    sfx.tap();
                    haptic(8);
                  }}
                  className="group relative flex flex-col items-center gap-1.5 border-2 p-2.5 text-center transition-all cursor-pointer"
                  style={{
                    borderColor: theme.border,
                    background: `linear-gradient(180deg, ${theme.bg} 0%, #0d0f18 100%)`,
                    boxShadow: `0 4px 0 #000, 0 0 10px ${theme.glow}`,
                  }}
                >
                  {/* Rank badge */}
                  <span
                    className="pixel-title absolute -top-2 -right-1 border border-black px-1 text-[7px] font-bold shadow-[1px_1px_0_#000]"
                    style={{ background: theme.border, color: "#000" }}
                  >
                    #{t.rank}
                  </span>

                  {/* Big pixel trophy */}
                  <span className="pixelated text-3xl transition-transform group-hover:scale-110">
                    {t.icon}
                  </span>

                  {/* Title & week */}
                  <span className="pixel-title line-clamp-1 w-full text-[8px] leading-tight" style={{ color: theme.text }}>
                    {t.title}
                  </span>
                  <span className="mono text-[10px] text-[#8b93b8]">
                    {t.weekKey}
                  </span>

                  {/* Shelf bottom pedestal line */}
                  <div className="h-1 w-full border-t border-black bg-[#3e2717]" />
                </motion.button>
              );
            })}
          </div>
          <div className="pixel-title text-center text-[7px] text-[#636c8f]">
            TOCA CUALQUIER TROFEO PARA INSPECCIONAR SUS DETALLES
          </div>
        </div>
      )}

      {/* Modal Inspector for Trophy */}
      <AnimatePresence>
        {inspect && (
          <Sheet
            title="DETALLE DEL TROFEO"
            onClose={() => setInspect(null)}
            footer={
              <PixelButton
                variant="gold"
                className="w-full py-2.5 text-[9px]"
                onClick={() => setInspect(null)}
              >
                CERRAR VITRINA
              </PixelButton>
            }
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={APPLE_BOUNCE}
                className="relative flex h-24 w-24 items-center justify-center border-4 border-black p-3"
                style={{
                  background: `radial-gradient(circle, ${gradeColors[inspect.grade].bg} 0%, #0d0f18 80%)`,
                  borderColor: gradeColors[inspect.grade].border,
                  boxShadow: `0 0 24px ${gradeColors[inspect.grade].glow}`,
                }}
              >
                <motion.span
                  initial={{ scale: 0.5, rotate: -8 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={APPLE_BOUNCE}
                  className="pixelated text-6xl"
                >
                  {inspect.icon}
                </motion.span>
                <motion.span
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ ...APPLE_BOUNCE, delay: 0.1 }}
                  className="pixel-title absolute -bottom-2 border-2 border-black px-2 py-0.5 text-[9px]"
                  style={{ background: gradeColors[inspect.grade].border, color: "#000" }}
                >
                  PUESTO #{inspect.rank}
                </motion.span>
              </motion.div>

              <div className="mt-1">
                <h4 className="pixel-title text-sm" style={{ color: gradeColors[inspect.grade].text }}>
                  {inspect.title}
                </h4>
                <p className="pixel-title mt-0.5 text-[8px]" style={{ color: inspect.leagueColor }}>
                  {inspect.leagueName} · SEMANA {inspect.weekKey}
                </p>
              </div>

              <p className="mono max-w-xs text-xs text-[#a0aec0]">
                {inspect.rank === 1
                  ? "Conquistó el escalón más alto del podio en una semana de esfuerzo legendario."
                  : inspect.rank <= 3
                  ? "Subió al podio demostrando disciplina y tonelaje férreo."
                  : inspect.rank <= 10
                  ? "Puesto de honor en el Top 10 semanal entre los atletas más dedicados."
                  : "Medalla conmemorativa de participación y constancia en la liga."}
              </p>

              <div className="grid w-full grid-cols-3 gap-2 text-center">
                <motion.div
                  whileHover={{ y: -2, scale: 1.02 }}
                  transition={APPLE_SPRING}
                  className="border-2 border-[#2c3350] bg-[#10131f] p-2"
                >
                  <div className="pixel-title text-[7px] text-[#8b93b8]">POSICIÓN</div>
                  <div className="mono text-base tabular-nums font-bold text-white">#{inspect.rank}</div>
                </motion.div>
                <motion.div
                  whileHover={{ y: -2, scale: 1.02 }}
                  transition={APPLE_SPRING}
                  className="border-2 border-[#2c3350] bg-[#10131f] p-2"
                >
                  <div className="pixel-title text-[7px] text-[#8b93b8]">EXP SEMANAL</div>
                  <div className="mono text-base tabular-nums text-[var(--cyan)]">{inspect.weeklyExp.toLocaleString("es")}</div>
                </motion.div>
                <motion.div
                  whileHover={{ y: -2, scale: 1.02 }}
                  transition={APPLE_SPRING}
                  className="border-2 border-[#2c3350] bg-[#10131f] p-2"
                >
                  <div className="pixel-title text-[7px] text-[#8b93b8]">PREMIO ORO</div>
                  <div className="mono text-base tabular-nums text-[var(--gold)]">+{inspect.goldReward}G</div>
                </motion.div>
              </div>

              <div className="mono w-full border-t border-[#2c3350] pt-2 text-[11px] text-[#636c8f]">
                Otorgado el {new Date(inspect.awardedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </Panel>
  );
}

function Armory({ level }: { level: number }) {
  const [slot, setSlot] = useState<Slot>("shirt");
  const { owned, equipped, gold } = useGame(useShallow((s) => ({ owned: s.owned, equipped: s.equipped, gold: s.gold })));
  const buy = useGame((s) => s.buy);
  const equip = useGame((s) => s.equip);
  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="pixel-title text-[10px] text-[var(--gold)]">ARMERÍA · <span className="text-white">{gold}G</span></h3>
        <span className="pixel-title text-[6.5px] text-[#8b93b8]">EQUIPO · ARMAS · MASCOTAS</span>
      </div>
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1.5 touch-pan-x">
        {SLOTS.map((s) => {
          const active = slot === s.id;
          return (
            <motion.button
              key={s.id}
              whileTap={{ scale: 0.92 }}
              transition={APPLE_TAP}
              onClick={() => { setSlot(s.id); sfx.tick(); }}
              className={`shrink-0 border-2 px-2.5 py-2 pixel-title text-[7.5px] transition-colors ${
                active
                  ? "border-black bg-[var(--gold)] text-black font-bold shadow-[2px_2px_0_#000]"
                  : "border-[#2c3350] bg-[#10131f] text-[#8b93b8]"
              }`}
            >
              {s.label}
            </motion.button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ITEMS.filter((i) => i.slot === slot).map((it) => {
          const has = owned.includes(it.id), on = (equipped?.[slot] ?? "") === it.id, locked = level < it.minLevel;
          return (
            <motion.button
              key={it.id}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={APPLE_TAP}
              onClick={(e) => {
                if (has) { equip(it.id); sfx.tap(); haptic(6); return; }
                if (buy(it.id)) { sfx.coin(); haptic([10, 20, 30]); fxAt(e.currentTarget, (x, y) => [{ kind: "burst", x, y, color: "#ffe14d", count: 24 }, { kind: "text", x, y, text: `-${it.price}G`, color: "#ffe14d" }]); }
                else { sfx.error(); haptic([40, 30, 40]); e.currentTarget.animate([{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }], { duration: 160, easing: "steps(3)" }); }
              }}
              className={`flex flex-col items-start gap-1 border-2 p-2.5 text-left cursor-pointer transition-colors shadow-[2px_2px_0_#000] ${on ? "border-[var(--gold)] bg-[#2a2410]" : "border-[#2c3350] bg-[#10131f]"} ${locked && !has ? "opacity-50" : ""}`}
            >
              <span className="flex items-center gap-2">
                <span className="pixelated inline-block h-4 w-4 shrink-0 border-2 border-black" style={{ background: it.color || "repeating-linear-gradient(45deg,#333 0 2px,#111 2px 4px)" }} />
                <span className="mono text-sm leading-tight text-white">{it.name}</span>
              </span>
              {it.desc && (
                <span className="mono text-[11px] leading-tight text-[var(--cyan)]">
                  {it.desc}
                </span>
              )}
              <span className="pixel-title text-[8px] text-[#8b93b8]">
                {on ? "✓ EQUIPADO" : has ? "EQUIPAR" : locked ? `🔒 LV ${it.minLevel}` : `${it.price}G`}
              </span>
            </motion.button>
          );
        })}
      </div>
    </Panel>
  );
}

function AchievementHall() {
  const { tonnage, streak, maxStreak, history, owned, bossKills, totalPrs, claimedAchievements, activeTitle } = useGame(
    useShallow((s) => ({
      tonnage: s.tonnage,
      streak: s.streak,
      maxStreak: s.maxStreak || 0,
      history: s.history || [],
      owned: s.owned || [],
      bossKills: s.bossKills || 0,
      totalPrs: s.totalPrs || 0,
      claimedAchievements: s.claimedAchievements || [],
      activeTitle: s.activeTitle,
    }))
  );
  const claimAchievement = useGame((s) => s.claimAchievement);
  const setActiveTitle = useGame((s) => s.setActiveTitle);
  const [expanded, setExpanded] = useState(false);

  const snap = { tonnage, streak, maxStreak, history, owned, bossKills, totalPrs };
  const evaluated = ACHIEVEMENTS.map((def) => {
    const ev = def.eval(snap);
    const claimed = claimedAchievements.includes(def.id);
    return { def, ...ev, claimed };
  });

  const unlockedCount = evaluated.filter((x) => x.unlocked).length;
  const claimableCount = evaluated.filter((x) => x.unlocked && !x.claimed).length;
  const shown = expanded ? evaluated : evaluated.slice(0, 6);

  return (
    <Panel className="p-4 space-y-3">
      <div className="flex items-center justify-between border-b-2 border-[#2c3350] pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🎖️</span>
          <div>
            <h3 className="pixel-title text-[10px] text-[var(--gold)]">MEDALLAS DE CARRERA</h3>
            <span className="pixel-title text-[7px] text-[#8b93b8]">LOGROS PERMANENTES Y TÍTULOS</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {claimableCount > 0 && (
            <span className="pixel-title animate-pulse border border-black bg-[var(--gold)] px-1.5 py-0.5 text-[7px] font-bold text-black">
              {claimableCount} LISTO{claimableCount > 1 ? "S" : ""}
            </span>
          )}
          <span className="mono text-xs tabular-nums text-[var(--cyan)]">
            {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {shown.map(({ def, unlocked, progress, target, unit, claimed }) => {
          const isTitleOn = activeTitle === def.profileTitle;
          return (
            <div
              key={def.id}
              className={`flex flex-col justify-between gap-2 border-2 p-2.5 shadow-[2px_2px_0_#000] transition-colors ${
                unlocked && !claimed
                  ? "border-[var(--gold)] bg-[#241e0a]"
                  : unlocked
                  ? "border-[#3a7a30] bg-[#15291a]/45"
                  : "border-[#2c3350] bg-[#10131f]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <span className={`text-xl leading-none shrink-0 ${unlocked ? "" : "grayscale opacity-50"}`}>
                    {def.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="pixel-title text-[7.5px] text-white leading-snug">{def.title}</div>
                    <div className="mono text-[11px] leading-tight text-[#cbd5e1] mt-0.5">{def.desc}</div>
                  </div>
                </div>
                <span className="pixel-title text-[7px] text-[var(--gold)] shrink-0">+{def.rewardGold}G</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between mono text-[10.5px] text-[#8b93b8]">
                  <span>Título: <b className="text-white">{def.profileTitle}</b></span>
                  <span className="tabular-nums">{progress.toLocaleString("es")}/{target.toLocaleString("es")} {unit}</span>
                </div>
                <Bar value={progress} max={target} color={unlocked ? "#7dff6a" : def.color} h={6} />
              </div>

              {unlocked && !claimed ? (
                <PixelButton
                  variant="gold"
                  className="w-full py-2 text-[8px] font-bold"
                  onClick={(e) => {
                    const g = claimAchievement(def.id);
                    if (g > 0) {
                      sfx.achievement();
                      haptic([15, 25, 40]);
                      fxAt(e.currentTarget, (x, y) => [
                        { kind: "burst", x, y, color: "#ffe14d", count: 28 },
                        { kind: "text", x, y: y - 12, text: `+${g}G`, color: "#ffe14d" },
                      ]);
                    }
                  }}
                >
                  🎁 COBRAR +{def.rewardGold}G Y TÍTULO
                </PixelButton>
              ) : unlocked ? (
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  transition={APPLE_TAP}
                  onClick={() => {
                    sfx.tap();
                    haptic(5);
                    setActiveTitle(isTitleOn ? null : def.profileTitle);
                  }}
                  className={`pixel-title w-full border py-1.5 text-[7px] transition-colors ${
                    isTitleOn
                      ? "border-[var(--gold)] bg-[var(--gold)] text-black font-bold"
                      : "border-[#2c3350] bg-[#141826] text-[#cbd5e1]"
                  }`}
                >
                  {isTitleOn ? "✓ TÍTULO EQUIPADO (TOCA PARA QUITAR)" : `EQUIPAR «${def.profileTitle.toUpperCase()}»`}
                </motion.button>
              ) : null}
            </div>
          );
        })}
      </div>

      {ACHIEVEMENTS.length > 6 && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={APPLE_TAP}
          onClick={() => {
            setExpanded((e) => !e);
            sfx.tick();
          }}
          className="pixel-title w-full border-2 border-[#2c3350] bg-[#10131f] py-2 text-[7.5px] text-[var(--cyan)]"
        >
          {expanded ? "▲ VER MENOS MEDALLAS" : `▼ VER TODAS LAS MEDALLAS (${ACHIEVEMENTS.length})`}
        </motion.button>
      )}
    </Panel>
  );
}
