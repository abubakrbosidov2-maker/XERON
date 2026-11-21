import type { Prisma } from "@prisma/client";
import { db } from "../db";
import { HttpError } from "../auth";
import type { Tx } from "../game";
import type { CommentDTO, FeedPage, PostDTO, ReportReason } from "../community-meta";
import { checkContent } from "./moderation";
import { loadPeople } from "./people";

const PAGE = 10;
const POST_COOLDOWN_MS = 15_000;
const COMMENT_COOLDOWN_MS = 4_000;
const MAX_POSTS_PER_DAY = 30;
const HIDE_AT_REPORTS = 3;

const baseInclude = {
  _count: { select: { likes: true, comments: { where: { status: "VISIBLE" } } } },
  comments: { where: { status: "VISIBLE" }, orderBy: { createdAt: "desc" }, take: 3 },
} satisfies Prisma.PostInclude;
type PostRow = Prisma.PostGetPayload<{ include: typeof baseInclude }>;

async function friendIdsOf(userId: string): Promise<string[]> {
  const rows = await db.friend.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    select: { requesterId: true, addresseeId: true },
  });
  return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
}

/** Postni kim ko'ra oladi: ochiq profil egasi hamma uchun; yopiq profil faqat o'zi va do'stlari uchun. */
function visibleWhere(userId: string, friendIds: string[]): Prisma.PostWhereInput {
  return {
    status: "VISIBLE",
    author: { status: "ACTIVE", OR: [{ id: userId }, { id: { in: friendIds } }, { profile: { is: { isPublic: true } } }] },
  };
}

async function assertVisiblePost(userId: string, postId: string) {
  const friendIds = await friendIdsOf(userId);
  const post = await db.post.findFirst({ where: { AND: [{ id: postId }, visibleWhere(userId, friendIds)] }, select: { id: true, authorId: true } });
  if (!post) throw new HttpError(404, "Post topilmadi");
  return post;
}

async function assemble(rows: PostRow[], userId: string): Promise<PostDTO[]> {
  if (rows.length === 0) return [];
  const authorIds = new Set<string>();
  for (const r of rows) {
    authorIds.add(r.authorId);
    for (const c of r.comments) authorIds.add(c.authorId);
  }
  const ids = [...authorIds];
  const achIds = rows.filter((r) => r.kind === "ACHIEVEMENT" && r.refId).map((r) => r.refId as string);

  const [people, profiles, follows, likedRows, achs] = await Promise.all([
    loadPeople(ids),
    db.profile.findMany({ where: { userId: { in: ids } }, select: { userId: true, isPublic: true } }),
    db.follow.findMany({ where: { followerId: userId, followingId: { in: ids } }, select: { followingId: true } }),
    db.like.findMany({ where: { userId, postId: { in: rows.map((r) => r.id) } }, select: { postId: true } }),
    db.achievement.findMany({ where: { id: { in: achIds } }, select: { id: true, name: true, description: true, rarity: true } }),
  ]);

  const isPublic = new Map(profiles.map((p) => [p.userId, p.isPublic]));
  const followed = new Set(follows.map((f) => f.followingId));
  const liked = new Set(likedRows.map((l) => l.postId));
  const achMap = new Map(achs.map((a) => [a.id, a]));

  const out: PostDTO[] = [];
  for (const r of rows) {
    const author = people.get(r.authorId)?.person;
    if (!author) continue;
    const comments: CommentDTO[] = [];
    for (const c of [...r.comments].reverse()) {
      const ca = people.get(c.authorId)?.person;
      if (ca) comments.push({ id: c.id, content: c.content, createdAt: c.createdAt.toISOString(), author: ca, isMine: c.authorId === userId });
    }
    const ach = r.kind === "ACHIEVEMENT" && r.refId ? achMap.get(r.refId) : undefined;
    out.push({
      id: r.id, kind: r.kind, content: r.content, createdAt: r.createdAt.toISOString(), author, isMine: r.authorId === userId,
      likes: r._count.likes, liked: liked.has(r.id), commentCount: r._count.comments, comments,
      following: followed.has(r.authorId), canFollow: r.authorId !== userId && isPublic.get(r.authorId) !== false,
      achievement: ach ? { name: ach.name, description: ach.description, rarity: ach.rarity } : null,
    });
  }
  return out;
}

export async function getFeed(userId: string, tab: "ALL" | "FOLLOWING", cursor?: string): Promise<FeedPage> {
  const friendIds = await friendIdsOf(userId);
  const and: Prisma.PostWhereInput[] = [visibleWhere(userId, friendIds)];
  if (tab === "FOLLOWING") {
    const fl = await db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    and.push({ authorId: { in: [...fl.map((f) => f.followingId), userId] } });
  }
  const rows = await db.post.findMany({
    where: { AND: and },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: baseInclude,
  });
  let nextCursor: string | null = null;
  if (rows.length > PAGE) {
    rows.pop();
    nextCursor = rows[rows.length - 1].id;
  }
  return { posts: await assemble(rows, userId), nextCursor };
}

