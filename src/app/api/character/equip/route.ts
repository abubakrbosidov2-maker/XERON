import { z } from "zod";
import { db } from "@/lib/db";
import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { getCharacterBundle } from "@/lib/services/character";

const schema = z.object({ itemId: z.string().min(1).max(60) });

export const POST = route(async (req) => {
  const u = await requireUser();
  const raw = await req.json().catch(() => {
    throw new HttpError(400, "So'rov formati noto'g'ri");
  });
  const { itemId } = schema.parse(raw);

  const ch = await db.character.findUnique({ where: { userId: u.id }, include: { appearance: true } });
  if (!ch || !ch.appearance) throw new HttpError(404, "Qahramon topilmadi");

  // Egalik serverda tekshiriladi — mijozga ishonilmaydi
  const owned = await db.userItem.findUnique({
    where: { userId_itemId: { userId: u.id, itemId } },
    include: { item: true },
  });
  if (!owned) throw new HttpError(403, "Bu buyum sizda yo'q");

  const item = owned.item;
  if (!item.isActive) throw new HttpError(400, "Buyum faol emas");
  if (item.slot === "NONE") throw new HttpError(400, "Bu buyumni kiyib bo'lmaydi");

  const body = ch.appearance.body;
  if ((item.gender === "MALE" && body === "female") || (item.gender === "FEMALE" && body === "male")) {
    throw new HttpError(400, "Bu buyum tanlangan tana turiga mos emas");
  }

  await db.equippedItem.upsert({
    where: { characterId_slot: { characterId: ch.id, slot: item.slot } },
    update: { userItemId: owned.id, equippedAt: new Date() },
    create: { characterId: ch.id, slot: item.slot, userItemId: owned.id },
  });

  return ok({ bundle: await getCharacterBundle(u.id) });
});