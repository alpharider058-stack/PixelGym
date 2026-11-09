"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useGame } from "@/lib/store";
import { DEFAULT_EQUIP, Equipped, ITEMS, LEAGUES, MUSCLE_LABEL, Muscle, Slot, Trophy, getTimeUntilWeeklyReset, leagueOf, levelOf, titleOf } from "@/lib/data";
import { useMyAvatar, useStats } from "@/lib/hooks";
import type { AvatarCfg } from "@/lib/avatar";
import { sfx } from "@/lib/fx";
import Avatar from "./Avatar";
import { Bar, Panel, PixelButton, SPRING, APPLE_SPRING, APPLE_TAP, APPLE_BOUNCE, APPLE_FLUID } from "./ui";
import { Sheet } from "./GymView";

interface Rival { id: string; name: string; me?: boolean; weekly: number; tonnage: number; streak: number; rel: number; cfg: AvatarCfg; title: string }
type Sort = "weekly" | "tonnage" | "streak" | "rel";
const SORTS: { id: Sort; label: string; unit: string }[] = [
  { id: "weekly", label: "EXP SEM", unit: "xp" }, { id: "tonnage", label: "TONELAJE", unit: "kg" },
  { id: "streak", label: "RACHA", unit: "días" }, { id: "rel", label: "F. RELAT.", unit: "x" },
];

const NAMES = ["BRUTUS", "PIXELYN", "IRONMAX", "LA_ROCA", "SQUATZILLA", "DELTOIDE", "KAIBA", "CHUNLIFT", "MEGABICEP", "VALKYRA", "TOR_8BIT", "BENCHZERO", "GOKULIFT", "ARNOLDINO", "SAMUS_FIT", "LINKGAINS", "ZELDAMUSCLE", "MAXPOWER", "TRAPKING", "NEONQUEEN"];

function rng(seed: number) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }

function makeRivals(): Rival[] {
  const hours = (Date.now() / 36e5) % 168; // progress through the week → live-looking drift
  const tick = Math.floor(Date.now() / 60000);
  return NAMES.map((name, i) => {
    const r = rng(i * 7919 + 13);
    const power = Math.pow(r(), 1.6);
    const lvl = 1 + Math.floor(power * 22);
    const tiers = Object.fromEntries((["chest", "back", "shoulders", "arms", "legs"] as Muscle[]).map((m) => [m, Math.min(4, Math.max(0, Math.round(power * 4 + (r() - 0.5) * 1.6)))])) as Record<Muscle, number>;
    const pick = (slot: Slot) => { const opts = ITEMS.filter((it) => it.slot === slot && it.minLevel <= lvl); return opts[Math.floor(r() * opts.length)]?.id ?? DEFAULT_EQUIP[slot]; };
    const equipped: Equipped = { shirt: pick("shirt"), belt: pick("belt"), wrist: pick("wrist"), hair: pick("hair"), aura: pick("aura"), bg: pick("bg") };
    const jitter = rng(i * 31 + tick)();
    return {
      id: "r" + i, name, title: titleOf(lvl),
      weekly: Math.round((power * 30000 + 200) * (hours / 168 + 0.15) + jitter * 40),
      tonnage: Math.round(power * 900000 + r() * 30000),
      streak: Math.round(power * 60 * r() + 1),
      rel: +(0.6 + power * 1.9).toFixed(2),
      cfg: { tiers, equipped, level: lvl },
    };
  });
}


