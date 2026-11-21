// Oddiy xotiradagi rate limiter (bitta server uchun). Ko'p serverda Redis ga almashtiring.
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count++;
  if (b.count > limit) return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

if (typeof setInterval !== "undefined") {
  const t = setInterval(() => {
    const now = Date.now();
    buckets.forEach((v, k) => v.reset < now && buckets.delete(k));
  }, 5 * 60_000);
  (t as unknown as { unref?: () => void }).unref?.();
}
