import type { Item } from "@prisma/client";
import type { AppearanceData, EquippedVisual } from "./avatar-config";

export const STAT_KEYS = ["strength", "intelligence", "speed", "creativity", "endurance", "luck"] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export interface ItemDTO {
  id: string; slug: string; name: string; description: string;
  category: string; slot: string; rarity: string; visualKey: string;
  c1: string; c2: string; gender: string; unlockLevel: number;
  priceCoins: number; priceGems: number; bonuses: Stats;
  unlockRequirement: string | null; isFeatured: boolean; isStarter: boolean;
  season: string | null; hasAchievement: boolean;
}

export interface LoadoutDTO { id: string; name: string; itemCount: number }

export interface CharacterBundle {
  name: string;
  level: number;
  appearance: AppearanceData;
  equipped: { slot: string; item: ItemDTO }[];
  owned: ItemDTO[];
  stats: Stats;
  bonuses: Stats;
}

export function toItemDTO(i: Item): ItemDTO {
  return {
    id: i.id, slug: i.slug, name: i.name, description: i.description, category: i.category, slot: i.slot,
    rarity: i.rarity, visualKey: i.visualKey, c1: i.colorPrimary, c2: i.colorSecondary, gender: i.gender,
    unlockLevel: i.unlockLevel, priceCoins: i.priceCoins, priceGems: i.priceGems,
    unlockRequirement: i.unlockRequirement, isFeatured: i.isFeatured, isStarter: i.isStarter,
    season: i.season, hasAchievement: i.achievementId !== null,
    bonuses: {
      strength: i.bonusStrength, intelligence: i.bonusIntelligence, speed: i.bonusSpeed,
      creativity: i.bonusCreativity, endurance: i.bonusEndurance, luck: i.bonusLuck,
    },
  };
}

export const toVisual = (i: ItemDTO): EquippedVisual => ({ slot: i.slot, visualKey: i.visualKey, c1: i.c1, c2: i.c2 });

export function sumBonuses(items: ItemDTO[]): Stats {
  const total: Stats = { strength: 0, intelligence: 0, speed: 0, creativity: 0, endurance: 0, luck: 0 };
  for (const it of items) for (const k of STAT_KEYS) total[k] += it.bonuses[k];
  return total;
}