import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCharacterBundle, listLoadouts } from "@/lib/services/character";
import { toItemDTO } from "@/lib/item-dto";
import { InventoryView, type InvEntry } from "@/components/items/InventoryView";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [bundle, rows, loadouts] = await Promise.all([
    getCharacterBundle(user.id),
    db.userItem.findMany({ where: { userId: user.id }, include: { item: true } }),
    listLoadouts(user.id),
  ]);
  if (!bundle) redirect("/login");

  const entries: InvEntry[] = rows.map((r) => ({ ...toItemDTO(r.item), acquiredAt: r.acquiredAt.toISOString() }));
  return <InventoryView bundle={bundle} entries={entries} loadouts={loadouts} />;
}