import { db } from "../db";
import { DEFAULT_APPEARANCE, type AppearanceData } from "../avatar-config";
import type { PersonDTO } from "../social-meta";

export interface PersonRow { person: PersonDTO; xp: number }

/** Foydalanuvchilarning ochiq ko'rinishi (avatar, daraja, davlat). Davlat yashirilgan bo'lsa null. */
export async function loadPeople(userIds: string[]): Promise<Map<string, PersonRow>> {
  const out = new Map<string, PersonRow>();
  if (userIds.length === 0) return out;

  const rows = await db.character.findMany({
    where: { userId: { in: userIds } },
    include: {
      appearance: true,
      equipped: { include: { userItem: { include: { item: true } } } },
      user: { select: { username: true, country: true, profile: { select: { showCountry: true, title: true } } } },
    },
  });

  for (const c of rows) {
    const a = c.appearance;
    const look = a
      ? ({ body: a.body, skinTone: a.skinTone, hairStyle: a.hairStyle, hairColor: a.hairColor, face: a.face, eyeColor: a.eyeColor, pose: a.pose, aura: a.aura } as AppearanceData)
      : DEFAULT_APPEARANCE;
    out.set(c.userId, {
      xp: c.xp,
      person: {
        username: c.user.username,
        level: c.level,
        country: c.user.profile?.showCountry === false ? null : c.user.country,
        title: c.user.profile?.title ?? null,
        avatar: {
          appearance: look,
          equipped: c.equipped.map((e) => ({ slot: e.slot, visualKey: e.userItem.item.visualKey, c1: e.userItem.item.colorPrimary, c2: e.userItem.item.colorSecondary })),
        },
      },
    });
  }
  return out;
}