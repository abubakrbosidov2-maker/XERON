import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Foydalanuvchi nomi kamida 3 belgi")
  .max(20, "Foydalanuvchi nomi ko'pi bilan 20 belgi")
  .regex(/^[a-z0-9_]+$/, "Faqat lotin harflari, raqam va _");

export const passwordSchema = z
  .string()
  .min(8, "Parol kamida 8 belgi")
  .max(72, "Parol ko'pi bilan 72 belgi")
  .regex(/[A-Za-z]/, "Parolda harf bo'lishi kerak")
  .regex(/[0-9]/, "Parolda raqam bo'lishi kerak");

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email noto'g'ri"),
  username: usernameSchema,
  password: passwordSchema,
  birthYear: z.number().int().min(1930).max(new Date().getFullYear() - 6, "Yosh juda kichik"),
  country: z.string().length(2, "Davlat kodi (2 harf)").toUpperCase(),
});

export const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(3).max(100),
  password: z.string().min(1).max(72),
});

export const appearanceSchema = z.object({
  body: z.enum(["male", "female", "neutral"]),
  skinTone: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  hairStyle: z.enum(["short", "long", "spiky", "bun", "mohawk", "bald"]),
  hairColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  face: z.enum(["calm", "happy", "fierce", "cool"]),
  eyeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  pose: z.enum(["idle", "hero", "wave"]),
  aura: z.enum(["none", "volt", "arcane", "ember"]),
});

/** Foydalanuvchi matnidan boshqaruv belgilarini olib tashlaydi.
 *  React matnni avtomatik escape qiladi; dangerouslySetInnerHTML ishlatilmaydi. */
export const safeText = (max: number) =>
  z.string().trim().min(1).max(max).transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ""));

export function ageGroupFromBirthYear(year: number): "CHILD" | "TEEN" | "ADULT" {
  const age = new Date().getFullYear() - year;
  if (age < 13) return "CHILD";
  if (age < 18) return "TEEN";
  return "ADULT";
}