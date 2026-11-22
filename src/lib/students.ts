import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { students } from "@/db/schema";

/** Список класса. Правится здесь — база синхронизируется сама при первом запросе. */
export const CLASS_LIST = [
  "Степанюк Илья",
  "Каминская Юлия",
  "Савчук София",
  "Петрочук Мария",
  "Сметюх Тимофей",
  "Миник Николя",
  "Щука Максим",
  "Миронюк Артём",
  "Будник Дарина",
  "Микитюк Мария",
] as const;

export const ACCENTS = [
  "#c8ff4d",
  "#4be3ff",
  "#ff7a3c",
  "#ff4d8d",
  "#ffd23f",
  "#7cf5c0",
  "#b28bff",
  "#ff5a5a",
  "#5ad2ff",
  "#e8ff5a",
  "#ff9ecd",
  "#63e6a8",
  "#ffb35c",
];

export type StudentRow = typeof students.$inferSelect;

/**
 * Синхронизация списка класса с базой:
 * — убирает учеников, которых больше нет в CLASS_LIST (вместе с их попытками и дуэлями);
 * — добавляет новых;
 * — выравнивает порядок (slot) и цвета аватаров.
 */
export async function ensureStudents(): Promise<void> {
  await ensureSchema();
  const wanted = CLASS_LIST.map((name, i) => ({
    name,
    slot: i,
    accent: ACCENTS[i % ACCENTS.length],
  }));
  const wantedNames = new Set<string>(wanted.map((w) => w.name));

  const existing = await db.select().from(students);
  const stale = existing.filter((s) => !wantedNames.has(s.name));
  if (stale.length > 0) {
    await db.delete(students).where(inArray(students.id, stale.map((s) => s.id)));
  }

  const existingNames = new Set(existing.map((s) => s.name));
  const missing = wanted.filter((w) => !existingNames.has(w.name));
  if (missing.length > 0) {
    await db.insert(students).values(missing).onConflictDoNothing();
  }

  const byName = new Map(existing.map((s) => [s.name, s]));
  for (const w of wanted) {
    const cur = byName.get(w.name);
    if (cur && (cur.slot !== w.slot || cur.accent !== w.accent)) {
      await db
        .update(students)
        .set({ slot: w.slot, accent: w.accent })
        .where(eq(students.id, cur.id));
    }
  }
}

export async function listStudents(): Promise<StudentRow[]> {
  await ensureStudents();
  return db.select().from(students).orderBy(students.slot);
}

export { initials } from "./initials";
