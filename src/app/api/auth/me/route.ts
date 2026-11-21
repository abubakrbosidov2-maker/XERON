import { db } from "@/lib/db";
import { route, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { levelProgress } from "@/lib/game";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const u = await requireUser();
  const [character, inventory, profile] = await Promise.all([
    db.character.findUnique({ where: { userId: u.id }, include: { appearance: true, stats: true } }),
    db.inventory.findUnique({ where: { userId: u.id }, select: { coins: true, gems: true } }),
    db.profile.findUnique({ where: { userId: u.id } }),
  ]);
  return ok({
    user: { id: u.id, username: u.username, email: u.email, role: u.role, ageGroup: u.ageGroup, country: u.country },
    profile,
    character: character && { ...character, progress: levelProgress(character.xp) },
    wallet: inventory,
  });
});