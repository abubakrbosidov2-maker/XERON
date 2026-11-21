import { z } from "zod";
import { Prisma } from "@prisma/client";
import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { answerQuestion } from "@/lib/services/arena";

const schema = z.object({ questionId: z.string().min(1).max(60), selectedIndex: z.number().int().min(0).max(9) });

export const POST = route<{ params: { slug: string } }>(
  async (req, ctx) => {
    const u = await requireUser();
    const raw = await req.json().catch(() => {
      throw new HttpError(400, "So'rov formati noto'g'ri");
    });
    const { questionId, selectedIndex } = schema.parse(raw);
    try {
      return ok(await answerQuestion(u.id, ctx.params.slug, questionId, selectedIndex));
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "Bu savolga allaqachon javob bergansiz");
      throw e;
    }
  },
  { limit: 120, windowMs: 60_000, key: "arena:answer" },
);