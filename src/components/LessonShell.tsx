"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Classmate, RunView } from "@/lib/board-types";
import type { RoundScore } from "@/db/schema";
import { sfx } from "@/lib/sound";
import { pushPending } from "@/lib/localStore";
import Theory from "./Theory";
import { BlitzRound, BuildRound, ChoiceRound, FixRound, type RoundResult } from "./Practice";
import DuelArena from "./DuelArena";
import PendingSync from "./PendingSync";
import { Avatar, Chip, Confetti, FlyScore, OfflineBanner, SoundToggle, StatBox } from "./ui";

type Stage = "brief" | "theory" | "choice" | "build" | "fix" | "blitz" | "results" | "arena";

const FLOW: { key: Stage; label: string; color: string }[] = [
  { key: "theory", label: "Правило", color: "#4be3ff" },
  { key: "choice", label: "Тест", color: "#c8ff4d" },
  { key: "build", label: "Конструктор", color: "#ffd23f" },
  { key: "fix", label: "Ошибки", color: "#ff4d8d" },
  { key: "blitz", label: "Блиц", color: "#ff6b3d" },
];

const RANKS = [
  { min: 0, title: "СТАЖЁР", icon: "🌱" },
  { min: 1200, title: "БОЕЦ", icon: "⚡" },
  { min: 2200, title: "МАСТЕР СРАВНЕНИЙ", icon: "🔥" },
  { min: 3200, title: "ЛЕГЕНДА ГРАММАТИКИ", icon: "👑" },
];

