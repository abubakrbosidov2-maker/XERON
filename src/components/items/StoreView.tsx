"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Lock, ShoppingBag } from "lucide-react";
import { Avatar } from "@/components/avatar/Avatar";
import { ItemModal, ItemThumb, Price, RarityBadge, bonusText } from "./ItemUI";
import { RARITY_META } from "@/lib/rarity";
import { RARITIES } from "@/lib/game";
import { toVisual, type CharacterBundle, type ItemDTO } from "@/lib/item-dto";

export interface StoreItem extends ItemDTO { owned: boolean; lock: string | null }
interface Wallet { coins: number; gems: number }
type Msg = { ok: boolean; text: string } | null;

const SECTIONS: { id: string; label: string; test: (i: ItemDTO) => boolean }[] = [
  { id: "featured", label: "Tavsiya etilgan", test: (i) => i.isFeatured },
  { id: "clothing", label: "Kiyimlar", test: (i) => i.category === "CLOTHES" || i.category === "ARMOR" },
  { id: "shoes", label: "Poyabzal", test: (i) => i.category === "SHOES" },
  { id: "accessories", label: "Aksessuarlar", test: (i) => ["ACCESSORY", "MASK", "GLOVES", "BACK"].includes(i.category) },
  { id: "skins", label: "Skin va effektlar", test: (i) => i.category === "SKIN" || i.category === "EFFECT" },
  { id: "seasonal", label: "Mavsumiy", test: (i) => !!i.season },
  { id: "exclusive", label: "Eksklyuziv yutuqlar", test: (i) => i.hasAchievement || (i.priceCoins === 0 && i.priceGems === 0) },
  { id: "all", label: "Hammasi", test: () => true },
];

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Xatolik yuz berdi");
  return data as T;
}

