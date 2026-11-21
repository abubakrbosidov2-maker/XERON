import { route, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { finishCompetition } from "@/lib/services/arena";

export const POST = route<{ params: { slug: string } }>(
  async (_req, ctx) => {
    const u = await requireUser();
    return ok(await finishCompetition(u.id, ctx.params.slug));
  },
  { limit: 30, windowMs: 60_000, key: "arena:finish" },
);