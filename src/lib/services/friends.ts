import { db } from "../db";
import { HttpError } from "../auth";
import type { Tx } from "../game";
import type { FriendRow, FriendsData, SearchHit } from "../social-meta";
import { checkAchievements } from "./achievements";
import { loadPeople } from "./people";

const MAX_FRIENDS = 100;
const MAX_PENDING_OUT = 30;

// Yosh himoyasi: voyaga yetmaganlar (CHILD/TEEN) va kattalar bir-birini do'st qila olmaydi.
const compatible = (_a: string, _b: string) => true;
const groupsFor = (_g: string): string[] => ["CHILD", "TEEN", "ADULT"];

export async function listFriends(userId: string): Promise<FriendsData> {
  const rows = await db.friend.findMany({
    where: { status: { in: ["ACCEPTED", "PENDING"] }, OR: [{ requesterId: userId }, { addresseeId: userId }] },
    orderBy: { createdAt: "desc" },
  });
  const otherId = (r: { requesterId: string; addresseeId: string }) => (r.requesterId === userId ? r.addresseeId : r.requesterId);
  const people = await loadPeople([...new Set(rows.map(otherId))]);

  const friends: FriendRow[] = [];
  const incoming: FriendRow[] = [];
  const outgoing: FriendRow[] = [];
  for (const r of rows) {
    const p = people.get(otherId(r))?.person;
    if (!p) continue;
    const row: FriendRow = { ...p, friendshipId: r.id };
    if (r.status === "ACCEPTED") friends.push(row);
    else if (r.requesterId === userId) outgoing.push(row);
    else incoming.push(row);
  }
  friends.sort((a, b) => a.username.localeCompare(b.username));
  return { friends, incoming, outgoing };
}

async function acceptRow(tx: Tx, f: { id: string; requesterId: string; addresseeId: string }, accepterName: string) {
  await tx.friend.update({ where: { id: f.id }, data: { status: "ACCEPTED" } });
  await tx.notification.create({
    data: { userId: f.requesterId, type: "FRIEND", title: "Do'stlik so'rovi qabul qilindi", body: `${accepterName} endi sizning do'stingiz.`, link: "/friends" },
  });
  await checkAchievements(tx, f.requesterId);
  await checkAchievements(tx, f.addresseeId);
}

export async function sendFriendRequest(userId: string, username: string) {
  return db.$transaction(async (tx) => {
    const me = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { username: true, ageGroup: true } });
    const target = await tx.user.findFirst({ where: { username, status: "ACTIVE", role: "PLAYER" }, select: { id: true, ageGroup: true } });
    // Mavjud bo'lmagan va mos kelmaydigan yosh guruhi bir xil xabar bilan javob beradi (ma'lumot oshkor qilinmaydi)
    if (!target || target.id === userId || !compatible(me.ageGroup, target.ageGroup)) throw new HttpError(404, "Foydalanuvchi topilmadi");

    const existing = await tx.friend.findFirst({
      where: { OR: [{ requesterId: userId, addresseeId: target.id }, { requesterId: target.id, addresseeId: userId }] },
    });
    if (existing) {
      if (existing.status === "ACCEPTED") throw new HttpError(409, "Siz allaqachon do'stsiz");
      if (existing.status === "BLOCKED") throw new HttpError(404, "Foydalanuvchi topilmadi");
      if (existing.requesterId === userId) throw new HttpError(409, "So'rov allaqachon yuborilgan");
      await acceptRow(tx, existing, me.username); // ular bizga yuborgan edi: avtomatik qabul
      return { status: "ACCEPTED" as const };
    }

    const out = await tx.friend.count({ where: { requesterId: userId, status: "PENDING" } });
    if (out >= MAX_PENDING_OUT) throw new HttpError(429, "Kutilayotgan so'rovlar juda ko'p");
    const total = await tx.friend.count({ where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] } });
    if (total >= MAX_FRIENDS) throw new HttpError(400, `Do'stlar soni ${MAX_FRIENDS} dan oshmasligi kerak`);

    await tx.friend.create({ data: { requesterId: userId, addresseeId: target.id } });
    await tx.notification.create({
      data: { userId: target.id, type: "FRIEND", title: "Yangi do'stlik so'rovi", body: `${me.username} sizga do'stlik so'rovi yubordi.`, link: "/friends" },
    });
    return { status: "SENT" as const };
  });
}

export async function respondFriend(userId: string, id: string, accept: boolean) {
  return db.$transaction(async (tx) => {
    const me = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { username: true } });
    const f = await tx.friend.findFirst({ where: { id, addresseeId: userId, status: "PENDING" } });
    if (!f) throw new HttpError(404, "So'rov topilmadi");
    if (accept) await acceptRow(tx, f, me.username);
    else await tx.friend.delete({ where: { id: f.id } });
    return { ok: true as const };
  });
}

/** Do'stlikni olib tashlash yoki yuborilgan so'rovni bekor qilish. */
export async function removeFriend(userId: string, id: string) {
  const res = await db.friend.deleteMany({ where: { id, OR: [{ requesterId: userId }, { addresseeId: userId }] } });
  if (res.count === 0) throw new HttpError(404, "Topilmadi");
  return { ok: true as const };
}

export async function searchUsers(userId: string, q: string): Promise<SearchHit[]> {
  const me = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { ageGroup: true } });
  const users = await db.user.findMany({
    where: {
      username: { startsWith: q }, status: "ACTIVE", role: "PLAYER", id: { not: userId },
      ageGroup: { in: groupsFor(me.ageGroup) }, profile: { is: { isPublic: true } },
    },
    select: { id: true },
    orderBy: { username: "asc" },
    take: 8,
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return [];

  const rels = await db.friend.findMany({
    where: { OR: [{ requesterId: userId, addresseeId: { in: ids } }, { addresseeId: userId, requesterId: { in: ids } }] },
  });
  const people = await loadPeople(ids);

  const hits: SearchHit[] = [];
  for (const id of ids) {
    const p = people.get(id)?.person;
    if (!p) continue;
    const rel = rels.find((r) => r.requesterId === id || r.addresseeId === id);
    let relation: SearchHit["relation"] = "NONE";
    if (rel?.status === "ACCEPTED") relation = "FRIEND";
    else if (rel?.status === "PENDING") relation = rel.requesterId === userId ? "SENT" : "RECEIVED";
    hits.push({ ...p, relation });
  }
  return hits;
}