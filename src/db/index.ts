import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * DATABASE_URL может отсутствовать на этапе сборки образа
 * (Docker-сборка на хостингах не получает переменные окружения).
 * В этом случае создаём пул с локальной заглушкой: запросы будут
 * завершаться ошибкой, но приложение поднимется и отработает в
 * автономном режиме (fallback в src/lib/board.ts).
 * В рантайме переменная подставляется и база подключается как обычно.
 */
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({ connectionString: databaseUrl });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

/** Доступна ли база данных в данный момент. */
export function hasDatabaseConfig(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
