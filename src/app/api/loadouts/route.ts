import { z } from "zod";
import { db } from "@/lib/db";
import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { listLoadouts } from "@/lib/services/character";

export const dynamic = "force-dynamic";

const saveSchema = z.object({ name: z.string().trim().min(1, "Nom kiriting").max(24, "Nom juda uzun") });
const deleteSchema = z.object({ id: z.string().min(1).max(60) });
const MAX_LOADOUTS = 6;

async function body(req: Request) {
  return req.json().catch(() => {
    throw new HttpError(400, "So'rov formati noto'g'ri");
  });
}

export const GET = route(async () => {
  const u = await requireUser();
  return ok({ loadouts: await listLoadouts(u.id) });
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const { name } = saveSchema.parse(await body(req));

  const ch = await db.character.findUnique({ where: { userId: u.id }, include: { equipped: { include: { userItem: true } } } });
  if (!ch) throw new HttpError(404, "Qahramon topilmadi");

  const data: Record<string, string> = {};
  for (const e of ch.equipped) data[e.slot] = e.userItem.itemId;
  if (Object.keys(data).length === 0) throw new HttpError(400, "Hech narsa kiyilmagan, saqlash uchun avval buyum kiying");

  const existing = await db.loadout.findUnique({ where: { userId_name: { userId: u.id, name } } });
  if (!existing && (await db.loadout.count({ where: { userId: u.id } })) >= MAX_LOADOUTS) {
    throw new HttpError(400, `Ko'pi bilan ${MAX_LOADOUTS} ta to'plam saqlash mumkin`);
  }

  await db.loadout.upsert({
    where: { userId_name: { userId: u.id, name } },
    update: { dataJson: JSON.stringify(data) },
    create: { userId: u.id, name, dataJson: JSON.stringify(data) },
  });
  return ok({ loadouts: await listLoadouts(u.id) });
});

export const DELETE = route(async (req) => {
  const u = await requireUser();
  const { id } = deleteSchema.parse(await body(req));
  await db.loadout.deleteMany({ where: { id, userId: u.id } });
  return ok({ loadouts: await listLoadouts(u.id) });
});