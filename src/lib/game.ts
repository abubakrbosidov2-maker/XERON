import type { Prisma } from "@prisma/client";

/** Daraja uchun kerakli jami XP: level L ga yetish = 100 * (L-1)^1.5 (yumshoq o'sish). */
export const xpForLevel = (level: number) => Math.round(100 * Math.pow(Math.max(level - 1, 0), 1.5));

export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp && level < 200) level++;
  return level;
}

export function levelProgress(totalXp: number) {
  const level = levelFromXp(totalXp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: totalXp - base, needed: next - base, pct: Math.min(100, Math.round(((totalXp - base) / (next - base)) * 100)) };
}

export const RARITIES = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"] as const;
export type Rarity = (typeof RARITIES)[number];

/** Muvozanat: buyum bonuslari sotib olinganligiga emas, faqat nodirlikka bog'liq.
 *  Har bir buyum uchun maksimal jami bonus (pay-to-win yo'q — narx bonusga ta'sir qilmaydi). */
export const MAX_BONUS_BY_RARITY: Record<Rarity, number> = { COMMON: 1, UNCOMMON: 2, RARE: 3, EPIC: 4, LEGENDARY: 5, MYTHIC: 6 };
/** Raqobatli o'yinlarda jami bonus chegarasi (adolatli o'yin). */
export const COMPETITIVE_BONUS_CAP = 10;

export type Tx = Prisma.TransactionClient;
