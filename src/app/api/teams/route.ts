import { z } from "zod";
import { Prisma } from "@prisma/client";
import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { usernameSchema } from "@/lib/validation";
import { createTeam, disbandTeam, inviteToTeam, joinTeam, kickMember, leaveTeam, respondInvite, setMemberRole, updateTeam } from "@/lib/services/teams";

const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const nameSchema = z.string().trim().min(3, "Nom kamida 3 belgi").max(24, "Nom ko'pi bilan 24 belgi")
  .regex(/^[\p{L}\p{N} _-]+$/u, "Nomda faqat harf, raqam, bo'shliq, _ va - bo'lishi mumkin");
const descSchema = z.string().trim().max(200, "Tavsif ko'pi bilan 200 belgi").transform(clean);

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"), name: nameSchema,
    tag: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,5}$/, "Teg 2-5 ta lotin harfi yoki raqam"),
    description: descSchema, isPublic: z.boolean(),
  }),
  z.object({ action: z.literal("join"), name: z.string().trim().min(1).max(40) }),
  z.object({ action: z.literal("leave") }),
  z.object({ action: z.literal("invite"), username: usernameSchema }),
  z.object({ action: z.literal("accept_invite"), id: z.string().min(1).max(60) }),
  z.object({ action: z.literal("decline_invite"), id: z.string().min(1).max(60) }),
  z.object({ action: z.literal("kick"), username: usernameSchema }),
  z.object({ action: z.literal("set_role"), username: usernameSchema, role: z.enum(["OWNER", "OFFICER", "MEMBER"]) }),
  z.object({ action: z.literal("update"), description: descSchema, isPublic: z.boolean() }),
  z.object({ action: z.literal("disband") }),
]);

export const POST = route(
  async (req) => {
    const u = await requireUser();
    const raw = await req.json().catch(() => {
      throw new HttpError(400, "So'rov formati noto'g'ri");
    });
    const b = schema.parse(raw);
    try {
      switch (b.action) {
        case "create": return ok(await createTeam(u.id, { name: b.name, tag: b.tag, description: b.description, isPublic: b.isPublic }));
        case "join": return ok(await joinTeam(u.id, b.name));
        case "leave": return ok(await leaveTeam(u.id));
        case "invite": return ok(await inviteToTeam(u.id, b.username));
        case "accept_invite": return ok(await respondInvite(u.id, b.id, true));
        case "decline_invite": return ok(await respondInvite(u.id, b.id, false));
        case "kick": return ok(await kickMember(u.id, b.username));
        case "set_role": return ok(await setMemberRole(u.id, b.username, b.role));
        case "update": return ok(await updateTeam(u.id, { description: b.description, isPublic: b.isPublic }));
        case "disband": return ok(await disbandTeam(u.id));
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "Bu nom/teg band yoki siz allaqachon jamoadasiz");
      throw e;
    }
  },
  { limit: 60, windowMs: 60_000, key: "teams" },
);