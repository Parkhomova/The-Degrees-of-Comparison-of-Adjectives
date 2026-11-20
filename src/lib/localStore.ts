"use client";

/** Очередь результатов в localStorage: если сервер/БД недоступны, работа не теряется. */

export type PendingRun = {
  at: number;
  payload: Record<string, unknown>;
};

const KEY = "cmp_pending_runs";

export function readPending(): PendingRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingRun[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writePending(list: PendingRun[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-50)));
  } catch {
    /* приватный режим — просто пропускаем */
  }
}

export function pushPending(payload: Record<string, unknown>): PendingRun[] {
  const list = [...readPending(), { at: Date.now(), payload }];
  writePending(list);
  return list;
}

export async function flushPending(): Promise<{ sent: number; left: number }> {
  const list = readPending();
  if (!list.length) return { sent: 0, left: 0 };
  const left: PendingRun[] = [];
  let sent = 0;
  for (const run of list) {
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(run.payload),
      });
      if (res.ok) sent += 1;
      else left.push(run);
    } catch {
      left.push(run);
    }
  }
  writePending(left);
  return { sent, left: left.length };
}