export default function RankView() {
  const [sort, setSort] = useState<Sort>("weekly");
  const [sel, setSel] = useState<Rival | null>(null);
  const [awardedTrophy, setAwardedTrophy] = useState<Trophy | null>(null);
  const [rivals, setRivals] = useState<Rival[]>(() => makeRivals());
  const myCfg = useMyAvatar();
  const st = useStats();
  const { name, weekly, bodyweight } = useGame(
    useShallow((s) => ({
      name: s.name,
      weekly: s.weeklyExp,
      bodyweight: s.bodyweight ?? 75,
    }))
  );

  useEffect(() => {
    const trophy = useGame.getState().checkWeeklyReset();
    if (trophy) setAwardedTrophy(trophy);
    const id = setInterval(() => setRivals(makeRivals()), 60000);
    return () => clearInterval(id);
  }, []);

  const me: Rival = {
    id: "me",
    me: true,
    name,
    weekly,
    tonnage: Math.round(st.tonnage),
    streak: st.sta,
    rel: +(st.str / (bodyweight || 75)).toFixed(2),
    cfg: myCfg,
    title: titleOf(st.level),
  };
  const list = useMemo(() => [...rivals, me].sort((a, b) => b[sort] - a[sort]), [rivals, sort, me.weekly, me.tonnage, me.streak, me.rel, me.cfg, me.name]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Real position in weekly EXP
  const myWeeklyRank = useMemo(() => {
    const weeklySorted = [...rivals, me].sort((a, b) => b.weekly - a.weekly);
    return weeklySorted.findIndex((r) => r.me) + 1;
  }, [rivals, me]);

  const league = leagueOf(weekly);
  const nextL = LEAGUES[LEAGUES.indexOf(league) + 1];
  const sortIdx = Math.max(0, SORTS.findIndex((s) => s.id === sort));
  const unit = SORTS[sortIdx].unit;
  const timeLeft = getTimeUntilWeeklyReset();

  return (
    <div className="flex flex-col gap-5">
      {/* HEADER DE TEMPORADA Y CUENTA ATRÁS */}
      <Panel className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b-2 border-[#2c3350] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">⏱</span>
            <span className="pixel-title text-[8px] text-[var(--gold)]">TEMPORADA SEMANAL</span>
          </div>
          <div className="mono text-xs tabular-nums text-[#3df2ff]">
            CIERRA EN: <b className="text-white">{timeLeft}</b>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LeagueBadge color={league.color} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="pixel-title text-xs" style={{ color: league.color }}>LIGA {league.name}</span>
              <span className="pixel-title text-[8px] text-[var(--gold)]">PUESTO ACTUAL: #{myWeeklyRank}</span>
            </div>
            <div className="mono text-sm text-[#8b93b8]">{nextL ? `${nextL.min - weekly} xp para ${nextL.name}` : "¡CIMA ALCANZADA!"}</div>
            <div className="mt-1"><Bar value={weekly - league.min} max={nextL ? nextL.min - league.min : 1} color={league.color} h={8} /></div>
          </div>
        </div>
      </Panel>

      <div className="border-2 border-[#2c3350] bg-[#10131f] p-1 shadow-[2px_2px_0_#000]">
        <div className="relative grid grid-cols-4">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-1/4"
            initial={false}
            animate={{ x: `${sortIdx * 100}%` }}
            transition={APPLE_SPRING}
          >
            <div className="h-full w-full bg-[var(--cyan)] border-2 border-black shadow-[2px_2px_0_#000]" />
          </motion.div>
          {SORTS.map((s) => (
            <motion.button
              key={s.id}
              whileTap={{ scale: 0.94 }}
              transition={APPLE_TAP}
              onClick={() => { setSort(s.id); sfx.tick(); }}
              className={`relative z-10 py-2.5 pixel-title text-[7.5px] font-bold transition-colors ${sort === s.id ? "text-black" : "text-[#8b93b8]"}`}
            >
              <span className="relative">{s.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {list.map((r, i) => {
          const lg = leagueOf(r.weekly);
          return (
            <motion.button
              layout="position"
              key={r.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...APPLE_SPRING, delay: Math.min(i * 0.03, 0.4) }}
              whileHover={{ scale: 1.015, x: 2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSel(r); sfx.whoosh(); }}
              className={`flex w-full items-center gap-3 border-2 p-2 text-left cursor-pointer transition-colors shadow-[2px_2px_0_#000] ${r.me ? "border-[var(--gold)] bg-[#2a2410]" : "border-[#2c3350] bg-[#141826]"}`}
            >
              <span className="pixel-title w-7 text-center text-[10px]" style={{ color: i < 3 ? ["#ffe14d", "#c8d0dc", "#c47a3a"][i] : "#8b93b8" }}>{i + 1}</span>
              <div className="h-[44px] w-[44px] shrink-0 overflow-hidden border-2 border-black"><div style={{ margin: "-6px 0 0 -10px" }}><Avatar cfg={r.cfg} scale={1} animate={false} /></div></div>
              <div className="min-w-0 flex-1">
                <div className="pixel-title truncate text-[9px]">{r.name}{r.me ? " (TÚ)" : ""}</div>
                <div className="pixel-title text-[7px]" style={{ color: lg.color }}>{lg.name} · LV{r.cfg.level}</div>
              </div>
              <span className="mono text-base tabular-nums">{r[sort].toLocaleString("es")}<span className="text-xs text-[#8b93b8]"> {unit}</span></span>
            </motion.button>
          );
        })}
      </div>

      {/* MODAL DE TROFEO OBTENIDO */}
      <AnimatePresence>
        {awardedTrophy && (
          <Sheet
            title="¡TEMPORADA FINALIZADA!"
            onClose={() => setAwardedTrophy(null)}
            footer={
              <PixelButton
                variant="gold"
                className="w-full py-3 text-[9px]"
                onClick={() => setAwardedTrophy(null)}
              >
                ¡RECLAMAR Y GUARDAR EN VITRINA!
              </PixelButton>
            }
          >
            <div className="flex flex-col items-center gap-3 text-center py-2">
              <motion.div
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={APPLE_BOUNCE}
                className="relative flex h-28 w-28 items-center justify-center border-4 border-[var(--gold)] bg-[#2a2208] p-4 shadow-[0_0_24px_rgba(255,225,77,0.4)]"
              >
                <motion.span
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -4, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="pixelated text-6xl"
                >
                  {awardedTrophy.icon}
                </motion.span>
                <motion.span
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ ...APPLE_BOUNCE, delay: 0.15 }}
                  className="pixel-title absolute -bottom-3 border-2 border-black bg-[var(--gold)] px-2 py-0.5 text-[9px] text-black font-bold"
                >
                  PUESTO #{awardedTrophy.rank}
                </motion.span>
              </motion.div>

              <div className="mt-2">
                <div className="pixel-title text-[9px] text-[var(--gold)]">¡NUEVO TROFEO CONSEGUIDO!</div>
                <h3 className="pixel-title text-base text-white mt-1">{awardedTrophy.title}</h3>
                <div className="pixel-title text-[8px] text-[var(--cyan)]">{awardedTrophy.leagueName} · {awardedTrophy.weekKey}</div>
              </div>

              <p className="mono max-w-xs text-xs text-[#a0aec0]">
                {awardedTrophy.rank === 1
                  ? "¡Has alcanzado la cima de la clasificación semanal! Tu nombre queda grabado en oro."
                  : awardedTrophy.rank <= 3
                  ? "¡Has subido al podio de honor de la liga esta semana!"
                  : awardedTrophy.rank <= 10
                  ? "¡Has terminado en el Top 10 semanal entre los levantadores más dedicados!"
                  : "¡Has completado una sólida semana de entrenamientos y sumado EXP a la liga!"}
              </p>

              <div className="w-full border-2 border-[#2c3350] bg-[#10131f] p-3 text-center space-y-2">
                <div className="pixel-title text-[8px] text-[var(--gold)]">RECOMPENSA DE TEMPORADA</div>
                <div className="mono text-xl tabular-nums font-bold text-[var(--gold)]">+{awardedTrophy.goldReward}G ORO</div>
                <div className="mono text-[11px] text-[#636c8f]">
                  Tu EXP semanal se ha reiniciado a 0 para dar comienzo a la nueva semana competitiva. Tu trofeo ya está expuesto en tu vitrina de la sección <b>AVATAR</b>.
                </div>
              </div>
            </div>
          </Sheet>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sel && (
          <Sheet
            title="TARJETA DE COMBATE"
            onClose={() => setSel(null)}
            footer={
              <PixelButton
                variant="ghost"
                className="w-full py-2.5 text-[9px]"
                onClick={() => setSel(null)}
              >
                CERRAR
              </PixelButton>
            }
          >
            <div className="flex flex-col items-center gap-3">
              <div className="frame9"><Avatar cfg={sel.cfg} scale={3} interactive /></div>
              <div className="pixel-title text-sm">{sel.name}</div>
              <div className="pixel-title text-[9px] text-[var(--gold)]">{sel.title.toUpperCase()} · LV {sel.cfg.level}</div>
              <div className="grid w-full grid-cols-3 gap-2 text-center">
                {[["TONELAJE", sel.tonnage.toLocaleString("es") + "kg"], ["RACHA", sel.streak + "d"], ["F.REL", sel.rel + "x"]].map(([k, v]) => (
                  <motion.div
                    key={k}
                    whileHover={{ y: -2, scale: 1.02 }}
                    transition={APPLE_SPRING}
                    className="border-2 border-[#2c3350] bg-[#10131f] p-2"
                  >
                    <div className="pixel-title text-[7px] text-[#8b93b8]">{k}</div>
                    <div className="mono text-base tabular-nums">{v}</div>
                  </motion.div>
                ))}
              </div>
              <div className="w-full space-y-1">
                {(Object.keys(MUSCLE_LABEL) as Muscle[]).map((m) => (
                  <div key={m} className="flex items-center gap-2">
                    <span className="pixel-title w-20 text-[7px]">{MUSCLE_LABEL[m]}</span>
                    <div className="flex-1"><Bar value={sel.cfg.tiers[m] + 1} max={5} color="#ff3f6c" h={8} /></div>
                  </div>
                ))}
              </div>
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}

function LeagueBadge({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 12 12" className="pixelated" shapeRendering="crispEdges">
      <path d="M2 1h8v1h1v5h-1v1h-1v1h-1v1h-1v1h-2v-1h-1v-1h-1v-1h-1v-1h-1v-5h1z" fill="#000" />
      <path d="M3 2h6v1h1v3h-1v1h-1v1h-1v1h-2v-1h-1v-1h-1v-1h-1v-3h1z" fill={color} />
      <path d="M4 3h2v1h-1v2h-1z" fill="#fff" opacity=".7" />
    </svg>
  );
}

export { levelOf };
