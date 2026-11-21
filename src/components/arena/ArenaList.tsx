"use client";
import Link from "next/link";
import { useState } from "react";
import { Coins, Sparkles, Users } from "lucide-react";
import { ARENA_TYPE_META, type CompetitionCard } from "@/lib/arena-meta";
import { Countdown, StatusPill, TimeChip, TypeIcon } from "./ArenaBits";

const ME_LABEL: Record<string, string> = { REGISTERED: "Ro'yxatdan o'tgansiz", PLAYING: "O'yin davom etmoqda", FINISHED: "Qatnashgansiz" };

export function ArenaList({ cards }: { cards: CompetitionCard[] }) {
  const [type, setType] = useState("ALL");
  const list = cards.filter((c) => type === "ALL" || c.type === type);
  const live = cards.filter((c) => c.status === "LIVE").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Arena</h1>
        <p className="text-sm text-white/50">Bilim va mantiq bellashuvlari. Ballar faqat serverda hisoblanadi, shuning uchun hamma uchun adolatli. Hozir jonli: {live}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", ...Object.keys(ARENA_TYPE_META)].map((t) => (
          <button key={t} type="button" onClick={() => setType(t)} className={`rounded-lg border px-3 py-1.5 text-sm transition ${type === t ? "border-volt bg-volt/20 text-white" : "border-white/10 bg-white/5 text-white/60 hover:text-white"}`}>
            {t === "ALL" ? "Hammasi" : ARENA_TYPE_META[t].label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="glass p-10 text-center text-white/50">Bu turda musobaqa yo'q.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((c) => {
            const color = ARENA_TYPE_META[c.type]?.color ?? "#6db3ff";
            return (
              <Link key={c.id} href={`/arena/${c.slug}`} className="glass group flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-neon" style={{ borderColor: color + "44" }}>
                <div className="flex items-start gap-3">
                  <TypeIcon type={c.type} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold">{c.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/45">
                      <span>{ARENA_TYPE_META[c.type]?.label}</span>
                      {c.season && <><span>·</span><span className="text-sky-300">{c.season}</span></>}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-white/55">{c.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-volt/15 px-2.5 py-1 text-volt-glow"><Sparkles size={12} /> {c.xpReward} XP gacha</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-1 text-amber-200"><Coins size={12} /> {c.coinReward} gacha</span>
                  <span className="inline-flex items-center gap-1 text-white/45"><Users size={12} /> {c.participants}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/50">
                  <span className="flex items-center gap-3">
                    <TimeChip seconds={c.durationSec} />
                    <span>{c.questionCount} savol</span>
                  </span>
                  <span>
                    {c.status === "UPCOMING" && <>Boshlanishiga: <b className="text-white/80"><Countdown to={c.startsAt} /></b></>}
                    {c.status === "LIVE" && <>Tugashiga: <b className="text-white/80"><Countdown to={c.endsAt} /></b></>}
                    {c.status === "FINISHED" && "Yakunlangan"}
                  </span>
                </div>
                {c.me !== "NONE" && <div className="mt-3 text-xs text-emerald-300">{ME_LABEL[c.me]}</div>}
                {c.locked && c.me === "NONE" && <div className="mt-3 text-xs text-white/45">Qulflangan: {c.locked}</div>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}