"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useGame } from "@/lib/store";
import { PushPrefs } from "@/lib/push-types";
import {
  PushSupportState,
  getActivePushSubscription,
  getPushSupportState,
  subscribeToRemotePush,
  syncRemotePushState,
  triggerRemoteTestPush,
  unsubscribeRemotePush,
} from "@/lib/push-client";
import { fxAt, haptic, sfx } from "@/lib/fx";
import { APPLE_TAP, Panel, PixelButton } from "./ui";

const PREF_ROWS: {
  key: keyof PushPrefs;
  icon: string;
  label: string;
  desc: string;
}[] = [
  {
    key: "dailyReminder",
    icon: "⚔️",
    label: "Recordatorio diario",
    desc: "~19:00h si aún no has entrenado hoy",
  },
  {
    key: "streakRisk",
    icon: "🔥",
    label: "Alerta de racha en riesgo",
    desc: "Aviso crítico tras 2 días sin sesión",
  },
  {
    key: "weeklyLeague",
    icon: "♛",
    label: "Cierre de Liga semanal",
    desc: "Domingo noche (~21h) antes del reinicio",
  },
  {
    key: "raidBoss",
    icon: "👹",
    label: "Nuevo Raid Boss semanal",
    desc: "Lunes mañana (~08h) al cambiar de jefe",
  },
  {
    key: "restPush",
    icon: "⏱",
    label: "Descanso con pantalla bloqueada",
    desc: "Push remoto al acabar el temporizador",
  },
];

