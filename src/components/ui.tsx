"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initials } from "@/lib/initials";
import { getMuted, loadMuted, setMuted, sfx } from "@/lib/sound";

/* ---------------------------- Avatar ---------------------------- */

export function Avatar({
  name,
  accent,
  size = 44,
  rank,
}: {
  name: string;
  accent: string;
  size?: number;
  rank?: number;
}) {
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-[30%] font-display font-extrabold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        color: "#08101a",
        background: `linear-gradient(150deg, ${accent}, ${accent}99)`,
        boxShadow: `0 6px 18px ${accent}44, inset 0 1px 0 rgba(255,255,255,.45)`,
      }}
    >
      {initials(name)}
      {rank !== undefined && rank < 3 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px]">
          {["🥇", "🥈", "🥉"][rank]}
        </span>
      )}
    </span>
  );
}

/* ---------------------------- Confetti ---------------------------- */

type P = { x: number; y: number; vx: number; vy: number; s: number; r: number; vr: number; c: string; life: number };

export function Confetti({ fire }: { fire: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const parts = useRef<P[]>([]);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!fire) return;
    const cv = ref.current;
    if (!cv) return;
    const colors = ["#c8ff4d", "#4be3ff", "#ff4d8d", "#ffd23f", "#ff6b3d", "#b28bff"];
    const w = (cv.width = cv.offsetWidth * 2);
    const h = (cv.height = cv.offsetHeight * 2);
    for (let i = 0; i < 90; i++) {
      parts.current.push({
        x: w / 2 + (Math.random() - 0.5) * w * 0.3,
        y: h * 0.42,
        vx: (Math.random() - 0.5) * 22,
        vy: -Math.random() * 26 - 6,
        s: 6 + Math.random() * 10,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        c: colors[i % colors.length],
        life: 1,
      });
    }
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      parts.current = parts.current.filter((p) => p.life > 0 && p.y < h + 60);
      for (const p of parts.current) {
        p.vy += 0.75;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        p.life -= 0.006;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
        ctx.restore();
      }
      if (parts.current.length) raf.current = requestAnimationFrame(loop);
      else ctx.clearRect(0, 0, w, h);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [fire]);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      aria-hidden
    />
  );
}

/* ---------------------------- Timer ring ---------------------------- */

export function TimerRing({
  ms,
  total,
  size = 62,
  danger = 4000,
}: {
  ms: number;
  total: number;
  size?: number;
  danger?: number;
}) {
  const pct = Math.max(0, Math.min(1, ms / total));
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const color = ms <= danger ? "#ff4d8d" : ms <= total * 0.4 ? "#ffd23f" : "#c8ff4d";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1b2431" strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset .1s linear, stroke .3s" }}
        />
      </svg>
      <span
        className={`absolute font-display text-lg font-extrabold tabular-nums ${
          ms <= danger ? "animate-pulseglow text-magenta" : "text-chalk"
        }`}
      >
        {Math.ceil(ms / 1000)}
      </span>
    </div>
  );
}

/* ---------------------------- Countdown timer hook ---------------------------- */

export function useCountdown(total: number, running: boolean, onEnd: () => void) {
  const [ms, setMs] = useState(total);
  const endRef = useRef(0);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const doneRef = useRef(false);
  const lastTick = useRef(99);

  const reset = useCallback((next?: number) => {
    const t = next ?? total;
    doneRef.current = false;
    lastTick.current = 99;
    endRef.current = performance.now() + t;
    setMs(t);
  }, [total]);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const step = () => {
      const left = endRef.current - performance.now();
      setMs(Math.max(0, left));
      const secs = Math.ceil(left / 1000);
      if (secs !== lastTick.current && secs <= 5 && secs > 0) {
        lastTick.current = secs;
        sfx.tick();
      }
      if (left <= 0) {
        if (!doneRef.current) {
          doneRef.current = true;
          onEndRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  return { ms, reset };
}

/* ---------------------------- Floating score ---------------------------- */

export function FlyScore({ items }: { items: { id: number; text: string; color: string }[] }) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-1/3 z-50">
      {items.map((i) => (
        <span
          key={i.id}
          className="fly-score absolute left-0 whitespace-nowrap font-display text-3xl font-extrabold"
          style={{ color: i.color, textShadow: "0 4px 20px rgba(0,0,0,.6)" }}
        >
          {i.text}
        </span>
      ))}
    </div>
  );
}

/* ---------------------------- Mute button ---------------------------- */

export function SoundToggle() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    setOn(!loadMuted());
  }, []);
  return (
    <button
      type="button"
      onClick={() => {
        const next = !on;
        setOn(next);
        setMuted(!next);
        if (next) sfx.click();
      }}
      className="btn grid h-10 w-10 place-items-center border border-line bg-panel/80 text-base hover:border-acid/60"
      title={on ? "Выключить звук" : "Включить звук"}
      aria-label={on ? "Выключить звук" : "Включить звук"}
    >
      {on ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c8ff4d" strokeWidth="2" strokeLinecap="round">
          <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="#c8ff4d" stroke="none" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b98ab" strokeWidth="2" strokeLinecap="round">
          <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="#8b98ab" stroke="none" />
          <path d="m16 9 5 6M21 9l-5 6" />
        </svg>
      )}
    </button>
  );
}

/* ---------------------------- Small helpers ---------------------------- */

export function Chip({
  children,
  color = "#c8ff4d",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${className}`}
      style={{ color, background: `${color}18`, border: `1px solid ${color}44` }}
    >
      {children}
    </span>
  );
}

export function StatBox({
  label,
  value,
  color = "#eef2f6",
  sub,
}: {
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="panel rounded-2xl px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{label}</div>
      <div className="display mt-1 text-2xl" style={{ color }}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div className="animate-rise mb-4 flex items-start gap-3 rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3">
      <span className="text-lg">📡</span>
      <p className="text-[13px] leading-relaxed text-chalk/85">
        <b className="text-coral">Автономный режим.</b> Сервер с базой данных сейчас недоступен,
        поэтому правило, тренажёры и раунды на времени работают полностью, а рейтинг показывает
        список класса без результатов. Пройденный урок сохранится в этом браузере и автоматически
        улетит в общую таблицу, как только сервер вернётся.
      </p>
    </div>
  );
}

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export function muteState() {
  return getMuted();
}
