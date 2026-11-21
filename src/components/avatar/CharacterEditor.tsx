"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FlipHorizontal2, RotateCcw, Save } from "lucide-react";
import { Avatar } from "./Avatar";
import {
  BASE_GLOWS, BODIES, DEFAULT_APPEARANCE, EYE_COLORS, FACES, HAIR_COLORS, HAIR_STYLES, POSES, PRESETS, SKIN_TONES, SLOTS,
  type AppearanceData,
} from "@/lib/avatar-config";
import { STAT_KEYS, toVisual, type CharacterBundle, type ItemDTO, type StatKey } from "@/lib/item-dto";
import { RARITY_META } from "@/lib/rarity";

const STAT_NAMES: Record<StatKey, string> = {
  strength: "Kuch", intelligence: "Aql", speed: "Tezlik", creativity: "Ijodkorlik", endurance: "Chidamlilik", luck: "Omad",
};

function fits(item: ItemDTO, body: AppearanceData["body"]) {
  return item.gender === "ANY" || body === "neutral" || (item.gender === "MALE" && body === "male") || (item.gender === "FEMALE" && body === "female");
}

function bonusText(item: ItemDTO) {
  const parts = STAT_KEYS.filter((k) => item.bonuses[k] > 0).map((k) => `+${item.bonuses[k]} ${STAT_NAMES[k]}`);
  return parts.length ? parts.join(", ") : "Bonussiz (faqat ko'rinish)";
}

function Swatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={color} className={`h-8 w-8 rounded-full border-2 transition ${active ? "scale-110 border-white shadow-neon" : "border-white/20 hover:border-white/60"}`} style={{ background: color }} />
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-lg border px-3 py-1.5 text-sm transition ${active ? "border-volt bg-volt/20 text-white" : "border-white/10 bg-white/5 text-white/60 hover:text-white"}`}>
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-white/70">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

async function call(method: string, url: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Xatolik yuz berdi");
  return data as { bundle: CharacterBundle };
}

export function CharacterEditor({ mode, initial }: { mode: "create" | "edit"; initial: CharacterBundle }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial.appearance);
  const [look, setLook] = useState<AppearanceData>(initial.appearance);
  const [equipped, setEquipped] = useState(initial.equipped);
  const [bonuses, setBonuses] = useState(initial.bonuses);
  const [preview, setPreview] = useState<ItemDTO | null>(null);
  const [flip, setFlip] = useState(false);
  const [tab, setTab] = useState<"look" | "gear" | "skins">("look");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = JSON.stringify(look) !== JSON.stringify(saved);
  const set = <K extends keyof AppearanceData>(k: K, v: AppearanceData[K]) => setLook((p) => ({ ...p, [k]: v }));

  const visuals = useMemo(() => {
    const base = equipped.filter((e) => !preview || e.slot !== preview.slot).map((e) => toVisual(e.item));
    return preview ? [...base, toVisual(preview)] : base;
  }, [equipped, preview]);

  function apply(b: CharacterBundle) {
    setEquipped(b.equipped);
    setBonuses(b.bonuses);
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMsg(null);
    try { await fn(); } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Xatolik" }); } finally { setBusy(false); }
  }

  const save = () => run(async () => {
    const { bundle } = await call("PUT", "/api/character/appearance", look);
    setSaved(bundle.appearance);
    setLook(bundle.appearance);
    apply(bundle);
    setMsg({ ok: true, text: "Tashqi ko'rinish saqlandi" });
    if (mode === "create") { router.push("/dashboard"); router.refresh(); }
  });

  const equip = (item: ItemDTO) => run(async () => {
    const { bundle } = await call("POST", "/api/character/equip", { itemId: item.id });
    apply(bundle);
    setPreview(null);
    setMsg({ ok: true, text: `${item.name} kiyildi` });
  });

  const unequip = (slot: string) => run(async () => {
    const { bundle } = await call("POST", "/api/character/unequip", { slot });
    apply(bundle);
    setPreview(null);
  });

  const equippedIn = (slot: string) => equipped.find((e) => e.slot === slot)?.item;
  const tabs = mode === "create" ? ([["look", "Tashqi ko'rinish"]] as const) : ([["look", "Tashqi ko'rinish"], ["gear", "Jihozlar"], ["skins", "Kolleksiya"]] as const);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[360px_1fr]">
      <section className="glass flex flex-col items-center p-6 lg:sticky lg:top-24 lg:self-start">
        <div className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-navy-800 to-void">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
          <Avatar appearance={look} equipped={visuals} size={250} flip={flip} animated />
        </div>
        <div className="mt-4 text-center">
          <div className="font-display text-lg font-bold">{initial.name}</div>
          <div className="text-xs text-white/45">Daraja {initial.level}</div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {POSES.map((p) => <Chip key={p.id} active={look.pose === p.id} onClick={() => set("pose", p.id)}>{p.label}</Chip>)}
          <button type="button" onClick={() => setFlip((f) => !f)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60 hover:text-white">
            <FlipHorizontal2 size={14} /> Aylantirish
          </button>
        </div>
        {preview && (
          <button type="button" onClick={() => setPreview(null)} className="mt-3 inline-flex items-center gap-2 text-xs text-amber-200">
            <EyeOff size={14} /> «{preview.name}» ko'rilmoqda. Bekor qilish
          </button>
        )}
        <div className="mt-5 w-full space-y-1.5">
          {STAT_KEYS.map((k) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-white/60">{STAT_NAMES[k]}</span>
              <span>{initial.stats[k]}{bonuses[k] > 0 && <span className="text-emerald-300"> +{bonuses[k]}</span>}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass p-6">
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map(([id, label]) => <Chip key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Chip>)}
        </div>

        {tab === "look" && (
          <div className="space-y-6">
            <Group title="Tayyor uslublar">
              {PRESETS.map((p) => <Chip key={p.id} active={false} onClick={() => setLook((prev) => ({ ...prev, ...p.look }))}>{p.label}</Chip>)}
            </Group>
            <Group title="Tana turi">
              {BODIES.map((b) => <Chip key={b.id} active={look.body === b.id} onClick={() => set("body", b.id)}>{b.label}</Chip>)}
            </Group>
            <Group title="Teri rangi">{SKIN_TONES.map((c) => <Swatch key={c} color={c} active={look.skinTone === c} onClick={() => set("skinTone", c)} />)}</Group>
            <Group title="Soch turi">{HAIR_STYLES.map((h) => <Chip key={h.id} active={look.hairStyle === h.id} onClick={() => set("hairStyle", h.id)}>{h.label}</Chip>)}</Group>
            <Group title="Soch rangi">{HAIR_COLORS.map((c) => <Swatch key={c} color={c} active={look.hairColor === c} onClick={() => set("hairColor", c)} />)}</Group>
            <Group title="Yuz ifodasi">{FACES.map((f) => <Chip key={f.id} active={look.face === f.id} onClick={() => set("face", f.id)}>{f.label}</Chip>)}</Group>
            <Group title="Ko'z rangi">{EYE_COLORS.map((c) => <Swatch key={c} color={c} active={look.eyeColor === c} onClick={() => set("eyeColor", c)} />)}</Group>
            <Group title="Taglik nuri (bepul)">{BASE_GLOWS.map((a) => <Chip key={a.id} active={look.aura === a.id} onClick={() => set("aura", a.id)}>{a.label}</Chip>)}</Group>

            <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
              <button type="button" onClick={save} disabled={busy || (!dirty && mode === "edit")} className="btn-neon">
                <Save size={16} /> {mode === "create" ? "Qahramonni tasdiqlash va boshlash" : "Saqlash"}
              </button>
              <button type="button" onClick={() => setLook(DEFAULT_APPEARANCE)} className="btn-ghost"><RotateCcw size={16} /> Asl holatga qaytarish</button>
              {dirty && <span className="text-xs text-amber-200">Saqlanmagan o'zgarishlar bor</span>}
            </div>
          </div>
        )}

        {tab === "gear" && (
          <div className="space-y-5">
            {SLOTS.filter((s) => s.id !== "SKIN").map((slot) => {
              const current = equippedIn(slot.id);
              const options = initial.owned.filter((i) => i.slot === slot.id && fits(i, look.body));
              return (
                <div key={slot.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{slot.label}</h3>
                    {current ? (
                      <button type="button" disabled={busy} onClick={() => unequip(slot.id)} className="text-xs text-white/50 hover:text-white">Yechish</button>
                    ) : <span className="text-xs text-white/35">Bo'sh</span>}
                  </div>
                  {options.length === 0 ? (
                    <p className="mt-2 text-sm text-white/40">Bu uya uchun buyumingiz yo'q.</p>
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {options.map((it) => {
                        const r = RARITY_META[it.rarity];
                        const on = current?.id === it.id;
                        return (
                          <div key={it.id} className="rounded-lg border bg-white/5 p-3" style={{ borderColor: on ? "#ffffff" : r.color + "66" }}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-medium">{it.name}</span>
                              <span className="shrink-0 text-xs" style={{ color: r.color }}>{r.label}</span>
                            </div>
                            <div className="mt-1 text-xs text-white/45">{bonusText(it)}</div>
                            <div className="mt-2 flex gap-2">
                              <button type="button" disabled={busy} onClick={() => (on ? unequip(slot.id) : equip(it))} className="rounded-md bg-volt/20 px-3 py-1 text-xs hover:bg-volt/30">{on ? "Yechish" : "Kiyish"}</button>
                              <button type="button" onClick={() => setPreview(preview?.id === it.id ? null : it)} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-1 text-xs text-white/60 hover:text-white"><Eye size={12} /> Ko'rish</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "skins" && (
          <div>
            <p className="mb-4 text-sm text-white/50">Maxsus personaj skinlari. Skin teri va ko'z rangini almashtiradi.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="font-medium">Standart personaj</div>
                <div className="mt-1 text-xs text-white/45">O'zingiz yaratgan ko'rinish</div>
                <button type="button" disabled={busy || !equippedIn("SKIN")} onClick={() => unequip("SKIN")} className="mt-3 rounded-md bg-volt/20 px-3 py-1 text-xs disabled:opacity-40">{equippedIn("SKIN") ? "Tanlash" : "Tanlangan"}</button>
              </div>
              {initial.owned.filter((i) => i.slot === "SKIN").map((it) => {
                const r = RARITY_META[it.rarity];
                const on = equippedIn("SKIN")?.id === it.id;
                return (
                  <div key={it.id} className="rounded-xl border bg-white/5 p-4" style={{ borderColor: on ? "#ffffff" : r.color + "66" }}>
                    <div className="flex justify-between"><span className="font-medium">{it.name}</span><span className="text-xs" style={{ color: r.color }}>{r.label}</span></div>
                    <div className="mt-1 text-xs text-white/45">{it.description}</div>
                    <div className="mt-3 flex gap-2">
                      <button type="button" disabled={busy || on} onClick={() => equip(it)} className="rounded-md bg-volt/20 px-3 py-1 text-xs disabled:opacity-40">{on ? "Tanlangan" : "Tanlash"}</button>
                      <button type="button" onClick={() => setPreview(preview?.id === it.id ? null : it)} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-1 text-xs text-white/60"><Eye size={12} /> Ko'rish</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {initial.owned.filter((i) => i.slot === "SKIN").length === 0 && <p className="mt-4 text-sm text-white/40">Hali skin yo'q. Do'kon ochilganda bu yerda paydo bo'ladi.</p>}
          </div>
        )}

        {msg && <p role="status" className={`mt-4 text-sm ${msg.ok ? "text-emerald-300" : "text-rose-300"}`}>{msg.text}</p>}
      </section>
    </div>
  );
}