export default function LessonShell({
  me,
  mates,
  history,
  seed,
  offline = false,
}: {
  me: Classmate;
  mates: Classmate[];
  history: RunView[];
  seed: number;
  offline?: boolean;
}) {
  const [stage, setStage] = useState<Stage>("brief");
  const [theoryPts, setTheoryPts] = useState(0);
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [saved, setSaved] = useState<{ rank: number; best: number; isRecord: boolean } | null>(null);
  const [storedLocal, setStoredLocal] = useState(false);
  const [fly, setFly] = useState<{ id: number; text: string; color: string }[]>([]);
  const [confetti, setConfetti] = useState(0);
  const savingRef = useRef(false);
  const flyId = useRef(0);

  const pushFly = (text: string, color: string) => {
    const id = ++flyId.current;
    setFly((f) => [...f, { id, text, color }]);
    window.setTimeout(() => setFly((f) => f.filter((x) => x.id !== id)), 950);
  };

  const addTheory = (n: number) => {
    setTheoryPts((p) => p + n);
    pushFly(`+${n} XP`, "#4be3ff");
  };

  const totalScore = useMemo(
    () => theoryPts + rounds.reduce((a, r) => a + r.score, 0),
    [theoryPts, rounds],
  );
  const totalCorrect = rounds.reduce((a, r) => a + r.correct, 0);
  const totalQuestions = rounds.reduce((a, r) => a + r.total, 0);
  const totalTime = rounds.reduce((a, r) => a + r.ms, 0);
  const bestStreak = rounds.reduce((a, r) => Math.max(a, r.correct), 0);

  const finishedAll = rounds.length >= 4;

  // сохранение результата один раз
  useEffect(() => {
    if (stage !== "results" || savingRef.current || !finishedAll) return;
    savingRef.current = true;
    const payload: RoundScore[] = [
      { key: "theory", label: "Правило", score: theoryPts, correct: 0, total: 0, ms: 0 },
      ...rounds.map((r) => ({
        key: r.key,
        label: r.label,
        score: r.score,
        correct: r.correct,
        total: r.total,
        ms: r.ms,
      })),
    ];
    const body = {
      studentId: me.id,
      score: totalScore,
      correct: totalCorrect,
      total: totalQuestions,
      timeMs: totalTime,
      bestStreak,
      rounds: payload,
      finished: 1,
    };
    fetch("/api/attempts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`save failed: ${r.status}`);
        return (await r.json()) as { rank?: number; best?: number; isRecord?: boolean };
      })
      .then((j) => {
        setStoredLocal(false);
        setSaved({ rank: j.rank ?? 0, best: j.best ?? 0, isRecord: Boolean(j.isRecord) });
        setConfetti((c) => c + 1);
        sfx.win();
      })
      .catch(() => {
        // сервер или БД недоступны — не теряем работу ученика
        pushPending(body as unknown as Record<string, unknown>);
        setStoredLocal(true);
        setSaved({ rank: 0, best: totalScore, isRecord: false });
        setConfetti((c) => c + 1);
        sfx.win();
      });
  }, [stage, finishedAll, me.id, rounds, theoryPts, totalScore, totalCorrect, totalQuestions, totalTime, bestStreak]);

  const next = (r: RoundResult) => {
    setRounds((rs) => [...rs.filter((x) => x.key !== r.key), r]);
    pushFly(`+${r.score} XP`, "#c8ff4d");
    const order: Stage[] = ["choice", "build", "fix", "blitz"];
    const i = order.indexOf(r.key as Stage);
    if (i >= 0 && i < order.length - 1) setStage(order[i + 1]);
    else setStage("results");
  };

  const restart = () => {
    setRounds([]);
    setTheoryPts(0);
    setSaved(null);
    savingRef.current = false;
    setStage("brief");
  };

  const rankInfo = RANKS.filter((r) => totalScore >= r.min).pop() ?? RANKS[0];
  const flowIdx = FLOW.findIndex((f) => f.key === stage);

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6">
      <Confetti fire={confetti} />
      <FlyScore items={fly} />

      {/* Верхняя панель */}
      <header className="sticky top-0 z-30 -mx-4 mb-5 border-b border-line/70 bg-ink/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="btn flex items-center gap-2 pr-2">
            <Avatar name={me.name} accent={me.accent} size={38} rank={me.rank - 1} />
            <span className="text-left">
              <span className="block font-display text-sm font-bold leading-tight text-chalk">
                {me.name}
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-muted">
                место в классе: {me.rank} · лучший XP: {me.best}
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <div className="rounded-xl border border-line bg-panel px-3 py-1.5 text-right">
              <div className="display text-lg leading-none tabular-nums text-acid">{totalScore}</div>
              <div className="text-[9px] uppercase tracking-widest text-muted">xp сейчас</div>
            </div>
            <Link
              href={`/leaderboard?sid=${me.id}`}
              className="btn border border-line bg-panel px-3 py-2.5 text-xs text-chalk hover:border-acid/60"
            >
              РЕЙТИНГ
            </Link>
            <SoundToggle />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto scroll-thin">
          {FLOW.map((f, i) => {
            const active = f.key === stage;
            const done = flowIdx > i || (stage === "results" || stage === "arena");
            return (
              <span
                key={f.key}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition"
                style={{
                  background: active ? `${f.color}22` : "transparent",
                  color: active ? f.color : done ? "#8b98ab" : "#4b5867",
                  border: `1px solid ${active ? `${f.color}66` : "transparent"}`,
                }}
              >
                <span>{done && !active ? "✓" : i + 1}</span>
                {f.label}
              </span>
            );
          })}
        </div>
      </header>

      <PendingSync />
      {offline && <OfflineBanner />}

      {/* БРИФИНГ */}
      {stage === "brief" && (
        <div className="animate-rise space-y-5">
          <section className="panel grain-card relative overflow-hidden rounded-3xl p-6 sm:p-9">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 animate-float rounded-full bg-acid/15 blur-3xl" />
            <div className="relative">
              <Chip color="#c8ff4d">самостоятельный урок · 6 класс · english</Chip>
              <h1 className="display mt-4 text-[clamp(2.4rem,8vw,5rem)] text-chalk">
                COMPARATIVE
                <span className="block text-acid">DEGREE ARENA</span>
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-chalk/75">
                Вторая степень сравнения прилагательных: 6 станций правила, тренажёр-«машина»,
                4 раунда на время, дуэль с одноклассником и общий рейтинг класса.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatBox label="станций правила" value="6" color="#4be3ff" sub="интерактивный разбор" />
                <StatBox label="раундов" value="4" color="#c8ff4d" sub="тест · конструктор · ошибки · блиц" />
                <StatBox label="вопросов" value="19+" color="#ffd23f" sub="генерируются заново" />
                <StatBox label="дуэль" value="45 с" color="#ff4d8d" sub="вызов однокласснику" />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sfx.start();
                    setStage("theory");
                  }}
                  className="btn bg-acid px-7 py-4 text-base text-ink shadow-[0_16px_40px_#c8ff4d33]"
                >
                  НАЧАТЬ УРОК →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setStage("choice");
                  }}
                  className="btn border border-line bg-panel px-6 py-4 text-base text-chalk hover:border-gold/60"
                >
                  сразу к заданиям
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setStage("arena");
                  }}
                  className="btn border border-magenta/50 bg-magenta/10 px-6 py-4 text-base text-magenta"
                >
                  арена вызовов ⚔
                </button>
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="panel rounded-3xl p-5">
              <Chip color="#ffd23f">как начисляются XP</Chip>
              <ul className="mt-3 space-y-2 text-sm text-chalk/75">
                {[
                  ["Правило", "мини-проверки на станциях", "+40 XP каждая"],
                  ["Раунд 1 · Тест", "15 с на вопрос", "100 + до 50 за скорость"],
                  ["Раунд 2 · Конструктор", "45 с на предложение", "150 + до 60 за скорость"],
                  ["Раунд 3 · Ошибки", "2 шага, 25 с", "130 (80 со 2-й попытки)"],
                  ["Раунд 4 · Блиц", "45 секунд без пауз", "40 × комбо до ×5, ошибка −2 с"],
                ].map(([a, b, c]) => (
                  <li key={a} className="flex flex-wrap items-baseline gap-2 rounded-xl border border-line bg-ink/40 px-3 py-2">
                    <b className="font-display text-chalk">{a}</b>
                    <span className="text-xs text-muted">{b}</span>
                    <span className="ml-auto text-xs font-bold text-acid">{c}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel rounded-3xl p-5">
              <Chip color="#4be3ff">твоя статистика</Chip>
              {history.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Ты ещё не проходил(а) этот урок. Пройди — и попадёшь в таблицу лидеров класса.
                </p>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <StatBox label="лучший XP" value={me.best} color="#c8ff4d" />
                    <StatBox label="попыток" value={me.runs} color="#4be3ff" />
                    <StatBox label="место" value={`#${me.rank}`} color="#ffd23f" />
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {history.slice(0, 4).map((h) => (
                      <li
                        key={h.id}
                        className="flex items-center justify-between rounded-xl border border-line bg-ink/40 px-3 py-2 text-xs"
                      >
                        <span className="text-muted">
                          {new Date(h.createdAt).toLocaleString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="font-display text-base text-chalk">{h.score} XP</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        </div>
      )}

      {stage === "theory" && <Theory onScore={addTheory} onDone={() => setStage("choice")} />}

      {stage === "choice" && <ChoiceRound seed={seed} onDone={next} />}
      {stage === "build" && <BuildRound seed={seed + 11} onDone={next} />}
      {stage === "fix" && <FixRound seed={seed + 29} onDone={next} />}
      {stage === "blitz" && <BlitzRound seed={seed + 71} onDone={next} />}

      {stage === "arena" && (
        <div className="animate-rise">
          <DuelArena me={me} mates={mates} />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setStage("brief");
              }}
              className="btn border border-line bg-panel px-5 py-3 text-sm text-chalk"
            >
              ← к уроку
            </button>
            <Link href={`/leaderboard?sid=${me.id}`} className="btn bg-acid px-5 py-3 text-sm text-ink">
              таблица лидеров →
            </Link>
          </div>
        </div>
      )}

      {/* РЕЗУЛЬТАТЫ */}
      {stage === "results" && (
        <div className="animate-rise space-y-5">
          <section className="panel grain-card relative overflow-hidden rounded-3xl p-6 text-center sm:p-9">
            <div className="pointer-events-none absolute inset-x-0 -top-24 h-64 bg-acid/10 blur-3xl" />
            <div className="relative">
              <div className="text-5xl">{rankInfo.icon}</div>
              <div className="display mt-2 text-sm uppercase tracking-[0.3em] text-muted">
                звание
              </div>
              <div className="display text-[clamp(2rem,7vw,3.4rem)] text-acid">{rankInfo.title}</div>
              <div className="display mt-4 text-[clamp(3.5rem,14vw,7rem)] leading-none text-chalk tabular-nums">
                {totalScore}
                <span className="ml-2 align-top text-xl text-muted">XP</span>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <Chip color="#4be3ff">
                  точность {totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0}%
                </Chip>
                <Chip color="#ffd23f">время {(totalTime / 1000).toFixed(0)} с</Chip>
                <Chip color="#ff4d8d">верно {totalCorrect}/{totalQuestions}</Chip>
                {saved && saved.rank > 0 && <Chip color="#c8ff4d">место в классе #{saved.rank}</Chip>}
                {saved?.isRecord && <Chip color="#b28bff">личный рекорд!</Chip>}
              </div>
              <p className="mt-3 text-sm text-muted">
                {!saved
                  ? "сохраняем результат…"
                  : storedLocal
                    ? "сервер не ответил — результат сохранён на этом устройстве и уйдёт в общий рейтинг автоматически, как только связь вернётся"
                    : `результат сохранён в общий рейтинг · лучший XP: ${saved.best}`}
              </p>
            </div>
          </section>

          <section className="panel rounded-3xl p-5">
            <Chip color="#c8ff4d">разбор по раундам</Chip>
            <div className="mt-4 space-y-3">
              {[
                { label: "Правило (станции)", score: theoryPts, correct: 0, total: 0, color: "#4be3ff" },
                ...[
                  { key: "choice", label: "Раунд 1 · Быстрый выбор", color: "#c8ff4d" },
                  { key: "build", label: "Раунд 2 · Конструктор", color: "#ffd23f" },
                  { key: "fix", label: "Раунд 3 · Найди ошибку", color: "#ff4d8d" },
                  { key: "blitz", label: "Раунд 4 · Блиц", color: "#ff6b3d" },
                ].map((m) => {
                  const r = rounds.find((x) => x.key === m.key);
                  return { label: m.label, score: r?.score ?? 0, correct: r?.correct ?? 0, total: r?.total ?? 0, color: m.color };
                }),
              ].map((row) => {
                const max = 1400;
                return (
                  <div key={row.label}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-chalk/80">{row.label}</span>
                      <span className="font-display tabular-nums" style={{ color: row.color }}>
                        {row.score} XP
                        {row.total > 0 && (
                          <span className="ml-2 text-xs text-muted">
                            {row.correct}/{row.total}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-ink">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (row.score / max) * 100)}%`,
                          background: `linear-gradient(90deg, ${row.color}, ${row.color}77)`,
                          animation: "barGrow .8s cubic-bezier(.2,.9,.3,1) both",
                          transformOrigin: "left",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => {
                sfx.start();
                setStage("arena");
              }}
              className="btn bg-magenta px-5 py-4 text-sm text-ink"
            >
              ⚔ БРОСИТЬ ВЫЗОВ КЛАССУ
            </button>
            <Link href={`/leaderboard?sid=${me.id}`} className="btn bg-acid px-5 py-4 text-sm text-ink">
              🏆 ТАБЛИЦА ЛИДЕРОВ
            </Link>
            <button
              type="button"
              onClick={() => {
                sfx.click();
                restart();
              }}
              className="btn border border-line bg-panel px-5 py-4 text-sm text-chalk hover:border-acid/60"
            >
              ↻ ПРОЙТИ ЕЩЁ РАЗ
            </button>
            <Link href="/" className="btn border border-line bg-panel px-5 py-4 text-sm text-chalk">
              ← сменить ученика
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}
