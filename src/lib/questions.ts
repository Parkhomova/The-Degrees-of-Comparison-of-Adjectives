import { comparative, wrongForms } from "./grammar";

/* ------------------------------------------------------------------ */
/*  Служебное                                                          */
/* ------------------------------------------------------------------ */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type RNG = () => number;

export function shuffle<T>(arr: T[], rng: RNG): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick<T>(arr: T[], rng: RNG): T {
  return arr[Math.floor(rng() * arr.length)];
}

/* ------------------------------------------------------------------ */
/*  Словарь                                                            */
/* ------------------------------------------------------------------ */

export type Adj = { en: string; ru: string; compRu: string };

export const SHORT_ADJ: Adj[] = [
  { en: "tall", ru: "высокий", compRu: "выше" },
  { en: "short", ru: "короткий", compRu: "короче" },
  { en: "fast", ru: "быстрый", compRu: "быстрее" },
  { en: "slow", ru: "медленный", compRu: "медленнее" },
  { en: "strong", ru: "сильный", compRu: "сильнее" },
  { en: "weak", ru: "слабый", compRu: "слабее" },
  { en: "long", ru: "длинный", compRu: "длиннее" },
  { en: "small", ru: "маленький", compRu: "меньше" },
  { en: "big", ru: "большой", compRu: "больше" },
  { en: "hot", ru: "жаркий", compRu: "жарче" },
  { en: "cold", ru: "холодный", compRu: "холоднее" },
  { en: "cool", ru: "прохладный", compRu: "прохладнее" },
  { en: "warm", ru: "тёплый", compRu: "теплее" },
  { en: "dark", ru: "тёмный", compRu: "темнее" },
  { en: "bright", ru: "яркий", compRu: "ярче" },
  { en: "deep", ru: "глубокий", compRu: "глубже" },
  { en: "wide", ru: "широкий", compRu: "шире" },
  { en: "high", ru: "высокий", compRu: "выше" },
  { en: "low", ru: "низкий", compRu: "ниже" },
  { en: "thin", ru: "тонкий", compRu: "тоньше" },
  { en: "wet", ru: "мокрый", compRu: "мокрее" },
  { en: "sad", ru: "грустный", compRu: "грустнее" },
  { en: "rich", ru: "богатый", compRu: "богаче" },
  { en: "kind", ru: "добрый", compRu: "добрее" },
  { en: "loud", ru: "громкий", compRu: "громче" },
  { en: "clean", ru: "чистый", compRu: "чище" },
  { en: "hard", ru: "трудный", compRu: "труднее" },
  { en: "soft", ru: "мягкий", compRu: "мягче" },
  { en: "young", ru: "молодой", compRu: "моложе" },
  { en: "cheap", ru: "дешёвый", compRu: "дешевле" },
  { en: "sweet", ru: "сладкий", compRu: "слаще" },
  { en: "safe", ru: "безопасный", compRu: "безопаснее" },
  { en: "nice", ru: "милый", compRu: "милее" },
  { en: "large", ru: "большой", compRu: "больше" },
];

export const Y_ADJ: Adj[] = [
  { en: "happy", ru: "счастливый", compRu: "счастливее" },
  { en: "easy", ru: "лёгкий", compRu: "легче" },
  { en: "busy", ru: "занятой", compRu: "занятее" },
  { en: "heavy", ru: "тяжёлый", compRu: "тяжелее" },
  { en: "funny", ru: "смешной", compRu: "смешнее" },
  { en: "pretty", ru: "хорошенький", compRu: "красивее" },
  { en: "angry", ru: "сердитый", compRu: "сердитее" },
  { en: "hungry", ru: "голодный", compRu: "голоднее" },
  { en: "tiny", ru: "крошечный", compRu: "крошечнее" },
  { en: "lucky", ru: "везучий", compRu: "везучее" },
  { en: "sunny", ru: "солнечный", compRu: "солнечнее" },
  { en: "cloudy", ru: "облачный", compRu: "облачнее" },
  { en: "windy", ru: "ветреный", compRu: "ветренее" },
  { en: "noisy", ru: "шумный", compRu: "шумнее" },
  { en: "tasty", ru: "вкусный", compRu: "вкуснее" },
  { en: "silly", ru: "глупый", compRu: "глупее" },
];

