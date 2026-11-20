import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Идемпотентное создание таблиц при старте.
 * Благодаря этому деплой на любой хостинг не требует `drizzle-kit push`:
 * достаточно задать DATABASE_URL.
 */
let done = false;

export async function ensureSchema(): Promise<void> {
  if (done) return;
  try {
    await db.execute(sql`
      create table if not exists students (
        id serial primary key,
        name text not null unique,
        slot integer not null default 0,
        accent text not null default '#c8ff4d',
        created_at timestamptz not null default now()
      )
    `);
    await db.execute(sql`
      create table if not exists attempts (
        id serial primary key,
        student_id integer not null references students(id) on delete cascade,
        score integer not null default 0,
        correct integer not null default 0,
        total integer not null default 0,
        time_ms integer not null default 0,
        best_streak integer not null default 0,
        rounds jsonb not null default '[]'::jsonb,
        finished integer not null default 0,
        created_at timestamptz not null default now()
      )
    `);
    await db.execute(sql`
      create table if not exists duels (
        id serial primary key,
        challenger_id integer not null references students(id) on delete cascade,
        target_id integer not null references students(id) on delete cascade,
        seed integer not null default 1,
        challenger_score integer not null default 0,
        challenger_correct integer not null default 0,
        target_score integer,
        target_correct integer,
        status text not null default 'pending',
        created_at timestamptz not null default now(),
        answered_at timestamptz
      )
    `);
    done = true;
  } catch {
    done = false;
  }
}
