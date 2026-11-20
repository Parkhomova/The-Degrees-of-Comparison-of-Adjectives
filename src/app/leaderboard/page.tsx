import { loadBoard } from "@/lib/board";
import Board from "@/components/Board";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string }>;
}) {
  const { sid } = await searchParams;
  const { mates, duels, totalRuns, offline } = await loadBoard(40);
  const ranked = [...mates].sort((a, b) => a.rank - b.rank);
  return (
    <Board
      initial={{ board: ranked, duels, totalRuns, offline }}
      highlight={sid ? Number(sid) : undefined}
    />
  );
}