export const LONG_ADJ: Adj[] = [
  { en: "beautiful", ru: "красивый", compRu: "красивее" },
  { en: "interesting", ru: "интересный", compRu: "интереснее" },
  { en: "expensive", ru: "дорогой", compRu: "дороже" },
  { en: "comfortable", ru: "удобный", compRu: "удобнее" },
  { en: "dangerous", ru: "опасный", compRu: "опаснее" },
  { en: "difficult", ru: "сложный", compRu: "сложнее" },
  { en: "important", ru: "важный", compRu: "важнее" },
  { en: "popular", ru: "популярный", compRu: "популярнее" },
  { en: "powerful", ru: "мощный", compRu: "мощнее" },
  { en: "careful", ru: "осторожный", compRu: "осторожнее" },
  { en: "colourful", ru: "красочный", compRu: "красочнее" },
  { en: "delicious", ru: "вкусный", compRu: "вкуснее" },
  { en: "exciting", ru: "захватывающий", compRu: "захватывающее" },
  { en: "boring", ru: "скучный", compRu: "скучнее" },
  { en: "intelligent", ru: "умный", compRu: "умнее" },
  { en: "modern", ru: "современный", compRu: "современнее" },
  { en: "romantic", ru: "романтичный", compRu: "романтичнее" },
  { en: "useful", ru: "полезный", compRu: "полезнее" },
];

export const TWO_ER_ADJ: Adj[] = [
  { en: "clever", ru: "сообразительный", compRu: "умнее" },
  { en: "narrow", ru: "узкий", compRu: "уже" },
  { en: "simple", ru: "простой", compRu: "проще" },
  { en: "quiet", ru: "тихий", compRu: "тише" },
  { en: "gentle", ru: "нежный", compRu: "нежнее" },
  { en: "friendly", ru: "дружелюбный", compRu: "дружелюбнее" },
];

export const IRREGULAR_ADJ: Adj[] = [
  { en: "good", ru: "хороший", compRu: "лучше" },
  { en: "bad", ru: "плохой", compRu: "хуже" },
  { en: "far", ru: "далёкий", compRu: "дальше" },
  { en: "little", ru: "маленький (о количестве)", compRu: "меньше" },
];

export const ALL_ADJ: Adj[] = [
  ...SHORT_ADJ,
  ...Y_ADJ,
  ...LONG_ADJ,
  ...TWO_ER_ADJ,
  ...IRREGULAR_ADJ,
];

export const compOf = (en: string) => comparative(en).form;

/* ------------------------------------------------------------------ */
/*  Предложения                                                        */
/* ------------------------------------------------------------------ */

export type Sentence = { tpl: string; ru: string; adj: string };

