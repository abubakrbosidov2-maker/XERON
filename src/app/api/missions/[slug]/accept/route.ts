import { Prisma } from "@prisma/client";
import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { acceptMission } from "@/lib/services/missions";

export const POST = route<{ params: { slug: string } }>(
  async (_req, ctx) => {
    const u = await requireUser();
    try {
      return ok(await acceptMission(u.id, ctx.params.slug));
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "Missiya allaqachon qabul qilingan");
      throw e;
    }
  },
  { limit: 60, windowMs: 60_000, key: "missions:accept" },
);