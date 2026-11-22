import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { students } from "@/db/schema";

export const CLASS_LIST = [
  "Мерчук Саша",
  "Пашкевич Алексей",
  "Пашкевич Настя",
  "Пытлюк Вика",
  "Селиванова Дарья",
  "Смолич Дарья",
  "Солышко Наташа",
  "Томчук Мария",
  "Федечко Кира",
  "Филипюк Юля",
  "Чечун Ольга",
  "Шуенков Максим",
  "Шульпина Милана",
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

/** Идемпотентный посев списка класса (сам создаёт таблицы, если их нет). */
export async function ensureStudents(): Promise<void> {
  await ensureSchema();
  await db
    .insert(students)
    .values(
      CLASS_LIST.map((name, i) => ({
        name,
        slot: i,
        accent: ACCENTS[i % ACCENTS.length],
      })),
    )
    .onConflictDoNothing({ target: students.name });
}

export async function listStudents(): Promise<StudentRow[]> {
  await ensureStudents();
  return db.select().from(students).orderBy(students.slot);
}

export { initials } from "./initials";
