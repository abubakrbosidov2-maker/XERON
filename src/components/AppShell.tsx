"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Bot, Castle, Coins, Gem, Globe, Home, LogOut, MessageSquare, Package, Settings, Shield, Shirt, ShoppingBag, Swords, Target, Trophy, User, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "./Logo";
import { NAV } from "@/lib/nav";

const ICONS: Record<string, LucideIcon> = {
  home: Home, user: User, shirt: Shirt, package: Package, bag: ShoppingBag, target: Target, swords: Swords,
  trophy: Trophy, globe: Globe, users: Users, friends: UserPlus, chat: MessageSquare, castle: Castle,
  bell: Bell, settings: Settings, shield: Shield, bot: Bot,
};

interface Props {
  user: { username: string; role: string };
  level: number;
  wallet: { coins: number; gems: number };
  unread: number;
  children: React.ReactNode;
}

export function AppShell({ user, level, wallet, unread, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const items = NAV.filter((n) => n.ready && (!n.adminOnly || user.role === "ADMIN"));

  async function logout() {
    setBusy(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const walletBadges = (
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-amber-200">
        <Coins size={14} /> {wallet.coins.toLocaleString("en-US")}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-fuchsia-200">
        <Gem size={14} /> {wallet.gems.toLocaleString("en-US")}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-navy-900/60 p-5 backdrop-blur-xl md:flex md:sticky md:top-0 md:h-screen">
        <Link href="/dashboard"><Logo size={36} /></Link>
        <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
          {items.map((n) => {
            const Icon = ICONS[n.icon] ?? Home;
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-gradient-to-r from-volt/25 to-arcane/20 text-white shadow-neon" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                <Icon size={18} />
                <span className="flex-1">{n.label}</span>
                {n.href === "/notifications" && unread > 0 && <span className="rounded-full bg-rose-500 px-2 text-xs">{unread}</span>}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} disabled={busy} className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-50">
          <LogOut size={18} /> Chiqish
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-void/70 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="md:hidden"><Link href="/dashboard"><Logo size={30} /></Link></div>
          <div className="hidden text-sm text-white/50 md:block">
            <span className="text-white">{user.username}</span> · Daraja {level}
          </div>
          <div className="flex items-center gap-3">
            {walletBadges}
            <button onClick={logout} disabled={busy} aria-label="Chiqish" className="rounded-lg border border-white/10 p-2 text-white/60 transition hover:text-white md:hidden">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-white/10 px-3 py-2 md:hidden">
          {items.map((n) => {
            const Icon = ICONS[n.icon] ?? Home;
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs ${active ? "bg-volt/20 text-white" : "text-white/60"}`}>
                <Icon size={15} /> {n.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}