import { db } from "../db";
import { HttpError } from "../auth";
import { changeCurrency } from "./economy";

/** Xarid to'liq serverda: narx, daraja, yutuq, egalik va balans bazadan tekshiriladi.
 *  Mijozdan faqat itemId qabul qilinadi; narxga mijoz ta'sir qila olmaydi. */
export async function purchaseItem(userId: string, itemId: string) {
  return db.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { id: itemId } });
    if (!item || !item.isActive) throw new HttpError(404, "Buyum topilmadi");
    if (item.isStarter) throw new HttpError(400, "Bu buyum boshlang'ich to'plamga kiradi");

    const ch = await tx.character.findUnique({ where: { userId }, select: { level: true } });
    if (!ch) throw new HttpError(404, "Qahramon topilmadi");
    if (ch.level < item.unlockLevel) throw new HttpError(403, `Buning uchun kamida ${item.unlockLevel}-daraja kerak`);

    if (item.achievementId) {
      const has = await tx.userAchievement.findUnique({ where: { userId_achievementId: { userId, achievementId: item.achievementId } } });
      if (!has) throw new HttpError(403, item.unlockRequirement ?? "Bu buyum faqat yutuq orqali ochiladi");
    }

    const already = await tx.userItem.findUnique({ where: { userId_itemId: { userId, itemId } } });
    if (already) throw new HttpError(409, "Bu buyum sizda allaqachon bor");

    const inv = await tx.inventory.findUnique({ where: { userId } });
    if (!inv) throw new HttpError(404, "Inventar topilmadi");
    const count = await tx.userItem.count({ where: { userId } });
    if (count >= inv.capacity) throw new HttpError(400, "Inventar to'lgan");

    const ref = { type: "ITEM", id: item.id };
    if (item.priceCoins > 0) await changeCurrency(tx, userId, "COINS", -item.priceCoins, "PURCHASE", ref);
    if (item.priceGems > 0) await changeCurrency(tx, userId, "GEMS", -item.priceGems, "PURCHASE", ref);

    const paid = item.priceCoins > 0 || item.priceGems > 0;
    await tx.userItem.create({ data: { userId, itemId, source: paid ? "STORE" : item.achievementId ? "ACHIEVEMENT" : "STORE" } });

    const wallet = await tx.inventory.findUniqueOrThrow({ where: { userId }, select: { coins: true, gems: true } });
    return { itemName: item.name, wallet };
  });
}