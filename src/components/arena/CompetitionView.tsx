"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Coins, Crown, Medal, Sparkles, Trophy, X } from "lucide-react";
import { ARENA_TYPE_META, type AnswerResult, type CompetitionDetail, type PlayState } from "@/lib/arena-meta";
import { countryName } from "@/lib/countries";
import { Countdown, StatusPill, TimeChip, TypeIcon, formatDuration } from "./ArenaBits";

type Msg = { ok: boolean; text: string } | null;

async function post(path: string, body?: unknown) {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : "{}" });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function CompetitionView({ detail }: { detail: CompetitionDetail }) {
  const router = useRouter();
  const { card, leaderboard, teams, my } = detail;
  const slug = card.slug;
  const color = ARENA_TYPE_META[card.type]?.color ?? "#6db3ff";

  const [play, setPlay] = useState<PlayState | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; points: number } | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const offsetRef = useRef(0); // server va mijoz soatlari orasidagi farq
  const finishingRef = useRef(false);

  const endPlay = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    try { await post(`/api/arena/${slug}/finish`); } catch { /* server baribir vaqtni tekshiradi */ }
    setPlay(null);
    router.refresh();
  }, [slug, router]);

  // Taymer: tugash vaqti serverdan keladi
  useEffect(() => {
    if (!play) return;
    const deadline = new Date(play.deadline).getTime();
    const tick = () => {
      const left = deadline - (Date.now() + offsetRef.current);
      setRemainingMs(Math.max(0, left));
      if (left <= 0) void endPlay();
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [play, endPlay]);

  async function register() {
    setBusy(true); setMsg(null);
    try {
      const { res, data } = await post(`/api/arena/${slug}/register`);
      if (!res.ok) { setMsg({ ok: false, text: data.error ?? "Xatolik yuz berdi" }); return; }
      router.refresh();
    } catch { setMsg({ ok: false, text: "Tarmoq xatosi" }); } finally { setBusy(false); }
  }

  async function start() {
    setBusy(true); setMsg(null);
    try {
      const { res, data } = await post(`/api/arena/${slug}/start`);
      if (!res.ok) { setMsg({ ok: false, text: data.error ?? "Xatolik yuz berdi" }); return; }
      if (data.expired) { router.refresh(); return; }
      const p = data.play as PlayState;
      offsetRef.current = new Date(p.serverNow).getTime() - Date.now();
      finishingRef.current = false;
      setFeedback(null);
      setPlay(p);
    } catch { setMsg({ ok: false, text: "Tarmoq xatosi" }); } finally { setBusy(false); }
  }

  async function answer(questionId: string, selectedIndex: number) {
    if (busy || feedback || !play) return;
    setBusy(true); setMsg(null);
    try {
      const { res, data } = await post(`/api/arena/${slug}/answer`, { questionId, selectedIndex });
      if (!res.ok) { setMsg({ ok: false, text: data.error ?? "Xatolik yuz berdi" }); return; }
      const r = data as AnswerResult;
      if (!r.ok) { setPlay(null); router.refresh(); return; }
      setPlay((p) => (p ? { ...p, score: r.score, answers: { ...p.answers, [questionId]: { correct: r.correct, points: r.points } } } : p));
      setFeedback({ correct: r.correct, points: r.points });
      setTimeout(() => {
        setFeedback(null);
        if (r.finished) { finishingRef.current = true; setPlay(null); router.refresh(); }
      }, 1100);
    } catch { setMsg({ ok: false, text: "Tarmoq xatosi" }); } finally { setBusy(false); }
  }

  // ───── O'yin ekrani ─────
  if (play) {
    const current = play.questions.find((q) => !play.answers[q.id]);
    const answered = Object.keys(play.answers).length;
    const secs = Math.ceil(remainingMs / 1000);
    const frac = Math.min(1, remainingMs / (play.durationSec * 1000));
    const low = secs <= 15;
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="glass flex items-center justify-between p-4">
          <div>
            <div className="text-xs text-white/45">{card.title}</div>
            <div className="font-display text-lg font-bold">Ball: {play.score}</div>
          </div>
          <div className={`font-display text-3xl font-black tabular-nums ${low ? "text-rose-400" : "text-white"}`}>{Math.floor(secs / 60)}:{pad(secs % 60)}</div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full transition-[width] duration-200 ${low ? "bg-rose-400" : "bg-gradient-to-r from-volt to-arcane"}`} style={{ width: `${frac * 100}%` }} /></div>

        {current ? (
          <div className="glass p-6" style={{ borderColor: color + "55" }}>
            <div className="mb-1 text-xs text-white/45">Savol {answered + 1} / {play.questions.length}</div>
            <h2 className="text-xl font-semibold">{current.prompt}</h2>
            <div className="mt-5 grid gap-3">
              {current.options.map((o, i) => (
                <button key={i} type="button" disabled={busy || !!feedback} onClick={() => answer(current.id, i)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-volt hover:bg-volt/15 disabled:opacity-50">
                  <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-xs">{String.fromCharCode(65 + i)}</span>{o}
                </button>
              ))}
            </div>
            {feedback && (
              <div role="status" className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${feedback.correct ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200"}`}>
                {feedback.correct ? <Check size={18} /> : <X size={18} />}
                {feedback.correct ? `To'g'ri! +${feedback.points} ball` : "Noto'g'ri javob"}
              </div>
            )}
            {msg && <p className="mt-4 text-sm text-rose-300">{msg.text}</p>}
          </div>
        ) : (
          <div className="glass p-8 text-center">Natijalar hisoblanmoqda...</div>
        )}
        <button type="button" onClick={endPlay} className="text-sm text-white/45 hover:text-white">Tugatish</button>
      </div>
    );
  }

  const finishedComp = card.status === "FINISHED";
  const canRegister = card.me === "NONE" && !finishedComp && !card.locked;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/arena" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"><ArrowLeft size={16} /> Barcha musobaqalar</Link>

      <section className="glass p-6" style={{ borderColor: color + "55" }}>
        <div className="flex flex-wrap items-start gap-4">
          <TypeIcon type={card.type} size={28} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold">{card.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/50">
              <span>{ARENA_TYPE_META[card.type]?.label}</span>
              <TimeChip seconds={card.durationSec} />
              <span>{card.questionCount} savol</span>
              <span>{card.participants} ishtirokchi</span>
              {card.season && <span className="text-sky-300">{card.season}</span>}
            </div>
          </div>
          <StatusPill status={card.status} />
        </div>
        <p className="mt-4 text-white/70">{card.description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-full bg-volt/15 px-3 py-1 text-volt-glow"><Sparkles size={14} /> {card.xpReward} XP gacha</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-3 py-1 text-amber-200"><Coins size={14} /> {card.coinReward} tanga gacha</span>
          <span className="text-xs text-white/40">+ 1-3 o'rinlar uchun qo'shimcha sovrin (musobaqa yakunida)</span>
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          {card.status === "UPCOMING" && (
            <div className="mb-4 text-center">
              <div className="text-xs text-white/45">Boshlanishiga</div>
              <div className="font-display text-3xl font-bold text-gradient"><Countdown to={card.startsAt} /></div>
            </div>
          )}
          {card.status === "LIVE" && (
            <div className="mb-4 text-center text-sm text-white/50">Musobaqa tugashiga: <b className="text-white"><Countdown to={card.endsAt} /></b></div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {canRegister && <button type="button" onClick={register} disabled={busy} className="btn-neon">{busy ? "..." : "Ro'yxatdan o'tish"}</button>}
            {card.me === "NONE" && card.locked && <span className="text-sm text-white/55">Qatnashib bo'lmaydi: {card.locked}</span>}
            {card.me === "NONE" && finishedComp && <span className="text-sm text-white/50">Musobaqa tugagan.</span>}
            {card.me === "REGISTERED" && card.status === "UPCOMING" && <span className="inline-flex items-center gap-2 text-emerald-300"><Check size={16} /> Ro'yxatdan o'tgansiz. Boshlanishini kuting.</span>}
            {card.me === "REGISTERED" && card.status === "LIVE" && (
              <div className="text-center">
                <button type="button" onClick={start} disabled={busy} className="btn-neon px-8 py-3 text-lg">{busy ? "Yuklanmoqda..." : "Boshlash"}</button>
                <p className="mt-2 text-xs text-white/40">Boshlaganingizdan so'ng {Math.floor(card.durationSec / 60)} daqiqa ichida tugatishingiz kerak. Qayta urinib bo'lmaydi.</p>
              </div>
            )}
            {card.me === "PLAYING" && <button type="button" onClick={start} disabled={busy} className="btn-neon px-8 py-3 text-lg">{busy ? "Yuklanmoqda..." : "Davom ettirish"}</button>}
          </div>
          {msg && <p className={`mt-4 text-center text-sm ${msg.ok ? "text-emerald-300" : "text-rose-300"}`}>{msg.text}</p>}
        </div>
      </section>

      {my && my.status === "FINISHED" && (
        <section className="glass p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Trophy size={18} className="text-amber-300" /> Sizning natijangiz</h2>
          <div className="grid gap-3 text-center sm:grid-cols-4">
            <div className="rounded-xl bg-white/5 p-4"><div className="font-display text-2xl font-bold">{my.score}</div><div className="text-xs text-white/45">Ball</div></div>
            <div className="rounded-xl bg-white/5 p-4"><div className="font-display text-2xl font-bold">{my.correct}/{my.total}</div><div className="text-xs text-white/45">To'g'ri javoblar</div></div>
            <div className="rounded-xl bg-white/5 p-4"><div className="font-display text-2xl font-bold">{my.rank ?? "-"}</div><div className="text-xs text-white/45">Hozirgi o'rin</div></div>
            <div className="rounded-xl bg-white/5 p-4"><div className="text-sm font-semibold text-volt-glow">+{my.rewardXp} XP</div><div className="text-sm font-semibold text-amber-200">+{my.rewardCoins} tanga</div><div className="text-xs text-white/45">Mukofot</div></div>
          </div>
          {!finishedComp && <p className="mt-3 text-center text-xs text-white/40">Yakuniy o'rin va sovrinlar musobaqa tugagach beriladi.</p>}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="glass p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Medal size={18} className="text-volt-glow" /> Reyting</h2>
          {leaderboard.length === 0 ? <p className="text-sm text-white/45">Hali natija yo'q. Birinchi bo'ling!</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-white/40"><tr><th className="pb-2">#</th><th className="pb-2">O'yinchi</th><th className="pb-2">Daraja</th><th className="pb-2 text-right">Ball</th><th className="pb-2 text-right">Vaqt</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {leaderboard.map((r) => (
                    <tr key={r.rank + r.username} className={r.isMe ? "bg-volt/10" : ""}>
                      <td className="py-2 pr-2 font-semibold">{r.rank === 1 ? <Crown size={16} className="text-amber-300" /> : r.rank}</td>
                      <td className="py-2">
                        <span className="font-medium">{r.username}</span>
                        {r.team && <span className="ml-1 text-xs text-white/40">[{r.team}]</span>}
                        {r.country && <span className="ml-2 text-xs text-white/35">{countryName(r.country)}</span>}
                        {r.status === "PLAYING" && <span className="ml-2 text-xs text-emerald-300">o'ynamoqda</span>}
                      </td>
                      <td className="py-2">{r.level}</td>
                      <td className="py-2 text-right font-semibold">{r.score}</td>
                      <td className="py-2 text-right text-white/50">{formatDuration(r.durationSec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="glass p-6">
          <h2 className="mb-4 font-semibold">Jamoalar hisobi</h2>
          {teams.length === 0 ? <p className="text-sm text-white/45">Jamoalar ishtirok etmagan.</p> : (
            <ul className="space-y-2 text-sm">
              {teams.map((t) => (
                <li key={t.name} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <span><b className="mr-2 text-white/50">{t.rank}.</b>{t.name} <span className="text-xs text-white/40">[{t.tag}]</span></span>
                  <span className="font-semibold">{t.score}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}