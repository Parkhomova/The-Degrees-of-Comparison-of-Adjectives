import { NextResponse } from "next/server";
import { loadBoard } from "@/lib/board";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  try {
    const { mates, duels, totalRuns, offline } = await loadBoard(40);
    const board = [...mates].sort((a, b) => a.rank - b.rank);
    const myDuels = studentId
      ? duels.filter(
          (d) => d.challenger.id === Number(studentId) || d.target.id === Number(studentId),
        )
      : [];
    return NextResponse.json({ board, duels, myDuels, history: [], totalRuns, offline });
  } catch {
    return NextResponse.json(
      { board: [], duels: [], myDuels: [], history: [], totalRuns: 0, offline: true },
      { status: 200 },
    );
  }
}
