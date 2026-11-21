import type { Tx } from "../game";

export interface ProvisionOptions {
  userId: string;
  username: string;
  ageGroup: "CHILD" | "TEEN" | "ADULT";
  body?: "male" | "female" | "neutral";
  skinTone?: string;
  hairColor?: string;
  hairStyle?: string;
  startCoins?: number;
  startGems?: number;
}

/** Yangi o'yinchi uchun barcha o'yin yozuvlarini yaratadi (ro'yxatdan o'tishda va seedda ishlatiladi).
 *  Hammasi bitta tranzaksiya ichida chaqirilishi kerak. */
export async function provisionPlayer(tx: Tx, o: ProvisionOptions) {
  const body = o.body ?? "neutral";

  await tx.profile.create({
    data: { userId: o.userId, displayName: o.username, allowDMs: o.ageGroup === "ADULT" },
  });

  const character = await tx.character.create({
    data: {
      userId: o.userId,
      name: o.username,
      appearance: {
        create: {
          body,
          skinTone: o.skinTone ?? "#e0ac69",
          hairColor: o.hairColor ?? "#2b2118",
          hairStyle: o.hairStyle ?? "short",
        },
      },
      stats: { create: {} },
    },
  });

  await tx.inventory.create({ data: { userId: o.userId, coins: o.startCoins ?? 100, gems: o.startGems ?? 0 } });
  await tx.virtualWorld.create({ data: { userId: o.userId, cityName: `${o.username} shahri`, wood: 20, stone: 20, energy: 10 } });

  // Barcha bepul boshlang'ich buyumlar egalik qilinadi; kiyiladigani jinsga mosi.
  const starters = await tx.item.findMany({ where: { isStarter: true, isActive: true } });
  const fits = (g: string) => g === "ANY" || body === "neutral" || (g === "MALE" && body === "male") || (g === "FEMALE" && body === "female");

  const equippedSlots = new Set<string>();
  for (const item of starters) {
    const ui = await tx.userItem.create({ data: { userId: o.userId, itemId: item.id, source: "STARTER" } });
    if (!fits(item.gender)) continue;
    const prefer = body === "female" && item.slug === "starter-dress";
    if (!equippedSlots.has(item.slot) || prefer) {
      if (equippedSlots.has(item.slot)) {
        await tx.equippedItem.deleteMany({ where: { characterId: character.id, slot: item.slot } });
      }
      await tx.equippedItem.create({ data: { characterId: character.id, slot: item.slot, userItemId: ui.id } });
      equippedSlots.add(item.slot);
    }
  }

  await tx.notification.create({
    data: { userId: o.userId, type: "SYSTEM", title: "XERON ga xush kelibsiz!", body: "Birinchi missiyangizni boshlang va dunyoni kashf eting.", link: "/missions" },
  });

  return character;
}