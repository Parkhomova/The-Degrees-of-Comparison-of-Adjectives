import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { duels } from "@/db/schema";
import { ensureStudents } from "@/lib/students";

export const dynamic = "force-dynamic";

/** Бросить вызов однокласснику. */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    challengerId?: number;
    targetId?: number;
    seed?: number;
    score?: number;
    correct?: number;
  };
  const challengerId = Number(body.challengerId);
  const targetId = Number(body.targetId);
  if (!challengerId || !targetId || challengerId === targetId) {
    return NextResponse.json({ error: "нужны два разных ученика" }, { status: 400 });
  }
  try {
    await ensureStudents();
    const [row] = await db
      .insert(duels)
      .values({
        challengerId,
        targetId,
        seed: Number(body.seed ?? 1),
        challengerScore: Math.max(0, Math.round(Number(body.score ?? 0))),
        challengerCorrect: Math.max(0, Math.round(Number(body.correct ?? 0))),
        status: "pending",
      })
      .returning({ id: duels.id });
    return NextResponse.json({ id: row.id });
  } catch {
    return NextResponse.json({ error: "база данных недоступна", offline: true }, { status: 503 });
  }
}

/** Принять вызов и записать свой результат. */
export async function PATCH(req: Request) {
  const body = (await req.json()) as {
    id?: number;
    studentId?: number;
    score?: number;
    correct?: number;
  };
  const id = Number(body.id);
  const studentId = Number(body.studentId);
  if (!id || !studentId) {
    return NextResponse.json({ error: "id и studentId обязательны" }, { status: 400 });
  }
  try {
    const [existing] = await db.select().from(duels).where(eq(duels.id, id));
    if (!existing) return NextResponse.json({ error: "вызов не найден" }, { status: 404 });
    if (existing.targetId !== studentId) {
      return NextResponse.json({ error: "этот вызов не тебе" }, { status: 403 });
    }
    const [row] = await db
      .update(duels)
      .set({
        targetScore: Math.max(0, Math.round(Number(body.score ?? 0))),
        targetCorrect: Math.max(0, Math.round(Number(body.correct ?? 0))),
        status: "answered",
        answeredAt: new Date(),
      })
      .where(and(eq(duels.id, id)))
      .returning({ id: duels.id, status: duels.status });
    return NextResponse.json({ ok: true, duel: row });
  } catch {
    return NextResponse.json({ error: "база данных недоступна", offline: true }, { status: 503 });
  }
}
