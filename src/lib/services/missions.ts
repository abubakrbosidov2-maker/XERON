import type { Mission } from "@prisma/client";
import { db } from "../db";
import { HttpError } from "../auth";
import { checkAnswer } from "../answers";
import type { Tx } from "../game";
import { TYPE_ORDER, type MissionCard, type MissionDTO, type MissionState, type SubmitResult } from "../mission-meta";
import { changeCurrency, grantXp } from "./economy";
import { checkAchievements } from "./achievements";

const PERIODIC = new Set(["DAILY", "WEEKLY", "MONTHLY"]);
const DIFF_ORDER = ["EASY", "MEDIUM", "HARD", "EPIC"];
// Dev rejimida kutish vaqtlari 20 baravar qisqartirilgan (sinab ko'rish qulay bo'lishi uchun)
const SCALE = process.env.NODE_ENV === "production" ? 1 : 0.05;
const MAX_COMPLETIONS_PER_DAY = 25;
const GLOBAL_PROJECT_BY_CATEGORY: Record<string, string> = { NATURE: "green-planet", KNOWLEDGE: "knowledge-tower", INTELLIGENCE: "knowledge-tower" };

/** Qayta bajariladigan missiyalar uchun davr kaliti (UTC): kun, hafta (ISO), oy. */
export function periodKey(type: string, now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  if (type === "DAILY") return `${y}-${m}-${d}`;
  if (type === "MONTHLY") return `${y}-${m}`;
  if (type === "WEEKLY") {
    const t = new Date(Date.UTC(y, now.getUTCMonth(), now.getUTCDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
    return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  return "ONCE";
}

function parseOptions(json: string | null): string[] | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : null;
  } catch {
    return null;
  }
}

export function minCharsFor(m: Pick<Mission, "description" | "difficulty" | "verificationMethod">): number | null {
  if (m.verificationMethod !== "TEXT") return null;
  const hit = /kamida (\d+) belgi/i.exec(m.description);
  if (hit) return Math.min(500, Number(hit[1]));
  return m.difficulty === "HARD" ? 100 : m.difficulty === "MEDIUM" ? 50 : 30;
}

const maxAttempts = (m: Pick<Mission, "type">) => (PERIODIC.has(m.type) ? 1 : 2);

export function toMissionDTO(m: Mission, withOptions: boolean): MissionDTO {
  return {
    id: m.id, slug: m.slug, title: m.title, description: m.description, category: m.category, type: m.type,
    difficulty: m.difficulty, xp: m.xpReward, coins: m.coinReward, gems: m.gemReward, requirements: m.requirements,
    verification: m.verificationMethod, minLevel: m.minLevel, deadline: m.deadline ? m.deadline.toISOString() : null,
    question: m.question, options: withOptions ? parseOptions(m.optionsJson) : null, minChars: minCharsFor(m),
  };
}

interface Ctx { level: number; birthYear: number | null; inTeam: boolean }

async function loadCtx(tx: Tx, userId: string): Promise<Ctx> {
  const ch = await tx.character.findUnique({ where: { userId }, select: { level: true } });
  const user = await tx.user.findUnique({ where: { id: userId }, select: { birthYear: true } });
  const member = await tx.teamMember.findUnique({ where: { userId } });
  if (!ch) throw new HttpError(404, "Qahramon topilmadi");
  return { level: ch.level, birthYear: user?.birthYear ?? null, inTeam: !!member };
}

function availability(m: Mission, ctx: Ctx, now: Date): string | null {
  if (!m.isActive) return "Missiya faol emas";
  if (m.startsAt && m.startsAt > now) return "Hali boshlanmagan";
  if (m.deadline && m.deadline < now) return "Muddati tugagan";
  if (ctx.level < m.minLevel) return `${m.minLevel}-daraja kerak`;
  if (m.minAge && ctx.birthYear && new Date().getFullYear() - ctx.birthYear < m.minAge) return "Yosh cheklovi";
  if (m.type === "TEAM" && !ctx.inTeam) return "Jamoa a'zosi bo'lish kerak";
  return null;
}

type PartLite = { status: string; _count: { submissions: number } };

function stateFor(m: Mission, part: PartLite | undefined, ctx: Ctx, now: Date): MissionState {
  const lock = availability(m, ctx, now);
  const max = maxAttempts(m);
  const isQuiz = m.verificationMethod === "QUIZ";
  if (!part) return { status: "NONE", lock, attemptsLeft: isQuiz ? max : null };
  if (part.status === "COMPLETED") return { status: "COMPLETED", lock: null, attemptsLeft: null };
  if (part.status === "REJECTED") return { status: "REJECTED", lock: null, attemptsLeft: 0 };
  return { status: "ACCEPTED", lock, attemptsLeft: isQuiz ? Math.max(0, max - part._count.submissions) : null };
}

export async function listMissionsForUser(userId: string): Promise<MissionCard[]> {
  const now = new Date();
  const ctx = await loadCtx(db, userId);
  const missions = await db.mission.findMany({
    where: { isActive: true, AND: [{ OR: [{ deadline: null }, { deadline: { gt: now } }] }, { OR: [{ startsAt: null }, { startsAt: { lte: now } }] }] },
  });
  const parts = await db.missionParticipation.findMany({ where: { userId }, include: { _count: { select: { submissions: true } } } });

  return missions
    .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || DIFF_ORDER.indexOf(a.difficulty) - DIFF_ORDER.indexOf(b.difficulty))
    .map((m) => {
      const key = periodKey(m.type, now);
      const part = parts.find((p) => p.missionId === m.id && p.periodKey === key);
      return { mission: toMissionDTO(m, false), state: stateFor(m, part, ctx, now) };
    });
}

