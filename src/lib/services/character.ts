import { db } from "../db";
import type { AppearanceData } from "../avatar-config";
import { sumBonuses, toItemDTO, type CharacterBundle, type LoadoutDTO } from "../item-dto";

export async function getCharacterBundle(userId: string): Promise<CharacterBundle | null> {
  const [ch, owned] = await Promise.all([
    db.character.findUnique({
      where: { userId },
      include: { appearance: true, stats: true, equipped: { include: { userItem: { include: { item: true } } } } },
    }),
    db.userItem.findMany({ where: { userId }, include: { item: true }, orderBy: { acquiredAt: "asc" } }),
  ]);
  if (!ch || !ch.appearance || !ch.stats) return null;

  const a = ch.appearance;
  const s = ch.stats;
  const equipped = ch.equipped.map((e) => ({ slot: e.slot, item: toItemDTO(e.userItem.item) }));

  return {
    name: ch.name,
    level: ch.level,
    appearance: {
      body: a.body, skinTone: a.skinTone, hairStyle: a.hairStyle, hairColor: a.hairColor,
      face: a.face, eyeColor: a.eyeColor, pose: a.pose, aura: a.aura,
    } as AppearanceData,
    equipped,
    owned: owned.map((o) => toItemDTO(o.item)),
    stats: { strength: s.strength, intelligence: s.intelligence, speed: s.speed, creativity: s.creativity, endurance: s.endurance, luck: s.luck },
    bonuses: sumBonuses(equipped.map((e) => e.item)),
  };
}

export async function listLoadouts(userId: string): Promise<LoadoutDTO[]> {
  const rows = await db.loadout.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return rows.map((r) => {
    let count = 0;
    try { count = Object.keys(JSON.parse(r.dataJson) as Record<string, string>).length; } catch { /* buzilgan yozuv */ }
    return { id: r.id, name: r.name, itemCount: count };
  });
}