import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { route, ok } from "@/lib/api";
import { registerSchema, ageGroupFromBirthYear } from "@/lib/validation";
import { hashPassword, createSession, HttpError } from "@/lib/auth";
import { provisionPlayer } from "@/lib/services/player";

export const POST = route(
  async (req) => {
    const raw = await req.json().catch(() => {
      throw new HttpError(400, "So'rov formati noto'g'ri");
    });
    const body = registerSchema.parse(raw);

    const setting = await db.platformSetting.findUnique({ where: { key: "registrationOpen" } });
    if (setting?.value === "false") throw new HttpError(403, "Ro'yxatdan o'tish vaqtincha yopiq");

    const ageGroup = ageGroupFromBirthYear(body.birthYear);
    const passwordHash = await hashPassword(body.password);

    try {
      const user = await db.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: { email: body.email, username: body.username, passwordHash, birthYear: body.birthYear, ageGroup, country: body.country },
        });
        await provisionPlayer(tx, { userId: u.id, username: u.username, ageGroup });

        // Yosh himoyasi: 13 yoshgacha profil yopiq, davlat yashirin
        if (ageGroup === "CHILD") {
          await tx.profile.update({ where: { userId: u.id }, data: { isPublic: false, showCountry: false, showFriends: false } });
        }
        return u;
      });

      await createSession(user.id, user.role);
      return ok({ user: { id: user.id, username: user.username, ageGroup } }, 201);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new HttpError(409, "Bu email yoki foydalanuvchi nomi band");
      }
      throw e;
    }
  },
  { limit: 10, windowMs: 15 * 60_000, key: "auth:register" },
);