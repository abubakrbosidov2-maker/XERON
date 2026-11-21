// Mijoz va server uchun umumiy turlar (Prisma importisiz).
import type { AppearanceData, EquippedVisual } from "./avatar-config";

export const SCOPES = ["GLOBAL", "COUNTRY", "FRIENDS", "TEAMS"] as const;
export type Scope = (typeof SCOPES)[number];
export const PERIODS = ["WEEKLY", "MONTHLY", "ALL"] as const;
export type Period = (typeof PERIODS)[number];

export const SCOPE_LABELS: Record<Scope, string> = { GLOBAL: "Global", COUNTRY: "Davlat", FRIENDS: "Do'stlar", TEAMS: "Jamoalar" };
export const PERIOD_LABELS: Record<Period, string> = { WEEKLY: "Haftalik", MONTHLY: "Oylik", ALL: "Barcha vaqt" };

export interface AvatarPayload { appearance: AppearanceData; equipped: EquippedVisual[] }

export interface PlayerEntry {
  rank: number; username: string; country: string | null; level: number; value: number;
  achievements: number; title: string | null; team: string | null; isMe: boolean; avatar: AvatarPayload;
}

export interface PlayerBoard {
  entries: PlayerEntry[]; me: PlayerEntry | null; total: number; countryCode: string | null; meHidden: boolean;
}

export interface TeamEntry {
  rank: number; name: string; tag: string; members: number; score: number; owner: string; isMine: boolean; isPublic: boolean;
}

export interface CountryEntry {
  rank: number; code: string; players: number; totalXp: number; avgLevel: number; topPlayer: string | null; isMine: boolean;
}