export async function getMissionDetail(userId: string, slug: string) {
  const now = new Date();
  const m = await db.mission.findUnique({ where: { slug } });
  if (!m || !m.isActive) return null;
  const ctx = await loadCtx(db, userId);
  const part = await db.missionParticipation.findUnique({
    where: { userId_missionId_periodKey: { userId, missionId: m.id, periodKey: periodKey(m.type, now) } },
    include: { _count: { select: { submissions: true } } },
  });
  return { mission: toMissionDTO(m, true), state: stateFor(m, part ?? undefined, ctx, now) };
}

export async function acceptMission(userId: string, slug: string) {
  return db.$transaction(async (tx) => {
    const now = new Date();
    const m = await tx.mission.findUnique({ where: { slug } });
    if (!m) throw new HttpError(404, "Missiya topilmadi");
    const lock = availability(m, await loadCtx(tx, userId), now);
    if (lock) throw new HttpError(403, lock);

    const key = periodKey(m.type, now);
    const existing = await tx.missionParticipation.findUnique({
      where: { userId_missionId_periodKey: { userId, missionId: m.id, periodKey: key } },
    });
    if (existing) {
      throw new HttpError(409, existing.status === "COMPLETED" ? "Bu missiyani shu davr uchun bajargansiz" : "Missiya allaqachon qabul qilingan");
    }
    await tx.missionParticipation.create({ data: { userId, missionId: m.id, periodKey: key } });
    return { status: "ACCEPTED" as const };
  }, { timeout: 15_000 });
}

export interface SubmitInput { choiceIndex?: number; text?: string; confirm?: boolean }

