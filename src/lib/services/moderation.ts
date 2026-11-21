import { db } from "../db";

// Asosiy taqiqlangan so'zlar. Admin panelda "bannedWords" sozlamasi orqali (vergul bilan) kengaytirish mumkin.
const BASE_WORDS = ["fuck", "shit", "bitch", "cunt", "nigger", "faggot", "porn"];

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|ru|uz|io|me|ly|gg|tv|xyz|info|co|app)\b)/i;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /\d(?:[\s\-().]?\d){6,}/;

/** Kontent filtri hamma foydalanuvchi uchun bir xil. Muammo bo'lsa xabar qaytaradi, yo'q bo'lsa null. */
export async function checkContent(text: string): Promise<string | null> {
  if (LINK.test(text)) return "Havolalar (linklar) taqiqlangan";
  if (EMAIL.test(text) || PHONE.test(text)) return "Telefon raqam va email ulashish taqiqlangan (maxfiylik uchun)";

  const setting = await db.platformSetting.findUnique({ where: { key: "bannedWords" } });
  const extra = (setting?.value ?? "").split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
  const normalized = " " + text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ") + " ";
  for (const w of [...BASE_WORDS, ...extra]) {
    if (normalized.includes(` ${w} `)) return "Nojo'ya so'zlar ishlatish taqiqlangan";
  }
  return null;
}