import { Trophy } from "lucide-react";
import { AvatarHead } from "@/components/avatar/AvatarHead";
import { countryName } from "@/lib/countries";
import type { PlayerEntry } from "@/lib/leaderboard-meta";

const MEDAL: Record<number, string> = { 1: "#f59e0b", 2: "#cbd5e1", 3: "#d97706" };

function Row({ e, unit }: { e: PlayerEntry; unit: string }) {
  return (
    <tr className={e.isMe ? "bg-volt/10" : ""}>
      <td className="py-2.5 pl-3 pr-2 font-display font-bold" style={{ color: MEDAL[e.rank] }}>{e.rank}</td>
      <td className="py-2.5">
        <div className="flex items-center gap-3">
          <AvatarHead avatar={e.avatar} size={42} />
          <div className="min-w-0">
            <div className="truncate font-medium">
              {e.username}
              {e.team && <span className="ml-1.5 text-xs text-white/40">[{e.team}]</span>}
              {e.isMe && <span className="ml-1.5 text-xs text-volt-glow">(siz)</span>}
            </div>
            {e.title && <div className="text-xs text-amber-200/80">{e.title}</div>}
          </div>
        </div>
      </td>
      <td className="hidden py-2.5 text-sm text-white/55 sm:table-cell">{e.country ? countryName(e.country) : "-"}</td>
      <td className="py-2.5 text-center">{e.level}</td>
      <td className="hidden py-2.5 text-center text-sm text-white/55 sm:table-cell"><span className="inline-flex items-center gap-1"><Trophy size={13} className="text-amber-300" />{e.achievements}</span></td>
      <td className="py-2.5 pr-3 text-right font-semibold">{e.value.toLocaleString("en-US")}<span className="ml-1 text-xs font-normal text-white/35">{unit}</span></td>
    </tr>
  );
}

export function PlayerTable({ entries, me, unit }: { entries: PlayerEntry[]; me: PlayerEntry | null; unit: string }) {
  const meInList = me ? entries.some((e) => e.isMe) : true;
  return (
    <div className="glass overflow-x-auto">
      <table className="w-full min-w-[360px] text-sm">
        <thead className="text-left text-xs text-white/40">
          <tr>
            <th className="py-3 pl-3 pr-2">#</th>
            <th className="py-3">O'yinchi</th>
            <th className="hidden py-3 sm:table-cell">Davlat</th>
            <th className="py-3 text-center">Daraja</th>
            <th className="hidden py-3 text-center sm:table-cell">Yutuqlar</th>
            <th className="py-3 pr-3 text-right">Ball</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {entries.map((e) => <Row key={e.username} e={e} unit={unit} />)}
          {!meInList && me && (
            <>
              <tr><td colSpan={6} className="py-1 text-center text-white/25">...</td></tr>
              <Row e={me} unit={unit} />
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}