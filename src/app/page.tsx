import { loadBoard } from "@/lib/board";
import Home from "@/components/Home";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { mates, duels, totalRuns, offline } = await loadBoard(20);
  const ranked = [...mates].sort((a, b) => a.rank - b.rank);
  return <Home mates={ranked} duels={duels} totalRuns={totalRuns} offline={offline} />;
}
