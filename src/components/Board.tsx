"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Classmate, DuelView } from "@/lib/board-types";
import { sfx } from "@/lib/sound";
import { Avatar, Chip, OfflineBanner, SoundToggle } from "./ui";
import PendingSync from "./PendingSync";

type Sort = "xp" | "acc" | "duels" | "name";

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.round(h / 24)} дн назад`;
}

export default function Board({
  initial,
  highlight,
}: {
  initial: { board: Classmate[]; duels: DuelView[]; totalRuns: number; offline?: boolean };
  highlight?: number;
}) {
  const [board, setBoard] = useState<Classmate[]>(initial.board);
  const [duels, setDuels] = useState<DuelView[]>(initial.duels);
  const [totalRuns, setTotalRuns] = useState(initial.totalRuns);
  const [sort, setSort] = useState<Sort>("xp");
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/leaderboard", { cache: "no-store" });
      const j = (await r.json()) as { board: Classmate[]; duels: DuelView[]; totalRuns: number };
      setBoard(j.board);
      setDuels(j.duels);
      setTotalRuns(j.totalRuns);
      setTick((t) => t + 1);
    } catch {
      /* офлайн — показываем последние данные */
    }
  }, []);

  useEffect(() => {
    const iv = window.setInterval(refresh, 12000);
    return () => window.clearInterval(iv);
  }, [refresh]);

  const ranked = useMemo(() => {
    const arr = [...board];
    if (sort === "xp") arr.sort((a, b) => b.best - a.best || b.bestAccuracy - a.bestAccuracy);
    if (sort === "acc") arr.sort((a, b) => b.bestAccuracy - a.bestAccuracy || b.best - a.best);
    if (sort === "duels")
      arr.sort(
        (a, b) =>
          b.duelsWon - b.duelsLost - (a.duelsWon - a.duelsLost) ||
          b.duelsWon - a.duelsWon ||
          b.best - a.best,
      );
    if (sort === "name") arr.sort((a, b) => a.slot - b.slot);
    return arr;
  }, [board, sort]);

  const podium = useMemo(() => {
    const byXp = [...board].sort((a, b) => b.best - a.best || b.bestAccuracy - a.bestAccuracy);
    return [byXp[1], byXp[0], byXp[2]].filter(Boolean) as Classmate[];
  }, [board]);

  const maxScore = Math.max(1, ...board.map((b) => b.best));
  const played = board.filter((b) => b.runs > 0).length;

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6">
      <header className="sticky top-0 z-30 -mx-4 mb-5 flex flex-wrap items-center gap-3 border-b border-line/70 bg-ink/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <Link href="/" className="btn border border-line bg-panel px-3 py-2 text-xs text-chalk">
          ← выбор ученика
        </Link>
        <div>
          <div className="display text-base leading-none text-chalk">ТАБЛИЦА ЛИДЕРОВ</div>
          <div className="text-[10px] uppercase tracking-widest text-muted">
            открытый рейтинг класса · обновлено {tick > 0 ? "только что" : "при загрузке"}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sfx.click();
              void refresh();
            }}
            className="btn border border-line bg-panel px-3 py-2.5 text-xs text-chalk hover:border-acid/60"
          >
            ⟳ обновить
          </button>
          <SoundToggle />
        </div>
      </header>

      <PendingSync onSynced={refresh} />
      {initial.offline && <OfflineBanner />}

      <section className="panel grain-card relative overflow-hidden rounded-3xl p-5 sm:p-7">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-float rounded-full bg-gold/15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <Chip color="#ffd23f">comparative degree arena</Chip>
            <h1 className="display mt-3 text-[clamp(2rem,6vw,3.6rem)] text-chalk">
              КТО ЛУЧШЕ ВСЕХ
              <span className="block text-gold">СРАВНИВАЕТ?</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Рейтинг обновляется автоматически каждые 12 секунд. Считается лучший результат урока:
              правило + 4 раунда на время.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "прошли урок", v: `${played}/${board.length}`, c: "#c8ff4d" },
              { l: "всего попыток", v: totalRuns, c: "#4be3ff" },
              { l: "дуэлей", v: duels.length, c: "#ff4d8d" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-line bg-ink/50 px-3 py-2 text-center">
                <div className="display text-2xl tabular-nums" style={{ color: s.c }}>{s.v}</div>
                <div className="text-[9px] uppercase tracking-widest text-muted">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Подиум */}
        <div className="relative mt-6 grid items-end gap-3 sm:grid-cols-3">
          {podium.map((p, i) => {
            const place = i === 1 ? 1 : i === 0 ? 2 : 3;
            const h = place === 1 ? "sm:h-44" : place === 2 ? "sm:h-36" : "sm:h-28";
            return (
              <div
                key={p.id}
                className={`animate-rise rounded-2xl border p-4 text-center ${h}`}
                style={{
                  borderColor: `${p.accent}55`,
                  background: `linear-gradient(180deg, ${p.accent}18, transparent)`,
                  animationDelay: `${place * 90}ms`,
                  order: place === 1 ? 0 : place === 2 ? -1 : 1,
                }}
              >
                <div className="flex justify-center">
                  <Avatar name={p.name} accent={p.accent} size={place === 1 ? 64 : 52} />
                </div>
                <div className="display mt-2 text-lg leading-tight text-chalk">{p.name}</div>
                <div className="text-[11px] text-muted">
                  {p.runs > 0 ? `точность ${p.bestAccuracy}% · попыток ${p.runs}` : "ещё не проходил(а)"}
                </div>
                <div className="display mt-1 text-3xl tabular-nums" style={{ color: p.accent }}>
                  {p.best}
                  <span className="ml-1 text-xs text-muted">XP</span>
                </div>
                <div className="mt-1 text-xl">{["🥇", "🥈", "🥉"][place - 1]}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Сортировка */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted">сортировка</span>
        {(
          [
            ["xp", "по XP"],
            ["acc", "по точности"],
            ["duels", "по дуэлям"],
            ["name", "по списку класса"],
          ] as [Sort, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              sfx.click();
              setSort(k);
            }}
            className="btn border px-3 py-1.5 text-xs"
            style={{
              borderColor: sort === k ? "#c8ff4d" : "#1e2937",
              color: sort === k ? "#c8ff4d" : "#8b98ab",
              background: sort === k ? "#c8ff4d14" : "transparent",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Таблица */}
      <section className="panel mt-3 overflow-hidden rounded-3xl">
        <div className="grid grid-cols-[38px_minmax(0,1fr)_auto] gap-2 border-b border-line px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-muted sm:grid-cols-[46px_minmax(0,1.2fr)_minmax(0,1fr)_90px_90px_110px] sm:px-5">
          <span>#</span>
          <span>ученик</span>
          <span className="hidden sm:block">лучший результат</span>
          <span className="hidden text-right sm:block">точность</span>
          <span className="hidden text-right sm:block">дуэли</span>
          <span className="text-right">XP</span>
        </div>
        {ranked.map((s, i) => {
          const isMe = highlight === s.id;
          return (
            <div
              key={s.id}
              className="grid grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2 border-b border-line/60 px-3 py-2.5 transition hover:bg-white/[0.03] sm:grid-cols-[46px_minmax(0,1.2fr)_minmax(0,1fr)_90px_90px_110px] sm:px-5"
              style={isMe ? { background: `${s.accent}12`, boxShadow: `inset 3px 0 0 ${s.accent}` } : undefined}
            >
              <span
                className="display text-base tabular-nums"
                style={{ color: s.runs > 0 && i < 3 ? "#ffd23f" : "#4b5867" }}
              >
                {i + 1}
              </span>
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar name={s.name} accent={s.accent} size={34} />
                <span className="min-w-0">
                  <span className="block truncate font-display text-sm font-bold text-chalk">
                    {s.name}
                    {isMe && <span className="ml-1.5 text-[10px] text-acid">ты</span>}
                  </span>
                  <span className="block text-[11px] text-muted">
                    {s.runs > 0 ? `${s.runs} попыт. · ${timeAgo(s.lastActive)}` : "урок не начат"}
                    {s.pendingIn > 0 && (
                      <span className="ml-1.5 text-magenta">· ждёт {s.pendingIn} вызов(а)</span>
                    )}
                  </span>
                </span>
              </span>
              <span className="hidden items-center gap-2 sm:flex">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink">
                  <span
                    className="block h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(s.best / maxScore) * 100}%`,
                      background: `linear-gradient(90deg, ${s.accent}, ${s.accent}66)`,
                    }}
                  />
                </span>
              </span>
              <span className="hidden text-right text-sm tabular-nums text-cyanx sm:block">
                {s.runs > 0 ? `${s.bestAccuracy}%` : "—"}
              </span>
              <span className="hidden text-right text-xs tabular-nums sm:block">
                <span className="text-acid">{s.duelsWon}W</span>
                <span className="mx-1 text-muted">/</span>
                <span className="text-magenta">{s.duelsLost}L</span>
              </span>
              <span className="text-right">
                <span className="display text-lg tabular-nums" style={{ color: s.best > 0 ? s.accent : "#3b4756" }}>
                  {s.best}
                </span>
                <span className="ml-1 text-[10px] text-muted">XP</span>
              </span>
            </div>
          );
        })}
      </section>

      {/* Журнал дуэлей */}
      <section className="panel mt-5 rounded-3xl p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip color="#ff4d8d">лента вызовов</Chip>
          <span className="text-xs text-muted">кто кого вызвал и чем закончилось</span>
        </div>
        {duels.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Дуэлей пока нет. Открой урок, зайди на «Арену вызовов» и брось вызов однокласснику —
            запись появится здесь.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 lg:grid-cols-2">
            {duels.slice(0, 12).map((d) => {
              const done = d.status === "answered";
              const chWin = done && d.challengerScore > (d.targetScore ?? 0);
              return (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-ink/40 p-3"
                >
                  <Avatar name={d.challenger.name} accent={d.challenger.accent} size={30} />
                  <span
                    className="max-w-[9rem] truncate text-xs font-bold"
                    style={{ color: chWin ? "#c8ff4d" : "#eef2f6" }}
                  >
                    {d.challenger.name}
                  </span>
                  <span className="font-display text-sm tabular-nums text-chalk">
                    {d.challengerScore}
                    <span className="mx-1 text-muted">:</span>
                    <span style={{ color: !chWin && done ? "#c8ff4d" : "#8b98ab" }}>
                      {done ? d.targetScore : "—"}
                    </span>
                  </span>
                  <span
                    className="max-w-[9rem] truncate text-xs font-bold"
                    style={{ color: !chWin && done ? "#c8ff4d" : "#eef2f6" }}
                  >
                    {d.target.name}
                  </span>
                  <Avatar name={d.target.name} accent={d.target.accent} size={30} />
                  <span className="ml-auto">
                    <Chip color={done ? "#c8ff4d" : "#ffd23f"}>
                      {done ? "бой состоялся" : "ждёт ответа"}
                    </Chip>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
