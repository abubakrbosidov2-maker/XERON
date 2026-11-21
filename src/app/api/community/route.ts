import { z } from "zod";
import { Prisma } from "@prisma/client";
import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { usernameSchema } from "@/lib/validation";
import {
  addComment, createPost, createReport, deleteComment, deletePost, getFeed, loadComments, shareAchievement, toggleFollow, toggleLike,
} from "@/lib/services/community";

export const dynamic = "force-dynamic";

const id = z.string().min(1).max(60);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("post"), content: z.string().max(500, "Post ko'pi bilan 500 belgi") }),
  z.object({ action: z.literal("share_achievement"), achievementId: id }),
  z.object({ action: z.literal("delete_post"), id }),
  z.object({ action: z.literal("like"), id }),
  z.object({ action: z.literal("comment"), id, content: z.string().max(300, "Izoh ko'pi bilan 300 belgi") }),
  z.object({ action: z.literal("load_comments"), id }),
  z.object({ action: z.literal("delete_comment"), id }),
  z.object({ action: z.literal("follow"), username: usernameSchema }),
  z.object({
    action: z.literal("report"), targetType: z.enum(["POST", "COMMENT"]), id,
    reason: z.enum(["SPAM", "ABUSE", "INAPPROPRIATE", "PRIVACY", "OTHER"]), details: z.string().max(300).default(""),
  }),
]);

export const GET = route(
  async (req) => {
    const u = await requireUser();
    const tab = req.nextUrl.searchParams.get("tab") === "FOLLOWING" ? "FOLLOWING" : "ALL";
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
    if (cursor && !/^[A-Za-z0-9_-]{1,60}$/.test(cursor)) throw new HttpError(400, "Noto'g'ri sahifa");
    return ok(await getFeed(u.id, tab, cursor));
  },
  { limit: 120, windowMs: 60_000, key: "community:get" },
);

export const POST = route(
  async (req) => {
    const u = await requireUser();
    const raw = await req.json().catch(() => {
      throw new HttpError(400, "So'rov formati noto'g'ri");
    });
    const b = schema.parse(raw);
    try {
      switch (b.action) {
        case "post": return ok(await createPost(u.id, b.content));
        case "share_achievement": return ok(await shareAchievement(u.id, b.achievementId));
        case "delete_post": return ok(await deletePost(u, b.id));
        case "like": return ok(await toggleLike(u.id, b.id));
        case "comment": return ok(await addComment(u.id, b.id, b.content));
        case "load_comments": return ok(await loadComments(u.id, b.id));
        case "delete_comment": return ok(await deleteComment(u, b.id));
        case "follow": return ok(await toggleFollow(u.id, b.username));
        case "report": return ok(await createReport(u.id, { targetType: b.targetType, id: b.id, reason: b.reason, details: b.details }));
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "Amal allaqachon bajarilgan");
      throw e;
    }
  },
  { limit: 90, windowMs: 60_000, key: "community:post" },
);