import { route, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { searchUsers } from "@/lib/services/friends";

export const dynamic = "force-dynamic";

export const GET = route(
  async (req) => {
    const u = await requireUser();
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
    if (!/^[a-z0-9_]{2,20}$/.test(q)) return ok({ hits: [] });
    return ok({ hits: await searchUsers(u.id, q) });
  },
  { limit: 40, windowMs: 60_000, key: "users:search" },
);