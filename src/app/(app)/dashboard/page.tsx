import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, Castle, Coins, Flame, Gem, Package, Shirt, Swords, Target } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { levelProgress } from "@/lib/game";
import { countryName } from "@/lib/countries";
import { getCharacterBundle } from "@/lib/services/character";
import { toVisual, STAT_KEYS } from "@/lib/item-dto";
import { Avatar } from "@/components/avatar/Avatar";

export const dynamic = "force-dynamic";

const STAT_META = {
  strength: ["Kuch", "#f87171"], intelligence: ["Aql", "#60a5fa"], speed: ["Tezlik", "#fbbf24"],
  creativity: ["Ijodkorlik", "#c084fc"], endurance: ["Chidamlilik", "#34d399"], luck: ["Omad", "#f472b6"],
} as const;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [bundle, ch, inv, world, notifications, completed, owned, liveComps, activeMissions] = await Promise.all([
    getCharacterBundle(user.id),
    db.character.findUnique({ where: { userId: user.id }, select: { xp: true, skillPoints: true } }),
    db.inventory.findUnique({ where: { userId: user.id } }),
    db.virtualWorld.findUnique({ where: { userId: user.id } }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.missionParticipation.count({ where: { userId: user.id, status: "COMPLETED" } }),
    db.userItem.count({ where: { userId: user.id } }),
    db.competition.count({ where: { status: "LIVE" } }),
    db.mission.count({ where: { isActive: true } }),
  ]);
  if (!bundle || !ch) redirect("/login");

  const p = levelProgress(ch.xp);
  const C = 2 * Math.PI * 52;
  const facts = [
    { icon: Target, label: "Bajarilgan missiyalar", value: completed },
    { icon: Flame, label: "Mavjud missiyalar", value: activeMissions },
    { icon: Package, label: "Buyumlarim", value: owned },
    { icon: Swords, label: "Jonli musobaqalar", value: liveComps },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Xush kelibsiz, <span className="text-gradient">{bundle.name}</span></h1>
        <p className="text-sm text-white/50">{countryName(user.country)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <section className="glass flex flex-col items-center p-5">
          <div className="relative flex h-[340px] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-navy-800 to-void">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
            <Avatar appearance={bundle.appearance} equipped={bundle.equipped.map((e) => toVisual(e.item))} size={200} animated />
          </div>
          <Link href="/character" className="btn-ghost mt-4 w-full"><Shirt size={16} /> Moslashtirish</Link>
        </section>

        <div className="space-y-6">
          <section className="glass flex items-center gap-6 p-6">
            <div className="relative shrink-0">
              <svg width="130" height="130" viewBox="0 0 120 120" className="-rotate-90">
                <defs>
                  <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2f8cff" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient>
                </defs>
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#ring)" strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p.pct / 100)} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-white/50">Daraja</span>
                <span className="font-display text-3xl font-bold">{p.level}</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-white/50">Tajriba (XP)</div>
              <div className="mt-1 font-display text-2xl font-bold">{ch.xp.toLocaleString("en-US")}</div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-volt to-arcane" style={{ width: `${p.pct}%` }} /></div>
              <div className="mt-2 text-xs text-white/45">Keyingi darajagacha: {(p.needed - p.current).toLocaleString("en-US")} XP</div>
              {ch.skillPoints > 0 && <div className="mt-2 inline-block rounded-full bg-amber-400/15 px-3 py-1 text-xs text-amber-200">{ch.skillPoints} ta mahorat ochkosi mavjud</div>}
            </div>
            <div className="hidden space-y-2 sm:block">
              <div className="flex items-center gap-2 rounded-xl bg-amber-400/10 px-4 py-2 text-amber-200"><Coins size={16} /><b>{(inv?.coins ?? 0).toLocaleString("en-US")}</b></div>
              <div className="flex items-center gap-2 rounded-xl bg-fuchsia-400/10 px-4 py-2 text-fuchsia-200"><Gem size={16} /><b>{(inv?.gems ?? 0).toLocaleString("en-US")}</b></div>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="glass p-6">
              <h2 className="mb-4 text-sm font-semibold text-white/70">Xususiyatlar</h2>
              <div className="space-y-3">
                {STAT_KEYS.map((k) => {
                  const total = bundle.stats[k] + bundle.bonuses[k];
                  return (
                    <div key={k}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-white/70">{STAT_META[k][0]}</span>
                        <span className="font-semibold">{bundle.stats[k]}{bundle.bonuses[k] > 0 && <span className="text-emerald-300"> +{bundle.bonuses[k]}</span>}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${Math.min(100, total * 5)}%`, background: STAT_META[k][1] }} /></div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="glass p-6">
              <h2 className="mb-4 text-sm font-semibold text-white/70">Umumiy ko'rinish</h2>
              <div className="grid grid-cols-2 gap-3">
                {facts.map((f) => (
                  <div key={f.label} className="rounded-xl bg-white/5 p-4">
                    <f.icon size={18} className="text-volt-glow" />
                    <div className="mt-2 font-display text-2xl font-bold">{f.value}</div>
                    <div className="text-xs text-white/50">{f.label}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/70"><Castle size={16} /> Shaharim</h2>
          {world && (
            <>
              <div className="font-display text-lg font-bold">{world.cityName}</div>
              <div className="text-sm text-white/50">Shahar darajasi: {world.cityLevel}</div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-xl bg-white/5 p-3"><div className="font-bold">{world.wood}</div><div className="text-xs text-white/45">Yog'och</div></div>
                <div className="rounded-xl bg-white/5 p-3"><div className="font-bold">{world.stone}</div><div className="text-xs text-white/45">Tosh</div></div>
                <div className="rounded-xl bg-white/5 p-3"><div className="font-bold">{world.energy}</div><div className="text-xs text-white/45">Energiya</div></div>
              </div>
            </>
          )}
        </section>

        <section className="glass p-6 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/70"><Bell size={16} /> So'nggi bildirishnomalar</h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-white/45">Hozircha bildirishnoma yo'q.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-4 py-3">
                  <div><div className="font-medium">{n.title}</div>{n.body && <div className="text-sm text-white/50">{n.body}</div>}</div>
                  <time className="shrink-0 text-xs text-white/35">{n.createdAt.toLocaleDateString("en-GB")}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}