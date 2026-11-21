import type { Tx } from "../game";
import { changeCurrency, grantXp } from "./economy";

/** Shartlari bajarilgan yutuqlarni ochadi (bir marta). Yutuq mukofoti daraja bersa, keyingi yutuqlar ham tekshiriladi. */
export async function checkAchievements(tx: Tx, userId: string): Promise<string[]> {
  const names: string[] = [];

  for (let round = 0; round < 3; round++) {
    const all = await tx.achievement.findMany({ where: { isActive: true } });
    const haveRows = await tx.userAchievement.findMany({ where: { userId }, select: { achievementId: true } });
    const have = new Set(haveRows.map((a) => a.achievementId));
    const pending = all.filter((a) => !have.has(a.id) && a.conditionType !== "MANUAL");
    if (pending.length === 0) break;

    const ch = await tx.character.findUnique({ where: { userId }, select: { level: true } });
    const completed = await tx.missionParticipation.count({ where: { userId, status: "COMPLETED" } });
    const wins = await tx.competitionParticipant.count({ where: { userId, rank: 1, competition: { status: "FINISHED" } } });
    const items = await tx.userItem.count({ where: { userId } });
    const friends = await tx.friend.count({ where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] } });
    const world = await tx.virtualWorld.findUnique({ where: { userId }, select: { cityLevel: true } });

    const value: Record<string, number> = {
      LEVEL: ch?.level ?? 1, MISSIONS_COMPLETED: completed, COMPETITIONS_WON: wins,
      ITEMS_OWNED: items, FRIENDS: friends, CITY_LEVEL: world?.cityLevel ?? 1,
    };

    let unlocked = 0;
    for (const a of pending) {
      if ((value[a.conditionType] ?? 0) < a.conditionValue) continue;
      await tx.userAchievement.create({ data: { userId, achievementId: a.id } });
      unlocked++;
      names.push(a.name);
      await tx.notification.create({
        data: { userId, type: "ACHIEVEMENT", title: `Yangi yutuq: ${a.name}`, body: a.description, link: "/dashboard" },
      });
      const ref = { type: "ACHIEVEMENT", id: a.id };
      if (a.xpReward > 0) await grantXp(tx, userId, a.xpReward, "ACHIEVEMENT", ref);
      if (a.coinReward > 0) await changeCurrency(tx, userId, "COINS", a.coinReward, "ACHIEVEMENT", ref);
      if (a.titleReward) await tx.profile.updateMany({ where: { userId, title: null }, data: { title: a.titleReward } });
    }
    if (unlocked === 0) break;
  }
  return names;
}