export default function PushPanel() {
  const { pushPrefs, name, streak, lastDay, weeklyExp, setPushPrefs } = useGame(
    useShallow((s) => ({
      pushPrefs: s.pushPrefs,
      name: s.name,
      streak: s.streak,
      lastDay: s.lastDay,
      weeklyExp: s.weeklyExp,
      setPushPrefs: s.setPushPrefs,
    }))
  );

  const [support, setSupport] = useState<PushSupportState>("supported");
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const meta = {
    prefs: pushPrefs,
    heroName: name,
    streak,
    lastDay,
    weeklyExp,
  };

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const s = getPushSupportState();
      if (!alive) return;
      setSupport(s);
      if (typeof Notification !== "undefined") {
        setPerm(Notification.permission);
      }
      const sub = await getActivePushSubscription();
      if (!alive) return;
      if (sub) {
        setSubscribed(true);
        const res = await syncRemotePushState(
          {
            prefs: pushPrefs,
            heroName: name,
            streak,
            lastDay,
            weeklyExp,
          },
          { force: true }
        );
        if (!alive) return;
        if (res.resubscribe) {
          setSubscribed(false);
          setStatusMsg("Tu suscripción anterior expiró. Pulsa activar para reconectar.");
        }
      } else {
        setSubscribed(false);
      }
    };
    refresh();
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      return;
    }
    const id = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const handleActivate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (busy) return;
    setBusy(true);
    setStatusMsg(null);
    const btn = e.currentTarget;
    const res = await subscribeToRemotePush(meta);
    setBusy(false);

    if (typeof Notification !== "undefined") {
      setPerm(Notification.permission);
    }

    if (res.ok) {
      setSubscribed(true);
      setStatusMsg("✓ Push remoto activado en este dispositivo");
      sfx.coin();
      haptic([12, 20, 30]);
      fxAt(btn, (x, y) => [
        { kind: "burst", x, y, color: "#7dff6a", count: 24 },
        { kind: "text", x, y: y - 14, text: "PUSH ACTIVO", color: "#7dff6a" },
      ]);
    } else if (res.reason === "denied") {
      setStatusMsg("⚠️ Permiso bloqueado en ajustes del navegador/móvil.");
      sfx.error();
    } else if (res.reason === "dismissed") {
      setStatusMsg("Permiso cancelado. Pulsa activar cuando quieras.");
    } else {
      setStatusMsg(res.message || "No se pudo activar el Push remoto.");
      sfx.error();
    }
  };

  const handleDisable = async () => {
    if (busy) return;
    setBusy(true);
    await unsubscribeRemotePush();
    setSubscribed(false);
    setBusy(false);
    setStatusMsg("Push remoto desactivado en este dispositivo.");
    sfx.tap();
  };

  const handleTogglePref = async (key: keyof PushPrefs) => {
    const nextPrefs = { ...pushPrefs, [key]: !pushPrefs[key] };
    setPushPrefs({ [key]: nextPrefs[key] });
    sfx.tick();
    haptic(5);
    if (subscribed) {
      await syncRemotePushState(
        {
          ...meta,
          prefs: nextPrefs,
        },
        { force: true }
      );
    }
  };

  const handleTest = async (delaySeconds?: number) => {
    if (busy || !subscribed) return;
    setBusy(true);
    setStatusMsg(null);
    const res = await triggerRemoteTestPush(meta, delaySeconds);
    setBusy(false);

    if (res.ok) {
      sfx.coin();
      haptic([10, 20, 15]);
      if (delaySeconds) {
        setCountdown(delaySeconds);
        setStatusMsg(
          `⏳ Enviado al servidor: cierra o bloquea la app (${delaySeconds}s)...`
        );
      } else {
        setStatusMsg("✓ Notificación remota enviada por el servidor VAPID.");
      }
    } else {
      sfx.error();
      setStatusMsg(res.error || "No se pudo enviar la notificación de prueba.");
    }
  };

  const isDenied = perm === "denied";

  return (
    <Panel className="p-4 space-y-3">
      <div className="flex items-center justify-between border-b-2 border-[#2c3350] pb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">🔔</span>
          <div className="min-w-0">
            <h3 className="pixel-title text-[10px] text-[var(--gold)]">
              NOTIFICACIONES PUSH
            </h3>
            <span className="pixel-title text-[7px] text-[#8b93b8]">
              ALERTAS CON LA APP CERRADA
            </span>
          </div>
        </div>
        <span
          className={`pixel-title shrink-0 border px-1.5 py-0.5 text-[7px] font-bold ${
            subscribed
              ? "border-[#3a7a30] bg-[#15291a] text-[#7dff6a]"
              : isDenied
              ? "border-[var(--red)] bg-[#3a151f] text-[var(--red)]"
              : "border-[#2c3350] bg-[#10131f] text-[#8b93b8]"
          }`}
        >
          {subscribed ? "● ACTIVO" : isDenied ? "✕ BLOQUEADO" : "○ INACTIVO"}
        </span>
      </div>

      {support === "ios-needs-install" ? (
        <div className="border-2 border-[var(--gold)] bg-[#241e0a] p-3 space-y-1.5">
          <div className="pixel-title text-[8px] text-[var(--gold)]">
            📱 INSTALA LA PWA EN IPHONE / IPAD
          </div>
          <p className="mono text-xs leading-snug text-[#cbd5e1]">
            En iOS, Apple solo permite notificaciones Push cuando abres la app
            desde tu pantalla de inicio. Pulsa <b className="text-white">Compartir ⬆</b>{" "}
            en Safari → <b className="text-white">Añadir a pantalla de inicio</b> y vuelve a entrar desde el icono.
          </p>
        </div>
      ) : support === "unsupported" ? (
        <div className="border-2 border-[#2c3350] bg-[#10131f] p-3 mono text-xs text-[#8b93b8]">
          Este navegador no soporta Push Web remoto (prueba Chrome, Edge o Safari PWA en móvil).
        </div>
      ) : support === "no-vapid" ? (
        <div className="border-2 border-[#2c3350] bg-[#10131f] p-3 mono text-xs text-[#8b93b8]">
          Falta configurar la clave pública VAPID en el entorno.
        </div>
      ) : (
        <>
          {!subscribed ? (
            <div className="space-y-2">
              {isDenied && (
                <p className="mono text-xs text-[var(--red)] leading-tight">
                  Has bloqueado los avisos para PixelGym. Actívalos en los
                  ajustes del sitio/navegador y pulsa reintentar.
                </p>
              )}
              <PixelButton
                variant="gold"
                className="w-full py-2.5 text-[9px] font-bold"
                disabled={busy}
                onClick={handleActivate}
              >
                {busy ? "CONECTANDO..." : "🔔 ACTIVAR PUSH REMOTO"}
              </PixelButton>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <PixelButton
                  variant="cyan"
                  className="py-2 text-[7.5px] font-bold"
                  disabled={busy}
                  onClick={() => handleTest()}
                >
                  🔔 PROBAR AHORA
                </PixelButton>
                <PixelButton
                  variant="ghost"
                  className="py-2 text-[7.5px]"
                  disabled={busy || countdown !== null}
                  onClick={() => handleTest(5)}
                >
                  {countdown !== null
                    ? `⏳ CIERRA APP (${countdown}s)`
                    : "🚪 PROBAR EN 5s"}
                </PixelButton>
              </div>
            </div>
          )}
        </>
      )}

      {/* Granular alert toggles */}
      <div className="space-y-1.5">
        {PREF_ROWS.map((row) => {
          const on = pushPrefs[row.key];
          return (
            <motion.button
              key={row.key}
              whileTap={{ scale: 0.98 }}
              transition={APPLE_TAP}
              onClick={() => handleTogglePref(row.key)}
              className={`flex w-full items-center justify-between gap-2 border-2 px-2.5 py-2 text-left transition-colors ${
                on
                  ? "border-[#3a7a30] bg-[#15291a]/40"
                  : "border-[#2c3350] bg-[#10131f] opacity-75"
              }`}
            >
              <div className="min-w-0">
                <div className="pixel-title text-[7.5px] text-white flex items-center gap-1.5">
                  <span>{row.icon}</span>
                  <span className="truncate">{row.label}</span>
                </div>
                <div className="mono text-[11px] leading-tight text-[#8b93b8] mt-0.5">
                  {row.desc}
                </div>
              </div>
              <span
                className={`pixel-title shrink-0 border px-1.5 py-0.5 text-[7px] font-bold ${
                  on
                    ? "border-black bg-[#7dff6a] text-black"
                    : "border-[#2c3350] bg-[#141826] text-[#8b93b8]"
                }`}
              >
                {on ? "ON" : "OFF"}
              </span>
            </motion.button>
          );
        })}
      </div>

      {statusMsg && (
        <div className="mono border border-[#2c3350] bg-[#0c0e17] px-2.5 py-1.5 text-xs text-[var(--cyan)] text-center">
          {statusMsg}
        </div>
      )}

      {subscribed && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleDisable}
            disabled={busy}
            className="pixel-title text-[6.5px] text-[#8b93b8] hover:text-[var(--red)] underline cursor-pointer"
          >
            DESACTIVAR PUSH EN ESTE DISPOSITIVO
          </button>
        </div>
      )}
    </Panel>
  );
}
