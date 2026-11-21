import { z } from "zod";
import { Prisma } from "@prisma/client";
import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { usernameSchema } from "@/lib/validation";
import { listFriends, removeFriend, respondFriend, sendFriendRequest } from "@/lib/services/friends";

export const dynamic = "force-dynamic";

const idSchema = z.string().min(1).max(60);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), username: usernameSchema }),
  z.object({ action: z.literal("accept"), id: idSchema }),
  z.object({ action: z.literal("decline"), id: idSchema }),
  z.object({ action: z.literal("remove"), id: idSchema }),
]);

export const GET = route(async () => {
  const u = await requireUser();
  return ok(await listFriends(u.id));
});

export const POST = route(
  async (req) => {
    const u = await requireUser();
    const raw = await req.json().catch(() => {
      throw new HttpError(400, "So'rov formati noto'g'ri");
    });
    const body = schema.parse(raw);
    try {
      switch (body.action) {
        case "request": return ok(await sendFriendRequest(u.id, body.username));
        case "accept": return ok(await respondFriend(u.id, body.id, true));
        case "decline": return ok(await respondFriend(u.id, body.id, false));
        case "remove": return ok(await removeFriend(u.id, body.id));
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "So'rov allaqachon mavjud");
      throw e;
    }
  },
  { limit: 60, windowMs: 60_000, key: "friends" },
);