export const SENTENCES: Sentence[] = [
  { tpl: "An elephant is {} than a dog.", ru: "Слон больше, чем собака.", adj: "big" },
  { tpl: "This exercise is {} than the last one.", ru: "Это упражнение легче, чем предыдущее.", adj: "easy" },
  { tpl: "Summer in Spain is {} than summer in Poland.", ru: "Лето в Испании жарче, чем в Польше.", adj: "hot" },
  { tpl: "Your new phone is {} than mine.", ru: "Твой новый телефон дороже моего.", adj: "expensive" },
  { tpl: "She is {} at maths than her brother.", ru: "Она лучше брата в математике.", adj: "good" },
  { tpl: "Today the weather is {} than yesterday.", ru: "Сегодня погода хуже, чем вчера.", adj: "bad" },
  { tpl: "A cheetah is {} than a lion.", ru: "Гепард быстрее льва.", adj: "fast" },
  { tpl: "This book is {} than that film.", ru: "Эта книга интереснее того фильма.", adj: "interesting" },
  { tpl: "My room is {} than yours.", ru: "Моя комната чище твоей.", adj: "clean" },
  { tpl: "He is {} than his classmates.", ru: "Он дружелюбнее своих одноклассников.", adj: "friendly" },
  { tpl: "The blue dress is {} than the red one.", ru: "Синее платье красивее красного.", adj: "pretty" },
  { tpl: "This sofa is {} than that chair.", ru: "Этот диван удобнее того кресла.", adj: "comfortable" },
  { tpl: "Mount Everest is {} than Mont Blanc.", ru: "Эверест выше Монблана.", adj: "high" },
  { tpl: "Maths is {} than history for me.", ru: "Математика для меня сложнее истории.", adj: "difficult" },
  { tpl: "My little sister is {} than me.", ru: "Моя младшая сестра моложе меня.", adj: "young" },
  { tpl: "This test was {} than I expected.", ru: "Этот тест оказался проще, чем я ожидал.", adj: "simple" },
  { tpl: "Your dog is {} than my cat.", ru: "Твоя собака счастливее моей кошки.", adj: "happy" },
  { tpl: "The second task is {} than the first.", ru: "Второе задание важнее первого.", adj: "important" },
  { tpl: "Autumn evenings are {} than summer ones.", ru: "Осенние вечера длиннее летних.", adj: "long" },
  { tpl: "This street is {} than the avenue.", ru: "Эта улица уже проспекта.", adj: "narrow" },
];

/* ------------------------------------------------------------------ */
/*  Типы заданий                                                       */
/* ------------------------------------------------------------------ */

export type ChoiceQ = {
  kind: "choice";
  prompt: string;
  sub: string;
  answer: string;
  options: string[];
  adj: string;
};

export type BuildQ = {
  kind: "build";
  ru: string;
  answer: string[];
  pool: string[];
  adj: string;
};

export type FixQ = {
  kind: "fix";
  tokens: string[];
  badIndex: number;
  options: string[];
  answer: string;
  ru: string;
  adj: string;
};

export type BlitzQ = {
  kind: "blitz";
  prompt: string;
  answer: string;
  options: string[];
  adj: string;
};

/* ------------------------------------------------------------------ */
/*  Генераторы                                                         */
/* ------------------------------------------------------------------ */

function optionsFor(adj: string, rng: RNG, count = 4): string[] {
  const answer = compOf(adj);
  const wrongs = shuffle(wrongForms(adj), rng).slice(0, count - 1);
  while (wrongs.length < count - 1) {
    const other = pick(ALL_ADJ, rng);
    const w = compOf(other.en);
    if (w !== answer && !wrongs.includes(w)) wrongs.push(w);
  }
  return shuffle([answer, ...wrongs], rng);
}

export function makeChoice(rng: RNG, pool: Adj[] = ALL_ADJ): ChoiceQ {
  const item = pick(pool, rng);
  const reverse = rng() < 0.3;
  const answer = compOf(item.en);
  return reverse
    ? {
        kind: "choice",
        prompt: `«${item.compRu}»`,
        sub: "Выбери правильный английский эквивалент",
        answer,
        options: optionsFor(item.en, rng),
        adj: item.en,
      }
    : {
        kind: "choice",
        prompt: item.en,
        sub: `${item.ru} → вторая степень сравнения`,
        answer,
        options: optionsFor(item.en, rng),
        adj: item.en,
      };
}

export function makeBuild(rng: RNG): BuildQ {
  const s = pick(SENTENCES, rng);
  const answer = s.tpl.replace("{}", compOf(s.adj)).split(" ");
  const extras = shuffle(["then", "-er", "most", "very", "as", "so", "but", "such"], rng).slice(
    0,
    2,
  );
  return {
    kind: "build",
    ru: s.ru,
    answer,
    pool: shuffle([...answer, ...extras], rng),
    adj: s.adj,
  };
}

