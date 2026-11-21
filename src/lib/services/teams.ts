import { db } from "../db";
import { HttpError } from "../auth";
import type { Tx } from "../game";
import { loadPeople } from "./people";
import type { BrowseTeam, TeamAchievement, TeamDetail, TeamInviteDTO, TeamMemberDTO, TeamRole, TeamsPageData } from "../social-meta";

// Yosh himoyasi: jamoa sardorining yosh guruhi (voyaga yetgan / yetmagan) bo'yicha qo'shilish cheklanadi.
const sameBracket = (_a: string, _b: string) => true;
const isManager = (r: string) => r === "OWNER" || r === "OFFICER";

type TeamLite = { id: string; name: string; ownerId: string; isPublic: boolean; maxMembers: number; owner: { ageGroup: string } };

async function membership(tx: Tx, userId: string) {
  return tx.teamMember.findUnique({ where: { userId }, include: { team: { include: { owner: { select: { ageGroup: true } } } } } });
}
async function requireMembership(tx: Tx, userId: string) {
  const m = await membership(tx, userId);
  if (!m) throw new HttpError(404, "Siz jamoada emassiz");
  return m;
}

async function enterTeam(tx: Tx, user: { id: string; username: string; ageGroup: string }, team: TeamLite, viaInvite: boolean) {
  if (await tx.teamMember.findUnique({ where: { userId: user.id } })) throw new HttpError(409, "Siz allaqachon jamoadasiz");
  if (!sameBracket(user.ageGroup, team.owner.ageGroup)) throw new HttpError(403, "Bu jamoaga qo'shilib bo'lmaydi");
  if (!viaInvite && !team.isPublic) throw new HttpError(403, "Jamoa yopiq. Qo'shilish uchun taklif kerak");
  const count = await tx.teamMember.count({ where: { teamId: team.id } });
  if (count >= team.maxMembers) throw new HttpError(409, "Jamoa to'lgan");

  await tx.teamMember.create({ data: { teamId: team.id, userId: user.id } });
  await tx.notification.create({
    data: { userId: team.ownerId, type: "TEAM", title: "Jamoaga yangi a'zo", body: `${user.username} jamoangizga qo'shildi.`, link: "/teams" },
  });
}

const userRow = (tx: Tx, id: string) => tx.user.findUniqueOrThrow({ where: { id }, select: { id: true, username: true, ageGroup: true } });

// ───────────── O'qish ─────────────

function buildAchievements(members: number, teamXp: number): TeamAchievement[] {
  return [
    { key: "founded", name: "Asos solingan", description: "Jamoa yaratildi", unlocked: true },
    { key: "five", name: "Beshlik", description: "Jamoada 5 ta a'zo", unlocked: members >= 5 },
    { key: "xp1k", name: "Birinchi ming", description: "Jamoa 1 000 XP to'pladi", unlocked: teamXp >= 1000 },
    { key: "xp5k", name: "Besh ming", description: "Jamoa 5 000 XP to'pladi", unlocked: teamXp >= 5000 },
    { key: "xp10k", name: "O'n ming", description: "Jamoa 10 000 XP to'pladi", unlocked: teamXp >= 10000 },
  ];
}

export async function getTeamsPageData(userId: string): Promise<TeamsPageData> {
  const me = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { ageGroup: true } });
  const mem = await db.teamMember.findUnique({
    where: { userId },
    include: { team: { include: { members: true, invites: { where: { status: "PENDING" }, include: { to: { select: { username: true } } } } } } },
  });

  let mine: TeamDetail | null = null;
  if (mem) {
    const t = mem.team;
    const people = await loadPeople(t.members.map((m) => m.userId));
    const members: TeamMemberDTO[] = [];
    for (const m of t.members) {
      const row = people.get(m.userId);
      if (!row) continue;
      members.push({ ...row.person, role: m.role as TeamRole, isMe: m.userId === userId, xp: row.xp });
    }
    const rank = (await db.team.count({ where: { teamXp: { gt: t.teamXp } } })) + 1;
    const order: Record<string, number> = { OWNER: 0, OFFICER: 1, MEMBER: 2 };
    members.sort((a, b) => order[a.role] - order[b.role] || b.xp - a.xp);
    mine = {
      name: t.name, tag: t.tag, description: t.description, isPublic: t.isPublic, teamXp: t.teamXp, maxMembers: t.maxMembers,
      rank, myRole: mem.role as TeamRole, members,
      invited: isManager(mem.role) ? t.invites.map((i) => i.to.username) : [],
      achievements: buildAchievements(t.members.length, t.teamXp),
    };
  }

  const inviteRows = await db.teamInvite.findMany({
    where: { toUserId: userId, status: "PENDING" },
    include: { team: { select: { name: true, tag: true } }, by: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });
  const invites: TeamInviteDTO[] = inviteRows.map((i) => ({ id: i.id, teamName: i.team.name, tag: i.team.tag, by: i.by.username }));

  let browse: BrowseTeam[] = [];
  if (!mem) {
    const teams = await db.team.findMany({
      where: { isPublic: true },
      include: { owner: { select: { username: true, ageGroup: true } }, _count: { select: { members: true } } },
      orderBy: [{ teamXp: "desc" }, { name: "asc" }],
      take: 30,
    });
    browse = teams
      .filter((t) => sameBracket(me.ageGroup, t.owner.ageGroup))
      .map((t) => {
        const full = t._count.members >= t.maxMembers;
        return {
          name: t.name, tag: t.tag, description: t.description, members: t._count.members, maxMembers: t.maxMembers,
          teamXp: t.teamXp, owner: t.owner.username, joinable: !full, reason: full ? "Jamoa to'lgan" : null,
        };
      });
  }
  return { mine, invites, browse };
}

