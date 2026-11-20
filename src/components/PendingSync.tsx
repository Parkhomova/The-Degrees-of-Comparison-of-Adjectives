"use client";

import { useEffect, useState } from "react";
import { flushPending, readPending } from "@/lib/localStore";
import { sfx } from "@/lib/sound";

/**
 * Показывает баннер, если результаты урока сохранены локально и ждут отправки,
 * и сам дозванивается на сервер каждые 30 секунд.
 */
export default function PendingSync({ onSynced }: { onSynced?: () => void }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(readPending().length);
    const run = async () => {
      const before = readPending().length;
      if (!before) {
        setCount(0);
        return;
      }
      const { sent, left } = await flushPending();
      setCount(left);
      if (sent > 0) {
        sfx.coin();
        onSynced?.();
      }
    };
    void run();
    const iv = window.setInterval(run, 30000);
    return () => window.clearInterval(iv);
  }, [onSynced]);

  if (count <= 0) return null;

  return (
    <div className="animate-rise mb-4 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3">
      <span className="text-lg">💾</span>
      <p className="text-[13px] leading-relaxed text-chalk/85">
        <b className="text-gold">Сохранено на этом устройстве: {count}</b> — сервер сейчас не
        отвечает, поэтому результат урока лежит в браузере. Страница сама отправит его в общий
        рейтинг, как только соединение появится (проверка каждые 30 секунд). Не очищай данные
        сайта, пока значок не исчез.
      </p>
    </div>
  );
}
