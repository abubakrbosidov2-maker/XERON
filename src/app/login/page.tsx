"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { ErrorBox, Field } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        setLoading(false);
        return;
      }
      const next = params.get("next");
      const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      router.replace(dest);
      router.refresh();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Qaytganingiz bilan!"
      subtitle="Hisobingizga kiring va sarguzashtni davom ettiring."
      footer={<>Hisobingiz yo'qmi? <Link href="/register" className="text-volt-glow hover:underline">Ro'yxatdan o'ting</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email yoki foydalanuvchi nomi" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required />
        <Field label="Parol" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        <ErrorBox message={error} />
        <button type="submit" disabled={loading} className="btn-neon w-full">{loading ? "Kirilmoqda..." : "Kirish"}</button>
        {process.env.NODE_ENV !== "production" && (
          <button type="button" className="btn-ghost w-full text-sm" onClick={() => { setIdentifier("demo@xeron.dev"); setPassword("Demo-Xeron-2026!"); }}>
            Demo hisob bilan to'ldirish (faqat dev)
          </button>
        )}
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}