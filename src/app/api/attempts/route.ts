import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attempts, type RoundScore } from "@/db/schema";
import { ensureStudents } from "@/lib/students";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    studentId?: number;
    score?: number;
    correct?: number;
    total?: number;
    timeMs?: number;
    bestStreak?: number;
    rounds?: RoundScore[];
    finished?: number;
  };

  const studentId = Number(body.studentId);
  if (!studentId) {
    return NextResponse.json({ error: "studentId обязателен" }, { status: 400 });
  }

  try {
    return await saveAttempt(studentId, body);
  } catch {
    return NextResponse.json(
      { error: "база данных недоступна", offline: true },
      { status: 503 },
    );
  }
}

async function saveAttempt(
  studentId: number,
  body: {
    score?: number;
    correct?: number;
    total?: number;
    timeMs?: number;
    bestStreak?: number;
    rounds?: RoundScore[];
    finished?: number;
  },
) {
  await ensureStudents();
  const [row] = await db
    .insert(attempts)
    .values({
      studentId,
      score: Math.max(0, Math.round(Number(body.score ?? 0))),
      correct: Math.max(0, Math.round(Number(body.correct ?? 0))),
      total: Math.max(0, Math.round(Number(body.total ?? 0))),
      timeMs: Math.max(0, Math.round(Number(body.timeMs ?? 0))),
      bestStreak: Math.max(0, Math.round(Number(body.bestStreak ?? 0))),
      rounds: Array.isArray(body.rounds) ? body.rounds : [],
      finished: Number(body.finished ?? 1),
    })
    .returning({ id: attempts.id, score: attempts.score });

  // Сколько учеников держат лучший результат — отсюда место в общем рейтинге.
  const higher = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(
      db
        .select({ studentId: attempts.studentId, best: sql<number>`max(${attempts.score})` })
        .from(attempts)
        .groupBy(attempts.studentId)
        .having(sql`max(${attempts.score}) > ${row.score}`)
        .as("tops"),
    );

  const mine = await db
    .select()
    .from(attempts)
    .where(eq(attempts.studentId, studentId))
    .orderBy(desc(attempts.createdAt))
    .limit(10);

  const best = mine.reduce((a, m) => Math.max(a, m.score), 0);

  return NextResponse.json({
    id: row.id,
    rank: (higher[0]?.n ?? 0) + 1,
    best,
    runs: mine.length,
    isRecord: row.score >= best,
  });
}
