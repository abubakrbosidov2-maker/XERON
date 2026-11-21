import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCharacterBundle } from "@/lib/services/character";
import { toItemDTO } from "@/lib/item-dto";
import { StoreView, type StoreItem } from "@/components/items/StoreView";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [bundle, rows, ownedRows, achRows, inv] = await Promise.all([
    getCharacterBundle(user.id),
    db.item.findMany({ where: { isActive: true, isStarter: false } }),
    db.userItem.findMany({ where: { userId: user.id }, select: { itemId: true } }),
    db.userAchievement.findMany({ where: { userId: user.id }, select: { achievementId: true } }),
    db.inventory.findUnique({ where: { userId: user.id }, select: { coins: true, gems: true } }),
  ]);
  if (!bundle || !inv) redirect("/login");

  const ownedIds = new Set(ownedRows.map((o) => o.itemId));
  const achIds = new Set(achRows.map((a) => a.achievementId));

  const items: StoreItem[] = rows.map((it) => {
    const dto = toItemDTO(it);
    let lock: string | null = null;
    if (bundle.level < it.unlockLevel) lock = `${it.unlockLevel}-daraja kerak`;
    else if (it.achievementId && !achIds.has(it.achievementId)) lock = it.unlockRequirement ?? "Yutuq orqali ochiladi";
    return { ...dto, owned: ownedIds.has(it.id), lock };
  });

  return <StoreView bundle={bundle} items={items} wallet={inv} />;
}