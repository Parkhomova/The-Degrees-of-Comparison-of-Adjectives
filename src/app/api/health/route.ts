import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Healthcheck для хостинга: всегда 200, чтобы кратковременная недоступность
 * базы не перезапускала сервис. Фактическое состояние базы — в поле `db`.
 */
export async function GET() {
  let ok = false;
  try {
    await db.execute(sql`select 1`);
    ok = true;
  } catch {
    ok = false;
  }
  return Response.json({ ok: true, db: ok, ts: Date.now() });
}
