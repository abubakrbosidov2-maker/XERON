import { z } from "zod";
import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { submitMission } from "@/lib/services/missions";

const schema = z.object({
  choiceIndex: z.number().int().min(0).max(9).optional(),
  text: z.string().max(2000).optional(),
  confirm: z.boolean().optional(),
});

export const POST = route<{ params: { slug: string } }>(
  async (req, ctx) => {
    const u = await requireUser();
    const raw = await req.json().catch(() => {
      throw new HttpError(400, "So'rov formati noto'g'ri");
    });
    const input = schema.parse(raw);
    return ok(await submitMission(u.id, ctx.params.slug, input));
  },
  { limit: 30, windowMs: 60_000, key: "missions:submit" },
);