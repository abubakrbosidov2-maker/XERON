import type { Prisma } from "@prisma/client";
import { db } from "../db";
import { DEFAULT_APPEARANCE, type AppearanceData } from "../avatar-config";
import type { CountryEntry, Period, PlayerBoard, PlayerEntry, Scope, TeamEntry } from "../leaderboard-meta";
import { periodKey } from "./missions";

const TOP = 25;

// Faqat ochiq profilli, faol o'yinchilar umumiy reytingda ko'rinadi (13 yoshgacha bo'lganlar yopiq)
const visible: Prisma.UserWhereInput = { status: "ACTIVE", role: "PLAYER", profile: { is: { isPublic: true } } };

const include = {
  appearance: true,
  equipped: { include: { userItem: { include: { item: true } } } },
  user: {
    select: {
      username: true,
      country: true,
      profile: { select: { showCountry: true, title: true } },
      teamMembers: { select: { team: { select: { tag: true } } } },
      _count: { select: { achievements: true } },
    },
  },
} satisfies Prisma.CharacterInclude;

type Row = Prisma.CharacterGetPayload<{ include: typeof include }>;

const valueOf = (c: { xp: number; weeklyXp: number; monthlyXp: number }, p: Period) =>
  p === "WEEKLY" ? c.weeklyXp : p === "MONTHLY" ? c.monthlyXp : c.xp;

const gtMetric = (p: Period, v: number): Prisma.CharacterWhereInput =>
  p === "WEEKLY" ? { weeklyXp: { gt: v } } : p === "MONTHLY" ? { monthlyXp: { gt: v } } : { xp: { gt: v } };

const primaryOrder = (p: Period): Prisma.CharacterOrderByWithRelationInput =>
  p === "WEEKLY" ? { weeklyXp: "desc" } : p === "MONTHLY" ? { monthlyXp: "desc" } : { xp: "desc" };

/** Haftalik/oylik XP lazy tarzda nollanadi: davr kaliti o'zgargan zahoti birinchi so'rov hisoblagichni tiklaydi. */
export async function syncPeriods() {
  const now = new Date();
  const week = periodKey("WEEKLY", now);
  const month = periodKey("MONTHLY", now);

  await db.platformSetting.upsert({ where: { key: "weekKey" }, update: {}, create: { key: "weekKey", value: week } });
  const w = await db.platformSetting.updateMany({ where: { key: "weekKey", value: { not: week } }, data: { value: week } });
  if (w.count > 0) await db.character.updateMany({ data: { weeklyXp: 0 } });

  await db.platformSetting.upsert({ where: { key: "monthKey" }, update: {}, create: { key: "monthKey", value: month } });
  const m = await db.platformSetting.updateMany({ where: { key: "monthKey", value: { not: month } }, data: { value: month } });
  if (m.count > 0) await db.character.updateMany({ data: { monthlyXp: 0 } });
}

function toEntry(c: Row, rank: number, period: Period, meId: string): PlayerEntry {
  const a = c.appearance;
  const look = a
    ? ({ body: a.body, skinTone: a.skinTone, hairStyle: a.hairStyle, hairColor: a.hairColor, face: a.face, eyeColor: a.eyeColor, pose: a.pose, aura: a.aura } as AppearanceData)
    : DEFAULT_APPEARANCE;
  return {
    rank,
    username: c.user.username,
    country: c.user.profile?.showCountry === false ? null : c.user.country,
    level: c.level,
    value: valueOf(c, period),
    achievements: c.user._count.achievements,
    title: c.user.profile?.title ?? null,
    team: c.user.teamMembers[0]?.team.tag ?? null,
    isMe: c.userId === meId,
    avatar: {
      appearance: look,
      equipped: c.equipped.map((e) => ({ slot: e.slot, visualKey: e.userItem.item.visualKey, c1: e.userItem.item.colorPrimary, c2: e.userItem.item.colorSecondary })),
    },
  };
}

