"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

const MESSAGES = ["Dunyo yuklanmoqda...", "Qahramonlar tayyorlanmoqda...", "Missiyalar sinxronlanmoqda...", "XERON ishga tushdi"];
const LOGO_MS = 900;
const LOAD_MS = 2600;

export function IntroGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"checking" | "intro" | "done">("checking");
  const [progress, setProgress] = useState(0);
  const [showSlogan, setShowSlogan] = useState(false);

  const finish = useCallback(() => {
    try { sessionStorage.setItem("xeron_intro_seen", "1"); } catch { /* ixtiyoriy */ }
    setPhase("done");
  }, []);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("xeron_intro_seen") === "1"; } catch { /* ixtiyoriy */ }
    setPhase(seen ? "done" : "intro");
  }, []);

  useEffect(() => {
    if (phase !== "intro") return;
    const start = Date.now();
    const tick = setInterval(() => {
      const p = ((Date.now() - start - LOGO_MS) / LOAD_MS) * 100;
      setProgress(Math.max(0, Math.min(100, p)));
    }, 40);
    const t1 = setTimeout(() => setShowSlogan(true), LOGO_MS + LOAD_MS);
    const t2 = setTimeout(finish, LOGO_MS + LOAD_MS + 1500);
    return () => { clearInterval(tick); clearTimeout(t1); clearTimeout(t2); };
  }, [phase, finish]);

  const msg = MESSAGES[Math.min(MESSAGES.length - 1, Math.floor(progress / 26))];

  return (
    <>
      {children}
      <AnimatePresence>
        {phase !== "done" && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-void"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {phase === "intro" && (
              <>
                <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />

                <svg width="150" height="150" viewBox="0 0 100 100" aria-hidden="true">
                  <defs>
                    <linearGradient id="splash-g" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#6db3ff" />
                      <stop offset="1" stopColor="#b69cff" />
                    </linearGradient>
                  </defs>
                  <g fill="none" stroke="url(#splash-g)" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(109,179,255,.8))" }}>
                    <polygon className="xeron-draw" pathLength="1" points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5" strokeWidth="3" />
                    <path className="xeron-draw" pathLength="1" d="M31 30 L69 70" strokeWidth="8" style={{ animationDelay: "0.5s" }} />
                    <path className="xeron-draw" pathLength="1" d="M69 30 L31 70" strokeWidth="8" style={{ animationDelay: "0.7s" }} />
                  </g>
                  <rect className="xeron-fade" x="45" y="45" width="10" height="10" transform="rotate(45 50 50)" fill="#ffffff" style={{ animationDelay: "1.2s" }} />
                </svg>

                <h1 className="xeron-fade mt-6 font-display text-4xl font-black tracking-[0.5em] text-white" style={{ animationDelay: "0.6s" }}>
                  XERON
                </h1>

                <div className="xeron-fade mt-10 w-64" style={{ animationDelay: "0.9s" }}>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-volt to-arcane" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-white/50">
                    <span>{msg}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                </div>

                <div className="mt-8 h-14 text-center">
                  {showSlogan && (
                    <div className="xeron-fade">
                      <p className="font-display text-sm font-bold tracking-[0.25em] text-volt-glow">YOUR LIFE. YOUR WORLD. YOUR GAME.</p>
                      <p className="mt-1 text-xs tracking-[0.2em] text-white/40">ONE WORLD. ENDLESS POSSIBILITIES.</p>
                    </div>
                  )}
                </div>

                <button onClick={finish} className="absolute bottom-6 right-6 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:text-white">
                  O'tkazib yuborish
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}