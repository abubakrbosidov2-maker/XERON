import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [ch, inv, unread] = await Promise.all([
    db.character.findUnique({ where: { userId: user.id }, select: { level: true } }),
    db.inventory.findUnique({ where: { userId: user.id }, select: { coins: true, gems: true } }),
    db.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  return (
    <AppShell user={{ username: user.username, role: user.role }} level={ch?.level ?? 1} wallet={{ coins: inv?.coins ?? 0, gems: inv?.gems ?? 0 }} unread={unread}>
      {children}
    </AppShell>
  );
}