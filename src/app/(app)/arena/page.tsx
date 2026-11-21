import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listCompetitions } from "@/lib/services/arena";
import { ArenaList } from "@/components/arena/ArenaList";

export const dynamic = "force-dynamic";

export default async function ArenaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const cards = await listCompetitions(user.id);
  return <ArenaList cards={cards} />;
}