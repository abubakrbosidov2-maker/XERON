import { z } from "zod";
import { db } from "@/lib/db";
import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { getCharacterBundle } from "@/lib/services/character";

const schema = z.object({ id: z.string().min(1).max(60) });
const dataSchema = z.record(z.string(), z.string());

export const POST = route(async (req) => {
  const u = await requireUser();
  const raw = await req.json().catch(() => {
    throw new HttpError(400, "So'rov formati noto'g'ri");
  });
  const { id } = schema.parse(raw);

  const loadout = await db.loadout.findFirst({ where: { id, userId: u.id } });
  if (!loadout) throw new HttpError(404, "To'plam topilmadi");

  let data: Record<string, string>;
  try {
    data = dataSchema.parse(JSON.parse(loadout.dataJson));
  } catch {
    throw new HttpError(400, "To'plam ma'lumoti buzilgan");
  }

  const ch = await db.character.findUnique({ where: { userId: u.id }, include: { appearance: true } });
  if (!ch || !ch.appearance) throw new HttpError(404, "Qahramon topilmadi");
  const characterId = ch.id;
  const body = ch.appearance.body;

  let skipped = 0;
  await db.$transaction(async (tx) => {
    await tx.equippedItem.deleteMany({ where: { characterId } });
    for (const [slot, itemId] of Object.entries(data)) {
      // Har bir buyum egaligi qayta tekshiriladi (sotilgan/o'chirilgan buyumlar o'tkazib yuboriladi)
      const owned = await tx.userItem.findUnique({ where: { userId_itemId: { userId: u.id, itemId } }, include: { item: true } });
      const mismatch = owned && ((owned.item.gender === "MALE" && body === "female") || (owned.item.gender === "FEMALE" && body === "male"));
      if (!owned || !owned.item.isActive || owned.item.slot !== slot || mismatch) {
        skipped++;
        continue;
      }
      await tx.equippedItem.create({ data: { characterId, slot, userItemId: owned.id } });
    }
  });

  return ok({ bundle: await getCharacterBundle(u.id), skipped });
});