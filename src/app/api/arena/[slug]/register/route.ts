import { Prisma } from "@prisma/client";
import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { registerForCompetition } from "@/lib/services/arena";

export const POST = route<{ params: { slug: string } }>(
  async (_req, ctx) => {
    const u = await requireUser();
    try {
      return ok(await registerForCompetition(u.id, ctx.params.slug));
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "Siz allaqachon ro'yxatdan o'tgansiz");
      throw e;
    }
  },
  { limit: 30, windowMs: 60_000, key: "arena:register" },
);