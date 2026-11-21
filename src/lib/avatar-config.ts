export interface AppearanceData {
  body: "male" | "female" | "neutral";
  skinTone: string;
  hairStyle: "short" | "long" | "spiky" | "bun" | "mohawk" | "bald";
  hairColor: string;
  face: "calm" | "happy" | "fierce" | "cool";
  eyeColor: string;
  pose: "idle" | "hero" | "wave";
  aura: "none" | "volt" | "arcane" | "ember";
}

export interface EquippedVisual { slot: string; visualKey: string; c1: string; c2: string }
export interface Geom { s: number; w: number; h: number }

export const BODY_GEOM: Record<string, Geom> = {
  male: { s: 40, w: 31, h: 29 },
  female: { s: 33, w: 24, h: 32 },
  neutral: { s: 37, w: 28, h: 30 },
};

export const DEFAULT_APPEARANCE: AppearanceData = {
  body: "neutral", skinTone: "#e0ac69", hairStyle: "short", hairColor: "#2b2118",
  face: "calm", eyeColor: "#2f8cff", pose: "idle", aura: "none",
};

export const BODIES = [
  { id: "male", label: "Erkak" }, { id: "female", label: "Ayol" }, { id: "neutral", label: "Neytral" },
] as const;
export const SKIN_TONES = ["#ffdbac", "#f1c27d", "#e0ac69", "#c68642", "#a9744f", "#8d5524", "#6b4226", "#4a2c17"];
export const HAIR_COLORS = ["#111827", "#2b2118", "#6b3f1d", "#92400e", "#ca8a04", "#e5c07b", "#be123c", "#7c3aed", "#0ea5e9", "#10b981", "#e5e7eb"];
export const EYE_COLORS = ["#2f8cff", "#22c55e", "#a16207", "#7c3aed", "#ef4444", "#0f172a", "#06b6d4"];
export const HAIR_STYLES = [
  { id: "short", label: "Qisqa" }, { id: "long", label: "Uzun" }, { id: "spiky", label: "Tikkaygan" },
  { id: "bun", label: "To'g'nog'ich" }, { id: "mohawk", label: "Mohok" }, { id: "bald", label: "Taqir" },
] as const;
export const FACES = [
  { id: "calm", label: "Xotirjam" }, { id: "happy", label: "Quvnoq" }, { id: "fierce", label: "Qat'iyatli" }, { id: "cool", label: "Sovuqqon" },
] as const;
export const POSES = [
  { id: "idle", label: "Oddiy" }, { id: "hero", label: "Qahramon" }, { id: "wave", label: "Salom" },
] as const;
export const BASE_GLOWS = [
  { id: "none", label: "Yo'q" }, { id: "volt", label: "Volt" }, { id: "arcane", label: "Arkan" }, { id: "ember", label: "Cho'g'" },
] as const;

export const PRESETS: { id: string; label: string; look: Partial<AppearanceData> }[] = [
  { id: "cyber", label: "Kiber", look: { hairStyle: "spiky", hairColor: "#0ea5e9", face: "cool", eyeColor: "#06b6d4", aura: "volt" } },
  { id: "mage", label: "Sehrgar", look: { hairStyle: "long", hairColor: "#7c3aed", face: "calm", eyeColor: "#7c3aed", aura: "arcane" } },
  { id: "rogue", label: "Soyaparast", look: { hairStyle: "short", hairColor: "#111827", face: "fierce", eyeColor: "#ef4444", aura: "none" } },
  { id: "scout", label: "Skaut", look: { hairStyle: "bun", hairColor: "#92400e", face: "happy", eyeColor: "#22c55e", aura: "none" } },
  { id: "punk", label: "Pank", look: { hairStyle: "mohawk", hairColor: "#be123c", face: "fierce", eyeColor: "#a16207", aura: "ember" } },
  { id: "sage", label: "Donishmand", look: { hairStyle: "bald", hairColor: "#2b2118", face: "calm", eyeColor: "#2f8cff", aura: "volt" } },
];

export const SLOTS = [
  { id: "TOP", label: "Ust kiyim" }, { id: "JACKET", label: "Kurtka / zirh" }, { id: "BOTTOM", label: "Shim / yubka" },
  { id: "SHOES", label: "Poyabzal" }, { id: "GLOVES", label: "Qo'lqop" }, { id: "MASK", label: "Niqob" },
  { id: "GLASSES", label: "Ko'zoynak" }, { id: "HEAD", label: "Bosh aksessuari" }, { id: "BACK", label: "Orqa buyum" },
  { id: "EFFECT", label: "Maxsus effekt" }, { id: "SKIN", label: "Skin" },
] as const;

/** hex rangni yorqinroq (+) yoki to'qroq (-) qiladi, amt: -1..1 */
export function shade(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}