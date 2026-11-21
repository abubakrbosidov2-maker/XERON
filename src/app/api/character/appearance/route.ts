import { db } from "@/lib/db";
import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { appearanceSchema } from "@/lib/validation";
import { getCharacterBundle } from "@/lib/services/character";

export const PUT = route(async (req) => {
  const u = await requireUser();
  const raw = await req.json().catch(() => {
    throw new HttpError(400, "So'rov formati noto'g'ri");
  });
  const data = appearanceSchema.parse(raw);

  const ch = await db.character.findUnique({ where: { userId: u.id }, select: { id: true } });
  if (!ch) throw new HttpError(404, "Qahramon topilmadi");

  await db.$transaction(async (tx) => {
    await tx.characterAppearance.update({ where: { characterId: ch.id }, data });
    // Jins o'zgarsa, mos kelmaydigan kiyilgan buyumlar avtomatik yechiladi
    if (data.body !== "neutral") {
      const wrong = data.body === "male" ? "FEMALE" : "MALE";
      const bad = await tx.equippedItem.findMany({
        where: { characterId: ch.id, userItem: { item: { gender: wrong } } },
        select: { id: true },
      });
      if (bad.length) await tx.equippedItem.deleteMany({ where: { id: { in: bad.map((b) => b.id) } } });
    }
  });

  return ok({ bundle: await getCharacterBundle(u.id) });
});