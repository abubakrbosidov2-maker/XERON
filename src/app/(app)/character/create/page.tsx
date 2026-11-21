import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCharacterBundle } from "@/lib/services/character";
import { CharacterEditor } from "@/components/avatar/CharacterEditor";

export const dynamic = "force-dynamic";

export default async function CharacterCreatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const bundle = await getCharacterBundle(user.id);
  if (!bundle) redirect("/login");
  return (
    <div>
      <div className="mx-auto mb-6 max-w-6xl">
        <h1 className="font-display text-2xl font-bold">Qahramoningizni yarating</h1>
        <p className="text-sm text-white/50">Ko'rinishni tanlang. Keyinroq istalgan vaqt o'zgartira olasiz.</p>
      </div>
      <CharacterEditor mode="create" initial={bundle} />
    </div>
  );
}