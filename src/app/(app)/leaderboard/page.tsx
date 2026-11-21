import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe, Shield, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getPlayerBoard, getTeamBoard } from "@/lib/services/leaderboard";
import { PERIODS, PERIOD_LABELS, SCOPES, SCOPE_LABELS, type Period, type Scope } from "@/lib/leaderboard-meta";
import { countryName } from "@/lib/countries";
import { Podium } from "@/components/leaderboard/Podium";
import { PlayerTable } from "@/components/leaderboard/PlayerTable";

export const dynamic = "force-dynamic";

const tab = (active: boolean) =>
  `rounded-lg border px-3 py-1.5 text-sm transition ${active ? "border-volt bg-volt/20 text-white" : "border-white/10 bg-white/5 text-white/60 hover:text-white"}`;

export default async function LeaderboardPage({ searchParams }: { searchParams: { scope?: string; period?: string; country?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const scope: Scope = (SCOPES as readonly string[]).includes(searchParams.scope ?? "") ? (searchParams.scope as Scope) : "GLOBAL";
  const period: Period = (PERIODS as readonly string[]).includes(searchParams.period ?? "") ? (searchParams.period as Period) : "ALL";
  const countryParam = /^[A-Za-z]{2}$/.test(searchParams.country ?? "") ? (searchParams.country as string).toUpperCase() : undefined;

  const href = (s: Scope, p: Period) => `/leaderboard?scope=${s}&period=${p}${s === "COUNTRY" && countryParam ? `&country=${countryParam}` : ""}`;
  const unit = period === "ALL" ? "XP" : period === "WEEKLY" ? "XP/hafta" : "XP/oy";

  const header = (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Global reyting</h1>
          <p className="text-sm text-white/50">Faqat ochiq profillar ko'rinadi. Aniq joylashuv ko'rsatilmaydi, faqat davlat.</p>
        </div>
        <Link href="/countries" className="btn-ghost !py-2 text-sm"><Globe size={16} /> Davlatlar jangi</Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {SCOPES.map((s) => <Link key={s} href={href(s, period)} className={tab(scope === s)}>{SCOPE_LABELS[s]}</Link>)}
      </div>
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => <Link key={p} href={href(scope, p)} className={tab(period === p)}>{PERIOD_LABELS[p]}</Link>)}
      </div>
    </>
  );

  if (scope === "TEAMS") {
    const teams = await getTeamBoard(user.id, period);
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        {header}
        {teams.length === 0 ? (
          <p className="glass p-10 text-center text-white/50">Bu davr uchun jamoa natijalari yo'q.</p>
        ) : (
          <div className="glass overflow-x-auto">
            <table className="w-full min-w-[360px] text-sm">
              <thead className="text-left text-xs text-white/40"><tr><th className="py-3 pl-3">#</th><th className="py-3">Jamoa</th><th className="hidden py-3 sm:table-cell">Sardor</th><th className="py-3 text-center">A'zolar</th><th className="py-3 pr-3 text-right">Ball</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {teams.map((t) => (
                  <tr key={t.name} className={t.isMine ? "bg-volt/10" : ""}>
                    <td className="py-3 pl-3 font-display font-bold" style={{ color: ({ 1: "#f59e0b", 2: "#cbd5e1", 3: "#d97706" } as Record<number, string>)[t.rank] }}>{t.rank}</td>
                    <td className="py-3"><span className="inline-flex items-center gap-2 font-medium"><Shield size={15} className="text-volt-glow" />{t.name}<span className="text-xs text-white/40">[{t.tag}]</span>{t.isMine && <span className="text-xs text-volt-glow">(sizning jamoangiz)</span>}</span></td>
                    <td className="hidden py-3 text-white/55 sm:table-cell">{t.owner}</td>
                    <td className="py-3 text-center"><span className="inline-flex items-center gap-1"><Users size={13} />{t.members}</span></td>
                    <td className="py-3 pr-3 text-right font-semibold">{t.score.toLocaleString("en-US")}<span className="ml-1 text-xs font-normal text-white/35">{unit}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  const board = await getPlayerBoard(user.id, scope, period, countryParam);
  const top3 = board.entries.slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {header}

      {scope === "COUNTRY" && board.countryCode && (
        <p className="text-sm text-white/60">Davlat: <b className="text-white">{countryName(board.countryCode)}</b> · {board.total} o'yinchi · <Link href="/countries" className="text-volt-glow hover:underline">boshqa davlat tanlash</Link></p>
      )}
      {scope !== "COUNTRY" && <p className="text-sm text-white/45">Jami o'yinchilar: {board.total}</p>}
      {board.meHidden && <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-100">Profilingiz yopiq, shuning uchun umumiy reytingda ko'rinmaysiz.</p>}

      {board.entries.length === 0 ? (
        <p className="glass p-10 text-center text-white/50">
          {scope === "FRIENDS" ? "Hozircha do'stlaringiz yo'q. Do'stlar bo'limi keyingi bosqichda ochiladi." : "Bu bo'limda hozircha natija yo'q."}
        </p>
      ) : (
        <>
          <Podium entries={top3} unit={unit} />
          <PlayerTable entries={board.entries} me={board.me} unit={unit} />
        </>
      )}
    </div>
  );
}