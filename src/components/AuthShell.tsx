import Link from "next/link";
import { Logo } from "./Logo";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center"><Logo size={44} /></Link>
        <div className="glass p-8 shadow-neon">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-white/50">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-white/50">{footer}</p>
      </div>
    </main>
  );
}