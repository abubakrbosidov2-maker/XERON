"use client";
import { useEffect, useState } from "react";
import { Brain, Calculator, Clock, Crown, Palette, Puzzle, Swords, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ARENA_TYPE_META, type ArenaStatus } from "@/lib/arena-meta";

const ICONS: Record<string, LucideIcon> = {
  KNOWLEDGE: Brain, LOGIC: Puzzle, MATH: Calculator, CREATIVE: Palette, TEAM: Users, CHAMPIONSHIP: Crown,
};

const pad = (n: number) => String(n).padStart(2, "0");

export function TypeIcon({ type, size = 22 }: { type: string; size?: number }) {
  const Icon = ICONS[type] ?? Swords;
  const color = ARENA_TYPE_META[type]?.color ?? "#6db3ff";
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-xl p-2.5" style={{ background: color + "22", color }}>
      <Icon size={size} />
    </span>
  );
}

export function Countdown({ to }: { to: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, new Date(to).getTime() - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [to]);
  if (left === null) return <span>--:--:--</span>;
  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400);
  return <span>{d > 0 ? `${d} kun ` : ""}{pad(Math.floor((s % 86400) / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}</span>;
}

export function StatusPill({ status }: { status: ArenaStatus }) {
  const map: Record<ArenaStatus, { label: string; cls: string }> = {
    LIVE: { label: "Jonli", cls: "bg-emerald-400/15 text-emerald-300" },
    UPCOMING: { label: "Tez orada", cls: "bg-sky-400/15 text-sky-300" },
    FINISHED: { label: "Tugagan", cls: "bg-white/10 text-white/50" },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${m.cls}`}>
      {status === "LIVE" && <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-emerald-300" />}
      {m.label}
    </span>
  );
}

export function TimeChip({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds / 60);
  return <span className="inline-flex items-center gap-1"><Clock size={12} /> {m > 0 ? `${m} daqiqa` : `${seconds} soniya`}</span>;
}

export const formatDuration = (s: number | null) => (s === null ? "-" : `${Math.floor(s / 60)}:${pad(s % 60)}`);