export async function submitMission(userId: string, slug: string, input: SubmitInput): Promise<SubmitResult> {
  return db.$transaction(async (tx): Promise<SubmitResult> => {
    const now = new Date();
    const m = await tx.mission.findUnique({ where: { slug } });
    if (!m) throw new HttpError(404, "Missiya topilmadi");
    const lock = availability(m, await loadCtx(tx, userId), now);
    if (lock) throw new HttpError(403, lock);

    const key = periodKey(m.type, now);
    const p = await tx.missionParticipation.findUnique({
      where: { userId_missionId_periodKey: { userId, missionId: m.id, periodKey: key } },
    });
    if (!p) throw new HttpError(400, "Avval missiyani qabul qiling");
    if (p.status === "COMPLETED") throw new HttpError(409, "Missiya allaqachon bajarilgan");
    if (p.status !== "ACCEPTED") throw new HttpError(403, "Bu davr uchun urinishlar tugagan");

    // Anti-cheat: kuniga bajariladigan missiyalar soni cheklangan
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const doneToday = await tx.missionParticipation.count({ where: { userId, status: "COMPLETED", completedAt: { gte: dayStart } } });
    if (doneToday >= MAX_COMPLETIONS_PER_DAY) throw new HttpError(429, "Bugungi missiyalar chegarasiga yetdingiz. Ertaga davom eting.");

    const elapsed = (now.getTime() - p.acceptedAt.getTime()) / 1000;
    const waitFor = (min: number) => {
      if (elapsed < min) throw new HttpError(429, `Biroz kuting: yana ${Math.ceil(min - elapsed)} soniyadan so'ng yuborishingiz mumkin`);
    };

    const attempts = await tx.missionSubmission.count({ where: { participationId: p.id } });
    let content = "";

    if (m.verificationMethod === "QUIZ") {
      waitFor(3);
      const options = parseOptions(m.optionsJson) ?? [];
      const idx = input.choiceIndex;
      if (idx === undefined || idx < 0 || idx >= options.length) throw new HttpError(400, "Javob variantini tanlang");
      const max = maxAttempts(m);
      if (attempts >= max) throw new HttpError(403, "Urinishlar tugagan");

      const correct = !!m.answerHash && checkAnswer(options[idx], m.answerHash);
      if (!correct) {
        const left = Math.max(0, max - (attempts + 1));
        await tx.missionSubmission.create({ data: { participationId: p.id, content: options[idx], status: "REJECTED", score: 0 } });
        if (left === 0) await tx.missionParticipation.update({ where: { id: p.id }, data: { status: "REJECTED" } });
        return {
          ok: false, attemptsLeft: left, rejected: left === 0,
          message: left > 0 ? `Noto'g'ri javob. Yana ${left} ta urinish qoldi.` : "Noto'g'ri javob. Urinishlar tugadi.",
        };
      }
      content = options[idx];
    } else if (m.verificationMethod === "TEXT") {
      waitFor(45 * SCALE);
      const need = minCharsFor(m) ?? 30;
      const text = (input.text ?? "").trim().replace(/\s+/g, " ");
      if (text.length < need) throw new HttpError(400, `Kamida ${need} belgi yozing (hozir ${text.length})`);
      if (text.length > 1000) throw new HttpError(400, "Matn juda uzun (ko'pi bilan 1000 belgi)");
      const words = text.split(" ").filter(Boolean);
      if (words.length < 5 || new Set(words.map((w) => w.toLowerCase())).size < 4) throw new HttpError(400, "Matn mazmunli bo'lishi kerak (kamida 5 ta so'z)");
      if (/(.)\1{6,}/.test(text)) throw new HttpError(400, "Matnda takroriy belgilar ko'p");
      const dup = await tx.missionSubmission.findFirst({ where: { content: text, status: "ACCEPTED", participation: { userId } } });
      if (dup) throw new HttpError(400, "Bu matn avval yuborilgan. O'z so'zlaringiz bilan yozing.");
      content = text;
    } else {
      waitFor(600 * SCALE);
      if (input.confirm !== true) throw new HttpError(400, "Bajarganingizni tasdiqlang");
      content = "Tasdiqlandi";
    }

    // Mukofot atomik "qulf" orqali bir marta beriladi (qayta yuborish yoki parallel so'rovlar ikkinchi marta bermaydi)
    const guard = await tx.missionParticipation.updateMany({
      where: { id: p.id, status: "ACCEPTED", rewardGiven: false },
      data: { status: "COMPLETED", completedAt: now, rewardGiven: true },
    });
    if (guard.count === 0) throw new HttpError(409, "Mukofot allaqachon berilgan");

    await tx.missionSubmission.create({ data: { participationId: p.id, content, status: "ACCEPTED", score: 100 } });

    const ref = { type: "MISSION", id: p.id };
    const xp = await grantXp(tx, userId, m.xpReward, "MISSION", ref);
    if (m.coinReward > 0) await changeCurrency(tx, userId, "COINS", m.coinReward, "MISSION", ref);
    if (m.gemReward > 0) await changeCurrency(tx, userId, "GEMS", m.gemReward, "MISSION", ref);

    await tx.notification.create({
      data: {
        userId, type: "MISSION", title: `Missiya bajarildi: ${m.title}`,
        body: `+${m.xpReward} XP${m.coinReward ? `, +${m.coinReward} tanga` : ""}${m.gemReward ? `, +${m.gemReward} gem` : ""}`, link: `/missions/${m.slug}`,
      },
    });

    if (m.type === "GLOBAL") {
      const slugForProject = GLOBAL_PROJECT_BY_CATEGORY[m.category];
      if (slugForProject) await tx.globalProject.updateMany({ where: { slug: slugForProject }, data: { currentPoints: { increment: m.xpReward } } });
    }

    const achievements = await checkAchievements(tx, userId);
    const chNow = await tx.character.findUniqueOrThrow({ where: { userId }, select: { level: true } });
    return { ok: true, rewards: { xp: m.xpReward, coins: m.coinReward, gems: m.gemReward }, leveledUp: xp.leveledUp, level: chNow.level, achievements };
  }, { timeout: 20_000 });
}