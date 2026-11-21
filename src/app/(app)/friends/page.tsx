import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listFriends } from "@/lib/services/friends";
import { FriendsView } from "@/components/social/FriendsView";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <FriendsView data={await listFriends(user.id)} />;
}