export function makeFix(rng: RNG): FixQ {
  const s = pick(SENTENCES, rng);
  const form = compOf(s.adj);
  const formTokens = form.split(" ");
  const answerTokens = s.tpl.replace("{}", form).split(" ");
  const thanIndex = answerTokens.indexOf("than");
  const compIndex = answerTokens.indexOf(formTokens[formTokens.length - 1]);
  const singleTokenComp = formTokens.length === 1 && compIndex >= 0;
  const useThen = !singleTokenComp || (thanIndex > 0 && rng() < 0.45);

  const tokens = [...answerTokens];
  let badIndex: number;
  let answer: string;
  let distractors: string[];

  if (useThen && thanIndex >= 0) {
    badIndex = thanIndex;
    tokens[badIndex] = "then";
    answer = "than";
    distractors = shuffle(["then", "that", "as", "from"], rng)
      .filter((w) => w !== answer)
      .slice(0, 2);
  } else {
    badIndex = compIndex;
    const wrongs = wrongForms(s.adj).filter((w) => !w.includes(" ") && w !== form);
    tokens[badIndex] = pick(wrongs.length ? wrongs : ["gooder"], rng);
    answer = form;
    distractors = shuffle(
      wrongs.filter((w) => w !== tokens[badIndex]),
      rng,
    ).slice(0, 2);
    while (distractors.length < 2) {
      const extra = pick(["more better", "gooder", "badder", "more taller"], rng);
      if (extra !== answer && !distractors.includes(extra)) distractors.push(extra);
      else distractors.push("most " + s.adj);
    }
  }

  return {
    kind: "fix",
    tokens,
    badIndex,
    options: shuffle([answer, ...distractors.slice(0, 2)], rng),
    answer,
    ru: s.ru,
    adj: s.adj,
  };
}

export function makeBlitz(rng: RNG, count: number): BlitzQ[] {
  const out: BlitzQ[] = [];
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    let item = pick(ALL_ADJ, rng);
    let guard = 0;
    while (used.has(item.en) && guard++ < 20) item = pick(ALL_ADJ, rng);
    used.add(item.en);
    const answer = compOf(item.en);
    out.push({
      kind: "blitz",
      prompt: item.en,
      answer,
      options: optionsFor(item.en, rng, 3),
      adj: item.en,
    });
  }
  return out;
}

export function buildRoundSet(seed: number, n: number, pool: Adj[] = ALL_ADJ): ChoiceQ[] {
  const rng = mulberry32(seed);
  const used = new Set<string>();
  const out: ChoiceQ[] = [];
  let guard = 0;
  while (out.length < n && guard++ < 400) {
    const q = makeChoice(rng, pool);
    if (used.has(q.adj)) continue;
    used.add(q.adj);
    out.push(q);
  }
  while (out.length < n) out.push(makeChoice(rng, pool));
  return out;
}

export function buildBuildSet(seed: number, n: number): BuildQ[] {
  const rng = mulberry32(seed);
  const seen = new Set<string>();
  const out: BuildQ[] = [];
  let guard = 0;
  while (out.length < n && guard++ < 200) {
    const q = makeBuild(rng);
    if (seen.has(q.ru)) continue;
    seen.add(q.ru);
    out.push(q);
  }
  return out;
}

export function buildFixSet(seed: number, n: number): FixQ[] {
  const rng = mulberry32(seed);
  const seen = new Set<string>();
  const out: FixQ[] = [];
  let guard = 0;
  while (out.length < n && guard++ < 200) {
    const q = makeFix(rng);
    if (seen.has(q.tokens.join(" "))) continue;
    seen.add(q.tokens.join(" "));
    out.push(q);
  }
  return out;
}
