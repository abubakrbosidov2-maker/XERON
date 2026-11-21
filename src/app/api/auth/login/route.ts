import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { route, ok } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, createSession, HttpError } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

// Foydalanuvchi topilmaganda ham bcrypt vaqtini sarflash uchun (hisob mavjudligini oshkor qilmaslik)
const DUMMY_HASH = bcrypt.hashSync("xeron-dummy-password", 12);

export const POST = route(
  async (req) => {
    const raw = await req.json().catch(() => {
      throw new HttpError(400, "So'rov formati noto'g'ri");
    });
    const { identifier, password } = loginSchema.parse(raw);

    // Har bir hisob uchun alohida cheklov (brute-force himoyasi)
    const rl = rateLimit(`login-id:${identifier}`, 8, 15 * 60_000);
    if (!rl.ok) throw new HttpError(429, "Juda ko'p urinish. 15 daqiqadan so'ng qayta urinib ko'ring.");

    const user = await db.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });

    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) throw new HttpError(401, "Login yoki parol noto'g'ri");
    if (user.status !== "ACTIVE") throw new HttpError(403, "Hisob faol emas");

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession(user.id, user.role);
    return ok({ user: { id: user.id, username: user.username, role: user.role } });
  },
  { limit: 30, windowMs: 15 * 60_000, key: "auth:login" },
);