import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCompetitionDetail } from "@/lib/services/arena";
import { CompetitionView } from "@/components/arena/CompetitionView";

export const dynamic = "force-dynamic";

export default async function CompetitionPage({ params }: { params: { slug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const detail = await getCompetitionDetail(user.id, params.slug);
  if (!detail) notFound();
  const k = `${detail.card.status}-${detail.my?.status ?? "NONE"}-${detail.my?.score ?? 0}`;
  return <CompetitionView key={k} detail={detail} />;
}