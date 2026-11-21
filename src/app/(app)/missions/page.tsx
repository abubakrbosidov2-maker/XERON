import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listMissionsForUser } from "@/lib/services/missions";
import { MissionsView } from "@/components/missions/MissionsView";

export const dynamic = "force-dynamic";

export default async function MissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const cards = await listMissionsForUser(user.id);
  return <MissionsView cards={cards} />;
}