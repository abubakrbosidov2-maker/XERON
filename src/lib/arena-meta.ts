// Mijoz va server uchun umumiy turlar va yorliqlar (Prisma importisiz).
export const ARENA_TYPE_META: Record<string, { label: string; color: string }> = {
  KNOWLEDGE: { label: "Bilimlar jangi", color: "#60a5fa" },
  LOGIC: { label: "Mantiq", color: "#a78bfa" },
  MATH: { label: "Matematika", color: "#22d3ee" },
  CREATIVE: { label: "Ijodiy", color: "#f472b6" },
  TEAM: { label: "Jamoaviy", color: "#fbbf24" },
  CHAMPIONSHIP: { label: "Chempionat", color: "#f43f5e" },
};

export type ArenaStatus = "UPCOMING" | "LIVE" | "FINISHED";
export type MyArenaStatus = "NONE" | "REGISTERED" | "PLAYING" | "FINISHED";

export interface CompetitionCard {
  id: string; slug: string; title: string; description: string; type: string; status: ArenaStatus;
  startsAt: string; endsAt: string; durationSec: number; xpReward: number; coinReward: number;
  minLevel: number; season: string | null; questionCount: number; participants: number;
  me: MyArenaStatus; locked: string | null;
}

export interface LeaderRow {
  rank: number; username: string; country: string | null; level: number; score: number;
  durationSec: number | null; isMe: boolean; status: string; team: string | null;
}

export interface TeamRow { rank: number; name: string; tag: string; score: number; members: number }

export interface MyResult {
  status: MyArenaStatus; score: number; correct: number; total: number; rank: number | null;
  rewardXp: number; rewardCoins: number;
}

export interface CompetitionDetail {
  card: CompetitionCard; leaderboard: LeaderRow[]; teams: TeamRow[]; my: MyResult | null; serverNow: string;
}

export interface PlayQuestion { id: string; index: number; prompt: string; options: string[] }

export interface PlayState {
  questions: PlayQuestion[];
  answers: Record<string, { correct: boolean; points: number }>;
  deadline: string;
  serverNow: string;
  score: number;
  durationSec: number;
}

export type AnswerResult =
  | { ok: true; correct: boolean; points: number; score: number; finished: boolean }
  | { ok: false; expired: true };