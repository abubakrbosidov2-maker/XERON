"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Coins, Gem, Sparkles, Trophy } from "lucide-react";
import { CATEGORY_META, TYPE_LABELS, VERIFICATION_LABELS, type MissionDTO, type MissionState, type SubmitResult } from "@/lib/mission-meta";
import { CategoryIcon, Deadline, DifficultyBadge, RewardChips } from "./MissionBits";

type Done = Extract<SubmitResult, { ok: true }>;

function RewardOverlay({ data, onClose }: { data: Done; onClose: () => void }) {
  const N = 28;
  return (
    <motion.div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="glass relative w-full max-w-sm p-8 text-center shadow-neon" initial={{ scale: 0.7, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 18 }} onClick={(e) => e.stopPropagation()}>
        {Array.from({ length: N }).map((_, i) => {
          const a = (i / N) * Math.PI * 2;
          const d = 130 + (i % 3) * 45;
          return (
            <motion.span
              key={i}
              className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
              style={{ background: i % 2 ? "#6db3ff" : "#b69cff" }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: 0, scale: 0.3 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          );
        })}
        <motion.div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-volt to-arcane shadow-neon" initial={{ rotate: -30, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 14 }}>
          <Trophy size={30} />
        </motion.div>
        <h2 className="font-display text-xl font-bold">Missiya bajarildi!</h2>
        <div className="mt-5 space-y-2 text-lg">
          <div className="flex items-center justify-center gap-2 text-volt-glow"><Sparkles size={18} /> +{data.rewards.xp} XP</div>
          {data.rewards.coins > 0 && <div className="flex items-center justify-center gap-2 text-amber-200"><Coins size={18} /> +{data.rewards.coins} tanga</div>}
          {data.rewards.gems > 0 && <div className="flex items-center justify-center gap-2 text-fuchsia-200"><Gem size={18} /> +{data.rewards.gems} gem</div>}
        </div>
        {data.leveledUp && <div className="mt-4 rounded-xl bg-amber-400/15 px-4 py-2 font-semibold text-amber-200">Yangi daraja: {data.level}!</div>}
        {data.achievements.map((a) => <div key={a} className="mt-3 rounded-xl bg-emerald-400/15 px-4 py-2 text-sm text-emerald-200">Yangi yutuq: {a}</div>)}
        <button type="button" onClick={onClose} className="btn-neon mt-6 w-full">Davom etish</button>
      </motion.div>
    </motion.div>
  );
}

export function MissionPlay({ mission: m, initial }: { mission: MissionDTO; initial: MissionState }) {
  const router = useRouter();
  const [status, setStatus] = useState(initial.status);
  const [attemptsLeft, setAttemptsLeft] = useState(initial.attemptsLeft);
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [reward, setReward] = useState<Done | null>(null);

  const lock = initial.lock;
  const color = CATEGORY_META[m.category]?.color ?? "#6db3ff";

  async function post(path: string, body: unknown) {
    const res = await fetch(`/api/missions/${m.slug}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  async function accept() {
    setBusy(true); setMsg(null);
    try {
      const { res, data } = await post("accept", {});
      if (!res.ok) { setMsg({ ok: false, text: data.error ?? "Xatolik yuz berdi" }); return; }
      setStatus("ACCEPTED");
      router.refresh();
    } catch { setMsg({ ok: false, text: "Tarmoq xatosi" }); } finally { setBusy(false); }
  }

  async function submit() {
    setBusy(true); setMsg(null);
    try {
      const body = m.verification === "QUIZ" ? { choiceIndex: choice ?? undefined } : m.verification === "TEXT" ? { text } : { confirm };
      const { res, data } = await post("submit", body);
      if (!res.ok) { setMsg({ ok: false, text: data.error ?? "Xatolik yuz berdi" }); return; }
      const result = data as SubmitResult;
      if (result.ok) {
        setStatus("COMPLETED");
        setReward(result);
        router.refresh();
      } else {
        setAttemptsLeft(result.attemptsLeft);
        if (result.rejected) setStatus("REJECTED");
        setChoice(null);
        setMsg({ ok: false, text: result.message });
      }
    } catch { setMsg({ ok: false, text: "Tarmoq xatosi" }); } finally { setBusy(false); }
  }

  const textLen = text.trim().replace(/\s+/g, " ").length;
  const canSubmit = m.verification === "QUIZ" ? choice !== null : m.verification === "TEXT" ? textLen >= (m.minChars ?? 30) : confirm;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/missions" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"><ArrowLeft size={16} /> Barcha missiyalar</Link>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <section className="glass p-6" style={{ borderColor: color + "55" }}>
          <div className="flex items-start gap-4">
            <CategoryIcon category={m.category} size={28} />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold">{m.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/50">
                <span>{TYPE_LABELS[m.type]}</span><span>·</span><span>{CATEGORY_META[m.category]?.label}</span><DifficultyBadge difficulty={m.difficulty} />
              </div>
            </div>
          </div>
          <p className="mt-5 text-white/75">{m.description}</p>

          <div className="mt-6 border-t border-white/10 pt-6">
            {status === "COMPLETED" && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-200"><Check size={20} /> Bu missiya bajarilgan. Mukofot berilgan.</div>
            )}
            {status === "REJECTED" && (
              <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-rose-200">Bu davr uchun urinishlar tugadi. Missiya yangilanganda qayta urinib ko'ring.</div>
            )}

            {status === "NONE" && (
              lock ? <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/60">Hozir mavjud emas: {lock}</div>
                : <button type="button" onClick={accept} disabled={busy} className="btn-neon w-full sm:w-auto">{busy ? "Qabul qilinmoqda..." : "Missiyani qabul qilish"}</button>
            )}

            {status === "ACCEPTED" && (lock ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/60">Topshirib bo'lmaydi: {lock}</div>
            ) : (
              <div className="space-y-4">
                {m.verification === "QUIZ" && m.options && (
                  <>
                    <p className="font-semibold">{m.question}</p>
                    <div className="grid gap-2">
                      {m.options.map((o, i) => (
                        <button key={i} type="button" onClick={() => setChoice(i)} className={`rounded-xl border px-4 py-3 text-left transition ${choice === i ? "border-volt bg-volt/20" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>{o}</button>
                      ))}
                    </div>
                    {attemptsLeft !== null && <p className="text-xs text-white/45">Qolgan urinishlar: {attemptsLeft}</p>}
                  </>
                )}
                {m.verification === "TEXT" && (
                  <>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={1000} placeholder="O'z so'zlaringiz bilan yozing..." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-volt focus:ring-2 focus:ring-volt/30" />
                    <p className={`text-xs ${textLen >= (m.minChars ?? 30) ? "text-emerald-300" : "text-white/45"}`}>{textLen} / kamida {m.minChars ?? 30} belgi</p>
                  </>
                )}
                {m.verification === "SELF_REPORT" && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                    <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-1 h-4 w-4 accent-volt" />
                    <span className="text-sm text-white/75">Men bu missiyani haqiqatan bajardim. Halol bo'lish XERON ning asosiy qoidasi.</span>
                  </label>
                )}
                <button type="button" onClick={submit} disabled={busy || !canSubmit} className="btn-neon">{busy ? "Yuborilmoqda..." : "Yuborish"}</button>
              </div>
            ))}

            {msg && <p role="status" className={`mt-4 text-sm ${msg.ok ? "text-emerald-300" : "text-rose-300"}`}>{msg.text}</p>}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="glass p-5">
            <h2 className="mb-3 text-sm font-semibold text-white/70">Mukofotlar</h2>
            <RewardChips xp={m.xp} coins={m.coins} gems={m.gems} />
          </div>
          <div className="glass space-y-3 p-5 text-sm">
            <div className="flex justify-between gap-3"><span className="text-white/50">Muddat</span><span className="text-right"><Deadline iso={m.deadline} /></span></div>
            <div className="flex justify-between gap-3"><span className="text-white/50">Tasdiqlash</span><span className="text-right">{VERIFICATION_LABELS[m.verification]}</span></div>
            <div className="flex justify-between gap-3"><span className="text-white/50">Kerakli daraja</span><span>{m.minLevel}</span></div>
            {m.requirements && <div className="border-t border-white/10 pt-3 text-white/65"><span className="text-white/50">Talab: </span>{m.requirements}</div>}
          </div>
        </aside>
      </div>

      <AnimatePresence>{reward && <RewardOverlay data={reward} onClose={() => setReward(null)} />}</AnimatePresence>
    </div>
  );
}