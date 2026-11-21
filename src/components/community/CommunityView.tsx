"use client";
import { useState } from "react";
import { Flag, Heart, MessageCircle, Send, Share2, Trash2, Trophy, UserCheck, UserPlus, X } from "lucide-react";
import { AvatarHead } from "@/components/avatar/AvatarHead";
import { api } from "@/lib/client-api";
import { countryName } from "@/lib/countries";
import { REPORT_LABELS, type AchievementOption, type CommentDTO, type FeedPage, type PostDTO, type ReportReason } from "@/lib/community-meta";
import { RARITY_META } from "@/lib/rarity";

type Msg = { ok: boolean; text: string } | null;
type Tab = "ALL" | "FOLLOWING";
const INPUT = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none placeholder:text-white/30 focus:border-volt focus:ring-2 focus:ring-volt/30";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "hozirgina";
  if (s < 3600) return `${Math.floor(s / 60)} daqiqa oldin`;
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`;
  return `${Math.floor(s / 86400)} kun oldin`;
}

interface ReportTarget { type: "POST" | "COMMENT"; id: string }

export function CommunityView({ initial, achievements, me }: { initial: FeedPage; achievements: AchievementOption[]; me: { username: string; role: string } }) {
  const [tab, setTab] = useState<Tab>("ALL");
  const [posts, setPosts] = useState<PostDTO[]>(initial.posts);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [text, setText] = useState("");
  const [shareId, setShareId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [report, setReport] = useState<ReportTarget | null>(null);
  const [reason, setReason] = useState<ReportReason>("INAPPROPRIATE");
  const [details, setDetails] = useState("");

  const staff = me.role === "ADMIN" || me.role === "MODERATOR";
  const fail = (e: unknown) => setMsg({ ok: false, text: e instanceof Error ? e.message : "Xatolik" });

  async function fetchFeed(t: Tab, cur?: string): Promise<FeedPage> {
    const res = await fetch(`/api/community?tab=${t}${cur ? `&cursor=${encodeURIComponent(cur)}` : ""}`);
    const d = (await res.json().catch(() => ({}))) as FeedPage & { error?: string };
    if (!res.ok) throw new Error(d.error ?? "Xatolik yuz berdi");
    return d;
  }

  async function reload(t: Tab = tab) {
    const f = await fetchFeed(t);
    setPosts(f.posts);
    setCursor(f.nextCursor);
  }

  async function changeTab(t: Tab) {
    setTab(t);
    setBusy(true);
    setMsg(null);
    try { await reload(t); } catch (e) { fail(e); } finally { setBusy(false); }
  }

  async function more() {
    if (!cursor) return;
    setBusy(true);
    try {
      const f = await fetchFeed(tab, cursor);
      setPosts((p) => [...p, ...f.posts.filter((x) => !p.some((y) => y.id === x.id))]);
      setCursor(f.nextCursor);
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/community", { action: "post", content: text });
      setText("");
      setMsg({ ok: true, text: "Post joylandi" });
      await reload();
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  async function share() {
    if (!shareId) return;
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/community", { action: "share_achievement", achievementId: shareId });
      setShareId("");
      setMsg({ ok: true, text: "Yutuq ulashildi" });
      await reload();
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  const patch = (id: string, fn: (p: PostDTO) => PostDTO) => setPosts((list) => list.map((p) => (p.id === id ? fn(p) : p)));

  async function like(p: PostDTO) {
    try {
      const r = await api<{ liked: boolean; likes: number }>("/api/community", { action: "like", id: p.id });
      patch(p.id, (x) => ({ ...x, liked: r.liked, likes: r.likes }));
    } catch (e) { fail(e); }
  }

  async function follow(p: PostDTO) {
    try {
      const r = await api<{ following: boolean }>("/api/community", { action: "follow", username: p.author.username });
      setPosts((list) => list.map((x) => (x.author.username === p.author.username ? { ...x, following: r.following } : x)));
    } catch (e) { fail(e); }
  }

  async function removePost(p: PostDTO) {
    if (!window.confirm("Postni o'chirasizmi?")) return;
    try {
      await api("/api/community", { action: "delete_post", id: p.id });
      setPosts((list) => list.filter((x) => x.id !== p.id));
    } catch (e) { fail(e); }
  }

  async function toggleComments(p: PostDTO) {
    const next = new Set(open);
    if (next.has(p.id)) { next.delete(p.id); setOpen(next); return; }
    next.add(p.id);
    setOpen(next);
    if (p.commentCount > p.comments.length) {
      try {
        const r = await api<{ comments: CommentDTO[] }>("/api/community", { action: "load_comments", id: p.id });
        patch(p.id, (x) => ({ ...x, comments: r.comments, commentCount: r.comments.length }));
      } catch (e) { fail(e); }
    }
  }

  async function sendComment(p: PostDTO) {
    const content = (drafts[p.id] ?? "").trim();
    if (!content) return;
    setMsg(null);
    try {
      const r = await api<{ comment: CommentDTO }>("/api/community", { action: "comment", id: p.id, content });
      setDrafts((d) => ({ ...d, [p.id]: "" }));
      patch(p.id, (x) => ({ ...x, comments: [...x.comments, r.comment], commentCount: x.commentCount + 1 }));
    } catch (e) { fail(e); }
  }

  async function removeComment(p: PostDTO, c: CommentDTO) {
    try {
      await api("/api/community", { action: "delete_comment", id: c.id });
      patch(p.id, (x) => ({ ...x, comments: x.comments.filter((y) => y.id !== c.id), commentCount: Math.max(0, x.commentCount - 1) }));
    } catch (e) { fail(e); }
  }

  async function sendReport() {
    if (!report) return;
    setBusy(true);
    try {
      await api("/api/community", { action: "report", targetType: report.type, id: report.id, reason, details });
      setReport(null);
      setDetails("");
      setMsg({ ok: true, text: "Shikoyat yuborildi. Rahmat, moderatorlar ko'rib chiqadi." });
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Hamjamiyat</h1>
        <p className="text-sm text-white/50">Muloqot xavfsiz bo'lishi uchun havola, telefon raqam, email va so'kinishlar bloklanadi. Qoidabuzarlikni «Shikoyat» orqali xabar bering.</p>
      </div>

      <form onSubmit={publish} className="glass space-y-3 p-4">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={500} placeholder="Nima yangilik? Yutuqlaringiz, maslahatlaringiz yoki savolingizni ulashing..." className={INPUT} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-white/40">{text.length} / 500</span>
          <button type="submit" disabled={busy || !text.trim()} className="btn-neon !py-2"><Send size={15} /> Joylash</button>
        </div>
        {achievements.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            <Trophy size={15} className="text-amber-300" />
            <select aria-label="Yutuq tanlash" value={shareId} onChange={(e) => setShareId(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-volt">
              <option value="">Yutuqni ulashish...</option>
              {achievements.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button type="button" disabled={busy || !shareId} onClick={share} className="btn-ghost !py-2 text-sm"><Share2 size={14} /> Ulashish</button>
          </div>
        )}
      </form>

      <div className="flex gap-2">
        {([["ALL", "Hammasi"], ["FOLLOWING", "Kuzatilayotganlar"]] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => changeTab(k)} className={`rounded-lg border px-3 py-1.5 text-sm transition ${tab === k ? "border-volt bg-volt/20 text-white" : "border-white/10 bg-white/5 text-white/60 hover:text-white"}`}>{label}</button>
        ))}
      </div>

      {msg && <p role="status" className={`rounded-xl border px-4 py-2 text-sm ${msg.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200"}`}>{msg.text}</p>}

      {posts.length === 0 ? (
        <p className="glass p-10 text-center text-white/50">{tab === "FOLLOWING" ? "Kuzatayotganlaringizdan hali post yo'q. «Hammasi» bo'limidan kimnidir kuzatishni boshlang." : "Hali postlar yo'q. Birinchi bo'lib yozing!"}</p>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => {
            const rc = p.achievement ? RARITY_META[p.achievement.rarity]?.color ?? "#f59e0b" : null;
            return (
              <article key={p.id} className="glass p-5">
                <header className="flex items-start gap-3">
                  <AvatarHead avatar={p.author.avatar} size={46} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{p.author.username}</span>
                      {p.isMine && <span className="text-xs text-volt-glow">(siz)</span>}
                      {p.author.title && <span className="text-xs text-amber-200/80">{p.author.title}</span>}
                    </div>
                    <div className="text-xs text-white/40">Daraja {p.author.level}{p.author.country ? ` · ${countryName(p.author.country)}` : ""} · {timeAgo(p.createdAt)}</div>
                  </div>
                  {p.canFollow && !p.isMine && (
                    <button type="button" onClick={() => follow(p)} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition ${p.following ? "border-emerald-400/40 text-emerald-300" : "border-white/15 text-white/60 hover:text-white"}`}>
                      {p.following ? <><UserCheck size={13} /> Kuzatilmoqda</> : <><UserPlus size={13} /> Kuzatish</>}
                    </button>
                  )}
                </header>

                <p className="mt-3 whitespace-pre-wrap break-words text-white/85">{p.content}</p>

                {p.achievement && rc && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: rc + "66", background: rc + "14" }}>
                    <Trophy size={22} style={{ color: rc }} />
                    <div><div className="font-semibold" style={{ color: rc }}>{p.achievement.name}</div><div className="text-xs text-white/55">{p.achievement.description}</div></div>
                  </div>
                )}

                <footer className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/10 pt-3 text-sm">
                  <button type="button" onClick={() => like(p)} className={`inline-flex items-center gap-1.5 transition ${p.liked ? "text-rose-400" : "text-white/55 hover:text-white"}`} aria-pressed={p.liked}>
                    <Heart size={16} fill={p.liked ? "currentColor" : "none"} /> {p.likes}
                  </button>
                  <button type="button" onClick={() => toggleComments(p)} className="inline-flex items-center gap-1.5 text-white/55 transition hover:text-white"><MessageCircle size={16} /> {p.commentCount}</button>
                  <span className="flex-1" />
                  {!p.isMine && <button type="button" onClick={() => { setReport({ type: "POST", id: p.id }); setMsg(null); }} className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white"><Flag size={13} /> Shikoyat</button>}
                  {(p.isMine || staff) && <button type="button" onClick={() => removePost(p)} className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-rose-300"><Trash2 size={13} /> O'chirish</button>}
                </footer>

                {open.has(p.id) && (
                  <div className="mt-4 space-y-3">
                    {p.comments.map((c) => (
                      <div key={c.id} className="flex gap-2.5">
                        <AvatarHead avatar={c.author.avatar} size={32} />
                        <div className="min-w-0 flex-1 rounded-xl bg-white/5 px-3 py-2">
                          <div className="flex items-center justify-between gap-2 text-xs text-white/45"><span className="font-medium text-white/80">{c.author.username}</span><span>{timeAgo(c.createdAt)}</span></div>
                          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{c.content}</p>
                          <div className="mt-1 flex gap-3 text-[11px] text-white/35">
                            {!c.isMine && <button type="button" onClick={() => { setReport({ type: "COMMENT", id: c.id }); setMsg(null); }} className="hover:text-white">Shikoyat</button>}
                            {(c.isMine || p.isMine || staff) && <button type="button" onClick={() => removeComment(p, c)} className="hover:text-rose-300">O'chirish</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                    <form onSubmit={(e) => { e.preventDefault(); void sendComment(p); }} className="flex gap-2">
                      <input value={drafts[p.id] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))} maxLength={300} placeholder="Izoh yozing..." className={INPUT} />
                      <button type="submit" disabled={!(drafts[p.id] ?? "").trim()} className="btn-neon !px-3" aria-label="Yuborish"><Send size={15} /></button>
                    </form>
                  </div>
                )}
              </article>
            );
          })}
          {cursor && <button type="button" onClick={more} disabled={busy} className="btn-ghost w-full">{busy ? "Yuklanmoqda..." : "Ko'proq ko'rsatish"}</button>}
        </div>
      )}

      {report && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setReport(null)} role="dialog" aria-modal="true" aria-label="Shikoyat">
          <div className="glass relative w-full max-w-md space-y-4 p-6" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setReport(null)} aria-label="Yopish" className="absolute right-4 top-4 text-white/50 hover:text-white"><X size={18} /></button>
            <h2 className="font-display text-lg font-bold">Shikoyat yuborish</h2>
            <label className="block text-sm text-white/60">Sabab
              <select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)} className="mt-1 w-full rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-white outline-none focus:border-volt">
                {(Object.keys(REPORT_LABELS) as ReportReason[]).map((k) => <option key={k} value={k}>{REPORT_LABELS[k]}</option>)}
              </select>
            </label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={300} placeholder="Qo'shimcha izoh (ixtiyoriy)" className={INPUT} />
            <p className="text-xs text-white/40">Bir nechta alohida o'yinchidan shikoyat kelsa, kontent moderator ko'rib chiqquncha avtomatik yashiriladi.</p>
            <button type="button" onClick={sendReport} disabled={busy} className="btn-neon w-full">{busy ? "..." : "Yuborish"}</button>
          </div>
        </div>
      )}
    </div>
  );
}