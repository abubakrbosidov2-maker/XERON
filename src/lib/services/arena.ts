import type { Competition, CompetitionQuestion } from "@prisma/client";
import { db } from "../db";
import { HttpError } from "../auth";
import type { Tx } from "../game";
import type {
  AnswerResult, ArenaStatus, CompetitionCard, CompetitionDetail, LeaderRow, MyArenaStatus, MyResult, PlayState, TeamRow,
} from "../arena-meta";
import { changeCurrency, grantXp } from "./economy";
import { checkAchievements } from "./achievements";

const GRACE_MS = 2000; // tarmoq kechikishi uchun ozgina imkoniyat
const MIN_ANSWER_GAP_MS = 800; // anti-cheat: juda tez javoblar (bot) rad etiladi
const FINISH_REWARD_SHARE = 0.6; // tugatgandagi mukofot ulushi (aniqlikka ko'ra)
const PLACE_BONUS = [0.4, 0.25, 0.15]; // 1-3 o'rin uchun qo'shimcha ulush
const SPEED_BONUS_SHARE = 0.5; // tez javob uchun maksimal qo'shimcha ball ulushi

type CompLite = Pick<Competition, "id" | "slug" | "title" | "xpReward" | "coinReward">;

export function statusOf(c: { startsAt: Date; endsAt: Date }, now = new Date()): ArenaStatus {
  if (now < c.startsAt) return "UPCOMING";
  if (now > c.endsAt) return "FINISHED";
  return "LIVE";
}

const deadlineOf = (c: Pick<Competition, "durationSec" | "endsAt">, startedAt: Date) =>
  Math.min(startedAt.getTime() + c.durationSec * 1000, c.endsAt.getTime());