export function StoreView({ bundle, items, wallet: initialWallet }: { bundle: CharacterBundle; items: StoreItem[]; wallet: Wallet }) {
  const router = useRouter();
  const [equipped, setEquipped] = useState(bundle.equipped);
  const [owned, setOwned] = useState(() => new Set(items.filter((i) => i.owned).map((i) => i.id)));
  const [wallet, setWallet] = useState(initialWallet);
  const [section, setSection] = useState("featured");
  const [preview, setPreview] = useState<ItemDTO | null>(null);
  const [selected, setSelected] = useState<StoreItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const visible = useMemo(() => {
    const sec = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
    return items
      .filter((i) => sec.test(i))
      .sort((a, b) => RARITIES.indexOf(a.rarity as never) - RARITIES.indexOf(b.rarity as never) || a.priceCoins - b.priceCoins);
  }, [items, section]);

  const visuals = useMemo(() => {
    const base = equipped.filter((e) => !preview || e.slot !== preview.slot).map((e) => toVisual(e.item));
    return preview ? [...base, toVisual(preview)] : base;
  }, [equipped, preview]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMsg(null);
    try { await fn(); } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Xatolik" }); } finally { setBusy(false); }
  }

  const buy = (item: StoreItem) => run(async () => {
    const data = await post<{ wallet: Wallet }>("/api/store/purchase", { itemId: item.id });
    setOwned((p) => new Set(p).add(item.id));
    setWallet(data.wallet);
    setMsg({ ok: true, text: `«${item.name}» sotib olindi!` });
    router.refresh();
  });

  const wear = (item: ItemDTO) => run(async () => {
    const data = await post<{ bundle: CharacterBundle }>("/api/character/equip", { itemId: item.id });
    setEquipped(data.bundle.equipped);
    setPreview(null);
    setSelected(null);
    setMsg({ ok: true, text: `«${item.name}» kiyildi` });
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">XERON do'koni</h1>
          <p className="text-sm text-white/50">Buyum kuchi nodirligiga bog'liq, narxiga emas. Tasodifiy qutilar yo'q.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="glass flex flex-col items-center p-5 lg:sticky lg:top-24 lg:self-start">
          <div className="relative flex h-[360px] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-navy-800 to-void">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
            <Avatar appearance={bundle.appearance} equipped={visuals} size={210} animated />
          </div>
          {preview ? (
            <button type="button" onClick={() => setPreview(null)} className="mt-3 inline-flex items-center gap-2 text-xs text-amber-200"><EyeOff size={14} /> «{preview.name}» kiyib ko'rilmoqda. Bekor qilish</button>
          ) : <p className="mt-3 text-center text-xs text-white/40">«Ko'rish» tugmasi buyumni personajingizda ko'rsatadi.</p>}
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <button key={s.id} type="button" onClick={() => setSection(s.id)} className={`rounded-lg border px-3 py-1.5 text-sm transition ${section === s.id ? "border-volt bg-volt/20 text-white" : "border-white/10 bg-white/5 text-white/60 hover:text-white"}`}>{s.label}</button>
            ))}
          </div>

          {msg && <p role="status" className={`mb-4 rounded-xl border px-4 py-2 text-sm ${msg.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200"}`}>{msg.text}</p>}

          {visible.length === 0 ? (
            <p className="glass p-8 text-center text-white/50">Bu bo'limda hozircha buyum yo'q.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((it) => {
                const r = RARITY_META[it.rarity] ?? RARITY_META.COMMON;
                const isOwned = owned.has(it.id);
                return (
                  <div key={it.id} className="glass flex flex-col p-4 transition hover:-translate-y-0.5" style={{ borderColor: r.color + "55" }}>
                    <div className="flex gap-3">
                      <ItemThumb item={it} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{it.name}</div>
                        <div className="mt-1"><RarityBadge rarity={it.rarity} /></div>
                        <div className="mt-2 text-xs text-emerald-300/90">{bonusText(it)}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      {isOwned ? <span className="inline-flex items-center gap-1 text-sm text-emerald-300"><Check size={14} /> Sizda bor</span>
                        : it.lock ? <span className="inline-flex items-center gap-1 text-xs text-white/45"><Lock size={13} /> {it.lock}</span>
                        : <Price coins={it.priceCoins} gems={it.priceGems} />}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => setSelected(it)} className="btn-neon flex-1 !py-2 text-sm"><ShoppingBag size={14} /> Batafsil</button>
                      <button type="button" onClick={() => setPreview(preview?.id === it.id ? null : it)} aria-label="Kiyib ko'rish" className="rounded-xl border border-white/10 px-3 text-white/60 hover:text-white"><Eye size={16} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selected && (() => {
        const isOwned = owned.has(selected.id);
        const afford = wallet.coins >= selected.priceCoins && wallet.gems >= selected.priceGems;
        return (
          <ItemModal item={selected} onClose={() => setSelected(null)}>
            {isOwned ? (
              selected.slot !== "NONE" ? <button type="button" disabled={busy} onClick={() => wear(selected)} className="btn-neon">Hozir kiyish</button> : <span className="text-sm text-emerald-300">Sizda bor</span>
            ) : selected.lock ? (
              <span className="inline-flex items-center gap-2 text-sm text-white/55"><Lock size={14} /> {selected.lock}</span>
            ) : (
              <>
                <button type="button" disabled={busy || !afford} onClick={() => buy(selected)} className="btn-neon">{selected.priceCoins + selected.priceGems === 0 ? "Bepul olish" : "Sotib olish"}</button>
                {!afford && <span className="self-center text-xs text-rose-300">Balans yetarli emas</span>}
              </>
            )}
            <button type="button" onClick={() => { setPreview(selected); setSelected(null); }} className="btn-ghost"><Eye size={16} /> Kiyib ko'rish</button>
            {msg && <p className={`w-full text-sm ${msg.ok ? "text-emerald-300" : "text-rose-300"}`}>{msg.text}</p>}
          </ItemModal>
        );
      })()}
    </div>
  );
}