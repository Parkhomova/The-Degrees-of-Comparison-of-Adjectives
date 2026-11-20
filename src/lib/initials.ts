/** Чистые утилиты без доступа к БД — безопасны для клиентских компонентов. */

export function initials(name: string): string {
  const parts = name.split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export function firstName(name: string): string {
  return name.split(/\s+/)[1] ?? name.split(/\s+/)[0] ?? name;
}
