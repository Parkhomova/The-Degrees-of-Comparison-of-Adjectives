import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type RoundScore = {
  key: string;
  label: string;
  score: number;
  correct: number;
  total: number;
  ms: number;
};

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slot: integer("slot").notNull().default(0),
  accent: text("accent").notNull().default("#c8ff4d"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(0),
  correct: integer("correct").notNull().default(0),
  total: integer("total").notNull().default(0),
  timeMs: integer("time_ms").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  rounds: jsonb("rounds").$type<RoundScore[]>().notNull().default([]),
  finished: integer("finished").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DuelStatus = "pending" | "answered";

export const duels = pgTable("duels", {
  id: serial("id").primaryKey(),
  challengerId: integer("challenger_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  targetId: integer("target_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  seed: integer("seed").notNull().default(1),
  challengerScore: integer("challenger_score").notNull().default(0),
  challengerCorrect: integer("challenger_correct").notNull().default(0),
  targetScore: integer("target_score"),
  targetCorrect: integer("target_correct"),
  status: text("status").$type<DuelStatus>().notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
});