async function guardPostRate(userId: string) {
  const last = await db.post.findFirst({ where: { authorId: userId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  if (last && Date.now() - last.createdAt.getTime() < POST_COOLDOWN_MS) {
    throw new HttpError(429, `Biroz kuting: yana ${Math.ceil((POST_COOLDOWN_MS - (Date.now() - last.createdAt.getTime())) / 1000)} soniyadan so'ng yozishingiz mumkin`);
  }
  const dayStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  if ((await db.post.count({ where: { authorId: userId, createdAt: { gte: dayStart } } })) >= MAX_POSTS_PER_DAY) {
    throw new HttpError(429, "Bugungi postlar chegarasiga yetdingiz");
  }
}

export async function createPost(userId: string, content: string) {
  const text = content.trim();
  if (text.length < 1) throw new HttpError(400, "Matn kiriting");
  const bad = await checkContent(text);
  if (bad) throw new HttpError(400, bad);
  await guardPostRate(userId);
  await db.post.create({ data: { authorId: userId, content: text } });
  return { ok: true as const };
}

export async function shareAchievement(userId: string, achievementId: string) {
  const ua = await db.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId } },
    include: { achievement: true },
  });
  if (!ua) throw new HttpError(403, "Bu yutuq sizda yo'q");
  const dup = await db.post.findFirst({ where: { authorId: userId, kind: "ACHIEVEMENT", refId: achievementId } });
  if (dup) throw new HttpError(409, "Bu yutuq allaqachon ulashilgan");
  await guardPostRate(userId);
  await db.post.create({
    data: { authorId: userId, kind: "ACHIEVEMENT", refId: achievementId, content: `«${ua.achievement.name}» yutug'ini ochdim!` },
  });
  return { ok: true as const };
}

export async function deletePost(user: { id: string; role: string }, postId: string) {
  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true, status: true } });
  if (!post || post.status === "REMOVED") throw new HttpError(404, "Post topilmadi");
  const staff = user.role === "ADMIN" || user.role === "MODERATOR";
  if (post.authorId !== user.id && !staff) throw new HttpError(403, "Ruxsat yo'q");
  await db.$transaction(async (tx) => {
    await tx.post.update({ where: { id: postId }, data: { status: "REMOVED" } });
    if (staff && post.authorId !== user.id) {
      await tx.adminAction.create({ data: { adminId: user.id, action: "REMOVE_POST", targetType: "POST", targetId: postId } });
      await tx.notification.create({ data: { userId: post.authorId, type: "COMMUNITY", title: "Postingiz o'chirildi", body: "Postingiz hamjamiyat qoidalariga mos kelmagani uchun o'chirildi.", link: "/community" } });
    }
  });
  return { ok: true as const };
}

export async function toggleLike(userId: string, postId: string) {
  const post = await assertVisiblePost(userId, postId);
  const existing = await db.like.findUnique({ where: { userId_postId: { userId, postId } } });
  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
  } else {
    await db.like.create({ data: { userId, postId } });
    if (post.authorId !== userId) {
      const me = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { username: true } });
      await db.notification.create({ data: { userId: post.authorId, type: "COMMUNITY", title: "Postingiz yoqdi", body: `${me.username} postingizga like bosdi.`, link: "/community" } });
    }
  }
  const likes = await db.like.count({ where: { postId } });
  return { liked: !existing, likes };
}

async function toCommentDTO(c: { id: string; content: string; createdAt: Date; authorId: string }, userId: string): Promise<CommentDTO | null> {
  const person = (await loadPeople([c.authorId])).get(c.authorId)?.person;
  return person ? { id: c.id, content: c.content, createdAt: c.createdAt.toISOString(), author: person, isMine: c.authorId === userId } : null;
}

