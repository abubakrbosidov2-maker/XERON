import { HttpError } from "../auth";
import { levelFromXp, type Tx } from "../game";

/** Valyuta o'zgarishi: barcha harakatlar tranzaksiya ichida, balans hech qachon manfiy bo'lmaydi. */
export async function changeCurrency(
  tx: Tx,
  userId: string,
  currency: "COINS" | "GEMS",
  amount: number,
  reason: string,
  ref?: { type: string; id: string },
) {
  if (!Number.isInteger(amount) || amount === 0) throw new HttpError(400, "Noto'g'ri miqdor");
  const field = currency === "COINS" ? "coins" : "gems";

  // Atomik shartli yangilash: poyga holatida ham balans manfiyga tushmaydi.
  if (amount < 0) {
    const res = await tx.inventory.updateMany({
      where: { userId, [field]: { gte: -amount } },
      data: { [field]: { decrement: -amount } },
    });
    if (res.count === 0) throw new HttpError(402, currency === "COINS" ? "Tangalar yetarli emas" : "Gemlar yetarli emas");
  } else {
    await tx.inventory.update({ where: { userId }, data: { [field]: { increment: amount } } });
  }

  const inv = await tx.inventory.findUniqueOrThrow({ where: { userId } });
  await tx.currencyTransaction.create({
    data: { userId, currency, amount, balanceAfter: currency === "COINS" ? inv.coins : inv.gems, reason, refType: ref?.type, refId: ref?.id },
  });
  return inv;
}

/** XP berish: bir manba uchun faqat bir marta, daraja avtomatik hisoblanadi, jamoa XP si ham oshadi. */
export async function grantXp(tx: Tx, userId: string, amount: number, reason: string, ref: { type: string; id: string }) {
  if (!Number.isInteger(amount) || amount <= 0) throw new HttpError(400, "Noto'g'ri XP");

  const exists = await tx.xPTransaction.findFirst({ where: { userId, reason, refType: ref.type, refId: ref.id } });
  if (exists) return { granted: false as const, leveledUp: false, level: undefined };

  await tx.xPTransaction.create({ data: { userId, amount, reason, refType: ref.type, refId: ref.id } });

  const ch = await tx.character.update({
    where: { userId },
    data: { xp: { increment: amount }, weeklyXp: { increment: amount }, monthlyXp: { increment: amount } },
  });

  const member = await tx.teamMember.findUnique({ where: { userId } });
  if (member) await tx.team.update({ where: { id: member.teamId }, data: { teamXp: { increment: amount } } });

  const newLevel = levelFromXp(ch.xp);
  let leveledUp = false;
  if (newLevel > ch.level) {
    leveledUp = true;
    await tx.character.update({ where: { userId }, data: { level: newLevel, skillPoints: { increment: (newLevel - ch.level) * 2 } } });
    await tx.notification.create({
      data: { userId, type: "LEVEL", title: `Daraja ${newLevel}!`, body: "Yangi daraja va 2 ta mahorat ochkosi oldingiz.", link: "/dashboard" },
    });
  }
  await tx.notification.create({
    data: { userId, type: "XP", title: `+${amount} XP`, body: "Tajriba ochkosi qo'shildi.", link: "/dashboard" },
  });
  return { granted: true as const, leveledUp, level: newLevel };
}