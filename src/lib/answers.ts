import { createHash } from "crypto";

/** Javobni normallashtirib (kichik harf, ortiqcha bo'shliqsiz) SHA-256 bilan hash qiladi.
 *  To'g'ri javoblar bazada faqat hash ko'rinishida saqlanadi va mijozga hech qachon yuborilmaydi. */
export const normalizeAnswer = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
export const hashAnswer = (s: string) => createHash("sha256").update(normalizeAnswer(s)).digest("hex");
export const checkAnswer = (given: string, hash: string) => hashAnswer(given) === hash;