import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { hashAnswer } from "../src/lib/answers";
import { levelFromXp, MAX_BONUS_BY_RARITY, type Rarity } from "../src/lib/game";
import { provisionPlayer } from "../src/lib/services/player";
import { ACHIEVEMENTS, COMPETITIONS, GLOBAL_PROJECTS, ITEMS, MISSIONS, SAMPLE_PLAYERS } from "./seed-data";

// Faqat DEV uchun. Deploydan oldin o'zgartiring yoki bu hisoblarni o'chiring.
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Demo-Xeron-2026!";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin-Xeron-2026!";

const HOUR = 3_600_000;

async function main() {
  console.log("🌱 XERON seed boshlandi...");

  // ── Yutuqlar ──
  const achievementIds = new Map<string, string>();
  for (const a of ACHIEVEMENTS) {
    const row = await db.achievement.upsert({
      where: { slug: a.slug },
      update: { ...a },
      create: { ...a },
    });
    achievementIds.set(a.slug, row.id);
  }

  // ── Buyumlar (muvozanat tekshiruvi bilan) ──
  for (const it of ITEMS) {
    const b = it.bonus ?? {};
    const total = Object.values(b).reduce((s, n) => s + (n ?? 0), 0);
    const cap = MAX_BONUS_BY_RARITY[it.rarity as Rarity];
    if (total > cap) throw new Error(`Muvozanat xatosi: ${it.slug} bonusi (${total}) ${it.rarity} chegarasidan (${cap}) oshib ketdi.`);

    const data = {
      name: it.name, description: it.description, category: it.category, slot: it.slot, rarity: it.rarity,
      visualKey: it.visualKey, colorPrimary: it.c1, colorSecondary: it.c2, gender: it.gender ?? "ANY",
      priceCoins: it.coins, priceGems: it.gems, unlockLevel: it.level, unlockRequirement: it.requirement ?? null,
      bonusStrength: b.strength ?? 0, bonusIntelligence: b.intelligence ?? 0, bonusSpeed: b.speed ?? 0,
      bonusCreativity: b.creativity ?? 0, bonusEndurance: b.endurance ?? 0, bonusLuck: b.luck ?? 0,
      isStarter: it.starter ?? false, isFeatured: it.featured ?? false, season: it.season ?? null,
      achievementId: it.achievement ? achievementIds.get(it.achievement) ?? null : null,
    };
    await db.item.upsert({ where: { slug: it.slug }, update: data, create: { slug: it.slug, ...data } });
  }

  // ── Missiyalar ──
  const now = Date.now();
  for (const m of MISSIONS) {
    const data = {
      title: m.title, description: m.description, category: m.category, type: m.type, difficulty: m.difficulty,
      xpReward: m.xp, coinReward: m.coins, gemReward: m.gems ?? 0, statTarget: m.stat ?? null,
      requirements: m.requirements ?? "", verificationMethod: m.verification,
      question: m.question ?? null, optionsJson: m.options ? JSON.stringify(m.options) : null,
      answerHash: m.answer ? hashAnswer(m.answer) : null, minLevel: m.minLevel ?? 1,
      deadline: m.daysToDeadline ? new Date(now + m.daysToDeadline * 24 * HOUR) : null,
    };
    await db.mission.upsert({ where: { slug: m.slug }, update: data, create: { slug: m.slug, ...data } });
  }

  // ── Musobaqalar ──
  for (const c of COMPETITIONS) {
    const startsAt = new Date(now + c.startOffsetHours * HOUR);
    const endsAt = new Date(startsAt.getTime() + c.durationHours * HOUR);
    const data = {
      title: c.title, description: c.description, type: c.type, startsAt, endsAt, durationSec: c.timeSec,
      xpReward: c.xp, coinReward: c.coins, season: c.season ?? null, minLevel: c.minLevel ?? 1,
      status: startsAt.getTime() <= now ? "LIVE" : "UPCOMING",
    };
    const comp = await db.competition.upsert({ where: { slug: c.slug }, update: data, create: { slug: c.slug, ...data } });
    await db.competitionQuestion.deleteMany({ where: { competitionId: comp.id, answers: { none: {} } } });
    for (const [i, q] of c.questions.entries()) {
      await db.competitionQuestion.upsert({
        where: { competitionId_orderIndex: { competitionId: comp.id, orderIndex: i } },
        update: {},
        create: { competitionId: comp.id, orderIndex: i, prompt: q.q, optionsJson: JSON.stringify(q.options), correctIndex: q.correct, points: q.points ?? 10 },
      });
    }
  }

  // ── Global loyihalar va sozlamalar ──
  for (const g of GLOBAL_PROJECTS) {
    await db.globalProject.upsert({ where: { slug: g.slug }, update: {}, create: g });
  }
  await db.platformSetting.upsert({ where: { key: "registrationOpen" }, update: {}, create: { key: "registrationOpen", value: "true" } });
  await db.platformSetting.upsert({ where: { key: "communityEnabled" }, update: {}, create: { key: "communityEnabled", value: "true" } });

  // ── Foydalanuvchilar ──
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  async function ensurePlayer(opts: { email: string; username: string; role?: string; hash: string; country: string; xp: number; coins: number; gems: number; body?: "male" | "female" | "neutral"; hair?: string; style?: string; skin?: string }) {
    const existing = await db.user.findUnique({ where: { username: opts.username } });
    if (existing) return existing;
    return db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: opts.email, username: opts.username, passwordHash: opts.hash, role: opts.role ?? "PLAYER", birthYear: 2000, ageGroup: "ADULT", country: opts.country },
      });
      const ch = await provisionPlayer(tx, { userId: user.id, username: opts.username, ageGroup: "ADULT", body: opts.body, hairColor: opts.hair, hairStyle: opts.style, skinTone: opts.skin, startCoins: opts.coins, startGems: opts.gems });
      if (opts.xp > 0) {
        const level = levelFromXp(opts.xp);
        await tx.character.update({ where: { id: ch.id }, data: { xp: opts.xp, level, weeklyXp: Math.round(opts.xp * 0.08), monthlyXp: Math.round(opts.xp * 0.25), skillPoints: (level - 1) * 2 } });
        await tx.xPTransaction.create({ data: { userId: user.id, amount: opts.xp, reason: "SEED", refType: "SEED", refId: "initial" } });
      }
      return user;
    });
  }

  await ensurePlayer({ email: "demo@xeron.dev", username: "demo_hero", hash: demoHash, country: "UZ", xp: 350, coins: 600, gems: 30, body: "male" });
  const admin = await ensurePlayer({ email: "admin@xeron.dev", username: "xeron_admin", role: "ADMIN", hash: adminHash, country: "UZ", xp: 0, coins: 0, gems: 0 });

  for (const p of SAMPLE_PLAYERS) {
    await ensurePlayer({ email: `${p.username}@sample.xeron.dev`, username: p.username, hash: demoHash, country: p.country, xp: p.xp, coins: Math.round(p.xp / 10), gems: 0, body: p.body, hair: p.hair, style: p.style, skin: p.skin });
  }

  // ── Namuna jamoa ──
  const owner = await db.user.findUniqueOrThrow({ where: { username: "kenji_x" } });
  const team = await db.team.upsert({
    where: { name: "Nova Pioneers" }, update: {},
    create: { name: "Nova Pioneers", tag: "NOVA", description: "Bilim va ijod izlovchilar jamoasi.", ownerId: owner.id },
  });
  for (const [username, role] of [["kenji_x", "OWNER"], ["aziza_nova", "OFFICER"], ["emma_w", "MEMBER"]] as const) {
    const u = await db.user.findUniqueOrThrow({ where: { username } });
    await db.teamMember.upsert({ where: { teamId_userId: { teamId: team.id, userId: u.id } }, update: {}, create: { teamId: team.id, userId: u.id, role } });
  }
  const members = await db.teamMember.findMany({ where: { teamId: team.id }, include: { user: { include: { character: true } } } });
  await db.team.update({ where: { id: team.id }, data: { teamXp: members.reduce((s, m) => s + (m.user.character?.xp ?? 0), 0) } });

  await db.adminAction.create({ data: { adminId: admin.id, action: "SEED", targetType: "SYSTEM", details: "Boshlang'ich ma'lumotlar yuklandi" } });

  console.log("✅ Seed tugadi.");
  console.log("   Demo hisob : demo@xeron.dev  (parol .env dagi SEED_DEMO_PASSWORD) — FAQAT DEV!");
  console.log("   Admin hisob: admin@xeron.dev (parol .env dagi SEED_ADMIN_PASSWORD) — FAQAT DEV!");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
