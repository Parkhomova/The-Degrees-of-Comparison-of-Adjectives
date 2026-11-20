"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { comparative, RULE_META } from "@/lib/grammar";
import {
  buildBuildSet,
  buildFixSet,
  buildRoundSet,
  makeBlitz,
  mulberry32,
  type BlitzQ,
  type BuildQ,
  type ChoiceQ,
  type FixQ,
} from "@/lib/questions";
import { sfx } from "@/lib/sound";
import { TimerRing, useCountdown } from "./ui";

export type RoundResult = {
  key: string;
  label: string;
  score: number;
  correct: number;
  total: number;
  ms: number;
};

/* ------------------------------------------------------------------ */
/*  Каркас раунда                                                      */
/* ------------------------------------------------------------------ */

export function RoundFrame({
  kicker,
  title,
  color,
  idx,
  total,
  score,
  streak,
  timer,
  combo,
  children,
  shake,
}: {
  kicker: string;
  title: string;
  color: string;
  idx: number;
  total: number;
  score: number;
  streak: number;
  timer?: React.ReactNode;
  combo?: number;
  children: React.ReactNode;
  shake?: boolean;
}) {
  return (
    <div className={shake ? "animate-shake" : undefined}>
      <div className="panel grain-card relative overflow-hidden rounded-3xl p-4 sm:p-6">
        <div
          className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full opacity-20 blur-3xl"
          style={{ background: color }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div
              className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
              style={{ color }}
            >
              {kicker}
            </div>
            <h2 className="display truncate text-xl text-chalk sm:text-2xl">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="display text-2xl tabular-nums" style={{ color }}>
                {score}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted">очки</div>
            </div>
            {streak > 1 && (
              <div className="animate-pop rounded-xl border border-coral/50 bg-coral/10 px-2.5 py-1 text-center">
                <div className="display text-lg text-coral">×{streak}</div>
                <div className="text-[9px] uppercase tracking-widest text-muted">серия</div>
              </div>
            )}
            {combo !== undefined && combo > 1 && (
              <div className="animate-pop rounded-xl border border-gold/50 bg-gold/10 px-2.5 py-1 text-center">
                <div className="display text-lg text-gold">×{combo}</div>
                <div className="text-[9px] uppercase tracking-widest text-muted">комбо</div>
              </div>
            )}
            {timer}
          </div>
        </div>

        <div className="relative mt-3 flex items-center gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                background: i < idx ? color : i === idx ? `${color}66` : "#1e2937",
                transform: i === idx ? "scaleY(1.6)" : undefined,
              }}
            />
          ))}
          <span className="ml-2 shrink-0 text-[11px] tabular-nums text-muted">
            {Math.min(idx + 1, total)}/{total}
          </span>
        </div>

        <div className="relative mt-4">{children}</div>
      </div>
    </div>
  );
}

