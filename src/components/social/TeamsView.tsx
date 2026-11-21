"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Crown, Lock, LogOut, Shield, Sparkles, Target, Unlock, UserPlus, Users } from "lucide-react";
import { AvatarHead } from "@/components/avatar/AvatarHead";
import { api } from "@/lib/client-api";
import { ROLE_LABELS, type TeamDetail, type TeamMemberDTO, type TeamRole, type TeamsPageData } from "@/lib/social-meta";

type Msg = { ok: boolean; text: string } | null;
const INPUT = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none placeholder:text-white/30 focus:border-volt focus:ring-2 focus:ring-volt/30";
const SELECT = "rounded-lg border border-white/10 bg-navy-800 px-2 py-1.5 text-xs text-white outline-none focus:border-volt";

export function TeamsView({ data }: { data: TeamsPageData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [cName, setCName] = useState("");
  const [cTag, setCTag] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cPublic, setCPublic] = useState(true);
  const [invName, setInvName] = useState("");
  const [desc, setDesc] = useState(data.mine?.description ?? "");
  const [pub, setPub] = useState(data.mine?.isPublic ?? true);

  async function act(body: Record<string, unknown>, okText?: string) {
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/teams", body);
      if (okText) setMsg({ ok: true, text: okText });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Xatolik" });
    } finally {
      setBusy(false);
    }
  }

  const banner = msg && <p role="status" className={`rounded-xl border px-4 py-2 text-sm ${msg.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200"}`}>{msg.text}</p>;

  // ───── Jamoam ─────
  if (data.mine) {
    const t: TeamDetail = data.mine;
    const manager = t.myRole === "OWNER" || t.myRole === "OFFICER";
    const owner = t.myRole === "OWNER";

    const memberActions = (m: TeamMemberDTO) => {
      if (m.isMe || m.role === "OWNER") return null;
      if (owner) {
        return (
          <>
            <select aria-label="Rol" value={m.role} disabled={busy} onChange={(e) => {
              const role = e.target.value as TeamRole;
              if (role === "OWNER" && !window.confirm(`Sardorlikni ${m.username} ga topshirasizmi?`)) return;
              void act({ action: "set_role", username: m.username, role }, "Rol o'zgartirildi");
            }} className={SELECT}>
              <option value="MEMBER">A'zo</option>
              <option value="OFFICER">Yordamchi</option>
              <option value="OWNER">Sardorlik topshirish</option>
            </select>
            <button type="button" disabled={busy} onClick={() => { if (window.confirm(`${m.username} ni jamoadan chiqarasizmi?`)) void act({ action: "kick", username: m.username }, "A'zo chiqarildi"); }} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/55 hover:text-rose-300">Chiqarish</button>
          </>
        );
      }
      if (t.myRole === "OFFICER" && m.role === "MEMBER") {
        return <button type="button" disabled={busy} onClick={() => { if (window.confirm(`${m.username} ni jamoadan chiqarasizmi?`)) void act({ action: "kick", username: m.username }, "A'zo chiqarildi"); }} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/55 hover:text-rose-300">Chiqarish</button>;
      }
      return null;
    };

    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="glass p-6 shadow-neon">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="rounded-xl bg-gradient-to-br from-volt/30 to-arcane/30 p-3 text-volt-glow"><Shield size={28} /></span>
              <div>
                <h1 className="font-display text-2xl font-bold">{t.name} <span className="text-base text-white/40">[{t.tag}]</span></h1>
                <p className="mt-1 max-w-xl text-sm text-white/60">{t.description || "Tavsif yo'q"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/50">
                  <span className="inline-flex items-center gap-1"><Users size={12} /> {t.members.length} / {t.maxMembers}</span>
                  <span className="inline-flex items-center gap-1">{t.isPublic ? <Unlock size={12} /> : <Lock size={12} />} {t.isPublic ? "Ochiq jamoa" : "Yopiq jamoa"}</span>
                  <span>Sizning rolingiz: <b className="text-white/80">{ROLE_LABELS[t.myRole]}</b></span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-white/5 px-5 py-3"><div className="font-display text-2xl font-bold text-gradient">{t.teamXp.toLocaleString("en-US")}</div><div className="text-xs text-white/45">Jamoa XP</div></div>
              <div className="rounded-xl bg-white/5 px-5 py-3"><div className="font-display text-2xl font-bold">#{t.rank}</div><div className="text-xs text-white/45">Reytingda</div></div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/missions" className="btn-neon !py-2 text-sm"><Target size={16} /> Jamoa missiyalari</Link>
            <Link href="/leaderboard?scope=TEAMS&period=ALL" className="btn-ghost !py-2 text-sm">Jamoalar reytingi</Link>
          </div>
          <p className="mt-3 text-xs text-white/40">A'zo missiya yoki musobaqada XP olsa, jamoa XP si ham shunga oshadi (qo'shilganidan keyin).</p>
        </section>

        {banner}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="glass p-5">
            <h2 className="mb-3 text-sm font-semibold text-white/70">A'zolar</h2>
            <div className="space-y-2">
              {t.members.map((m) => (
                <div key={m.username} className={`flex flex-wrap items-center gap-3 rounded-xl p-3 ${m.isMe ? "bg-volt/10" : "bg-white/5"}`}>
                  <AvatarHead avatar={m.avatar} size={46} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="truncate">{m.username}</span>
                      {m.role === "OWNER" && <Crown size={14} className="shrink-0 text-amber-300" />}
                      {m.isMe && <span className="text-xs text-volt-glow">(siz)</span>}
                    </div>
                    <div className="text-xs text-white/45">{ROLE_LABELS[m.role]} · Daraja {m.level} · {m.xp.toLocaleString("en-US")} XP</div>
                  </div>
                  <div className="flex items-center gap-2">{memberActions(m)}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="glass p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/70"><Award size={15} /> Jamoa yutuqlari</h2>
              <ul className="space-y-2 text-sm">
                {t.achievements.map((a) => (
                  <li key={a.key} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${a.unlocked ? "bg-emerald-400/10 text-emerald-100" : "bg-white/5 text-white/40"}`}>
                    <Sparkles size={14} className="shrink-0" />
                    <span><b>{a.name}</b><span className="block text-xs opacity-70">{a.description}</span></span>
                  </li>
                ))}
              </ul>
            </section>

            {manager && (
              <section className="glass p-5">
                <h2 className="mb-3 text-sm font-semibold text-white/70">A'zo taklif qilish</h2>
                <form onSubmit={(e) => { e.preventDefault(); if (invName.trim()) void act({ action: "invite", username: invName.trim().toLowerCase() }, "Taklif yuborildi").then(() => setInvName("")); }} className="flex gap-2">
                  <input value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="Foydalanuvchi nomi" maxLength={20} className={INPUT} />
                  <button type="submit" disabled={busy || !invName.trim()} className="btn-neon !px-3" aria-label="Taklif yuborish"><UserPlus size={16} /></button>
                </form>
                {t.invited.length > 0 && <p className="mt-3 text-xs text-white/45">Kutilayotgan takliflar: {t.invited.join(", ")}</p>}
              </section>
            )}

            {owner && (
              <section className="glass space-y-3 p-5">
                <h2 className="text-sm font-semibold text-white/70">Jamoa sozlamalari</h2>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} maxLength={200} placeholder="Jamoa tavsifi" className={INPUT} />
                <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} className="h-4 w-4 accent-volt" /> Ochiq jamoa (hamma qo'shila oladi)</label>
                <button type="button" disabled={busy} onClick={() => act({ action: "update", description: desc, isPublic: pub }, "Saqlandi")} className="btn-ghost w-full !py-2 text-sm">Saqlash</button>
                <button type="button" disabled={busy} onClick={() => { if (window.confirm("Jamoani tarqatasizmi? Bu qaytarib bo'lmaydi.")) void act({ action: "disband" }); }} className="w-full rounded-xl border border-rose-500/30 py-2 text-sm text-rose-300 hover:bg-rose-500/10">Jamoani tarqatish</button>
              </section>
            )}

            <button type="button" disabled={busy} onClick={() => { if (window.confirm("Jamoani tark etasizmi?")) void act({ action: "leave" }); }} className="btn-ghost w-full"><LogOut size={16} /> Jamoani tark etish</button>
          </div>
        </div>
      </div>
    );
  }

  // ───── Jamoada emas ─────
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Jamoalar</h1>
        <p className="text-sm text-white/50">Jamoa bilan birgalikda XP yig'ing, jamoa missiyalarini bajaring va reytingda ko'tariling.</p>
      </div>
      {banner}

      {data.invites.length > 0 && (
        <section className="glass border-amber-400/30 p-5">
          <h2 className="mb-3 text-sm font-semibold text-amber-200">Sizga takliflar</h2>
          <div className="space-y-2">
            {data.invites.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 p-3">
                <div><b>{i.teamName}</b> <span className="text-xs text-white/40">[{i.tag}]</span><div className="text-xs text-white/45">Taklif qildi: {i.by}</div></div>
                <div className="flex gap-2">
                  <button type="button" disabled={busy} onClick={() => act({ action: "accept_invite", id: i.id })} className="rounded-lg bg-emerald-400/20 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-400/30">Qabul qilish</button>
                  <button type="button" disabled={busy} onClick={() => act({ action: "decline_invite", id: i.id })} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 hover:text-white">Rad etish</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="glass p-5">
          <h2 className="mb-3 text-sm font-semibold text-white/70">Ochiq jamoalar</h2>
          {data.browse.length === 0 ? <p className="text-sm text-white/45">Hozircha ochiq jamoa yo'q. Birinchi jamoani o'zingiz yarating!</p> : (
            <div className="space-y-2">
              {data.browse.map((b) => (
                <div key={b.name} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/5 p-3">
                  <span className="rounded-lg bg-volt/15 p-2 text-volt-glow"><Shield size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{b.name} <span className="text-xs text-white/40">[{b.tag}]</span></div>
                    <div className="text-xs text-white/45">{b.members}/{b.maxMembers} a'zo · {b.teamXp.toLocaleString("en-US")} XP · sardor: {b.owner}</div>
                    {b.description && <div className="mt-1 line-clamp-1 text-xs text-white/55">{b.description}</div>}
                  </div>
                  {b.joinable
                    ? <button type="button" disabled={busy} onClick={() => act({ action: "join", name: b.name })} className="btn-neon !px-4 !py-1.5 text-sm">Qo'shilish</button>
                    : <span className="text-xs text-white/40">{b.reason}</span>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass p-5">
          <h2 className="mb-3 text-sm font-semibold text-white/70">Jamoa yaratish</h2>
          <form onSubmit={(e) => { e.preventDefault(); void act({ action: "create", name: cName, tag: cTag, description: cDesc, isPublic: cPublic }, "Jamoa yaratildi!"); }} className="space-y-3">
            <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Jamoa nomi" minLength={3} maxLength={24} required className={INPUT} />
            <input value={cTag} onChange={(e) => setCTag(e.target.value.toUpperCase())} placeholder="Teg (2-5 harf), masalan NOVA" minLength={2} maxLength={5} required className={INPUT} />
            <textarea value={cDesc} onChange={(e) => setCDesc(e.target.value)} rows={3} maxLength={200} placeholder="Tavsif (ixtiyoriy)" className={INPUT} />
            <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={cPublic} onChange={(e) => setCPublic(e.target.checked)} className="h-4 w-4 accent-volt" /> Ochiq jamoa</label>
            <button type="submit" disabled={busy} className="btn-neon w-full">{busy ? "..." : "Jamoa yaratish"}</button>
          </form>
          <p className="mt-3 text-xs text-white/40">Har kim jamoa yarata oladi va istalgan ochiq jamoaga qo'shila oladi.</p>
        </section>
      </div>
    </div>
  );
}