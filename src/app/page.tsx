import Link from "next/link";
import { Bot, Castle, Globe, Shirt, ShieldCheck, Swords, Target, Trophy, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RARITY_META } from "@/lib/rarity";
import { Logo, LogoMark } from "@/components/Logo";
import { IntroGate } from "@/components/IntroGate";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: Shirt, title: "Noyob qahramon", text: "Qatlamli avatar: soch, yuz, kiyim, niqob, qanot va effektlar. Kiygan narsangiz personajda ko'rinadi." },
  { icon: Target, title: "Kundalik missiyalar", text: "Bilim, ijod, sport, tabiat va jamoaviy topshiriqlar. Har biri uchun XP va tangalar." },
  { icon: Swords, title: "Arena", text: "Bilim janglari, mantiq va matematika musobaqalari. Ballar faqat serverda hisoblanadi." },
  { icon: Trophy, title: "Global reyting", text: "Dunyo, davlat, do'stlar va jamoalar bo'yicha reyting. Haftalik va oylik chempionlar." },
  { icon: Castle, title: "Shaxsiy shahar", text: "O'z shahringizni quring, binolarni yangilang va umumiy global loyihalarga hissa qo'shing." },
  { icon: Users, title: "Jamoalar va do'stlar", text: "Jamoa tuzing, birgalikda missiyalarni bajaring va jamoaviy XP to'plang." },
  { icon: Bot, title: "XERON AI", text: "Sizning rivojlanishingizni tahlil qilib, mos missiyalarni tavsiya qiluvchi yordamchi." },
  { icon: ShieldCheck, title: "Adolat va xavfsizlik", text: "Pulga kuch sotilmaydi, qutilar yo'q. Yoshga mos kontent va maxfiylik himoyasi." },
];

const STEPS = [
  { n: "01", t: "Qahramon yarating", d: "Ro'yxatdan o'ting va o'z personajingizni moslang." },
  { n: "02", t: "Missiyalarni bajaring", d: "Real hayotdagi xavfsiz topshiriqlar uchun XP oling." },
  { n: "03", t: "Rivojlaning", d: "Daraja ko'taring, buyumlar yig'ing, shahringizni quring." },
  { n: "04", t: "Dunyo bilan bellashing", d: "Arenada qatnashing va reytingda ko'tariling." },
];

export default async function Home() {
  const [user, players, missions, items, competitions] = await Promise.all([
    getCurrentUser(),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.mission.count({ where: { isActive: true } }),
    db.item.count({ where: { isActive: true } }),
    db.competition.count(),
  ]);

  const stats = [
    { label: "Faol o'yinchilar", value: players },
    { label: "Missiyalar", value: missions },
    { label: "Buyumlar", value: items },
    { label: "Musobaqalar", value: competitions },
  ];

  return (
    <IntroGate>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] bg-grid opacity-40" />

        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Logo size={38} />
          <nav className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="btn-neon">O'yinga kirish</Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Kirish</Link>
                <Link href="/register" className="btn-neon hidden sm:inline-flex">Boshlash</Link>
              </>
            )}
          </nav>
        </header>

        <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-16 text-center md:pt-24">
          <div className="mx-auto mb-8 w-fit animate-float"><LogoMark size={120} /></div>
          <h1 className="font-display text-4xl font-black leading-tight md:text-6xl">
            <span className="text-gradient">YOUR LIFE.</span> YOUR WORLD.<br />YOUR GAME.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            XERON hayotingizni o'yinga aylantiradi: qahramon yarating, missiyalarni bajaring, jamoa tuzing,
            shahringizni quring va butun dunyo bilan bellashing.
          </p>
          <p className="mt-3 text-xs tracking-[0.3em] text-white/30">ONE WORLD. ENDLESS POSSIBILITIES.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href={user ? "/dashboard" : "/register"} className="btn-neon px-8 py-3 text-lg">{user ? "O'yinga kirish" : "Qahramon yaratish"}</Link>
            {!user && <Link href="/login" className="btn-ghost px-8 py-3 text-lg">Menda hisob bor</Link>}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-6xl px-5">
          <div className="glass grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl font-bold text-gradient">{s.value}</div>
                <div className="mt-1 text-sm text-white/50">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-6xl px-5 py-24">
          <Reveal><h2 className="text-center font-display text-3xl font-bold">Nimalar sizni kutmoqda</h2></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 0.08}>
                <div className="glass h-full p-6 transition hover:-translate-y-1 hover:border-volt/40 hover:shadow-neon">
                  <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-volt/30 to-arcane/30 p-3 text-volt-glow"><f.icon size={22} /></div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24">
          <Reveal><h2 className="text-center font-display text-3xl font-bold">Qanday ishlaydi</h2></Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="glass relative h-full p-6">
                  <div className="font-display text-4xl font-black text-white/10">{s.n}</div>
                  <h3 className="mt-2 font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm text-white/55">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-4xl px-5 pb-24 text-center">
          <Reveal>
            <h2 className="font-display text-2xl font-bold">Oltita nodirlik darajasi</h2>
            <p className="mt-2 text-sm text-white/50">Buyum kuchi uning nodirligiga bog'liq, narxiga emas.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {Object.entries(RARITY_META).map(([k, r]) => (
                <span key={k} className="rounded-full border px-4 py-1.5 text-sm font-medium" style={{ borderColor: r.color + "88", color: r.color, boxShadow: `0 0 18px ${r.color}33` }}>
                  {r.label}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="relative z-10 mx-auto max-w-3xl px-5 pb-24">
          <Reveal>
            <div className="glass p-10 text-center shadow-neon">
              <Globe className="mx-auto mb-4 text-volt-glow" size={36} />
              <h2 className="font-display text-2xl font-bold">Yangi olamga kirishga tayyormisiz?</h2>
              <p className="mt-2 text-white/55">Bepul boshlang. Hech qanday tasodifiy qutilar va pulga olinadigan kuch yo'q.</p>
              <Link href={user ? "/dashboard" : "/register"} className="btn-neon mt-6 px-8 py-3">{user ? "O'yinga kirish" : "Hozir boshlash"}</Link>
            </div>
          </Reveal>
        </section>

        <footer className="relative z-10 border-t border-white/10 py-8 text-center text-sm text-white/35">
          XERON — YOUR LIFE. YOUR WORLD. YOUR GAME.
        </footer>
      </div>
    </IntroGate>
  );
}