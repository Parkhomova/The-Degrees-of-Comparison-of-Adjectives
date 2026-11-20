"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ghostTarget, type Classmate, type DuelView } from "@/lib/board-types";
import { sfx } from "@/lib/sound";
import { BlitzRound } from "./Practice";
import { Avatar, Chip, Confetti } from "./ui";

const DUEL_MS = 45000;

/* --------------------------- гонка --------------------------- */
function Race({
  target,
  name,
  accent,
  live,
  ghostNow,
  liveCorrect,
}: {
  target: number;
  name: string;
  accent: string;
  live: number;
  ghostNow: number;
  liveCorrect: number;
}) {
  const mine = Math.min(1, live / Math.max(1, target));
  const theirs = Math.min(1, ghostNow / Math.max(1, target));
  return (
    <div className="panel mb-4 rounded-2xl p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-muted">
        <span>
          гонка до {target} очков · верных ответов: <b className="text-cyanx">{liveCorrect}</b>
        </span>
        <span className="tabular-nums">
          ты {live} · {name} {ghostNow}
        </span>
      </div>
      <div className="space-y-2">
        {[
          { n: "ТЫ", v: mine, c: "#c8ff4d", s: live },
          { n: name, v: theirs, c: accent, s: ghostNow },
        ].map((row) => (
          <div key={row.n} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate font-display text-xs font-bold text-chalk">
              {row.n}
            </span>
            <span className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-ink">
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${row.v * 100}%`,
                  background: `linear-gradient(90deg, ${row.c}, ${row.c}88)`,
                  boxShadow: `0 0 18px ${row.c}66`,
                  transition: "width .12s linear",
                }}
              />
            </span>
            <span
              className="w-12 shrink-0 text-right font-display text-sm tabular-nums"
              style={{ color: row.c }}
            >
              {row.s}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Phase =
  | { t: "pick" }
  | { t: "play"; mate: Classmate; seed: number }
  | { t: "verdict"; mate: Classmate; score: number; correct: number; ghost: number; sent: boolean }
  | { t: "accept"; duel: DuelView }
  | { t: "acceptVerdict"; duel: DuelView; score: number; correct: number; win: boolean };

export default function DuelArena({
  me,
  mates,
  compact = false,
}: {
  me: Classmate;
  mates: Classmate[];
  compact?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>({ t: "pick" });
  const [myDuels, setMyDuels] = useState<DuelView[] | null>(null);
  const [live, setLive] = useState(0);
  const [liveCorrect, setLiveCorrect] = useState(0);
  const [ghostNow, setGhostNow] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const startRef = useRef(0);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/leaderboard?studentId=${me.id}`, { cache: "no-store" });
      const j = (await r.json()) as { myDuels: DuelView[] };
      setMyDuels(j.myDuels ?? []);
    } catch {
      setMyDuels([]);
    }
  }, [me.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // анимация «призрака» соперника во время гонки
  useEffect(() => {
    if (phase.t !== "play" && phase.t !== "accept") return;
    const target =
      phase.t === "play"
        ? ghostTarget(phase.mate)
        : phase.duel.challengerScore;
    startRef.current = performance.now();
    const iv = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - startRef.current) / DUEL_MS);
      setGhostNow(Math.round(target * p * (0.9 + Math.sin(p * 9) * 0.08)));
    }, 90);
    return () => window.clearInterval(iv);
  }, [phase]);

  const others = mates.filter((m) => m.id !== me.id);
  const incoming = (myDuels ?? []).filter((d) => d.target.id === me.id && d.status === "pending");
  const journal = myDuels ?? [];

  /* --------------------------- рендер --------------------------- */

  if (phase.t === "play") {
    const mate = phase.mate;
    const ghost = ghostTarget(mate);
    return (
      <div>
        <Race
          target={ghost}
          name={mate.name.split(" ")[0]}
          accent={mate.accent}
          live={live}
          ghostNow={ghostNow}
          liveCorrect={liveCorrect}
        />
        <BlitzRound
          seed={phase.seed}
          duration={DUEL_MS}
          label={`ДУЭЛЬ: ${mate.name.split(" ")[0]}`}
          kicker="вызов · 45 секунд · тот же набор вопросов, что у соперника"
          color={mate.accent}
          onLive={(s, c) => {
            setLive(s);
            setLiveCorrect(c);
          }}
          onDone={async (r) => {
            try {
              await fetch("/api/duels", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  challengerId: me.id,
                  targetId: mate.id,
                  seed: phase.seed,
                  score: r.score,
                  correct: r.correct,
                }),
              });
            } catch {
              /* сеть не критична */
            }
            void load();
            if (r.score >= ghost) {
              sfx.win();
              setConfetti((c) => c + 1);
            } else sfx.lose();
            setPhase({
              t: "verdict",
              mate,
              score: r.score,
              correct: r.correct,
              ghost,
              sent: true,
            });
          }}
        />
      </div>
    );
  }

  if (phase.t === "accept") {
    const d = phase.duel;
    return (
      <div>
        <Race
          target={Math.max(1, d.challengerScore)}
          name={d.challenger.name.split(" ")[0]}
          accent={d.challenger.accent}
          live={live}
          ghostNow={ghostNow}
          liveCorrect={liveCorrect}
        />
        <BlitzRound
          seed={d.seed}
          duration={DUEL_MS}
          label="ОТВЕТ НА ВЫЗОВ"
          kicker={`тебя вызвал(а) ${d.challenger.name} · результат ${d.challengerScore}`}
          color={d.challenger.accent}
          onLive={(s, c) => {
            setLive(s);
            setLiveCorrect(c);
          }}
          onDone={async (r) => {
            try {
              await fetch("/api/duels", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id: d.id, studentId: me.id, score: r.score, correct: r.correct }),
              });
            } catch {
              /* ignore */
            }
            void load();
            const win = r.score > d.challengerScore;
            if (win) {
              sfx.win();
              setConfetti((c) => c + 1);
            } else sfx.lose();
            setPhase({ t: "acceptVerdict", duel: d, score: r.score, correct: r.correct, win });
          }}
        />
      </div>
    );
  }

  if (phase.t === "verdict") {
    const win = phase.score >= phase.ghost;
    return (
      <div className="panel grain-card rounded-3xl p-6 text-center">
        <Confetti fire={win ? confetti : 0} />
        <div
          className="display mx-auto inline-block rounded-2xl px-6 py-3 text-[clamp(1.8rem,6vw,3rem)]"
          style={{ background: win ? "#c8ff4d" : "#ff4d8d22", color: win ? "#08101a" : "#ff4d8d", border: `1px solid ${win ? "#c8ff4d" : "#ff4d8d"}` }}
        >
          {win ? "ТЫ ВПЕРЕДИ!" : "СОПЕРНИК БЫЛ КРУЧЕ"}
        </div>
        <p className="mt-4 text-chalk/75">
          Вызов для <b className="text-chalk">{phase.mate.name}</b> отправлен — он(а) увидит его на
          своей странице урока и сможет ответить тем же набором вопросов за 45 секунд.
        </p>
        <div className="mx-auto mt-5 grid max-w-md gap-3 sm:grid-cols-3">
          {[
            { l: "твои очки", v: phase.score, c: "#c8ff4d" },
            { l: "ориентир", v: phase.ghost, c: phase.mate.accent },
            { l: "верных", v: phase.correct, c: "#4be3ff" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-line bg-ink/50 p-3">
              <div className="display text-3xl" style={{ color: s.c }}>{s.v}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLive(0);
              setGhostNow(0);
              sfx.click();
              setPhase({ t: "pick" });
            }}
            className="btn bg-acid px-5 py-3 text-sm text-ink"
          >
            к списку соперников
          </button>
          <button
            type="button"
            onClick={() => {
              setLive(0);
              setGhostNow(0);
              setPhase({ t: "play", mate: phase.mate, seed: Math.floor(Math.random() * 1e6) + 7 });
            }}
            className="btn border border-line bg-panel px-5 py-3 text-sm text-chalk"
          >
            реванш ↻
          </button>
        </div>
      </div>
    );
  }

  if (phase.t === "acceptVerdict") {
    const d = phase.duel;
    return (
      <div className="panel grain-card rounded-3xl p-6 text-center">
        <Confetti fire={phase.win ? confetti : 0} />
        <div
          className="display mx-auto inline-block rounded-2xl px-6 py-3 text-[clamp(1.8rem,6vw,3rem)]"
          style={{ background: phase.win ? "#c8ff4d" : "#ff4d8d22", color: phase.win ? "#08101a" : "#ff4d8d", border: `1px solid ${phase.win ? "#c8ff4d" : "#ff4d8d"}` }}
        >
          {phase.win ? "ВЫЗОВ ПРИНЯТ. ТЫ ПОБЕДИЛ(А)!" : "В СЛЕДУЮЩИЙ РАЗ — ТОЧНО ТВОЁ"}
        </div>
        <div className="mx-auto mt-5 grid max-w-md gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-ink/50 p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted">{d.challenger.name}</div>
            <div className="display text-3xl" style={{ color: d.challenger.accent }}>{d.challengerScore}</div>
          </div>
          <div className="rounded-2xl border border-line bg-ink/50 p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted">ты</div>
            <div className="display text-3xl text-acid">{phase.score}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setLive(0);
            setGhostNow(0);
            sfx.click();
            setPhase({ t: "pick" });
          }}
          className="btn mt-5 bg-acid px-5 py-3 text-sm text-ink"
        >
          дальше →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Confetti fire={confetti} />

      {incoming.length > 0 && (
        <section className="panel rounded-3xl border-magenta/40 p-5">
          <div className="flex items-center gap-2">
            <Chip color="#ff4d8d">тебя вызвали · {incoming.length}</Chip>
          </div>
          <div className="mt-3 grid gap-2">
            {incoming.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-magenta/30 bg-magenta/[0.07] p-3"
              >
                <Avatar name={d.challenger.name} accent={d.challenger.accent} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base font-bold text-chalk">
                    {d.challenger.name} набрал(а) {d.challengerScore} очков за 45 секунд
                  </div>
                  <div className="text-xs text-muted">
                    тот же набор вопросов · ответь и попади в журнал дуэлей
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLive(0);
                    setGhostNow(0);
                    sfx.start();
                    setPhase({ t: "accept", duel: d });
                  }}
                  className="btn bg-magenta px-4 py-2.5 text-sm text-ink"
                >
                  ПРИНЯТЬ ВЫЗОВ
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel grain-card rounded-3xl p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Chip color="#ffd23f">арена вызовов</Chip>
            <h3 className="display mt-2 text-2xl sm:text-3xl">КИНУТЬ ВЫЗОВ ОДНОКЛАССНИКУ</h3>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Выбери соперника: у тебя 45 секунд на блиц. Твой результат уйдёт ему(ей) как вызов —
              он(а) должен(на) повторить тот же набор вопросов и побить твой счёт.
            </p>
          </div>
          <div className="text-right">
            <div className="display text-3xl text-gold">
              {me.duelsWon}–{me.duelsLost}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted">дуэли: победы–поражения</div>
          </div>
        </div>

        <div className={`mt-4 grid gap-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {others.map((m) => {
            const g = ghostTarget(m);
            return (
              <div key={m.id} className="tile flex items-center gap-3 rounded-2xl p-3">
                <Avatar name={m.name} accent={m.accent} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-sm font-bold text-chalk">{m.name}</div>
                  <div className="text-[11px] text-muted">
                    ориентир ≈ {g} очк. · XP {m.best}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLive(0);
                    setLiveCorrect(0);
                    setGhostNow(0);
                    sfx.start();
                    setPhase({ t: "play", mate: m, seed: Math.floor(Math.random() * 1e6) + 7 });
                  }}
                  className="btn shrink-0 px-3 py-2 text-xs text-ink"
                  style={{ background: m.accent }}
                >
                  ВЫЗВАТЬ ⚔
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel rounded-3xl p-5">
        <div className="flex items-center gap-2">
          <Chip color="#4be3ff">журнал дуэлей</Chip>
          <span className="text-xs text-muted">{journal.length} записей</span>
        </div>
        {journal.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Пока пусто. Брось первый вызов — и здесь появится история ваших поединков.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {journal.map((d) => {
              const mine = d.challenger.id === me.id;
              const myScore = mine ? d.challengerScore : (d.targetScore ?? 0);
              const opScore = mine ? (d.targetScore ?? 0) : d.challengerScore;
              const op = mine ? d.target : d.challenger;
              const done = d.status === "answered";
              const win = done && myScore > opScore;
              return (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-ink/40 p-3"
                >
                  <Avatar name={op.name} accent={op.accent} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-chalk/85">
                      {mine ? "ты вызвал(а)" : "вызов от"} <b>{op.name}</b>
                    </div>
                    <div className="text-[11px] text-muted">
                      {new Date(d.createdAt).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {done && d.answeredAt ? " · отвечен" : " · ждёт ответа"}
                    </div>
                  </div>
                  <div className="font-display text-lg tabular-nums">
                    <span style={{ color: win ? "#c8ff4d" : "#eef2f6" }}>{myScore}</span>
                    <span className="mx-1.5 text-muted">:</span>
                    <span style={{ color: win ? "#8b98ab" : "#ff4d8d" }}>{done ? opScore : "—"}</span>
                  </div>
                  <Chip color={done ? (win ? "#c8ff4d" : "#ff4d8d") : "#ffd23f"}>
                    {done ? (win ? "победа" : myScore === opScore ? "ничья" : "поражение") : "ожидание"}
                  </Chip>
                  {!done && !mine && (
                    <button
                      type="button"
                      onClick={() => {
                        setLive(0);
                        setGhostNow(0);
                        sfx.start();
                        setPhase({ t: "accept", duel: d });
                      }}
                      className="btn bg-magenta px-3 py-2 text-xs text-ink"
                    >
                      ответить
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
