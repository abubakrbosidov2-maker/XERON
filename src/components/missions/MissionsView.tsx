"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORY_META, TYPE_LABELS, TYPE_ORDER, type MissionCard } from "@/lib/mission-meta";
import { CategoryIcon, Deadline, DifficultyBadge, RewardChips, StatusChip } from "./MissionBits";

const SELECT = "rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-volt";

export function MissionsView({ cards }: { cards: MissionCard[] }) {
  const [type, setType] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const done = cards.filter((c) => c.state.status === "COMPLETED").length;

  const list = useMemo(
    () =>
      cards.filter((c) => {
        if (type !== "ALL" && c.mission.type !== type) return false;
        if (category !== "ALL" && c.mission.category !== category) return false;
        if (status === "OPEN" && (c.state.status === "COMPLETED" || c.state.status === "REJECTED" || !!c.state.lock)) return false;
        if (status === "ACTIVE" && c.state.status !== "ACCEPTED") return false;
        if (status === "DONE" && c.state.status !== "COMPLETED") return false;
        return true;
      }),
    [cards, type, category, status],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Missiyalar</h1>
          <p className="text-sm text-white/50">Xavfsiz, real hayotdagi topshiriqlar. Bajarilgan: {done} / {cards.length}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Kategoriya" value={category} onChange={(e) => setCategory(e.target.value)} className={SELECT}>
            <option value="ALL">Barcha yo'nalishlar</option>
            {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select aria-label="Holat" value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT}>
            <option value="ALL">Barcha holatlar</option>
            <option value="OPEN">Mavjud</option>
            <option value="ACTIVE">Jarayonda</option>
            <option value="DONE">Bajarilgan</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", ...TYPE_ORDER].map((t) => (
          <button key={t} type="button" onClick={() => setType(t)} className={`rounded-lg border px-3 py-1.5 text-sm transition ${type === t ? "border-volt bg-volt/20 text-white" : "border-white/10 bg-white/5 text-white/60 hover:text-white"}`}>
            {t === "ALL" ? "Hammasi" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="glass p-10 text-center text-white/50">Filtrga mos missiya topilmadi.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map(({ mission: m, state }) => {
            const color = CATEGORY_META[m.category]?.color ?? "#6db3ff";
            const finished = state.status === "COMPLETED";
            return (
              <Link key={m.id} href={`/missions/${m.slug}`} className={`glass group flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-neon ${finished ? "opacity-70" : ""}`} style={{ borderColor: color + "44" }}>
                <div className="flex items-start gap-3">
                  <CategoryIcon category={m.category} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold group-hover:text-white">{m.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/45">
                      <span>{TYPE_LABELS[m.type]}</span><span>·</span><span>{CATEGORY_META[m.category]?.label}</span>
                    </div>
                  </div>
                  <DifficultyBadge difficulty={m.difficulty} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-white/55">{m.description}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <RewardChips xp={m.xp} coins={m.coins} gems={m.gems} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/45">
                  <Deadline iso={m.deadline} />
                  <StatusChip state={state} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}