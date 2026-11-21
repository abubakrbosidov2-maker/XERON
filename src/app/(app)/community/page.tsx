import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getFeed } from "@/lib/services/community";
import { CommunityView } from "@/components/community/CommunityView";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [feed, mine] = await Promise.all([
    getFeed(user.id, "ALL"),
    db.userAchievement.findMany({ where: { userId: user.id }, include: { achievement: { select: { name: true } } }, orderBy: { unlockedAt: "desc" } }),
  ]);

  return (
    <CommunityView
      initial={feed}
      achievements={mine.map((m) => ({ id: m.achievementId, name: m.achievement.name }))}
      me={{ username: user.username, role: user.role }}
    />
  );
}