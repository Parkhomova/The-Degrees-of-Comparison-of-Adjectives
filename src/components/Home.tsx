"use client";

import Link from "next/link";
import { useState } from "react";
import type { Classmate, DuelView } from "@/lib/board-types";
import { sfx } from "@/lib/sound";
import { Avatar, Chip, OfflineBanner, SoundToggle } from "./ui";
import PendingSync from "./PendingSync";

const STEPS = [
  { n: "01", t: "Выбери себя", d: "13 учеников класса — нажми на свою карточку.", c: "#4be3ff" },
  { n: "02", t: "Правило: 6 станций", d: "Короткие, длинные, орфография, исключения, than.", c: "#c8ff4d" },
  { n: "03", t: "4 раунда на время", d: "Тест 15 с, конструктор 45 с, ошибки, блиц 45 с.", c: "#ffd23f" },
  { n: "04", t: "Дуэль", d: "Кинь вызов однокласснику и обгони его за 45 секунд.", c: "#ff4d8d" },
  { n: "05", t: "Рейтинг класса", d: "Результат улетает в общую таблицу лидеров.", c: "#ff6b3d" },
];

export default function Home({
  mates,
  duels,
  totalRuns,
  offline = false,
}: {
  mates: Classmate[];
  duels: DuelView[];
  totalRuns: number;
  offline?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const top = [...mates].sort((a, b) => b.best - a.best || b.bestAccuracy - a.bestAccuracy);
  const played = mates.filter((m) => m.runs > 0).length;
  const pending = duels.filter((d) => d.status === "pending");

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6">
      <header className="mb-5 flex items-center gap-2">
        <Chip color="#c8ff4d">english · 6 класс · самостоятельная работа</Chip>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/leaderboard"
            className="btn border border-line bg-panel px-3 py-2.5 text-xs text-chalk hover:border-gold/60"
          >
            🏆 РЕЙТИНГ КЛАССА
          </Link>
          <SoundToggle />
        </div>
      </header>

      <PendingSync />
      {offline && <OfflineBanner />}

      {/* ГЕРОЙ */}
      <section className="panel grain-card relative overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 animate-float rounded-full bg-acid/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-magenta/15 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div>
            <div className="display text-[10px] uppercase tracking-[0.4em] text-muted">
              интерактивный урок
            </div>
            <h1 className="display mt-3 text-[clamp(2.6rem,9vw,5.6rem)] text-chalk">
              COMPARATIVE
              <span className="block text-acid">DEGREE</span>
              <span className="block text-[clamp(1.4rem,4vw,2.4rem)] text-cyanx">
                вторая степень сравнения
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-chalk/75">
              Разбери правило на 6 интерактивных станциях, прокрути любое прилагательное через
              «машину», а затем выступи в четырёх раундах на время. Финал — дуэль с одноклассником
              и место в общем рейтинге класса.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Chip color="#4be3ff">tall → taller</Chip>
              <Chip color="#ffd23f">happy → happier</Chip>
              <Chip color="#b28bff">beautiful → more beautiful</Chip>
              <Chip color="#ff4d8d">good → better</Chip>
              <Chip color="#ff6b3d">…than!</Chip>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-2 sm:max-w-md">
              {[
                { l: "учеников", v: mates.length, c: "#4be3ff" },
                { l: "прошли урок", v: `${played}`, c: "#c8ff4d" },
                { l: "попыток", v: totalRuns, c: "#ffd23f" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-line bg-ink/50 px-3 py-2 text-center">
                  <div className="display text-2xl tabular-nums" style={{ color: s.c }}>{s.v}</div>
                  <div className="text-[9px] uppercase tracking-widest text-muted">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Топ-3 превью */}
          <div className="panel rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <Chip color="#ffd23f">лидеры класса</Chip>
              <Link href="/leaderboard" className="text-[11px] text-muted underline-offset-2 hover:text-acid hover:underline">
                весь рейтинг →
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {top.slice(0, 3).map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-ink/40 p-2.5"
                >
                  <span className="display w-5 text-center text-lg">{["🥇", "🥈", "🥉"][i]}</span>
                  <Avatar name={s.name} accent={s.accent} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-bold text-chalk">{s.name}</span>
                    <span className="block text-[11px] text-muted">
                      {s.runs > 0 ? `точность ${s.bestAccuracy}% · дуэли ${s.duelsWon}–${s.duelsLost}` : "ещё не проходил(а)"}
                    </span>
                  </span>
                  <span className="display text-xl tabular-nums" style={{ color: s.accent }}>
                    {s.best}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-line pt-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
                вызовы в ожидании · {pending.length}
              </div>
              {pending.slice(0, 3).map((d) => (
                <div key={d.id} className="mt-1.5 truncate text-xs text-chalk/70">
                  <b style={{ color: d.challenger.accent }}>{d.challenger.name}</b> ⚔{" "}
                  <b style={{ color: d.target.accent }}>{d.target.name}</b> · {d.challengerScore} XP
                </div>
              ))}
              {pending.length === 0 && (
                <div className="mt-1 text-xs text-muted">пока тихо — брось первый вызов!</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* СПИСОК КЛАССА */}
      <section className="mt-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Chip color="#c8ff4d">шаг 1</Chip>
            <h2 className="display mt-2 text-[clamp(1.6rem,5vw,2.6rem)] text-chalk">
              ВЫБЕРИ СЕБЯ ИЗ СПИСКА
            </h2>
            <p className="mt-1 text-sm text-muted">
              Работа выполняется от имени ученика — результат попадёт в общий рейтинг под твоим именем.
            </p>
          </div>
          <span className="text-xs text-muted">{mates.length} учеников</span>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {mates.map((s) => {
            const isHover = hover === s.id;
            return (
              <Link
                key={s.id}
                href={`/lesson?sid=${s.id}`}
                onMouseEnter={() => {
                  setHover(s.id);
                  sfx.hover();
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => sfx.click()}
                className="tile group relative flex items-center gap-3 overflow-hidden rounded-2xl p-3"
                style={
                  isHover
                    ? { borderColor: s.accent, boxShadow: `0 14px 40px ${s.accent}22` }
                    : undefined
                }
              >
                <Avatar name={s.name} accent={s.accent} size={46} rank={s.rank - 1} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[15px] font-bold text-chalk">
                    {s.name}
                  </span>
                  <span className="block text-[11px] text-muted">
                    {s.runs > 0
                      ? `место #${s.rank} · ${s.best} XP · ${s.runs} попыт.`
                      : "урок не начат"}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {s.pendingIn > 0 && (
                    <span className="animate-pulseglow rounded-full bg-magenta px-2 py-0.5 text-[10px] font-extrabold text-ink">
                      ⚔ {s.pendingIn}
                    </span>
                  )}
                  <span
                    className="text-lg transition group-hover:translate-x-1"
                    style={{ color: s.accent }}
                  >
                    →
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* КАК ПРОХОДИТ */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Chip color="#4be3ff">маршрут урока</Chip>
          <span className="text-xs text-muted">≈ 15–20 минут</span>
        </div>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s) => (
            <div key={s.n} className="panel rounded-2xl p-4">
              <div className="display text-2xl" style={{ color: s.c }}>{s.n}</div>
              <div className="display mt-1 text-base text-chalk">{s.t}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
        <span>
          Comparative Degree Arena · урок для самостоятельной работы · ссылка открывается на любом
          устройстве
        </span>
        <Link href="/leaderboard" className="btn border border-line bg-panel px-3 py-2 text-chalk hover:border-acid/60">
          рейтинг для общего доступа →
        </Link>
      </footer>
    </div>
  );
}
