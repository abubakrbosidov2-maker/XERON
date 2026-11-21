import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMissionDetail } from "@/lib/services/missions";
import { MissionPlay } from "@/components/missions/MissionPlay";

export const dynamic = "force-dynamic";

export default async function MissionPage({ params }: { params: { slug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getMissionDetail(user.id, params.slug);
  if (!data) notFound();
  return <MissionPlay key={data.mission.id + data.state.status} mission={data.mission} initial={data.state} />;
}