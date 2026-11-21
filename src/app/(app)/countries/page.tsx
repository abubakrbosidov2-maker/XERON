import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCountryBoard } from "@/lib/services/leaderboard";
import { PERIODS, PERIOD_LABELS, type Period } from "@/lib/leaderboard-meta";
import { countryName } from "@/lib/countries";

export const dynamic = "force-dynamic";

const MEDAL: Record<number, string> = { 1: "#f59e0b", 2: "#cbd5e1", 3: "#d97706" };

export default async function CountriesPage({ searchParams }: { searchParams: { period?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const period: Period = (PERIODS as readonly string[]).includes(searchParams.period ?? "") ? (searchParams.period as Period) : "WEEKLY";
  const rows = await getCountryBoard(user.id, period);
  const leader = rows[0];
  const mine = rows.find((r) => r.isMine);
  const max = leader?.totalXp ?? 1;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Davlatlar jangi</h1>
        <p className="text-sm text-white/50">Davlat ballari shu davlat o'yinchilarining XP yig'indisidan iborat. Faqat davlatini yashirmagan ochiq profillar hisoblanadi.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link key={p} href={`/countries?period=${p}`} className={`rounded-lg border px-3 py-1.5 text-sm transition ${period === p ? "border-volt bg-volt/20 text-white" : "border-white/10 bg-white/5 text-white/60 hover:text-white"}`}>{PERIOD_LABELS[p]}</Link>
        ))}
      </div>

      {leader && (
        <div className="glass flex flex-wrap items-center justify-between gap-4 p-5 shadow-neon">
          <div className="flex items-center gap-3">
            <Flame className="text-amber-300" />
            <div>
              <div className="text-xs text-white/45">{PERIOD_LABELS[period]} yetakchi</div>
              <div className="font-display text-xl font-bold">{countryName(leader.code)}</div>
            </div>
          </div>
          <div className="text-right text-sm text-white/60">
            {mine ? <>Sizning davlatingiz: <b className="text-white">{mine.rank}-o'rin</b></> : "Sizning davlatingiz hali reytingda yo'q"}
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="glass p-10 text-center text-white/50">Bu davr uchun natijalar yo'q.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Link key={r.code} href={`/leaderboard?scope=COUNTRY&period=${period}&country=${r.code}`} className={`glass block p-4 transition hover:-translate-y-0.5 hover:shadow-neon ${r.isMine ? "border-volt/50" : ""}`}>
              <div className="flex items-center gap-4">
                <div className="w-8 text-center font-display text-xl font-black" style={{ color: MEDAL[r.rank] ?? "#ffffff66" }}>{r.rank}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{countryName(r.code)}</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">{r.code}</span>
                    {r.isMine && <span className="text-xs text-volt-glow">(sizniki)</span>}
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-volt to-arcane" style={{ width: `${Math.max(3, (r.totalXp / max) * 100)}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
                    <span className="inline-flex items-center gap-1"><Users size={12} /> {r.players} o'yinchi</span>
                    <span>O'rtacha daraja: {r.avgLevel}</span>
                    {r.topPlayer && <span>Eng yaxshi: {r.topPlayer}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold">{r.totalXp.toLocaleString("en-US")}</div>
                  <div className="text-xs text-white/40">XP</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}