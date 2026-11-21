import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./auth";
import { rateLimit } from "./rate-limit";

/** CSRF himoyasi: o'zgartiruvchi so'rovlar faqat o'z originidan kelishi shart. */
export function assertSameOrigin(req: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin) return; // server-to-server / bir xil sayt so'rovlari
  if (new URL(origin).host !== host) throw new HttpError(403, "Noto'g'ri origin");
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<NextResponse | Response>;

/** Barcha API yo'llari uchun umumiy o'ram: origin tekshiruvi, rate limit, xatolarni JSON ga o'girish. */
export function route<C = unknown>(handler: Handler<C>, opts?: { limit?: number; windowMs?: number; key?: string }): Handler<C> {
  return async (req, ctx) => {
    try {
      assertSameOrigin(req);
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
      const rl = rateLimit(`${opts?.key ?? req.nextUrl.pathname}:${ip}`, opts?.limit ?? 120, opts?.windowMs ?? 60_000);
      if (!rl.ok) {
        return NextResponse.json({ error: "Juda ko'p so'rov. Birozdan so'ng urinib ko'ring." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
      }
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0]?.message ?? "Noto'g'ri ma'lumot", issues: e.issues }, { status: 400 });
      console.error("API xatosi:", e);
      return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
  };
}

export const ok = <T,>(data: T, status = 200) => NextResponse.json(data, { status });