// ───────────── Harakatlar ─────────────

export async function createTeam(userId: string, input: { name: string; tag: string; description: string; isPublic: boolean }) {
  return db.$transaction(async (tx) => {
    if (await tx.teamMember.findUnique({ where: { userId } })) throw new HttpError(409, "Siz allaqachon jamoadasiz");
    const lower = input.name.toLowerCase();
    const similar = await tx.team.findMany({ where: { OR: [{ name: { contains: input.name } }, { tag: input.tag }] }, select: { name: true, tag: true } });
    if (similar.some((t) => t.name.toLowerCase() === lower || t.tag === input.tag)) throw new HttpError(409, "Bu nom yoki teg band");

    const team = await tx.team.create({ data: { name: input.name, tag: input.tag, description: input.description, isPublic: input.isPublic, ownerId: userId } });
    await tx.teamMember.create({ data: { teamId: team.id, userId, role: "OWNER" } });
    return { ok: true as const };
  });
}

export async function joinTeam(userId: string, name: string) {
  return db.$transaction(async (tx) => {
    const team = await tx.team.findFirst({ where: { name }, include: { owner: { select: { ageGroup: true } } } });
    if (!team) throw new HttpError(404, "Jamoa topilmadi");
    await enterTeam(tx, await userRow(tx, userId), team, false);
    return { ok: true as const };
  });
}

export async function leaveTeam(userId: string) {
  return db.$transaction(async (tx) => {
    const m = await requireMembership(tx, userId);
    if (m.role === "OWNER") {
      const count = await tx.teamMember.count({ where: { teamId: m.teamId } });
      if (count > 1) throw new HttpError(400, "Sardor jamoani tark eta olmaydi: avval sardorlikni topshiring yoki jamoani tarqating");
      await tx.team.delete({ where: { id: m.teamId } });
    } else {
      await tx.teamMember.delete({ where: { id: m.id } });
    }
    return { ok: true as const };
  });
}

export async function inviteToTeam(userId: string, username: string) {
  return db.$transaction(async (tx) => {
    const m = await requireMembership(tx, userId);
    if (!isManager(m.role)) throw new HttpError(403, "Taklif qilish uchun sardor yoki yordamchi bo'lish kerak");

    const target = await tx.user.findFirst({ where: { username, status: "ACTIVE", role: "PLAYER" }, select: { id: true, ageGroup: true } });
    if (!target || target.id === userId || !sameBracket(target.ageGroup, m.team.owner.ageGroup)) throw new HttpError(404, "Foydalanuvchi topilmadi");
    if (await tx.teamMember.findUnique({ where: { userId: target.id } })) throw new HttpError(409, "Bu foydalanuvchi allaqachon jamoada");
    if ((await tx.teamMember.count({ where: { teamId: m.teamId } })) >= m.team.maxMembers) throw new HttpError(409, "Jamoa to'lgan");

    const existing = await tx.teamInvite.findUnique({ where: { teamId_toUserId: { teamId: m.teamId, toUserId: target.id } } });
    if (existing?.status === "PENDING") throw new HttpError(409, "Taklif allaqachon yuborilgan");

    await tx.teamInvite.upsert({
      where: { teamId_toUserId: { teamId: m.teamId, toUserId: target.id } },
      update: { status: "PENDING", byUserId: userId, createdAt: new Date() },
      create: { teamId: m.teamId, toUserId: target.id, byUserId: userId },
    });
    await tx.notification.create({
      data: { userId: target.id, type: "TEAM", title: "Jamoa taklifi", body: `«${m.team.name}» jamoasi sizni taklif qildi.`, link: "/teams" },
    });
    return { ok: true as const };
  });
}