function Explain({
  ok,
  answer,
  adj,
  note,
}: {
  ok: boolean;
  answer: string;
  adj?: string;
  note?: string;
}) {
  const c = adj ? comparative(adj) : null;
  const meta = c ? RULE_META[c.rule] : null;
  return (
    <div
      className="animate-rise mt-4 rounded-2xl border p-3 text-sm"
      style={{
        borderColor: ok ? "#c8ff4d55" : "#ff4d8d55",
        background: ok ? "#c8ff4d10" : "#ff4d8d10",
      }}
    >
      <div className="font-display text-base font-extrabold" style={{ color: ok ? "#c8ff4d" : "#ff4d8d" }}>
        {ok ? "В точку!" : `Правильно: ${answer}`}
      </div>
      {c && meta && (
        <div className="mt-1 text-chalk/75">
          <b style={{ color: meta.color }}>{meta.title}</b> · {c.explanation}
        </div>
      )}
      {note && <div className="mt-1 text-chalk/70">{note}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  РАУНД 1 — ТЕСТ НА ВРЕМЯ                                            */
/* ------------------------------------------------------------------ */

function ChoiceQuestion({
  q,
  limit,
  onResult,
  onNext,
  onTick,
}: {
  q: ChoiceQ;
  limit: number;
  onResult: (ok: boolean, leftMs: number) => void;
  onNext: () => void;
  onTick?: (ms: number) => void;
}) {
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const { ms } = useCountdown(limit, !locked, () => {
    if (locked) return;
    setLocked(true);
    setOk(false);
    sfx.wrong();
    onResult(false, 0);
    window.setTimeout(onNext, 1700);
  });
  const tickRef = useRef(onTick);
  tickRef.current = onTick;
  useEffect(() => {
    tickRef.current?.(ms);
  }, [ms]);

  const answer = (opt: string) => {
    if (locked) return;
    const good = opt === q.answer;
    setPicked(opt);
    setOk(good);
    setLocked(true);
    if (good) sfx.correct(1);
    else sfx.wrong();
    onResult(good, ms);
    window.setTimeout(onNext, good ? 900 : 1700);
  };

  const c = comparative(q.adj);

  return (
    <div>
      <div className="rounded-2xl border border-line bg-ink/50 p-5 text-center">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted">{q.sub}</div>
        <div className="display mt-2 text-[clamp(2.2rem,7vw,3.6rem)] text-chalk">{q.prompt}</div>
      </div>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {q.options.map((o, oi) => {
          const isAns = o === q.answer;
          const isPick = o === picked;
          const bg = !locked
            ? undefined
            : isAns
              ? "#c8ff4d"
              : isPick
                ? "#ff4d8d"
                : undefined;
          return (
            <button
              key={o + oi}
              type="button"
              disabled={locked}
              onClick={() => answer(o)}
              className="tile btn px-4 py-4 text-left font-display text-lg font-bold text-chalk disabled:cursor-default"
              style={
                bg
                  ? { background: bg, color: "#08101a", borderColor: bg }
                  : undefined
              }
            >
              <span className="mr-2 text-xs text-muted">{o === q.answer && locked ? "✓" : "•"}</span>
              {o}
            </button>
          );
        })}
      </div>
      {locked && <Explain ok={ok} answer={q.answer} adj={q.adj} note={`${c.input} → ${c.form}`} />}
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted">
        <span className="h-1 w-24 overflow-hidden rounded-full bg-line">
          <span
            className="block h-full rounded-full"
            style={{ width: `${(ms / limit) * 100}%`, background: ms < 4000 ? "#ff4d8d" : "#4be3ff", transition: "width .1s linear" }}
          />
        </span>
        осталось {Math.ceil(ms / 1000)} с · бонус за скорость
      </div>
    </div>
  );
}

export function ChoiceRound({ seed, onDone }: { seed: number; onDone: (r: RoundResult) => void }) {
  const LIMIT = 15000;
  const COUNT = 8;
  const questions = useMemo(() => buildRoundSet(seed, COUNT), [seed]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const t0 = useRef(performance.now());
  const [liveMs, setLiveMs] = useState(LIMIT);
  useEffect(() => setLiveMs(LIMIT), [idx, LIMIT]);
  void bestStreak;

  return (
    <RoundFrame
      kicker="раунд 1 · 15 секунд на вопрос"
      title="БЫСТРЫЙ ВЫБОР"
      color="#4be3ff"
      idx={idx}
      total={COUNT}
      score={score}
      streak={streak}
      timer={<TimerRing ms={liveMs} total={LIMIT} />}
    >
      <ChoiceQuestion
        key={idx}
        q={questions[idx]}
        limit={LIMIT}
        onTick={setLiveMs}
        onResult={(okv, left) => {
          if (okv) {
            const bonus = Math.round((left / LIMIT) * 50);
            scoreRef.current += 100 + bonus;
            correctRef.current += 1;
            setScore(scoreRef.current);
            setCorrect(correctRef.current);
            setStreak((s) => {
              const n = s + 1;
              setBestStreak((b) => Math.max(b, n));
              return n;
            });
          } else setStreak(0);
        }}
        onNext={() => {
          if (idx + 1 >= COUNT) {
            onDone({
              key: "choice",
              label: "Быстрый выбор",
              score: scoreRef.current,
              correct: correctRef.current,
              total: COUNT,
              ms: Math.round(performance.now() - t0.current),
            });
          } else setIdx((i) => i + 1);
        }}
      />
    </RoundFrame>
  );
}

/* ------------------------------------------------------------------ */
/*  РАУНД 2 — КОНСТРУКТОР ПРЕДЛОЖЕНИЙ                                  */
/* ------------------------------------------------------------------ */

function BuildQuestion({
  q,
  limit,
  onResult,
  onNext,
  onTick,
}: {
  q: BuildQ;
  limit: number;
  onResult: (ok: boolean, left: number) => void;
  onNext: () => void;
  onTick?: (ms: number) => void;
}) {
  const [placedIdx, setPlacedIdx] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [ok, setOk] = useState(false);
  const placed = placedIdx.map((i) => q.pool[i]);
  const { ms } = useCountdown(limit, !locked, () => {
    if (locked) return;
    setLocked(true);
    setOk(false);
    sfx.wrong();
    onResult(false, 0);
    window.setTimeout(onNext, 2200);
  });
  const tickRef = useRef(onTick);
  tickRef.current = onTick;
  useEffect(() => {
    tickRef.current?.(ms);
  }, [ms]);

  const add = (i: number) => {
    if (locked) return;
    setPlacedIdx((p) => [...p, i]);
    sfx.click();
  };
  const remove = (pos: number) => {
    if (locked) return;
    setPlacedIdx((p) => p.filter((_, i) => i !== pos));
    sfx.click();
  };

  const check = () => {
    const good = placed.join(" ") === q.answer.join(" ");
    setLocked(true);
    setOk(good);
    if (good) sfx.correct(2);
    else sfx.wrong();
    onResult(good, ms);
    window.setTimeout(onNext, good ? 1300 : 2600);
  };

  return (
    <div>
      <div className="rounded-2xl border border-line bg-ink/50 p-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted">собери предложение</div>
        <div className="mt-1 font-display text-lg text-gold sm:text-xl">{q.ru}</div>
      </div>

      <div className="mt-4 min-h-[86px] rounded-2xl border-2 border-dashed border-line bg-ink/40 p-3">
        {placed.length === 0 ? (
          <div className="grid h-14 place-items-center text-sm text-muted">
            нажимай на плитки ниже, чтобы собрать предложение
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {placed.map((t, i) => (
              <button
                key={i}
                type="button"
                disabled={locked}
                onClick={() => remove(i)}
                className="animate-pop rounded-xl px-3 py-2 font-display text-base font-bold"
                style={{
                  background: locked ? (ok ? "#c8ff4d" : "#ff4d8d22") : "#1b2431",
                  color: locked && ok ? "#08101a" : "#eef2f6",
                  border: `1px solid ${locked && !ok ? "#ff4d8d" : "#2a3648"}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {q.pool.map((t, i) => {
          const used = placedIdx.includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={locked || used}
              onClick={() => add(i)}
              className="tile btn rounded-xl px-3.5 py-2.5 font-display text-base font-bold"
              style={{
                opacity: used ? 0.22 : 1,
                color: "#eef2f6",
                borderColor: used ? "#1e2937" : undefined,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={locked || placed.length !== q.answer.length}
          onClick={check}
          className="btn bg-acid px-5 py-3 text-sm text-ink shadow-[0_10px_30px_#c8ff4d33]"
        >
          ПРОВЕРИТЬ
        </button>
        <span className="text-[11px] text-muted">
          лишних плиток: {q.pool.length - q.answer.length} · нужно {q.answer.length} слов
        </span>
      </div>

      {locked && (
        <Explain
          ok={ok}
          answer={q.answer.join(" ")}
          adj={q.adj}
          note={`перевод: ${q.ru}`}
        />
      )}
    </div>
  );
}

export function BuildRound({ seed, onDone }: { seed: number; onDone: (r: RoundResult) => void }) {
  const LIMIT = 45000;
  const COUNT = 5;
  const questions = useMemo(() => buildBuildSet(seed, COUNT), [seed]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const t0 = useRef(performance.now());
  const [liveMs, setLiveMs] = useState(LIMIT);
  useEffect(() => setLiveMs(LIMIT), [idx, LIMIT]);

  return (
    <RoundFrame
      kicker="раунд 2 · 45 секунд на предложение"
      title="КОНСТРУКТОР"
      color="#c8ff4d"
      idx={idx}
      total={COUNT}
      score={score}
      streak={streak}
      timer={<TimerRing ms={liveMs} total={LIMIT} />}
    >
      <BuildQuestion
        key={idx}
        q={questions[idx]}
        limit={LIMIT}
        onTick={setLiveMs}
        onResult={(okv, left) => {
          if (okv) {
            scoreRef.current += 150 + Math.round((left / LIMIT) * 60);
            correctRef.current += 1;
            setScore(scoreRef.current);
            setCorrect(correctRef.current);
            setStreak((s) => s + 1);
          } else setStreak(0);
        }}
        onNext={() => {
          if (idx + 1 >= COUNT) {
            onDone({
              key: "build",
              label: "Конструктор",
              score: scoreRef.current,
              correct: correctRef.current,
              total: COUNT,
              ms: Math.round(performance.now() - t0.current),
            });
          } else setIdx((i) => i + 1);
        }}
      />
    </RoundFrame>
  );
}

/* ------------------------------------------------------------------ */
/*  РАУНД 3 — НАЙДИ ОШИБКУ                                             */
/* ------------------------------------------------------------------ */

function FixQuestion({
  q,
  limit,
  onResult,
  onNext,
  onTick,
}: {
  q: FixQ;
  limit: number;
  onResult: (ok: boolean, left: number, tries: number) => void;
  onNext: () => void;
  onTick?: (ms: number) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [miss, setMiss] = useState(0);
  const [wrongPick, setWrongPick] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [ok, setOk] = useState(false);
  const { ms } = useCountdown(limit, !locked, () => {
    if (locked) return;
    setLocked(true);
    setOk(false);
    sfx.wrong();
    onResult(false, 0, miss + 1);
    window.setTimeout(onNext, 2400);
  });
  const tickRef = useRef(onTick);
  tickRef.current = onTick;
  useEffect(() => {
    tickRef.current?.(ms);
  }, [ms]);

  const clickToken = (i: number) => {
    if (locked || step !== 1) return;
    if (i === q.badIndex) {
      sfx.coin();
      setStep(2);
    } else {
      setMiss((m) => m + 1);
      setWrongPick(i);
      sfx.wrong();
      window.setTimeout(() => setWrongPick(null), 500);
      if (miss + 1 >= 2) {
        setLocked(true);
        setOk(false);
        onResult(false, ms, miss + 1);
        window.setTimeout(onNext, 2400);
      }
    }
  };

  const choose = (opt: string) => {
    if (locked) return;
    const good = opt === q.answer;
    setLocked(true);
    setOk(good);
    if (good) sfx.correct(2);
    else sfx.wrong();
    onResult(good, ms, miss);
    window.setTimeout(onNext, good ? 1400 : 2600);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em]"
          style={{ background: step === 1 ? "#ff4d8d22" : "#c8ff4d22", color: step === 1 ? "#ff4d8d" : "#c8ff4d" }}
        >
          {step === 1 ? "шаг 1 · найди ошибочное слово" : "шаг 2 · замени его"}
        </span>
        <span className="text-[11px] text-muted">ошибок при поиске: {miss}/2</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-line bg-ink/50 p-4">
        {q.tokens.map((t, i) => {
          const isBad = locked && i === q.badIndex;
          const isFixed = isBad && ok;
          const shake = wrongPick === i;
          return (
            <button
              key={i}
              type="button"
              disabled={locked || step !== 1}
              onClick={() => clickToken(i)}
              className={`btn rounded-xl px-3 py-2 font-display text-base font-bold sm:text-lg ${shake ? "animate-shake" : ""}`}
              style={{
                background: isFixed ? "#c8ff4d" : isBad ? "#ff4d8d22" : "#161f2d",
                color: isFixed ? "#08101a" : "#eef2f6",
                border: `1px solid ${isBad ? "#ff4d8d" : "#26313f"}`,
                textDecoration: isBad && !ok ? "line-through" : undefined,
              }}
            >
              {isFixed ? q.answer : t}
            </button>
          );
        })}
      </div>

      {step === 2 && !locked && (
        <div className="animate-rise mt-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted">чем заменить?</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {q.options.map((o, oi) => (
              <button
                key={o + oi}
                type="button"
                onClick={() => choose(o)}
                className="tile btn rounded-xl border-acid/40 px-4 py-3 font-display text-lg font-bold text-chalk"
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-muted">
        перевод предложения: <span className="text-chalk/70">{q.ru}</span>
      </p>

      {locked && (
        <Explain ok={ok} answer={q.tokens.map((t, i) => (i === q.badIndex ? q.answer : t)).join(" ")} adj={q.adj} />
      )}
    </div>
  );
}

export function FixRound({ seed, onDone }: { seed: number; onDone: (r: RoundResult) => void }) {
  const LIMIT = 25000;
  const COUNT = 6;
  const questions = useMemo(() => buildFixSet(seed, COUNT), [seed]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const t0 = useRef(performance.now());
  const [liveMs, setLiveMs] = useState(LIMIT);
  useEffect(() => setLiveMs(LIMIT), [idx, LIMIT]);

  return (
    <RoundFrame
      kicker="раунд 3 · редактор"
      title="НАЙДИ ОШИБКУ"
      color="#ff4d8d"
      idx={idx}
      total={COUNT}
      score={score}
      streak={streak}
      timer={<TimerRing ms={liveMs} total={LIMIT} />}
    >
      <FixQuestion
        key={idx}
        q={questions[idx]}
        limit={LIMIT}
        onTick={setLiveMs}
        onResult={(okv, left, tries) => {
          if (okv) {
            scoreRef.current += (tries === 0 ? 130 : 80) + Math.round((left / LIMIT) * 40);
            correctRef.current += 1;
            setScore(scoreRef.current);
            setCorrect(correctRef.current);
            setStreak((s) => s + 1);
          } else setStreak(0);
        }}
        onNext={() => {
          if (idx + 1 >= COUNT) {
            onDone({
              key: "fix",
              label: "Найди ошибку",
              score: scoreRef.current,
              correct: correctRef.current,
              total: COUNT,
              ms: Math.round(performance.now() - t0.current),
            });
          } else setIdx((i) => i + 1);
        }}
      />
    </RoundFrame>
  );
}

/* ------------------------------------------------------------------ */
/*  РАУНД 4 — БЛИЦ (он же дуэльный режим)                              */
/* ------------------------------------------------------------------ */

export function BlitzRound({
  seed,
  duration = 45000,
  label = "БЛИЦ",
  kicker = "раунд 4 · 45 секунд",
  color = "#ffd23f",
  onDone,
  onLive,
  onFinishSound = true,
}: {
  seed: number;
  duration?: number;
  label?: string;
  kicker?: string;
  color?: string;
  onDone: (r: RoundResult) => void;
  onLive?: (score: number, correct: number) => void;
  onFinishSound?: boolean;
}) {
  const [qIdx, setQIdx] = useState(0);
  const bank = useMemo(() => {
    const rng = mulberry32(seed);
    const out: BlitzQ[] = [];
    while (out.length < 60) out.push(...makeBlitz(rng, 20));
    return out;
  }, [seed]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(1);
  const [picked, setPicked] = useState<string | null>(null);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [ms, setMs] = useState(duration);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(3);
  const endRef = useRef(0);
  const t0 = useRef(performance.now());
  const doneRef = useRef(false);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const answeredRef = useRef(0);
  const lockRef = useRef(false);
  const doneCb = useRef(onDone);
  doneCb.current = onDone;

  // обратный отсчёт перед стартом
  useEffect(() => {
    if (count <= 0) {
      setRunning(true);
      endRef.current = performance.now() + duration;
      t0.current = performance.now();
      sfx.start();
      return;
    }
    sfx.tick();
    const t = window.setTimeout(() => setCount((c) => c - 1), 700);
    return () => window.clearTimeout(t);
  }, [count, duration]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const step = () => {
      const left = endRef.current - performance.now();
      setMs(Math.max(0, left));
      if (left <= 0) {
        if (!doneRef.current) {
          doneRef.current = true;
          setRunning(false);
          if (onFinishSound) {
            if (scoreRef.current > 400) sfx.win();
            else sfx.lose();
          }
          doneCb.current({
            key: "blitz",
            label,
            score: scoreRef.current,
            correct: correctRef.current,
            total: answeredRef.current,
            ms: Math.round(performance.now() - t0.current),
          });
        }
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running, label, onFinishSound]);

  const q = bank[qIdx % bank.length];

  const answer = (opt: string) => {
    if (!running || lockRef.current) return;
    lockRef.current = true;
    setPicked(opt);
    const good = opt === q.answer;
    answeredRef.current += 1;
    setAnswered(answeredRef.current);
    if (good) {
      const nextStreak = streak + 1;
      const nextCombo = Math.min(5, 1 + Math.floor(nextStreak / 3));
      const pts = 40 * nextCombo;
      setStreak(nextStreak);
      setCombo(nextCombo);
      setScore((s) => {
        const n = s + pts;
        scoreRef.current = n;
        return n;
      });
      setCorrect((c) => {
        correctRef.current = c + 1;
        return c + 1;
      });
      setFlash("ok");
      sfx.correct(nextStreak);
      onLive?.(scoreRef.current, correctRef.current);
    } else {
      setStreak(0);
      setCombo(1);
      setFlash("bad");
      endRef.current -= 2000;
      sfx.wrong();
    }
    window.setTimeout(() => {
      setPicked(null);
      setFlash(null);
      lockRef.current = false;
      setQIdx((i) => i + 1);
    }, 240);
  };

  const pct = ms / duration;

  return (
    <RoundFrame
      kicker={kicker}
      title={label}
      color={color}
      idx={Math.floor((1 - ms / duration) * 14)}
      total={14}
      score={score}
      streak={streak}
      combo={combo}
      shake={flash === "bad"}
    >
      {count > 0 ? (
        <div className="grid h-64 place-items-center">
          <div className="text-center">
            <div className="display animate-pop text-[6rem] leading-none" style={{ color }}>
              {count}
            </div>
            <div className="mt-2 text-sm uppercase tracking-[0.2em] text-muted">
              приготовься: жми на правильную форму
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="h-2 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct * 100}%`,
                background: pct < 0.25 ? "#ff4d8d" : color,
                transition: "width .1s linear",
              }}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <div>
              <div className="rounded-2xl border border-line bg-ink/50 p-5 text-center">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted">
                  вторая степень от
                </div>
                <div key={qIdx} className="display animate-pop mt-1 text-[clamp(2.2rem,7vw,3.4rem)] text-chalk">
                  {q.prompt}
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {q.options.map((o, oi) => {
                  const isPick = o === picked;
                  const good = isPick && o === q.answer;
                  return (
                    <button
                      key={o + oi}
                      type="button"
                      onClick={() => answer(o)}
                      className="tile btn px-3 py-4 font-display text-base font-bold text-chalk sm:text-lg"
                      style={
                        isPick
                          ? {
                              background: good ? "#c8ff4d" : "#ff4d8d",
                              color: "#08101a",
                              borderColor: good ? "#c8ff4d" : "#ff4d8d",
                            }
                          : undefined
                      }
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="panel rounded-2xl p-3 text-center">
                <div className="display text-4xl tabular-nums" style={{ color: pct < 0.25 ? "#ff4d8d" : "#eef2f6" }}>
                  {(ms / 1000).toFixed(1)}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted">секунд</div>
              </div>
              <div className="panel rounded-2xl p-3 text-center">
                <div className="display text-2xl text-cyanx tabular-nums">{answered}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted">ответов</div>
              </div>
              <div className="panel rounded-2xl p-3 text-center">
                <div className="display text-2xl text-gold tabular-nums">
                  {answered ? Math.round((correct / answered) * 100) : 0}%
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted">точность</div>
              </div>
            </div>
          </div>
        </>
      )}
    </RoundFrame>
  );
}
