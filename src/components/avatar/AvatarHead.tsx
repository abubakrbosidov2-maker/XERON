"use client";
import { Avatar } from "./Avatar";
import type { AvatarPayload } from "@/lib/leaderboard-meta";

/** Qahramonning bosh va yelkasi: ro'yxatlar uchun kichik doira. */
export function AvatarHead({ avatar, size = 44 }: { avatar: AvatarPayload; size?: number }) {
  const w = size * 1.15;
  return (
    <div className="shrink-0 overflow-hidden rounded-full border border-white/10 bg-gradient-to-b from-navy-700 to-navy-900" style={{ width: size, height: size }}>
      <div style={{ marginLeft: -(w - size) / 2, marginTop: size * 0.04 }}>
        <Avatar appearance={avatar.appearance} equipped={avatar.equipped} size={w} pose="idle" />
      </div>
    </div>
  );
}