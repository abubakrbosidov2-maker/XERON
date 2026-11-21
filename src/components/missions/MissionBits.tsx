"use client";
import { useEffect, useState } from "react";
import { BookOpen, Brain, Check, Clock, Coins, Cpu, Gem, HeartHandshake, HeartPulse, Leaf, Lock, Palette, Sparkles, Users, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CATEGORY_META, DIFFICULTY_META, type MissionState } from "@/lib/mission-meta";

const ICONS: Record<string, LucideIcon> = {
  KNOWLEDGE: BookOpen, INTELLIGENCE: Brain, CREATIVITY: Palette, TECHNOLOGY: Cpu,
  WELLNESS: HeartPulse, NATURE: Leaf, TEAMWORK: Users, SOCIAL: HeartHandshake,
};

export function CategoryIcon({ category, size = 22 }: { category: string; size?: number }) {
  const Icon = ICONS[category] ?? Sparkles;
  const color = CATEGORY_META[category]?.color ?? "#6db3ff";
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-xl p-2.5" style={{ background: color + "22", color }}>
      <Icon size={size} />
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const d = DIFFICULTY_META[difficulty] ?? DIFFICULTY_META.EASY;
  return <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium" style={{ borderColor: d.color + "88", color: d.color }}>{d.label}</span>;
}

export function RewardChips({ xp, coins, gems }: { xp: number; coins: number; gems: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-1 rounded-full bg-volt/15 px-2.5 py-1 text-volt-glow"><Sparkles size={12} /> {xp} XP</span>
      {coins > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-1 text-amber-200"><Coins size={12} /> {coins}</span>}
      {gems > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-400/10 px-2.5 py-1 text-fuchsia-200"><Gem size={12} /> {gems}</span>}
    </div>
  );
}

export function Deadline({ iso }: { iso: string | null }) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!iso) { setText("Muddatsiz"); return; }
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) { setText("Muddati tugagan"); return; }
    const h = Math.floor(ms / 3_600_000);
    setText(h >= 48 ? `${Math.floor(h / 24)} kun qoldi` : h >= 1 ? `${h} soat qoldi` : `${Math.max(1, Math.floor(ms / 60_000))} daqiqa qoldi`);
  }, [iso]);
  return <span className="inline-flex items-center gap-1"><Clock size={12} /> {text}</span>;
}

export function StatusChip({ state }: { state: MissionState }) {
  if (state.status === "COMPLETED") return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs text-emerald-300"><Check size={12} /> Bajarilgan</span>;
  if (state.status === "REJECTED") return <span className="inline-flex items-center gap-1 rounded-full bg-rose-400/15 px-2.5 py-1 text-xs text-rose-300"><XCircle size={12} /> Muvaffaqiyatsiz</span>;
  if (state.lock) return <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/55"><Lock size={12} /> {state.lock}</span>;
  if (state.status === "ACCEPTED") return <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs text-amber-200">Jarayonda</span>;
  return <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60">Mavjud</span>;
}