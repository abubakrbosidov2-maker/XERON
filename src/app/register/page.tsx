"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { ErrorBox, Field } from "@/components/ui";
import { COUNTRIES } from "@/lib/countries";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [country, setCountry] = useState("UZ");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const year = Number(birthYear);
  const isChild = birthYear.length === 4 && year > 1900 && new Date().getFullYear() - year < 13;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, birthYear: year, country }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        setLoading(false);
        return;
      }
      router.replace("/character/create");
      router.refresh();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Qahramon yarating"
      subtitle="XERON olamiga qo'shiling. Bu bepul."
      footer={<>Hisobingiz bormi? <Link href="/login" className="text-volt-glow hover:underline">Kirish</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <Field label="Foydalanuvchi nomi" value={username} onChange={(e) => setUsername(e.target.value)} hint="3-20 belgi: lotin harflari, raqam va _" autoComplete="username" required minLength={3} maxLength={20} />
        <Field label="Parol" type="password" value={password} onChange={(e) => setPassword(e.target.value)} hint="Kamida 8 belgi, harf va raqam" autoComplete="new-password" required minLength={8} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tug'ilgan yil" type="number" inputMode="numeric" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="2008" required min={1930} max={new Date().getFullYear() - 6} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/70">Davlat</span>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-xl border border-white/10 bg-navy-800 px-3 py-2.5 text-white outline-none focus:border-volt focus:ring-2 focus:ring-volt/30">
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </label>
        </div>
        {isChild && (
          <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-100">
            13 yoshgacha bo'lgan o'yinchilarning profili yopiq bo'ladi va maxfiylik cheklovlari qo'llanadi.
          </p>
        )}
        <ErrorBox message={error} />
        <button type="submit" disabled={loading} className="btn-neon w-full">{loading ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}</button>
        <p className="text-center text-xs text-white/35">Aniq joylashuvingiz saqlanmaydi, faqat davlat.</p>
      </form>
    </AuthShell>
  );
}