import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attempts, duels, students, type RoundScore } from "@/db/schema";
import { ACCENTS, CLASS_LIST, ensureStudents } from "./students";
import type { Classmate, DuelView, RunView } from "./board-types";

export type { Classmate, DuelView, RunView };
export { ghostTarget } from "./board-types";

const blitzOf = (rounds: RoundScore[]) => rounds.find((r) => r.key === "blitz")?.score ?? 0;

/** Запасной список класса, если БД недоступна: урок остаётся проходимым. */
export function fallbackClass(): Classmate[] {
  return CLASS_LIST.map((name, i) => ({
    id: i + 1,
    name,
    accent: ACCENTS[i % ACCENTS.length],
    slot: i,
    best: 0,
    bestBlitz: 0,
    bestAccuracy: 0,
    bestStreak: 0,
    runs: 0,
    totalTimeMs: 0,
    lastActive: null,
    duelsWon: 0,
    duelsLost: 0,
    pendingIn: 0,
    rank: i + 1,
  }));
}

/** Жива ли база данных. */
export async function isDbUp(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

const person = (s?: { id: number; name: string; accent: string }, id = 0) => ({
  id: s?.id ?? id,
  name: s?.name ?? "ученик",
  accent: s?.accent ?? "#c8ff4d",
});

export async function getClassData(): Promise<Classmate[]> {
  try {
    return await readClassData();
  } catch {
    return fallbackClass();
  }
}

async function readClassData(): Promise<Classmate[]> {
  await ensureStudents();
  const [all, runs, allDuels] = await Promise.all([
    db.select().from(students).orderBy(students.slot),
    db.select().from(attempts).orderBy(desc(attempts.createdAt)).limit(500),
    db.select().from(duels).orderBy(desc(duels.createdAt)).limit(300),
  ]);

  const rows = all.map((s) => {
    const mine = runs.filter((r) => r.studentId === s.id);
    const best = mine.length ? Math.max(...mine.map((m) => m.score)) : 0;
    const bestRun = mine.find((m) => m.score === best);
    const answered = allDuels.filter((d) => d.status === "answered");
    const duelsWon = answered.filter(
      (d) =>
        (d.challengerId === s.id && (d.targetScore ?? 0) < d.challengerScore) ||
        (d.targetId === s.id && (d.targetScore ?? 0) > d.challengerScore),
    ).length;
    const duelsLost = answered.filter(
      (d) =>
        (d.challengerId === s.id && (d.targetScore ?? 0) > d.challengerScore) ||
        (d.targetId === s.id && (d.targetScore ?? 0) < d.challengerScore),
    ).length;
    return {
      id: s.id,
      name: s.name,
      accent: s.accent,
      slot: s.slot,
      best,
      bestBlitz: mine.length ? Math.max(...mine.map((m) => blitzOf(m.rounds))) : 0,
      bestAccuracy:
        bestRun && bestRun.total > 0 ? Math.round((bestRun.correct / bestRun.total) * 100) : 0,
      bestStreak: mine.length ? Math.max(...mine.map((m) => m.bestStreak)) : 0,
      runs: mine.length,
      totalTimeMs: mine.reduce((a, m) => a + m.timeMs, 0),
      lastActive: mine[0]?.createdAt.toISOString() ?? null,
      duelsWon,
      duelsLost,
      pendingIn: allDuels.filter((d) => d.targetId === s.id && d.status === "pending").length,
      rank: 0,
    };
  });

  const sorted = [...rows].sort(
    (a, b) => b.best - a.best || b.bestAccuracy - a.bestAccuracy || a.slot - b.slot,
  );
  sorted.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

export async function getDuelFeed(limit = 40): Promise<DuelView[]> {
  try {
    return await readDuelFeed(limit);
  } catch {
    return [];
  }
}

async function readDuelFeed(limit = 40): Promise<DuelView[]> {
  await ensureStudents();
  const [all, rows] = await Promise.all([
    db.select().from(students),
    db.select().from(duels).orderBy(desc(duels.createdAt)).limit(limit),
  ]);
  const find = (id: number) => person(all.find((x) => x.id === id), id);
  return rows.map((d) => ({
    id: d.id,
    seed: d.seed,
    status: d.status,
    challengerScore: d.challengerScore,
    challengerCorrect: d.challengerCorrect,
    targetScore: d.targetScore,
    targetCorrect: d.targetCorrect,
    createdAt: d.createdAt.toISOString(),
    answeredAt: d.answeredAt?.toISOString() ?? null,
    challenger: find(d.challengerId),
    target: find(d.targetId),
  }));
}

export async function getIncoming(studentId: number): Promise<DuelView[]> {
  try {
    return await readIncoming(studentId);
  } catch {
    return [];
  }
}

async function readIncoming(studentId: number): Promise<DuelView[]> {
  await ensureStudents();
  const [rows, all] = await Promise.all([
    db.select().from(duels).where(eq(duels.targetId, studentId)).orderBy(desc(duels.createdAt)).limit(10),
    db.select().from(students),
  ]);
  const find = (id: number) => person(all.find((x) => x.id === id), id);
  return rows.map((d) => ({
    id: d.id,
    seed: d.seed,
    status: d.status,
    challengerScore: d.challengerScore,
    challengerCorrect: d.challengerCorrect,
    targetScore: d.targetScore,
    targetCorrect: d.targetCorrect,
    createdAt: d.createdAt.toISOString(),
    answeredAt: d.answeredAt?.toISOString() ?? null,
    challenger: find(d.challengerId),
    target: find(d.targetId),
  }));
}

export async function getHistory(studentId: number): Promise<RunView[]> {
  try {
    return await readHistory(studentId);
  } catch {
    return [];
  }
}

async function readHistory(studentId: number): Promise<RunView[]> {
  await ensureStudents();
  const rows = await db
    .select()
    .from(attempts)
    .where(eq(attempts.studentId, studentId))
    .orderBy(desc(attempts.createdAt))
    .limit(12);
  return rows.map((r) => ({
    id: r.id,
    score: r.score,
    correct: r.correct,
    total: r.total,
    timeMs: r.timeMs,
    finished: r.finished,
    rounds: r.rounds,
    createdAt: r.createdAt.toISOString(),
  }));
}

export type BoardPayload = {
  mates: Classmate[];
  duels: DuelView[];
  totalRuns: number;
  offline: boolean;
};

/** Единая точка загрузки витрины для серверных страниц. */
export async function loadBoard(duelLimit = 40): Promise<BoardPayload> {
  const [up, mates, duels] = await Promise.all([
    isDbUp(),
    getClassData(),
    getDuelFeed(duelLimit),
  ]);
  return {
    mates,
    duels,
    totalRuns: mates.reduce((a, b) => a + b.runs, 0),
    offline: !up,
  };
}