function parseOptions(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

// ───────────── Holatlarni yangilash va yakunlash ─────────────

async function settleParticipant(tx: Tx, comp: CompLite, total: number, part: { id: string; userId: string }, finishedAt: Date) {
  const res = await tx.competitionParticipant.updateMany({
    where: { id: part.id, status: "PLAYING" },
    data: { status: "FINISHED", finishedAt },
  });
  if (res.count === 0) return null; // allaqachon yakunlangan

  const correct = await tx.competitionAnswer.count({ where: { participantId: part.id, correct: true } });
  const ratio = total > 0 ? correct / total : 0;
  const xp = Math.round(comp.xpReward * FINISH_REWARD_SHARE * ratio);
  const coins = Math.round(comp.coinReward * FINISH_REWARD_SHARE * ratio);
  const ref = { type: "COMPETITION", id: part.id };
  if (xp > 0) await grantXp(tx, part.userId, xp, "COMPETITION", ref);
  if (coins > 0) await changeCurrency(tx, part.userId, "COINS", coins, "COMPETITION", ref);
  await tx.competitionParticipant.update({ where: { id: part.id }, data: { rewardGiven: true } });
  await tx.notification.create({
    data: {
      userId: part.userId, type: "COMPETITION", title: `${comp.title}: yakunlandi`,
      body: `To'g'ri javoblar: ${correct}/${total}${xp ? `, +${xp} XP` : ""}${coins ? `, +${coins} tanga` : ""}`, link: `/arena/${comp.slug}`,
    },
  });
  return { correct, total, xp, coins };
}

async function finalizeCompetition(id: string) {
  await db.$transaction(
    async (tx) => {
      const guard = await tx.competition.updateMany({ where: { id, finalizedAt: null }, data: { finalizedAt: new Date(), status: "FINISHED" } });
      if (guard.count === 0) return; // boshqa so'rov allaqachon yakunlagan

      const comp = await tx.competition.findUniqueOrThrow({ where: { id }, include: { _count: { select: { questions: true } } } });
      const total = comp._count.questions;

      // Hali o'ynayotganlarni yakunlash
      const playing = await tx.competitionParticipant.findMany({ where: { competitionId: id, status: "PLAYING" } });
      for (const p of playing) {
        const finishedAt = p.startedAt ? new Date(Math.min(deadlineOf(comp, p.startedAt), comp.endsAt.getTime())) : new Date();
        await settleParticipant(tx, comp, total, p, finishedAt);
      }

      // Reyting: ball (kamayish), keyin tezlik (o'sish)
      const started = await tx.competitionParticipant.findMany({ where: { competitionId: id, startedAt: { not: null }, score: { gt: 0 } } });
      const dur = (p: { startedAt: Date | null; finishedAt: Date | null }) => (p.startedAt && p.finishedAt ? p.finishedAt.getTime() - p.startedAt.getTime() : Number.MAX_SAFE_INTEGER);
      const sorted = [...started].sort((a, b) => b.score - a.score || dur(a) - dur(b) || a.id.localeCompare(b.id));

      for (const [i, p] of sorted.entries()) {
        const rank = i + 1;
        await tx.competitionParticipant.update({ where: { id: p.id }, data: { rank } });
        const share = PLACE_BONUS[i] ?? 0;
        let bonus = "";
        if (share > 0) {
          const xp = Math.round(comp.xpReward * share);
          const coins = Math.round(comp.coinReward * share);
          const ref = { type: "COMPETITION", id: p.id };
          if (xp > 0) await grantXp(tx, p.userId, xp, "COMPETITION_RANK", ref);
          if (coins > 0) await changeCurrency(tx, p.userId, "COINS", coins, "COMPETITION", ref);
          bonus = ` Sovrin: +${xp} XP, +${coins} tanga.`;
        }
        await tx.notification.create({
          data: { userId: p.userId, type: "COMPETITION", title: `${comp.title}: ${rank}-o'rin`, body: `Natijangiz: ${p.score} ball.${bonus}`, link: `/arena/${comp.slug}` },
        });
      }
      if (sorted[0]) await checkAchievements(tx, sorted[0].userId);
    },
    { timeout: 60_000, maxWait: 15_000 },
  );
}

/** Vaqtga qarab holatlarni yangilaydi va muddati o'tgan musobaqalarni yakunlaydi (lazy). */
export async function syncCompetitions() {
  const now = new Date();
  await db.competition.updateMany({ where: { status: "UPCOMING", startsAt: { lte: now }, endsAt: { gt: now } }, data: { status: "LIVE" } });
  const due = await db.competition.findMany({ where: { finalizedAt: null, endsAt: { lte: now } }, select: { id: true } });
  for (const c of due) await finalizeCompetition(c.id);
}

async function settleExpired(userId: string) {
  const now = Date.now();
  const parts = await db.competitionParticipant.findMany({
    where: { userId, status: "PLAYING" },
    include: { competition: { include: { _count: { select: { questions: true } } } } },
  });
  for (const p of parts) {
    if (!p.startedAt) continue;
    const dl = deadlineOf(p.competition, p.startedAt);
    if (now > dl + GRACE_MS) {
      await db.$transaction(async (tx) => {
        await settleParticipant(tx, p.competition, p.competition._count.questions, p, new Date(dl));
      });
    }
  }
}

// ───────────── O'qish ─────────────

function toCard(
  c: Competition & { _count: { questions: number; participants: number } },
  me: MyArenaStatus,
  level: number,
  now: Date,
): CompetitionCard {
  return {
    id: c.id, slug: c.slug, title: c.title, description: c.description, type: c.type, status: statusOf(c, now),
    startsAt: c.startsAt.toISOString(), endsAt: c.endsAt.toISOString(), durationSec: c.durationSec,
    xpReward: c.xpReward, coinReward: c.coinReward, minLevel: c.minLevel, season: c.season,
    questionCount: c._count.questions, participants: c._count.participants, me,
    locked: level < c.minLevel ? `${c.minLevel}-daraja kerak` : null,
  };
}

async function levelOf(userId: string) {
  const ch = await db.character.findUnique({ where: { userId }, select: { level: true } });
  if (!ch) throw new HttpError(404, "Qahramon topilmadi");
  return ch.level;
}

export async function listCompetitions(userId: string): Promise<CompetitionCard[]> {
  await syncCompetitions();
  await settleExpired(userId);
  const now = new Date();
  const level = await levelOf(userId);
  const comps = await db.competition.findMany({ orderBy: { startsAt: "asc" }, include: { _count: { select: { questions: true, participants: true } } } });
  const mine = await db.competitionParticipant.findMany({ where: { userId } });
  const order: Record<string, number> = { LIVE: 0, UPCOMING: 1, FINISHED: 2 };
  return comps
    .map((c) => toCard(c, (mine.find((m) => m.competitionId === c.id)?.status as MyArenaStatus | undefined) ?? "NONE", level, now))
    .sort((a, b) => order[a.status] - order[b.status]);
}

export async function getCompetitionDetail(userId: string, slug: string): Promise<CompetitionDetail | null> {
  await syncCompetitions();
  await settleExpired(userId);
  const now = new Date();
  const comp = await db.competition.findUnique({ where: { slug }, include: { _count: { select: { questions: true, participants: true } } } });
  if (!comp) return null;

  const level = await levelOf(userId);
  const myPart = await db.competitionParticipant.findUnique({ where: { competitionId_userId: { competitionId: comp.id, userId } } });

  const parts = await db.competitionParticipant.findMany({
    where: { competitionId: comp.id, startedAt: { not: null } },
    include: {
      user: {
        select: {
          username: true, country: true,
          character: { select: { level: true } },
          profile: { select: { showCountry: true } },
          teamMembers: { select: { team: { select: { name: true, tag: true } } } },
        },
      },
    },
  });

  const durOf = (p: { startedAt: Date | null; finishedAt: Date | null }) =>
    p.startedAt ? Math.round(((p.finishedAt ?? now).getTime() - p.startedAt.getTime()) / 1000) : Number.MAX_SAFE_INTEGER;
  const sorted = [...parts].sort((a, b) => b.score - a.score || durOf(a) - durOf(b) || a.id.localeCompare(b.id));

  const rows: LeaderRow[] = sorted.map((p, i) => ({
    rank: i + 1, username: p.user.username,
    country: p.user.profile?.showCountry === false ? null : p.user.country,
    level: p.user.character?.level ?? 1, score: p.score, durationSec: p.startedAt ? durOf(p) : null,
    isMe: p.userId === userId, status: p.status, team: p.user.teamMembers[0]?.team.tag ?? null,
  }));

  const teamMap = new Map<string, TeamRow>();
  for (const p of sorted) {
    const t = p.user.teamMembers[0]?.team;
    if (!t) continue;
    const cur = teamMap.get(t.name) ?? { rank: 0, name: t.name, tag: t.tag, score: 0, members: 0 };
    cur.score += p.score;
    cur.members += 1;
    teamMap.set(t.name, cur);
  }
  const teams = [...teamMap.values()].sort((a, b) => b.score - a.score).map((t, i) => ({ ...t, rank: i + 1 }));

  let my: MyResult | null = null;
  if (myPart) {
    const total = comp._count.questions;
    const correct = await db.competitionAnswer.count({ where: { participantId: myPart.id, correct: true } });
    const xp = await db.xPTransaction.aggregate({ where: { userId, refType: "COMPETITION", refId: myPart.id }, _sum: { amount: true } });
    const coins = await db.currencyTransaction.aggregate({ where: { userId, refType: "COMPETITION", refId: myPart.id, currency: "COINS" }, _sum: { amount: true } });
    my = {
      status: myPart.status as MyArenaStatus, score: myPart.score, correct, total,
      rank: myPart.startedAt && myPart.score > 0 ? rows.find((r) => r.isMe)?.rank ?? null : null,
      rewardXp: xp._sum.amount ?? 0, rewardCoins: coins._sum.amount ?? 0,
    };
  }

  return {
    card: toCard(comp, (myPart?.status as MyArenaStatus | undefined) ?? "NONE", level, now),
    leaderboard: rows.slice(0, 20), teams: teams.slice(0, 10), my, serverNow: now.toISOString(),
  };
}

// ───────────── Harakatlar ─────────────

export async function registerForCompetition(userId: string, slug: string) {
  await syncCompetitions();
  return db.$transaction(async (tx) => {
    const comp = await tx.competition.findUnique({ where: { slug }, include: { _count: { select: { participants: true } } } });
    if (!comp) throw new HttpError(404, "Musobaqa topilmadi");
    if (statusOf(comp) === "FINISHED") throw new HttpError(403, "Musobaqa tugagan");

    const ch = await tx.character.findUnique({ where: { userId }, select: { level: true } });
    if (!ch) throw new HttpError(404, "Qahramon topilmadi");
    if (ch.level < comp.minLevel) throw new HttpError(403, `Buning uchun kamida ${comp.minLevel}-daraja kerak`);
    if (comp._count.participants >= comp.maxParticipants) throw new HttpError(409, "Joylar to'lgan");

    const existing = await tx.competitionParticipant.findUnique({ where: { competitionId_userId: { competitionId: comp.id, userId } } });
    if (existing) throw new HttpError(409, "Siz allaqachon ro'yxatdan o'tgansiz");

    await tx.competitionParticipant.create({ data: { competitionId: comp.id, userId } });
    await tx.notification.create({
      data: { userId, type: "COMPETITION", title: `${comp.title}: ro'yxatdan o'tdingiz`, body: "Musobaqa boshlanganda qatnashishingiz mumkin.", link: `/arena/${comp.slug}` },
    });
    return { ok: true as const };
  });
}

function buildPlay(
  comp: Competition & { questions: CompetitionQuestion[] },
  part: { startedAt: Date; score: number },
  answers: { questionId: string; correct: boolean; pointsAwarded: number }[],
  now: Date,
): PlayState {
  const ordered = [...comp.questions].sort((a, b) => a.orderIndex - b.orderIndex);
  return {
    // correctIndex hech qachon mijozga yuborilmaydi
    questions: ordered.map((q, i) => ({ id: q.id, index: i, prompt: q.prompt, options: parseOptions(q.optionsJson) })),
    answers: Object.fromEntries(answers.map((a) => [a.questionId, { correct: a.correct, points: a.pointsAwarded }])),
    deadline: new Date(deadlineOf(comp, part.startedAt)).toISOString(),
    serverNow: now.toISOString(),
    score: part.score,
    durationSec: comp.durationSec,
  };
}

export async function startCompetition(userId: string, slug: string): Promise<{ play: PlayState } | { expired: true }> {
  await syncCompetitions();
  return db.$transaction(async (tx) => {
    const now = new Date();
    const comp = await tx.competition.findUnique({ where: { slug }, include: { questions: true } });
    if (!comp) throw new HttpError(404, "Musobaqa topilmadi");
    if (statusOf(comp, now) !== "LIVE") throw new HttpError(403, "Musobaqa hozir faol emas");
    if (comp.questions.length === 0) throw new HttpError(400, "Musobaqada savollar yo'q");

    let part = await tx.competitionParticipant.findUnique({ where: { competitionId_userId: { competitionId: comp.id, userId } } });
    if (!part) throw new HttpError(400, "Avval ro'yxatdan o'ting");
    if (part.status === "FINISHED") throw new HttpError(409, "Siz bu musobaqada allaqachon qatnashgansiz");

    if (part.status === "REGISTERED") {
      const upd = await tx.competitionParticipant.updateMany({ where: { id: part.id, status: "REGISTERED" }, data: { status: "PLAYING", startedAt: now } });
      part = await tx.competitionParticipant.findUniqueOrThrow({ where: { id: part.id } });
      if (upd.count === 0 && part.status === "FINISHED") throw new HttpError(409, "Siz bu musobaqada allaqachon qatnashgansiz");
    }
    if (!part.startedAt) throw new HttpError(500, "Holat noto'g'ri");

    const dl = deadlineOf(comp, part.startedAt);
    if (now.getTime() > dl + GRACE_MS) {
      await settleParticipant(tx, comp, comp.questions.length, part, new Date(dl));
      return { expired: true as const };
    }

    const answers = await tx.competitionAnswer.findMany({ where: { participantId: part.id }, select: { questionId: true, correct: true, pointsAwarded: true } });
    return { play: buildPlay(comp, { startedAt: part.startedAt, score: part.score }, answers, now) };
  });
}

export async function answerQuestion(userId: string, slug: string, questionId: string, selectedIndex: number): Promise<AnswerResult> {
  return db.$transaction(async (tx): Promise<AnswerResult> => {
    const now = new Date();
    const comp = await tx.competition.findUnique({ where: { slug }, include: { questions: true } });
    if (!comp) throw new HttpError(404, "Musobaqa topilmadi");
    const part = await tx.competitionParticipant.findUnique({ where: { competitionId_userId: { competitionId: comp.id, userId } } });
    if (!part || part.status !== "PLAYING" || !part.startedAt) throw new HttpError(400, "Siz hozir bu musobaqada o'ynamayapsiz");

    const total = comp.questions.length;
    const dl = deadlineOf(comp, part.startedAt);
    if (now.getTime() > dl + GRACE_MS) {
      await settleParticipant(tx, comp, total, part, new Date(dl));
      return { ok: false, expired: true };
    }

    const q = comp.questions.find((x) => x.id === questionId);
    if (!q) throw new HttpError(404, "Savol topilmadi");
    const options = parseOptions(q.optionsJson);
    if (selectedIndex < 0 || selectedIndex >= options.length) throw new HttpError(400, "Noto'g'ri variant");

    const dup = await tx.competitionAnswer.findUnique({ where: { participantId_questionId: { participantId: part.id, questionId } } });
    if (dup) throw new HttpError(409, "Bu savolga allaqachon javob bergansiz");

    const last = await tx.competitionAnswer.findFirst({ where: { participantId: part.id }, orderBy: { answeredAt: "desc" } });
    const since = now.getTime() - (last?.answeredAt ?? part.startedAt).getTime();
    if (since < MIN_ANSWER_GAP_MS) throw new HttpError(429, "Juda tez. Savolni o'qib chiqing.");

    // Ball serverda hisoblanadi: to'g'ri javob + qolgan vaqtga qarab tezlik bonusi
    const correct = q.correctIndex === selectedIndex;
    const remainingFrac = Math.max(0, Math.min(1, (dl - now.getTime()) / (comp.durationSec * 1000)));
    const points = correct ? q.points + Math.round(q.points * SPEED_BONUS_SHARE * remainingFrac) : 0;

    await tx.competitionAnswer.create({ data: { participantId: part.id, questionId, selectedIndex, correct, pointsAwarded: points } });
    const updated = await tx.competitionParticipant.update({ where: { id: part.id }, data: { score: { increment: points } } });

    const answeredCount = await tx.competitionAnswer.count({ where: { participantId: part.id } });
    let finished = false;
    if (answeredCount >= total) {
      await settleParticipant(tx, comp, total, part, now);
      finished = true;
    }
    return { ok: true, correct, points, score: updated.score, finished };
  });
}

export async function finishCompetition(userId: string, slug: string) {
  return db.$transaction(async (tx) => {
    const comp = await tx.competition.findUnique({ where: { slug }, include: { _count: { select: { questions: true } } } });
    if (!comp) throw new HttpError(404, "Musobaqa topilmadi");
    const part = await tx.competitionParticipant.findUnique({ where: { competitionId_userId: { competitionId: comp.id, userId } } });
    if (!part) throw new HttpError(400, "Siz bu musobaqada qatnashmayapsiz");
    if (part.status !== "PLAYING" || !part.startedAt) return { ok: true as const };
    const finishedAt = new Date(Math.min(Date.now(), deadlineOf(comp, part.startedAt)));
    await settleParticipant(tx, comp, comp._count.questions, part, finishedAt);
    return { ok: true as const };
  });
}