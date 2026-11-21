"use client";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { Avatar } from "@/components/avatar/Avatar";
import type { PlayerEntry } from "@/lib/leaderboard-meta";

const CFG: Record<number, { h: number; color: string }> = {
  1: { h: 150, color: "#f59e0b" },
  2: { h: 112, color: "#cbd5e1" },
  3: { h: 84, color: "#d97706" },
};

function Column({ e, delay, unit }: { e: PlayerEntry; delay: number; unit: string }) {
  const cfg = CFG[e.rank];
  return (
    <div className="flex w-[92px] flex-col items-center sm:w-36">
      <motion.div className="relative" initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: delay + 0.5 }}>
        {e.rank === 1 && <Crown size={26} className="absolute -top-5 left-1/2 -translate-x-1/2 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,.9)]" />}
        <div className="h-[116px] w-[92px] overflow-hidden sm:h-[132px] sm:w-[104px]">
          <Avatar appearance={e.avatar.appearance} equipped={e.avatar.equipped} size={92} pose={e.rank === 1 ? "hero" : "idle"} className="mx-auto sm:scale-110" />
        </div>
      </motion.div>
      <div className="mt-2 w-full truncate text-center text-sm font-semibold">{e.username}{e.isMe && <span className="text-volt-glow"> (siz)</span>}</div>
      <div className="text-center text-xs" style={{ color: cfg.color }}>{e.value.toLocaleString("en-US")} {unit}</div>
      <motion.div
        className="mt-2 flex w-full items-start justify-center rounded-t-xl pt-2 font-display text-3xl font-black text-white/90"
        style={{ background: `linear-gradient(180deg, ${cfg.color}cc, ${cfg.color}22)`, boxShadow: `0 0 28px ${cfg.color}44` }}
        initial={{ height: 0 }}
        animate={{ height: cfg.h }}
        transition={{ duration: 0.8, delay }}
      >
        {e.rank}
      </motion.div>
    </div>
  );
}

export function Podium({ entries, unit }: { entries: PlayerEntry[]; unit: string }) {
  const [first, second, third] = entries;
  return (
    <div className="glass overflow-hidden px-3 pb-0 pt-10 sm:px-8">
      <div className="flex items-end justify-center gap-2 sm:gap-6">
        {second ? <Column e={second} delay={0.25} unit={unit} /> : <div className="w-[92px] sm:w-36" />}
        {first ? <Column e={first} delay={0} unit={unit} /> : null}
        {third ? <Column e={third} delay={0.45} unit={unit} /> : <div className="w-[92px] sm:w-36" />}
      </div>
    </div>
  );
}