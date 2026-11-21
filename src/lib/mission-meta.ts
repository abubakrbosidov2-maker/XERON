// Mijoz va server uchun umumiy (faqat turlar va yorliqlar, Prisma importisiz).
export const TYPE_LABELS: Record<string, string> = {
  DAILY: "Kunlik", WEEKLY: "Haftalik", MONTHLY: "Oylik", SPECIAL: "Maxsus", TEAM: "Jamoaviy", GLOBAL: "Global",
};
export const TYPE_ORDER = ["DAILY", "WEEKLY", "MONTHLY", "SPECIAL", "TEAM", "GLOBAL"];

export const CATEGORY_META: Record<string, { label: string; color: string }> = {
  KNOWLEDGE: { label: "Bilim", color: "#60a5fa" },
  INTELLIGENCE: { label: "Aql", color: "#a78bfa" },
  CREATIVITY: { label: "Ijod", color: "#f472b6" },
  TECHNOLOGY: { label: "Texnologiya", color: "#22d3ee" },
  WELLNESS: { label: "Sport va salomatlik", color: "#34d399" },
  NATURE: { label: "Tabiat", color: "#4ade80" },
  TEAMWORK: { label: "Jamoaviylik", color: "#fbbf24" },
  SOCIAL: { label: "Ijtimoiy hissa", color: "#fb923c" },
};

export const DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  EASY: { label: "Oson", color: "#4ade80" },
  MEDIUM: { label: "O'rtacha", color: "#38bdf8" },
  HARD: { label: "Qiyin", color: "#f59e0b" },
  EPIC: { label: "Epik", color: "#f43f5e" },
};

export const VERIFICATION_LABELS: Record<string, string> = {
  QUIZ: "Savolga to'g'ri javob berish",
  TEXT: "Matnli hisobot yuborish",
  SELF_REPORT: "O'zingiz tasdiqlaysiz",
};

export interface MissionDTO {
  id: string; slug: string; title: string; description: string; category: string; type: string; difficulty: string;
  xp: number; coins: number; gems: number; requirements: string; verification: string; minLevel: number;
  deadline: string | null; question: string | null; options: string[] | null; minChars: number | null;
}

export interface MissionState {
  status: "NONE" | "ACCEPTED" | "COMPLETED" | "REJECTED";
  lock: string | null;
  attemptsLeft: number | null;
}

export interface MissionCard { mission: MissionDTO; state: MissionState }

export type SubmitResult =
  | { ok: true; rewards: { xp: number; coins: number; gems: number }; leveledUp: boolean; level: number; achievements: string[] }
  | { ok: false; message: string; attemptsLeft: number; rejected: boolean };