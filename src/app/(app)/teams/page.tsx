import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTeamsPageData } from "@/lib/services/teams";
import { TeamsView } from "@/components/social/TeamsView";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getTeamsPageData(user.id);
  // Server ma'lumoti o'zgarganda (rol, a'zolar, sozlamalar) shakllar qayta yaratiladi
  const key = data.mine ? `${data.mine.name}-${data.mine.myRole}-${data.mine.members.length}-${data.mine.isPublic}-${data.mine.description.length}` : `none-${data.invites.length}`;
  return <TeamsView key={key} data={data} />;
}