import type { RoundScore } from "@/db/schema";

/** Общие типы витрины — без импортов БД, чтобы их могли использовать клиентские компоненты. */

export type Classmate = {
  id: number;
  name: string;
  accent: string;
  slot: number;
  best: number;
  bestBlitz: number;
  bestAccuracy: number;
  bestStreak: number;
  runs: number;
  totalTimeMs: number;
  lastActive: string | null;
  duelsWon: number;
  duelsLost: number;
  pendingIn: number;
  rank: number;
};

export type DuelView = {
  id: number;
  seed: number;
  status: "pending" | "answered";
  challengerScore: number;
  challengerCorrect: number;
  targetScore: number | null;
  targetCorrect: number | null;
  createdAt: string;
  answeredAt: string | null;
  challenger: { id: number; name: string; accent: string };
  target: { id: number; name: string; accent: string };
};

export type RunView = {
  id: number;
  score: number;
  correct: number;
  total: number;
  timeMs: number;
  finished: number;
  rounds: RoundScore[];
  createdAt: string;
};

/** Призрачный ориентир соперника для гонки в дуэли. */
export function ghostTarget(mate?: { bestBlitz: number; id: number } | null): number {
  if (mate && mate.bestBlitz > 0) return mate.bestBlitz;
  return 420 + ((mate?.id ?? 1) * 97) % 560;
}
