import Link from "next/link";
import { getClassData, getHistory, isDbUp } from "@/lib/board";
import LessonShell from "@/components/LessonShell";
import { fallbackClass } from "@/lib/board";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string }>;
}) {
  const { sid } = await searchParams;
  const [mates, online] = await Promise.all([getClassData(), isDbUp()]);
  const id = Number(sid);
  const list = mates.length ? mates : fallbackClass();
  const me = list.find((m) => m.id === id);

  if (!me) {
    return (
      <main className="relative z-10 grid min-h-screen place-items-center px-6">
        <div className="panel max-w-md rounded-3xl p-8 text-center">
          <div className="display text-4xl text-acid">КТО ТЫ?</div>
          <p className="mt-3 text-sm text-muted">
            Урок выполняется от имени конкретного ученика — сначала выбери себя из списка класса,
            тогда результат попадёт в общий рейтинг.
          </p>
          <Link href="/" className="btn mt-5 inline-block bg-acid px-6 py-3 text-sm text-ink">
            ← ВЫБРАТЬ УЧЕНИКА
          </Link>
        </div>
      </main>
    );
  }

  const history = online ? await getHistory(me.id) : [];
  const seed = 1000 + Math.floor(Math.random() * 900000);

  return <LessonShell me={me} mates={list} history={history} seed={seed} offline={!online} />;
}
