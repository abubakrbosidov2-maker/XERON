import { route, ok } from "@/lib/api";
import { requireUser, HttpError } from "@/lib/auth";
import { getCharacterBundle } from "@/lib/services/character";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const u = await requireUser();
  const bundle = await getCharacterBundle(u.id);
  if (!bundle) throw new HttpError(404, "Qahramon topilmadi");
  return ok({ bundle });
});