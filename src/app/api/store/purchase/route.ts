import { z } from "zod";
import { Prisma } from "@prisma/client";
import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { purchaseItem } from "@/lib/services/store";

const schema = z.object({ itemId: z.string().min(1).max(60) });

export const POST = route(
  async (req) => {
    const u = await requireUser();
    const raw = await req.json().catch(() => {
      throw new HttpError(400, "So'rov formati noto'g'ri");
    });
    const { itemId } = schema.parse(raw);
    try {
      const result = await purchaseItem(u.id, itemId);
      return ok({ ok: true, ...result });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new HttpError(409, "Bu buyum sizda allaqachon bor");
      }
      throw e;
    }
  },
  { limit: 30, windowMs: 60_000, key: "store:purchase" },
);