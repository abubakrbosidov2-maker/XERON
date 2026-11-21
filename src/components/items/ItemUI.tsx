"use client";
import { Coins, Gem, Package, X } from "lucide-react";
import { Avatar } from "@/components/avatar/Avatar";
import { DEFAULT_APPEARANCE, type AppearanceData } from "@/lib/avatar-config";
import { RARITY_META } from "@/lib/rarity";
import { STAT_KEYS, type ItemDTO, type StatKey } from "@/lib/item-dto";

export const STAT_NAMES: Record<StatKey, string> = {
  strength: "Kuch", intelligence: "Aql", speed: "Tezlik", creativity: "Ijodkorlik", endurance: "Chidamlilik", luck: "Omad",
};

export const CATEGORY_LABELS: Record<string, string> = {
  CLOTHES: "Kiyim", SHOES: "Poyabzal", ARMOR: "Zirh", MASK: "Niqob", GLOVES: "Qo'lqop",
  ACCESSORY: "Aksessuar", BACK: "Orqa buyum", EFFECT: "Effekt", SKIN: "Skin", MATERIAL: "Material",
};

export function bonusText(item: ItemDTO) {
  const parts = STAT_KEYS.filter((k) => item.bonuses[k] > 0).map((k) => `+${item.bonuses[k]} ${STAT_NAMES[k]}`);
  return parts.length ? parts.join(", ") : "Bonussiz (faqat ko'rinish)";
}

// Buyumni manekenda ko'rsatish uchun avatarning qaysi qismi kesib olinadi: [x, y, kenglik, balandlik] (200x320 birlikda)
const REGION: Record<string, [number, number, number, number]> = {
  HEAD: [58, 0, 84, 84], MASK: [62, 34, 76, 66], GLASSES: [62, 38, 76, 50], TOP: [44, 90, 112, 112],
  JACKET: [40, 90, 120, 130], BOTTOM: [50, 172, 100, 128], SHOES: [48, 256, 104, 52], GLOVES: [20, 140, 160, 64],
  BACK: [0, 90, 200, 190], EFFECT: [0, 0, 200, 320], SKIN: [30, 0, 140, 300],
};

export function ItemThumb({ item, box = 88 }: { item: ItemDTO; box?: number }) {
  const rc = RARITY_META[item.rarity]?.color ?? "#9aa3b2";
  const bg = `radial-gradient(circle at 50% 40%, ${rc}33, #0a0e24 72%)`;
  const reg = REGION[item.slot];
  if (!reg) {
    return (
      <div className="flex shrink-0 items-center justify-center rounded-xl" style={{ width: box, height: box, background: bg, color: item.c1 }}>
        <Package size={box * 0.45} />
      </div>
    );
  }
  const [x, y, w, h] = reg;
  const k = box / Math.max(w, h);
  const left = (box - w * k) / 2 - x * k;
  const top = (box - h * k) / 2 - y * k;
  const body: AppearanceData["body"] = item.gender === "FEMALE" ? "female" : item.gender === "MALE" ? "male" : "neutral";
  const look: AppearanceData = { ...DEFAULT_APPEARANCE, body };
  return (
    <div className="relative shrink-0 overflow-hidden rounded-xl" style={{ width: box, height: box, background: bg }}>
      <div style={{ position: "absolute", left, top }}>
        <Avatar appearance={look} equipped={[{ slot: item.slot, visualKey: item.visualKey, c1: item.c1, c2: item.c2 }]} size={200 * k} className="block max-w-none" />
      </div>
    </div>
  );
}

export function RarityBadge({ rarity }: { rarity: string }) {
  const r = RARITY_META[rarity] ?? RARITY_META.COMMON;
  return <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium" style={{ borderColor: r.color + "88", color: r.color }}>{r.label}</span>;
}

export function Price({ coins, gems }: { coins: number; gems: number }) {
  if (coins <= 0 && gems <= 0) return <span className="text-sm font-semibold text-emerald-300">Bepul</span>;
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      {coins > 0 && <span className="inline-flex items-center gap-1 text-amber-200"><Coins size={14} />{coins.toLocaleString("en-US")}</span>}
      {gems > 0 && <span className="inline-flex items-center gap-1 text-fuchsia-200"><Gem size={14} />{gems.toLocaleString("en-US")}</span>}
    </span>
  );
}

export function ItemModal({ item, onClose, children }: { item: ItemDTO; onClose: () => void; children?: React.ReactNode }) {
  const r = RARITY_META[item.rarity] ?? RARITY_META.COMMON;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="glass relative w-full max-w-md p-6" style={{ borderColor: r.color + "88", boxShadow: `0 0 40px ${r.color}33` }} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Yopish" className="absolute right-4 top-4 text-white/50 hover:text-white"><X size={18} /></button>
        <div className="flex gap-4">
          <ItemThumb item={item} box={110} />
          <div className="min-w-0">
            <div className="font-display text-lg font-bold">{item.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2"><RarityBadge rarity={item.rarity} /><span className="text-xs text-white/45">{CATEGORY_LABELS[item.category] ?? item.category}</span></div>
            {item.season && <div className="mt-1 text-xs text-sky-300">Mavsumiy: {item.season}</div>}
          </div>
        </div>
        <p className="mt-4 text-sm text-white/70">{item.description}</p>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-white/50">Bonuslar</dt><dd className="text-emerald-300">{bonusText(item)}</dd></div>
          <div className="flex justify-between"><dt className="text-white/50">Kerakli daraja</dt><dd>{item.unlockLevel}</dd></div>
          {item.unlockRequirement && <div className="flex justify-between gap-4"><dt className="text-white/50">Shart</dt><dd className="text-right">{item.unlockRequirement}</dd></div>}
          <div className="flex justify-between"><dt className="text-white/50">Narx</dt><dd><Price coins={item.priceCoins} gems={item.priceGems} /></dd></div>
        </dl>
        {children && <div className="mt-5 flex flex-wrap gap-2">{children}</div>}
      </div>
    </div>
  );
}