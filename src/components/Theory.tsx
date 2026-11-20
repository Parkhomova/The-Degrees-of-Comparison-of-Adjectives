"use client";

import { useMemo, useState } from "react";
import { comparative, RULE_META, type RuleId } from "@/lib/grammar";
import { ALL_ADJ, pick, mulberry32 } from "@/lib/questions";
import { sfx } from "@/lib/sound";
import { Chip } from "./ui";

/* ------------------------------------------------------------------ */
/*  Морфинг слова                                                      */
/* ------------------------------------------------------------------ */

function WordMorph({ base, auto = false }: { base: string; auto?: boolean }) {
  const [open, setOpen] = useState(auto);
  const c = useMemo(() => comparative(base), [base]);
  const meta = RULE_META[c.rule];

  return (
    <button
      type="button"
      onClick={() => {
        setOpen((v) => !v);
        sfx.click();
      }}
      className="tile group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left"
      style={open ? { borderColor: `${meta.color}66` } : undefined}
    >
      <span className="min-w-0">
        <span className="block font-display text-lg font-bold text-chalk">{base}</span>
        <span className="block text-[11px] text-muted">
          {open ? meta.why : "нажми, чтобы превратить"}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {open ? (
          <span className="flex items-baseline font-display text-xl font-extrabold">
            {c.prefix && (
              <span className="animate-pop" style={{ color: meta.color }}>
                {c.prefix.trim()}&nbsp;
              </span>
            )}
            <span className="text-chalk">{c.stem}</span>
            {c.suffix && (
              <span
                className="animate-pop"
                style={{ color: meta.color, animationDelay: "60ms" }}
              >
                {c.suffix}
              </span>
            )}
          </span>
        ) : (
          <span className="text-muted transition group-hover:translate-x-1 group-hover:text-acid">
            →
          </span>
        )}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Мини-проверка                                                      */
/* ------------------------------------------------------------------ */

type Check = { q: string; options: string[]; answer: number; why: string };

function MiniCheck({
  check,
  onScore,
  tag,
}: {
  check: Check;
  onScore: (n: number) => void;
  tag: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  const ok = picked === check.answer;

  return (
    <div
      className="mt-3 rounded-xl border border-dashed p-3"
      style={{ borderColor: done ? (ok ? "#c8ff4d55" : "#ff4d8d55") : "#2a3648" }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Chip color={ok ? "#c8ff4d" : done ? "#ff4d8d" : "#4be3ff"}>
          {done ? (ok ? "+40 XP" : "разбор") : "проверь себя"}
        </Chip>
        <span className="text-xs text-muted">{tag}</span>
      </div>
      <p className="font-display text-base font-bold leading-snug text-chalk">{check.q}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {check.options.map((o, i) => {
          const isAns = i === check.answer;
          const isPick = i === picked;
          const color = !done
            ? "#2a3648"
            : isAns
              ? "#c8ff4d"
              : isPick
                ? "#ff4d8d"
                : "#2a3648";
          return (
            <button
              key={o + i}
              type="button"
              disabled={done}
              onClick={() => {
                setPicked(i);
                if (isAns) {
                  sfx.correct(1);
                  onScore(40);
                } else sfx.wrong();
              }}
              className="btn border px-3 py-1.5 text-sm font-semibold"
              style={{
                borderColor: color,
                color: done && (isAns || isPick) ? "#08101a" : "#eef2f6",
                background: done && (isAns || isPick) ? color : "rgba(255,255,255,.03)",
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
      {done && (
        <p className="animate-rise mt-2 text-xs leading-relaxed text-muted">
          <b style={{ color: ok ? "#c8ff4d" : "#ff4d8d" }}>
            {ok ? "Верно! " : `Правильный ответ: ${check.options[check.answer]}. `}
          </b>
          {check.why}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Машина прилагательных                                              */
/* ------------------------------------------------------------------ */

function Machine() {
  const [value, setValue] = useState("happy");
  const [shown, setShown] = useState("happy");
  const [history, setHistory] = useState<string[]>([]);
  const c = useMemo(() => comparative(shown), [shown]);
  const meta = RULE_META[c.rule];
  const known = ALL_ADJ.find((a) => a.en === shown.toLowerCase().trim());

  const run = (raw: string) => {
    const v = raw.trim().toLowerCase().replace(/[^a-z]/g, "");
    if (!v) return;
    setShown(v);
    setHistory((h) => [v, ...h.filter((x) => x !== v)].slice(0, 6));
    sfx.coin();
  };

  return (
    <div className="panel grain-card rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Chip color="#ffd23f">тренажёр</Chip>
          <h3 className="display mt-2 text-2xl">МАШИНА ПРИЛАГАТЕЛЬНЫХ</h3>
          <p className="mt-1 text-sm text-muted">
            Вбей любое английское прилагательное — машина соберёт вторую степень и покажет,
            какое правило сработало.
          </p>
        </div>
        <div className="hidden shrink-0 sm:block">
          <div
            className="grid h-20 w-20 place-items-center rounded-2xl border text-3xl"
            style={{ borderColor: `${meta.color}55`, background: `${meta.color}12` }}
          >
            ⚙️
          </div>
        </div>
      </div>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          run(value);
        }}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="например: big"
          className="min-w-0 flex-1 rounded-xl border border-line bg-ink/70 px-4 py-3 font-display text-lg font-bold text-chalk outline-none transition placeholder:text-muted/60 focus:border-acid"
        />
        <button type="submit" className="btn bg-acid px-5 py-3 text-ink shadow-[0_10px_30px_#c8ff4d33]">
          ПРЕВРАТИТЬ →
        </button>
        <button
          type="button"
          onClick={() => run(pick(ALL_ADJ, mulberry32(Math.floor(Math.random() * 1e9))).en)}
          className="btn border border-line bg-panel px-4 py-3 text-chalk hover:border-gold/70"
          title="Случайное прилагательное"
        >
          🎲
        </button>
      </form>

      <div key={shown} className="animate-rise mt-4 rounded-2xl border p-4" style={{ borderColor: `${meta.color}44`, background: `${meta.color}0d` }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 font-display text-3xl font-extrabold sm:text-4xl">
            <span className="text-muted line-through decoration-2">{shown}</span>
            <span style={{ color: meta.color }}>→</span>
            <span className="text-chalk">
              {c.prefix && <span style={{ color: meta.color }}>{c.prefix}</span>}
              {c.stem}
              {c.suffix && <span className="animate-pop" style={{ color: meta.color }}>{c.suffix}</span>}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Chip color={meta.color}>{meta.title}</Chip>
            <span className="text-[11px] text-muted">
              слогов: {c.syllables} · {meta.short}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-chalk/80">{c.explanation}</p>
        {known && (
          <p className="mt-1 text-xs text-muted">
            перевод: <b className="text-chalk/80">{known.ru}</b> → {known.compRu}
          </p>
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest text-muted">история</span>
          {history.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => run(h)}
              className="rounded-full border border-line px-3 py-1 text-xs text-chalk/80 transition hover:border-acid hover:text-acid"
            >
              {h} → {comparative(h).form}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Станции правила                                                    */
/* ------------------------------------------------------------------ */

type Station = {
  id: string;
  n: string;
  kicker: string;
  title: string;
  formula?: string;
  color: string;
  lead: string;
  words: string[];
  table?: { a: string; b: string; c: string }[];
  warn?: string[];
  checks: Check[];
};

const STATIONS: Station[] = [
  {
    id: "degrees",
    n: "00",
    kicker: "разминка",
    title: "ТРИ СТУПЕНИ",
    color: "#4be3ff",
    formula: "positive → comparative → superlative",
    lead: "У английского прилагательного три формы. Нас интересует ВТОРАЯ — comparative degree: она сравнивает ДВА предмета и всегда дружит со словом than.",
    words: [],
    table: [
      { a: "tall", b: "taller", c: "the tallest" },
      { a: "beautiful", b: "more beautiful", c: "the most beautiful" },
      { a: "good", b: "better", c: "the best" },
      { a: "bad", b: "worse", c: "the worst" },
    ],
    checks: [
      {
        q: "Какая колонка — вторая степень сравнения?",
        options: ["tall", "taller", "the tallest"],
        answer: 1,
        why: "Средняя форма (comparative) сравнивает два предмета: A is taller than B.",
      },
    ],
  },
  {
    id: "short",
    n: "01",
    kicker: "правило 1",
    title: "КОРОТКИЕ СЛОВА + -er",
    color: "#c8ff4d",
    formula: "adj + er",
    lead: "Если в прилагательном ОДИН слог (или два, но с особым окончанием), просто прибавляем суффикс -er.",
    words: ["tall", "fast", "old", "strong", "long", "cold"],
    checks: [
      {
        q: "cold → ?",
        options: ["more cold", "colder", "coldest"],
        answer: 1,
        why: "Один слог — добавляем -er: colder.",
      },
      {
        q: "strong → ?",
        options: ["stronger", "more strong", "strongier"],
        answer: 0,
        why: "Два согласных на конце, удвоения нет: stronger.",
      },
    ],
  },
  {
    id: "spelling",
    n: "02",
    kicker: "правило 2",
    title: "ОРФОГРАФИЯ: -e, CVC и -y",
    color: "#ffd23f",
    formula: "-e → +r · CVC → ×2 + er · -y → -ier",
    lead: "Три капризных случая. Нажимай на слова — машина покажет, что именно поменялось.",
    words: ["nice", "large", "safe", "big", "hot", "thin", "happy", "easy", "funny"],
    warn: [
      "nice → nicer (не niceer): слово уже заканчивается на -e, добавляем только -r.",
      "big → bigger: один слог «согласная-гласная-согласная» — последняя согласная удваивается.",
      "happy → happier: y после согласной превращается в i.",
    ],
    checks: [
      {
        q: "big → ?",
        options: ["biger", "bigger", "more big"],
        answer: 1,
        why: "Схема C-V-C: удваиваем g → bigger.",
      },
      {
        q: "easy → ?",
        options: ["easyer", "easier", "more easy"],
        answer: 1,
        why: "y → i + er: easier.",
      },
      {
        q: "large → ?",
        options: ["larger", "largeer", "more large"],
        answer: 0,
        why: "Уже есть -e, добавляем только -r: larger.",
      },
    ],
  },
  {
    id: "long",
    n: "03",
    kicker: "правило 3",
    title: "ДЛИННЫЕ СЛОВА: MORE + adj",
    color: "#b28bff",
    formula: "more + adjective",
    lead: "Два слога и больше — суффикс не клеим, ставим перед словом more. Слово остаётся без изменений.",
    words: ["beautiful", "expensive", "interesting", "comfortable", "difficult", "modern"],
    warn: [
      "Неправильно: beautifuler, more beautifuler, expensiver.",
      "Но: clever → cleverer, narrow → narrower, simple → simpler, quiet → quieter — двусложные на -er/-le/-ow/-ure любят -er.",
    ],
    checks: [
      {
        q: "expensive → ?",
        options: ["expensiver", "more expensive", "expensivest"],
        answer: 1,
        why: "Три слога → more expensive.",
      },
      {
        q: "simple → ?",
        options: ["more simple", "simpler", "simplest"],
        answer: 1,
        why: "Двусложное на -le допускает -er: simpler (more simple тоже не ошибка, но проще — simpler).",
      },
    ],
  },
  {
    id: "irregular",
    n: "04",
    kicker: "правило 4",
    title: "ИСКЛЮЧЕНИЯ — ВЫУЧИТЬ!",
    color: "#ff4d8d",
    formula: "good → better · bad → worse",
    lead: "Эти слова ломают все правила. Их четыре — зато они встречаются в каждом втором предложении.",
    words: ["good", "bad", "far", "little"],
    table: [
      { a: "good / well", b: "better", c: "the best" },
      { a: "bad / badly", b: "worse", c: "the worst" },
      { a: "far", b: "farther / further", c: "the farthest" },
      { a: "little", b: "less", c: "the least" },
      { a: "much / many", b: "more", c: "the most" },
    ],
    warn: ["gooder ✗ · badder ✗ · more good ✗ — только better.", "old → older (о возрасте) и elder (о старшинстве в семье)."],
    checks: [
      {
        q: "bad → ?",
        options: ["badder", "worse", "more bad"],
        answer: 1,
        why: "Исключение: bad → worse → the worst.",
      },
      {
        q: "good → ?",
        options: ["better", "gooder", "more good"],
        answer: 0,
        why: "Исключение: good → better → the best.",
      },
    ],
  },
  {
    id: "than",
    n: "05",
    kicker: "правило 5",
    title: "КОНСТРУКЦИЯ С THAN",
    color: "#ff6b3d",
    formula: "A + is/are + comparative + THAN + B",
    lead: "Вторая степень почти всегда идёт в паре с than. Не then (потом), а than (чем).",
    words: [],
    table: [
      { a: "A tiger is", b: "stronger", c: "than a cat." },
      { a: "These shoes are", b: "more comfortable", c: "than those." },
      { a: "My result is", b: "better", c: "than yours." },
    ],
    warn: [
      "more taller ✗ — двойное сравнение запрещено: только taller.",
      "then ✗ → than ✓",
      "biger ✗ → bigger ✓",
    ],
    checks: [
      {
        q: "Выбери правильное предложение:",
        options: [
          "She is more taller than me.",
          "She is taller than me.",
          "She is taller then me.",
        ],
        answer: 1,
        why: "Короткое слово + -er, союз than. More вместе с -er не используется.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Теория                                                             */
/* ------------------------------------------------------------------ */

export default function Theory({
  onScore,
  onDone,
}: {
  onScore: (n: number) => void;
  onDone: () => void;
}) {
  const [active, setActive] = useState(0);
  const st = STATIONS[active];
  const [seen, setSeen] = useState<Set<string>>(new Set(["degrees"]));

  const go = (i: number) => {
    setActive(i);
    setSeen((s) => new Set(s).add(STATIONS[i].id));
    sfx.click();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      {/* Навигация */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="panel rounded-2xl p-2">
          <div className="px-2 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            станции правила
          </div>
          <div className="flex gap-1.5 overflow-x-auto scroll-thin lg:flex-col">
            {STATIONS.map((s, i) => {
              const isActive = i === active;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(i)}
                  className="btn flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs lg:w-full"
                  style={{
                    background: isActive ? `${s.color}1f` : "transparent",
                    color: isActive ? s.color : "#8b98ab",
                    border: `1px solid ${isActive ? `${s.color}55` : "transparent"}`,
                  }}
                >
                  <span className="font-display text-sm font-extrabold">{s.n}</span>
                  <span className="hidden whitespace-nowrap font-semibold lg:inline">
                    {s.title}
                  </span>
                  {seen.has(s.id) && (
                    <span className="ml-auto hidden text-[10px] lg:inline">✓</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-line px-2 pt-2">
            <span className="text-[11px] text-muted">
              изучено {seen.size}/{STATIONS.length}
            </span>
            <button
              type="button"
              onClick={() => {
                sfx.start();
                onDone();
              }}
              className="btn bg-acid px-3 py-2 text-xs text-ink"
            >
              К ЗАДАНИЯМ →
            </button>
          </div>
        </div>
      </aside>

      {/* Контент */}
      <div key={st.id} className="animate-rise space-y-5">
        <section className="panel grain-card relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-25 blur-3xl"
            style={{ background: st.color }}
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Chip color={st.color}>{st.kicker}</Chip>
              <span className="font-display text-xs text-muted">станция {st.n}</span>
            </div>
            <h2 className="display mt-3 text-[clamp(1.8rem,4.6vw,2.9rem)] text-chalk">
              {st.title}
            </h2>
            {st.formula && (
              <div
                className="mt-3 inline-block rounded-xl border px-4 py-2 font-display text-base font-bold sm:text-lg"
                style={{ borderColor: `${st.color}55`, color: st.color, background: `${st.color}10` }}
              >
                {st.formula}
              </div>
            )}
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-chalk/75">{st.lead}</p>

            {st.table && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-line">
                {st.table.map((row, i) => (
                  <div
                    key={row.a + i}
                    className={`grid grid-cols-3 gap-2 px-3 py-2.5 text-sm sm:text-base ${
                      i % 2 ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <span className="text-chalk/70">{row.a}</span>
                    <span className="font-display font-bold" style={{ color: st.color }}>
                      {row.b}
                    </span>
                    <span className="text-muted">{row.c}</span>
                  </div>
                ))}
              </div>
            )}

            {st.words.length > 0 && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {st.words.map((w) => (
                  <WordMorph key={w} base={w} />
                ))}
              </div>
            )}

            {st.warn && (
              <ul className="mt-4 space-y-1.5">
                {st.warn.map((w) => (
                  <li key={w} className="flex gap-2 text-[13px] leading-relaxed text-chalk/70">
                    <span style={{ color: st.color }}>▲</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 space-y-2">
              {st.checks.map((c, i) => (
                <MiniCheck key={i} tag={`станция ${st.n}`} check={c} onScore={onScore} />
              ))}
            </div>
          </div>
        </section>

        <Machine />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={active === 0}
            onClick={() => go(Math.max(0, active - 1))}
            className="btn border border-line bg-panel px-4 py-3 text-sm text-chalk disabled:opacity-30"
          >
            ← назад
          </button>
          {active < STATIONS.length - 1 ? (
            <button
              type="button"
              onClick={() => go(active + 1)}
              className="btn px-6 py-3 text-sm text-ink"
              style={{ background: STATIONS[active + 1].color }}
            >
              следующая станция →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                sfx.start();
                onDone();
              }}
              className="btn bg-acid px-6 py-3 text-sm text-ink shadow-[0_10px_30px_#c8ff4d33]"
            >
              ПРАКТИКА: 4 РАУНДА →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export type { RuleId };