export async function respondInvite(userId: string, inviteId: string, accept: boolean) {
  return db.$transaction(async (tx) => {
    const inv = await tx.teamInvite.findFirst({
      where: { id: inviteId, toUserId: userId, status: "PENDING" },
      include: { team: { include: { owner: { select: { ageGroup: true } } } } },
    });
    if (!inv) throw new HttpError(404, "Taklif topilmadi");
    if (!accept) {
      await tx.teamInvite.update({ where: { id: inv.id }, data: { status: "DECLINED" } });
      return { ok: true as const };
    }
    await enterTeam(tx, await userRow(tx, userId), inv.team, true);
    await tx.teamInvite.update({ where: { id: inv.id }, data: { status: "ACCEPTED" } });
    await tx.teamInvite.updateMany({ where: { toUserId: userId, status: "PENDING" }, data: { status: "DECLINED" } });
    return { ok: true as const };
  });
}

export async function kickMember(userId: string, username: string) {
  return db.$transaction(async (tx) => {
    const m = await requireMembership(tx, userId);
    if (!isManager(m.role)) throw new HttpError(403, "Ruxsat yo'q");
    const target = await tx.teamMember.findFirst({ where: { teamId: m.teamId, user: { username } } });
    if (!target) throw new HttpError(404, "A'zo topilmadi");
    if (target.userId === userId) throw new HttpError(400, "O'zingizni chiqara olmaysiz");
    if (target.role === "OWNER") throw new HttpError(403, "Sardorni chiqarib bo'lmaydi");
    if (m.role === "OFFICER" && target.role !== "MEMBER") throw new HttpError(403, "Yordamchi faqat oddiy a'zolarni chiqara oladi");

    await tx.teamMember.delete({ where: { id: target.id } });
    await tx.notification.create({
      data: { userId: target.userId, type: "TEAM", title: "Jamoadan chiqarildingiz", body: `Siz «${m.team.name}» jamoasidan chiqarildingiz.`, link: "/teams" },
    });
    return { ok: true as const };
  });
}

export async function setMemberRole(userId: string, username: string, role: TeamRole) {
  return db.$transaction(async (tx) => {
    const m = await requireMembership(tx, userId);
    if (m.role !== "OWNER") throw new HttpError(403, "Faqat sardor rollarni o'zgartira oladi");
    const target = await tx.teamMember.findFirst({ where: { teamId: m.teamId, user: { username } } });
    if (!target) throw new HttpError(404, "A'zo topilmadi");
    if (target.userId === userId) throw new HttpError(400, "O'zingizning rolingizni o'zgartira olmaysiz");

    if (role === "OWNER") {
      // Sardorlikni topshirish
      await tx.teamMember.update({ where: { id: target.id }, data: { role: "OWNER" } });
      await tx.teamMember.update({ where: { id: m.id }, data: { role: "OFFICER" } });
      await tx.team.update({ where: { id: m.teamId }, data: { ownerId: target.userId } });
    } else {
      await tx.teamMember.update({ where: { id: target.id }, data: { role } });
    }
    await tx.notification.create({
      data: { userId: target.userId, type: "TEAM", title: "Rolingiz o'zgardi", body: `«${m.team.name}» jamoasida yangi rolingiz: ${role === "OWNER" ? "Sardor" : role === "OFFICER" ? "Yordamchi" : "A'zo"}.`, link: "/teams" },
    });
    return { ok: true as const };
  });
}

export async function updateTeam(userId: string, input: { description: string; isPublic: boolean }) {
  return db.$transaction(async (tx) => {
    const m = await requireMembership(tx, userId);
    if (m.role !== "OWNER") throw new HttpError(403, "Faqat sardor sozlamalarni o'zgartira oladi");
    await tx.team.update({ where: { id: m.teamId }, data: { description: input.description, isPublic: input.isPublic } });
    return { ok: true as const };
  });
}

export async function disbandTeam(userId: string) {
  return db.$transaction(async (tx) => {
    const m = await requireMembership(tx, userId);
    if (m.role !== "OWNER") throw new HttpError(403, "Faqat sardor jamoani tarqata oladi");
    const others = await tx.teamMember.findMany({ where: { teamId: m.teamId, userId: { not: userId } }, select: { userId: true } });
    if (others.length > 0) {
      await tx.notification.createMany({
        data: others.map((o) => ({ userId: o.userId, type: "TEAM", title: "Jamoa tarqatildi", body: `«${m.team.name}» jamoasi tarqatildi.`, link: "/teams" })),
      });
    }
    await tx.team.delete({ where: { id: m.teamId } });
    return { ok: true as const };
  });
}