export async function getPlayerBoard(userId: string, scope: Scope, period: Period, countryParam?: string): Promise<PlayerBoard> {
  await syncPeriods();

  const meUser = await db.user.findUnique({ where: { id: userId }, select: { country: true } });
  let userFilter: Prisma.UserWhereInput = visible;
  let countryCode: string | null = null;

  if (scope === "COUNTRY") {
    countryCode = countryParam ?? meUser?.country ?? null;
    if (!countryCode) return { entries: [], me: null, total: 0, countryCode: null, meHidden: false };
    userFilter = { ...visible, country: countryCode, profile: { is: { isPublic: true, showCountry: true } } };
  } else if (scope === "FRIENDS") {
    const fr = await db.friend.findMany({
      where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] },
      select: { requesterId: true, addresseeId: true },
    });
    const ids = new Set<string>([userId]);
    for (const f of fr) { ids.add(f.requesterId); ids.add(f.addresseeId); }
    userFilter = { status: "ACTIVE", id: { in: [...ids] } };
  }

  const metricWhere: Prisma.CharacterWhereInput = period === "ALL" ? {} : gtMetric(period, 0);
  const where: Prisma.CharacterWhereInput = { AND: [{ user: userFilter }, metricWhere] };

  const [rows, total, mine] = await Promise.all([
    db.character.findMany({ where, orderBy: [primaryOrder(period), { level: "desc" }, { id: "asc" }], take: TOP, include }),
    db.character.count({ where }),
    db.character.findUnique({ where: { userId }, include }),
  ]);

  const entries = rows.map((c, i) => toEntry(c, i + 1, period, userId));

  let me: PlayerEntry | null = null;
  let meHidden = false;
  if (mine) {
    const inScope = (await db.character.count({ where: { AND: [where, { userId }] } })) > 0;
    if (inScope) {
      const myVal = valueOf(mine, period);
      const rank = (await db.character.count({ where: { AND: [where, gtMetric(period, myVal)] } })) + 1;
      me = toEntry(mine, rank, period, userId);
    } else if (scope === "GLOBAL" || scope === "COUNTRY") {
      const prof = await db.profile.findUnique({ where: { userId }, select: { isPublic: true } });
      meHidden = prof?.isPublic === false;
    }
  }
  return { entries, me, total, countryCode, meHidden };
}

export async function getTeamBoard(userId: string, period: Period): Promise<TeamEntry[]> {
  await syncPeriods();
  const teams = await db.team.findMany({
    include: {
      owner: { select: { username: true } },
      members: { select: { userId: true, user: { select: { character: { select: { xp: true, weeklyXp: true, monthlyXp: true } } } } } },
    },
  });

  return teams
    .filter((t) => t.isPublic || t.members.some((m) => m.userId === userId))
    .map((t) => ({
      name: t.name, tag: t.tag, members: t.members.length, owner: t.owner.username, isPublic: t.isPublic,
      isMine: t.members.some((m) => m.userId === userId),
      score: t.members.reduce((s, m) => s + (m.user.character ? valueOf(m.user.character, period) : 0), 0),
    }))
    .filter((t) => period === "ALL" || t.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 20)
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

/** Davlatlar reytingi: faqat davlatini yashirmagan ochiq profillar hisoblanadi. Aniq joylashuv hech qayerda saqlanmaydi.
 *  Eslatma: hozir hisob-kitob ilovada bajariladi (kichik/o'rta hajm uchun yetarli). */
export async function getCountryBoard(userId: string, period: Period): Promise<CountryEntry[]> {
  await syncPeriods();
  const me = await db.user.findUnique({ where: { id: userId }, select: { country: true } });
  const chars = await db.character.findMany({
    where: { user: { ...visible, country: { not: null }, profile: { is: { isPublic: true, showCountry: true } } } },
    select: { xp: true, weeklyXp: true, monthlyXp: true, level: true, user: { select: { country: true, username: true } } },
  });

  const map = new Map<string, { players: number; total: number; levels: number; top: string | null; topVal: number }>();
  for (const c of chars) {
    const code = c.user.country;
    if (!code) continue;
    const v = valueOf(c, period);
    const cur = map.get(code) ?? { players: 0, total: 0, levels: 0, top: null, topVal: -1 };
    cur.players += 1;
    cur.total += v;
    cur.levels += c.level;
    if (v > cur.topVal) { cur.topVal = v; cur.top = c.user.username; }
    map.set(code, cur);
  }

  return [...map.entries()]
    .filter(([, v]) => period === "ALL" || v.total > 0)
    .sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]))
    .slice(0, 40)
    .map(([code, v], i) => ({
      rank: i + 1, code, players: v.players, totalXp: v.total, avgLevel: Math.round((v.levels / v.players) * 10) / 10,
      topPlayer: v.top, isMine: code === me?.country,
    }));
}