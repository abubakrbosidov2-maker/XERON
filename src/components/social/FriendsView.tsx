"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, Trash2, Trophy, UserPlus, X } from "lucide-react";
import { AvatarHead } from "@/components/avatar/AvatarHead";
import { api } from "@/lib/client-api";
import { countryName } from "@/lib/countries";
import type { FriendRow, FriendsData, PersonDTO, SearchHit } from "@/lib/social-meta";

type Msg = { ok: boolean; text: string } | null;

function Person({ p, children }: { p: PersonDTO; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
      <AvatarHead avatar={p.avatar} size={46} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{p.username}</div>
        <div className="text-xs text-white/45">Daraja {p.level}{p.country ? ` · ${countryName(p.country)}` : ""}</div>
        {p.title && <div className="text-xs text-amber-200/80">{p.title}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

export function FriendsView({ data }: { data: FriendsData }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  async function run(fn: () => Promise<string | void>) {
    setBusy(true);
    setMsg(null);
    try {
      const text = await fn();
      if (text) setMsg({ ok: true, text });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Xatolik" });
    } finally {
      setBusy(false);
    }
  }

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim().toLowerCase();
    if (term.length < 2) { setMsg({ ok: false, text: "Kamida 2 ta belgi kiriting" }); return; }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(term)}`);
      const d = (await res.json().catch(() => ({}))) as { hits?: SearchHit[]; error?: string };
      if (!res.ok) throw new Error(d.error ?? "Xatolik yuz berdi");
      setHits(d.hits ?? []);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Xatolik" });
    } finally {
      setBusy(false);
    }
  };

  const sendTo = (username: string) => run(async () => {
    const r = await api<{ status: "SENT" | "ACCEPTED" }>("/api/friends", { action: "request", username });
    setHits((h) => (h ? h.map((x) => (x.username === username ? { ...x, relation: r.status === "ACCEPTED" ? "FRIEND" : "SENT" } : x)) : h));
    return r.status === "ACCEPTED" ? `${username} bilan do'st bo'ldingiz!` : "So'rov yuborildi";
  });
  const act = (action: "accept" | "decline" | "remove", row: FriendRow) =>
    run(async () => { await api("/api/friends", { action, id: row.friendshipId }); });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Do'stlar</h1>
          <p className="text-sm text-white/50">{data.friends.length} ta do'st.</p>
        </div>
        <Link href="/leaderboard?scope=FRIENDS&period=ALL" className="btn-ghost !py-2 text-sm"><Trophy size={16} /> Do'stlar reytingi</Link>
      </div>

      {msg && <p role="status" className={`rounded-xl border px-4 py-2 text-sm ${msg.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200"}`}>{msg.text}</p>}

      <section className="glass p-5">
        <h2 className="mb-3 text-sm font-semibold text-white/70">Do'st qidirish</h2>
        <form onSubmit={search} className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Foydalanuvchi nomining boshi (masalan: kenji)" maxLength={20} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 outline-none placeholder:text-white/30 focus:border-volt focus:ring-2 focus:ring-volt/30" />
          <button type="submit" disabled={busy} className="btn-neon"><Search size={16} /> Qidirish</button>
        </form>
        {hits && (
          <div className="mt-4 space-y-2">
            {hits.length === 0 && <p className="text-sm text-white/45">Hech kim topilmadi. Yopiq profillarni qidiruvda ko'rib bo'lmaydi, lekin aniq nomini quyida yozib so'rov yuborishingiz mumkin.</p>}
            {hits.map((h) => (
              <Person key={h.username} p={h}>
                {h.relation === "NONE" && <button type="button" disabled={busy} onClick={() => sendTo(h.username)} className="rounded-lg bg-volt/20 px-3 py-1.5 text-sm hover:bg-volt/30"><UserPlus size={14} className="mr-1 inline" />Qo'shish</button>}
                {h.relation === "SENT" && <span className="text-xs text-white/45">So'rov yuborilgan</span>}
                {h.relation === "FRIEND" && <span className="inline-flex items-center gap-1 text-xs text-emerald-300"><Check size={13} /> Do'st</span>}
                {h.relation === "RECEIVED" && <span className="text-xs text-amber-200">Sizga so'rov yuborgan, pastda qabul qiling</span>}
              </Person>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) void sendTo(name.trim().toLowerCase()).then(() => setName("")); }} className="mt-5 flex gap-2 border-t border-white/10 pt-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aniq foydalanuvchi nomi" maxLength={20} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 outline-none placeholder:text-white/30 focus:border-volt" />
          <button type="submit" disabled={busy || !name.trim()} className="btn-ghost">So'rov yuborish</button>
        </form>
      </section>

      {data.incoming.length > 0 && (
        <section className="glass p-5">
          <h2 className="mb-3 text-sm font-semibold text-white/70">Kelgan so'rovlar ({data.incoming.length})</h2>
          <div className="space-y-2">
            {data.incoming.map((r) => (
              <Person key={r.friendshipId} p={r}>
                <button type="button" disabled={busy} onClick={() => act("accept", r)} className="rounded-lg bg-emerald-400/20 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-400/30"><Check size={14} className="mr-1 inline" />Qabul</button>
                <button type="button" disabled={busy} onClick={() => act("decline", r)} aria-label="Rad etish" className="rounded-lg border border-white/10 p-2 text-white/50 hover:text-rose-300"><X size={14} /></button>
              </Person>
            ))}
          </div>
        </section>
      )}

      <section className="glass p-5">
        <h2 className="mb-3 text-sm font-semibold text-white/70">Mening do'stlarim ({data.friends.length})</h2>
        {data.friends.length === 0 ? <p className="text-sm text-white/45">Hozircha do'stlaringiz yo'q. Yuqoridan qidirib so'rov yuboring.</p> : (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.friends.map((f) => (
              <Person key={f.friendshipId} p={f}>
                <button type="button" disabled={busy} onClick={() => { if (window.confirm(`${f.username} ni do'stlardan olib tashlaysizmi?`)) void act("remove", f); }} aria-label="Olib tashlash" className="rounded-lg border border-white/10 p-2 text-white/40 hover:text-rose-300"><Trash2 size={14} /></button>
              </Person>
            ))}
          </div>
        )}
      </section>

      {data.outgoing.length > 0 && (
        <section className="glass p-5">
          <h2 className="mb-3 text-sm font-semibold text-white/70">Yuborilgan so'rovlar ({data.outgoing.length})</h2>
          <div className="space-y-2">
            {data.outgoing.map((r) => (
              <Person key={r.friendshipId} p={r}>
                <button type="button" disabled={busy} onClick={() => act("remove", r)} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 hover:text-white">Bekor qilish</button>
              </Person>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}