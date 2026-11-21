import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCharacterBundle } from "@/lib/services/character";
import { CharacterEditor } from "@/components/avatar/CharacterEditor";

export const dynamic = "force-dynamic";

export default async function CharacterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const bundle = await getCharacterBundle(user.id);
  if (!bundle) redirect("/login");
  return (
    <div>
      <h1 className="mx-auto mb-6 max-w-6xl font-display text-2xl font-bold">Qahramonni moslashtirish</h1>
      <CharacterEditor mode="edit" initial={bundle} />
    </div>
  );
}