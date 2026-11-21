import { route, ok } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export const POST = route(async () => {
  destroySession();
  return ok({ ok: true });
});