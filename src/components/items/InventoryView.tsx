"use client";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Save, Trash2 } from "lucide-react";
import { Avatar } from "@/components/avatar/Avatar";
import { SLOTS } from "@/lib/avatar-config";
import { RARITIES } from "@/lib/game";
import { RARITY_META } from "@/lib/rarity";
import { toVisual, type CharacterBundle, type ItemDTO, type LoadoutDTO } from "@/lib/item-dto";
import { CATEGORY_LABELS, ItemModal, ItemThumb, RarityBadge, bonusText } from "./ItemUI";

export type InvEntry = ItemDTO & { acquiredAt: string };
type Msg = { ok: boolean; text: string } | null;

async function call<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Xatolik yuz berdi");
  return data as T;
}

const SELECT = "w-full rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-volt";

export function InventoryView({ bundle, entries, loadouts: initialLoadouts }: { bundle: CharacterBundle; entries: InvEntry[]; loadouts: LoadoutDTO[] }) {
  const [equipped, setEquipped] = useState(bundle.equipped);
  const [bonuses, setBonuses] = useState(bundle.bonuses);
  const [loadouts, setLoadouts] = useState(initialLoadouts);
  const [rarity, setRarity] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("rarity");
  const [preview, setPreview] = useState<ItemDTO | null>(null);
  const [selected, setSelected] = useState<InvEntry | null>(null);
  const [loadoutName, setLoadoutName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const equippedIds = useMemo(() => new Set(equipped.map((e) => e.item.id)), [equipped]);

  const list = useMemo(() => {
    const out = entries.filter((e) => (rarity === "ALL" || e.rarity === rarity) && (category === "ALL" || e.category === category));
    out.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "newest") return b.acquiredAt.localeCompare(a.acquiredAt);
      if (sort === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      return RARITIES.indexOf(b.rarity as never) - RARITIES.indexOf(a.rarity as never) || a.name.localeCompare(b.name);
    });
    return out;
  }, [entries, rarity, category, sort]);

  const visuals = useMemo(() => {
    const base = equipped.filter((e) => !preview || e.slot !== preview.slot).map((e) => toVisual(e.item));
    return preview ? [...base, toVisual(preview)] : base;
  }, [equipped, preview]);

  function applyBundle(b: CharacterBundle) {
    setEquipped(b.equipped);
    setBonuses(b.bonuses);
    setPreview(null);
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMsg(null);
    try { await fn(); } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Xatolik" }); } finally { setBusy(false); }
  }

  const equip = (it: ItemDTO) => run(async () => {
    const d = await call<{ bundle: CharacterBundle }>("POST", "/api/character/equip", { itemId: it.id });
    applyBundle(d.bundle);
    setMsg({ ok: true, text: `«${it.name}» kiyildi` });
  });
  const unequip = (slot: string) => run(async () => {
    const d = await call<{ bundle: CharacterBundle }>("POST", "/api/character/unequip", { slot });
    applyBundle(d.bundle);
  });
  const saveLoadout = () => run(async () => {
    const d = await call<{ loadouts: LoadoutDTO[] }>("POST", "/api/loadouts", { name: loadoutName });
    setLoadouts(d.loadouts);
    setLoadoutName("");
    setMsg({ ok: true, text: "To'plam saqlandi" });
  });
  const applyLoadout = (id: string) => run(async () => {
    const d = await call<{ bundle: CharacterBundle; skipped: number }>("POST", "/api/loadouts/apply", { id });
    applyBundle(d.bundle);
    setMsg({ ok: true, text: d.skipped > 0 ? `To'plam qo'llandi (${d.skipped} ta buyum mavjud emas)` : "To'plam qo'llandi" });
  });
  const removeLoadout = (id: string) => run(async () => {
    const d = await call<{ loadouts: LoadoutDTO[] }>("DELETE", "/api/loadouts", { id });
    setLoadouts(d.loadouts);
  });

  const slotRows = SLOTS.filter((s) => s.id !== "SKIN" || equipped.some((e) => e.slot === "SKIN"));
  const bonusEntries = Object.entries(bonuses).filter(([, v]) => v > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Inventar</h1>
        <p className="text-sm text-white/50">{entries.length} ta buyum</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="glass flex flex-col items-center p-4">
            <div className="relative flex h-[320px] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-navy-800 to-void">
              <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
              <Avatar appearance={bundle.appearance} equipped={visuals} size={190} animated />
            </div>
            {preview && <button type="button" onClick={() => setPreview(null)} className="mt-3 inline-flex items-center gap-2 text-xs text-amber-200"><EyeOff size={14} /> «{preview.name}» ko'rilmoqda. Bekor qilish</button>}
            <div className="mt-3 text-center text-xs text-white/50">
              {bonusEntries.length ? <>Jihoz bonuslari: <span className="text-emerald-300">{bonusEntries.map(([k, v]) => `+${v} ${({ strength: "Kuch", intelligence: "Aql", speed: "Tezlik", creativity: "Ijod", endurance: "Chidam", luck: "Omad" } as Record<string, string>)[k]}`).join(", ")}</span></> : "Jihoz bonuslari yo'q"}
            </div>
          </div>

          <div className="glass p-4">
            <h2 className="mb-3 text-sm font-semibold text-white/70">Kiyilgan jihozlar</h2>
            <ul className="space-y-1.5 text-sm">
              {slotRows.map((s) => {
                const cur = equipped.find((e) => e.slot === s.id)?.item;
                return (
                  <li key={s.id} className="flex items-center justify-between gap-2">
                    <span className="text-white/45">{s.label}</span>
                    {cur ? (
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate" style={{ color: RARITY_META[cur.rarity]?.color }}>{cur.name}</span>
                        <button type="button" disabled={busy} onClick={() => unequip(s.id)} aria-label={`${s.label} yechish`} className="text-white/40 hover:text-white">✕</button>
                      </span>
                    ) : <span className="text-white/25">—</span>}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="glass p-4">
            <h2 className="mb-3 text-sm font-semibold text-white/70">Saqlangan to'plamlar</h2>
            <div className="flex gap-2">
              <input value={loadoutName} onChange={(e) => setLoadoutName(e.target.value)} maxLength={24} placeholder="To'plam nomi" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-volt" />
              <button type="button" disabled={busy || !loadoutName.trim()} onClick={saveLoadout} className="btn-neon !px-3 !py-2" aria-label="Saqlash"><Save size={16} /></button>
            </div>
            <ul className="mt-3 space-y-2">
              {loadouts.length === 0 && <li className="text-xs text-white/40">Hozircha to'plam yo'q. Hozirgi kiyimni nom bilan saqlang.</li>}
              {loadouts.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{l.name} <span className="text-xs text-white/35">({l.itemCount})</span></span>
                  <span className="flex shrink-0 gap-2">
                    <button type="button" disabled={busy} onClick={() => applyLoadout(l.id)} className="rounded-md bg-volt/20 px-2.5 py-1 text-xs hover:bg-volt/30">Qo'llash</button>
                    <button type="button" disabled={busy} onClick={() => removeLoadout(l.id)} aria-label="O'chirish" className="text-white/40 hover:text-rose-300"><Trash2 size={14} /></button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section>
          <div className="glass mb-4 grid gap-3 p-4 sm:grid-cols-3">
            <label className="block text-xs text-white/50">Nodirlik
              <select value={rarity} onChange={(e) => setRarity(e.target.value)} className={`${SELECT} mt-1`}>
                <option value="ALL">Hammasi</option>
                {RARITIES.map((r) => <option key={r} value={r}>{RARITY_META[r].label}</option>)}
              </select>
            </label>
            <label className="block text-xs text-white/50">Kategoriya
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${SELECT} mt-1`}>
                <option value="ALL">Hammasi</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="block text-xs text-white/50">Saralash
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${SELECT} mt-1`}>
                <option value="rarity">Nodirligi (yuqoridan)</option>
                <option value="newest">Yangi olinganlar</option>
                <option value="name">Nomi (A-Z)</option>
                <option value="category">Kategoriya</option>
              </select>
            </label>
          </div>

          {msg && <p role="status" className={`mb-4 rounded-xl border px-4 py-2 text-sm ${msg.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200"}`}>{msg.text}</p>}

          {list.length === 0 ? (
            <p className="glass p-8 text-center text-white/50">Filtrga mos buyum topilmadi.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((it) => {
                const r = RARITY_META[it.rarity] ?? RARITY_META.COMMON;
                const on = equippedIds.has(it.id);
                return (
                  <div key={it.id} className="glass p-4" style={{ borderColor: on ? "#ffffff88" : r.color + "55" }}>
                    <button type="button" onClick={() => setSelected(it)} className="flex w-full gap-3 text-left">
                      <ItemThumb item={it} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{it.name}</span>
                        <span className="mt-1 flex items-center gap-2"><RarityBadge rarity={it.rarity} /><span className="text-xs text-white/40">{CATEGORY_LABELS[it.category]}</span></span>
                        <span className="mt-2 block text-xs text-emerald-300/90">{bonusText(it)}</span>
                      </span>
                    </button>
                    {it.slot !== "NONE" && (
                      <div className="mt-3 flex gap-2">
                        <button type="button" disabled={busy} onClick={() => (on ? unequip(it.slot) : equip(it))} className="flex-1 rounded-lg bg-volt/20 py-1.5 text-sm hover:bg-volt/30">{on ? "Yechish" : "Kiyish"}</button>
                        <button type="button" onClick={() => setPreview(preview?.id === it.id ? null : it)} aria-label="Kiyib ko'rish" className="rounded-lg border border-white/10 px-3 text-white/60 hover:text-white"><Eye size={15} /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {selected && (
        <ItemModal item={selected} onClose={() => setSelected(null)}>
          {selected.slot !== "NONE" && (
            <button type="button" disabled={busy} onClick={() => (equippedIds.has(selected.id) ? unequip(selected.slot) : equip(selected))} className="btn-neon">
              {equippedIds.has(selected.id) ? "Yechish" : "Kiyish"}
            </button>
          )}
          {selected.slot !== "NONE" && <button type="button" onClick={() => { setPreview(selected); setSelected(null); }} className="btn-ghost"><Eye size={16} /> Kiyib ko'rish</button>}
          <span className="w-full text-xs text-white/35">Olingan sana: {new Date(selected.acquiredAt).toLocaleDateString("en-GB")}</span>
        </ItemModal>
      )}
    </div>
  );
}