export async function addComment(userId: string, postId: string, content: string) {
  const post = await assertVisiblePost(userId, postId);
  const text = content.trim();
  if (text.length < 1) throw new HttpError(400, "Izoh yozing");
  const bad = await checkContent(text);
  if (bad) throw new HttpError(400, bad);

  const last = await db.comment.findFirst({ where: { authorId: userId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  if (last && Date.now() - last.createdAt.getTime() < COMMENT_COOLDOWN_MS) throw new HttpError(429, "Juda tez. Bir necha soniya kuting.");

  const c = await db.comment.create({ data: { postId, authorId: userId, content: text } });
  if (post.authorId !== userId) {
    const me = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { username: true } });
    await db.notification.create({ data: { userId: post.authorId, type: "COMMUNITY", title: "Yangi izoh", body: `${me.username} postingizga izoh yozdi.`, link: "/community" } });
  }
  const dto = await toCommentDTO(c, userId);
  if (!dto) throw new HttpError(500, "Xatolik");
  return { comment: dto };
}

export async function loadComments(userId: string, postId: string) {
  await assertVisiblePost(userId, postId);
  const rows = await db.comment.findMany({ where: { postId, status: "VISIBLE" }, orderBy: { createdAt: "asc" }, take: 100 });
  const people = await loadPeople([...new Set(rows.map((r) => r.authorId))]);
  const comments: CommentDTO[] = [];
  for (const c of rows) {
    const p = people.get(c.authorId)?.person;
    if (p) comments.push({ id: c.id, content: c.content, createdAt: c.createdAt.toISOString(), author: p, isMine: c.authorId === userId });
  }
  return { comments };
}

export async function deleteComment(user: { id: string; role: string }, commentId: string) {
  const c = await db.comment.findUnique({ where: { id: commentId }, include: { post: { select: { authorId: true } } } });
  if (!c || c.status === "REMOVED") throw new HttpError(404, "Izoh topilmadi");
  const staff = user.role === "ADMIN" || user.role === "MODERATOR";
  if (c.authorId !== user.id && c.post.authorId !== user.id && !staff) throw new HttpError(403, "Ruxsat yo'q");
  await db.$transaction(async (tx) => {
    await tx.comment.update({ where: { id: commentId }, data: { status: "REMOVED" } });
    if (staff && c.authorId !== user.id) await tx.adminAction.create({ data: { adminId: user.id, action: "REMOVE_COMMENT", targetType: "COMMENT", targetId: commentId } });
  });
  return { ok: true as const };
}

export async function toggleFollow(userId: string, username: string) {
  const target = await db.user.findFirst({
    where: { username, status: "ACTIVE", role: "PLAYER", profile: { is: { isPublic: true } } },
    select: { id: true },
  });
  if (!target || target.id === userId) throw new HttpError(404, "Foydalanuvchi topilmadi");
  const existing = await db.follow.findUnique({ where: { followerId_followingId: { followerId: userId, followingId: target.id } } });
  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    return { following: false };
  }
  await db.follow.create({ data: { followerId: userId, followingId: target.id } });
  const me = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { username: true } });
  await db.notification.create({ data: { userId: target.id, type: "COMMUNITY", title: "Yangi kuzatuvchi", body: `${me.username} sizni kuzata boshladi.`, link: "/community" } });
  return { following: true };
}

async function hideTarget(tx: Tx, targetType: string, targetId: string) {
  if (targetType === "POST") {
    const r = await tx.post.updateMany({ where: { id: targetId, status: "VISIBLE" }, data: { status: "HIDDEN" } });
    if (r.count > 0) {
      const p = await tx.post.findUnique({ where: { id: targetId }, select: { authorId: true } });
      if (p) await tx.notification.create({ data: { userId: p.authorId, type: "COMMUNITY", title: "Postingiz yashirildi", body: "Ko'p shikoyat tushgani uchun postingiz moderator ko'rib chiqquncha yashirildi.", link: "/community" } });
    }
  } else if (targetType === "COMMENT") {
    await tx.comment.updateMany({ where: { id: targetId, status: "VISIBLE" }, data: { status: "HIDDEN" } });
  }
}

export async function createReport(userId: string, input: { targetType: "POST" | "COMMENT"; id: string; reason: ReportReason; details: string }) {
  return db.$transaction(async (tx) => {
    let authorId: string | undefined;
    if (input.targetType === "POST") {
      authorId = (await tx.post.findFirst({ where: { id: input.id, status: "VISIBLE" }, select: { authorId: true } }))?.authorId;
    } else {
      authorId = (await tx.comment.findFirst({ where: { id: input.id, status: "VISIBLE" }, select: { authorId: true } }))?.authorId;
    }
    if (!authorId) throw new HttpError(404, "Kontent topilmadi");
    if (authorId === userId) throw new HttpError(400, "O'zingizning kontentingizga shikoyat qila olmaysiz");

    const dup = await tx.report.findFirst({ where: { reporterId: userId, targetType: input.targetType, targetId: input.id } });
    if (dup) throw new HttpError(409, "Siz allaqachon shikoyat qilgansiz");

    await tx.report.create({
      data: { reporterId: userId, targetType: input.targetType, targetId: input.id, reason: input.reason, details: input.details.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, 300) },
    });
    const open = await tx.report.findMany({ where: { targetType: input.targetType, targetId: input.id, status: "OPEN" }, select: { reporterId: true } });
    if (new Set(open.map((r) => r.reporterId)).size >= HIDE_AT_REPORTS) await hideTarget(tx, input.targetType, input.id);
    return { ok: true as const };
  });
}