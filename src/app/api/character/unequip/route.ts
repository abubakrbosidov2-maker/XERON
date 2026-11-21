import { z } from "zod";
import { db } from "@/lib/db";
import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { getCharacterBundle } from "@/lib/services/character";

const schema = z.object({
  slot: z.enum(["TOP", "JACKET", "BOTTOM", "SHOES", "GLOVES", "MASK", "GLASSES", "HEAD", "BACK", "EFFECT", "SKIN"]),
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const raw = await req.json().catch(() => {
    throw new HttpError(400, "So'rov formati noto'g'ri");
  });
  const { slot } = schema.parse(raw);

  const ch = await db.character.findUnique({ where: { userId: u.id }, select: { id: true } });
  if (!ch) throw new HttpError(404, "Qahramon topilmadi");

  await db.equippedItem.deleteMany({ where: { characterId: ch.id, slot } });
  return ok({ bundle: await getCharacterBundle(u.id) });
});