/**
 * Движок образования второй (сравнительной) степени сравнения прилагательных.
 * Используется и в правиле-«машинке», и для генерации заданий/дистракторов.
 */

export type RuleId = "irregular" | "e" | "y" | "cvc" | "er" | "more";

export const RULE_META: Record<
  RuleId,
  { title: string; short: string; color: string; why: string }
> = {
  irregular: {
    title: "Исключение",
    short: "?!?",
    color: "#ff4d8d",
    why: "Форма меняется полностью — её нужно запомнить.",
  },
  e: {
    title: "Уже есть -e",
    short: "+ r",
    color: "#4be3ff",
    why: "Если слово уже заканчивается на -e, добавляем только -r.",
  },
  y: {
    title: "Согласная + y",
    short: "y → ier",
    color: "#ffd23f",
    why: "Y после согласной превращается в i, затем добавляем -er.",
  },
  cvc: {
    title: "Удвоение",
    short: "CVC → +er",
    color: "#ff7a3c",
    why: "Один слог, закрытый одной согласной: согласная удваивается.",
  },
  er: {
    title: "Короткое слово",
    short: "+ er",
    color: "#c8ff4d",
    why: "Один-два слога — просто добавляем суффикс -er.",
  },
  more: {
    title: "Длинное слово",
    short: "more +",
    color: "#b28bff",
    why: "Два слога и больше (кроме -y/-le/-er/-ow) — ставим more перед словом.",
  },
};

export const IRREGULAR: Record<string, { comp: string; sup: string }> = {
  good: { comp: "better", sup: "best" },
  well: { comp: "better", sup: "best" },
  bad: { comp: "worse", sup: "worst" },
  far: { comp: "farther", sup: "farthest" },
  little: { comp: "less", sup: "least" },
  much: { comp: "more", sup: "most" },
  many: { comp: "more", sup: "most" },
};

const VOWELS = "aeiouy";
const isVowel = (c: string) => VOWELS.includes(c);

/** Двусложные слова, которые всё же любят суффикс -er. */
const TWO_SYLLABLE_ER = new Set([
  "clever",
  "narrow",
  "simple",
  "gentle",
  "quiet",
  "common",
  "cruel",
  "bitter",
  "tender",
  "polite",
  "handsome",
  "pleasant",
  "solid",
  "stupid",
  "friendly",
]);

export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const groups = w.match(/[aeiouy]+/g) ?? [];
  let n = groups.length;
  if (w.endsWith("e") && n > 1 && !/[aeiouy]e$/.test(w)) n -= 1;
  return Math.max(1, n);
}

export type Comparative = {
  input: string;
  form: string;
  prefix: string;
  stem: string;
  suffix: string;
  rule: RuleId;
  syllables: number;
  explanation: string;
};

export function comparative(raw: string): Comparative {
  const adj = raw.trim().toLowerCase().replace(/[^a-z-]/g, "");
  const syl = syllables(adj);
  const base: Omit<Comparative, "rule" | "explanation"> = {
    input: adj,
    form: "",
    prefix: "",
    stem: adj,
    suffix: "",
    syllables: syl,
  };

  if (IRREGULAR[adj]) {
    const form = IRREGULAR[adj].comp;
    return {
      ...base,
      stem: "",
      suffix: "",
      prefix: "",
      form,
      rule: "irregular",
      explanation: `${adj} — исключение: ${adj} → ${form}. ${RULE_META.irregular.why}`,
    };
  }

  if (TWO_SYLLABLE_ER.has(adj) && !adj.endsWith("y")) {
    const form = adj.endsWith("e") ? `${adj}r` : `${adj}er`;
    return {
      ...base,
      form,
      prefix: "",
      stem: adj,
      suffix: form.slice(adj.length),
      rule: "er",
      explanation: `Двусложное слово на -er/-le/-ow/-ure принимает -er: ${adj} → ${form}.`,
    };
  }

  if (adj.endsWith("y") && adj.length > 2) {
    if (syl >= 2) {
      const stem = adj.slice(0, -1);
      const form = `${stem}ier`;
      return {
        ...base,
        form,
        stem,
        suffix: "ier",
        rule: "y",
        explanation: `Слово на -y: меняем y на i и добавляем -er: ${adj} → ${form}.`,
      };
    }
    const form = `${adj}er`;
    return {
      ...base,
      form,
      suffix: "er",
      rule: "er",
      explanation: `Односложное слово на -y просто получает -er: ${adj} → ${form}.`,
    };
  }

  if (syl <= 1 && adj.length >= 3) {
    const l = adj.length;
    const c1 = !isVowel(adj[l - 3]);
    const v = isVowel(adj[l - 2]);
    const c2 = !isVowel(adj[l - 1]);
    if (c1 && v && c2 && !adj.endsWith("y") && !/[wx]$/.test(adj)) {
      const form = `${adj}${adj[l - 1]}er`;
      return {
        ...base,
        form,
        suffix: `${adj[l - 1]}er`,
        rule: "cvc",
        explanation: `Один слог, схема «согласная-гласная-согласная»: удваиваем ${adj[l - 1]} → ${form}.`,
      };
    }
  }

  if (syl >= 2) {
    return {
      ...base,
      form: `more ${adj}`,
      prefix: "more ",
      stem: adj,
      suffix: "",
      rule: "more",
      explanation: `${adj} — длинное слово (${syl} сл.), поэтому ставим more: ${adj} → more ${adj}.`,
    };
  }

  if (adj.endsWith("e")) {
    const form = `${adj}r`;
    return {
      ...base,
      form,
      suffix: "r",
      rule: "e",
      explanation: `${adj} — короткое слово и уже оканчивается на -e, поэтому добавляем только -r: ${adj} → ${form}.`,
    };
  }

  const form = `${adj}er`;
  return {
    ...base,
    form,
    suffix: "er",
    rule: "er",
    explanation: `Короткое слово (${syl} сл.) — добавляем -er: ${adj} → ${form}.`,
  };
}

/** Грубые «ошибочные» формы для дистракторов. */
/** Типичные ученические ошибки — используются как дистракторы. */
export function wrongForms(raw: string): string[] {
  const adj = raw.trim().toLowerCase();
  const good = comparative(adj);
  const out = new Set<string>();

  out.add(`more ${adj}`); // лишнее more
  out.add(`most ${adj}`); // перепутана третья степень
  out.add(`${adj}er`); // суффикс там, где не надо / без правил орфографии
  out.add(`${adj}est`);

  if (adj.endsWith("y")) {
    out.add(`${adj.slice(0, -1)}ier`);
    out.add(`${adj.slice(0, -1)}yer`);
    out.add(`more ${adj}`);
  }
  if (adj.endsWith("e")) out.add(`${adj}er`); // niceer

  const l = adj.length;
  if (l >= 3 && isVowel(adj[l - 2]) && !isVowel(adj[l - 1])) {
    out.add(`${adj}${adj[l - 1]}er`); // лишнее удвоение: fastter
  }

  if (IRREGULAR[adj]) {
    out.add(IRREGULAR[adj].sup); // best вместо better
    out.add(`${adj}er`); // gooder
  }

  out.delete(good.form);
  return [...out].filter((w) => w && w !== good.form);
}
