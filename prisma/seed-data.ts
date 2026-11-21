// Boshlang'ich (seed) ma'lumotlari. Faqat dastlabki kontent — foydalanuvchi progressi bu yerda qattiq yozilmaydi.

type Bonus = Partial<{ strength: number; intelligence: number; speed: number; creativity: number; endurance: number; luck: number }>;

export interface ItemSeed {
  slug: string; name: string; description: string;
  category: string; slot: string; rarity: string; visualKey: string;
  c1: string; c2: string; coins: number; gems: number; level: number;
  bonus?: Bonus; starter?: boolean; featured?: boolean; season?: string; gender?: "ANY" | "MALE" | "FEMALE";
  requirement?: string; achievement?: string; // achievement slug
}

const I = (x: ItemSeed) => x;

export const ITEMS: ItemSeed[] = [
  // ── Boshlang'ich (bepul) ──
  I({ slug: "starter-tee", name: "Boshlovchi futbolka", description: "Har bir sarguzasht oddiy futbolkadan boshlanadi.", category: "CLOTHES", slot: "TOP", rarity: "COMMON", visualKey: "tee", c1: "#3b82f6", c2: "#1e3a8a", coins: 0, gems: 0, level: 1, starter: true }),
  I({ slug: "starter-pants", name: "Sayohatchi shimi", description: "Yengil va qulay.", category: "CLOTHES", slot: "BOTTOM", rarity: "COMMON", visualKey: "pants", c1: "#334155", c2: "#0f172a", coins: 0, gems: 0, level: 1, starter: true }),
  I({ slug: "starter-sneakers", name: "Yo'lovchi krossovkasi", description: "Birinchi qadamlar uchun.", category: "SHOES", slot: "SHOES", rarity: "COMMON", visualKey: "sneakers", c1: "#e2e8f0", c2: "#64748b", coins: 0, gems: 0, level: 1, starter: true }),
  I({ slug: "starter-dress", name: "Yengil ko'ylak", description: "Yorqin va harakatchan ko'ylak.", category: "CLOTHES", slot: "TOP", rarity: "COMMON", visualKey: "dress", c1: "#ec4899", c2: "#9d174d", coins: 0, gems: 0, level: 1, starter: true, gender: "FEMALE" }),

  // ── Kiyimlar ──
  I({ slug: "neon-hoodie", name: "Neon xudi", description: "Qorong'ida porlaydigan chiziqlar.", category: "CLOTHES", slot: "TOP", rarity: "UNCOMMON", visualKey: "hoodie", c1: "#22d3ee", c2: "#0e7490", coins: 150, gems: 0, level: 2, bonus: { speed: 1 } }),
  I({ slug: "scholar-vest", name: "Olim nimchasi", description: "Bilim izlovchilar uchun klassik uslub.", category: "CLOTHES", slot: "TOP", rarity: "UNCOMMON", visualKey: "vest", c1: "#a16207", c2: "#713f12", coins: 180, gems: 0, level: 3, bonus: { intelligence: 1 }, gender: "ANY" }),
  I({ slug: "volt-jacket", name: "Volt kurtka", description: "Elektr zaryadi bilan to'lgan kurtka.", category: "CLOTHES", slot: "JACKET", rarity: "RARE", visualKey: "jacket", c1: "#2f8cff", c2: "#1d4ed8", coins: 400, gems: 0, level: 5, bonus: { speed: 1, endurance: 1 }, featured: true }),
  I({ slug: "arcane-cloak-jacket", name: "Arkan to'ni", description: "Sirli binafsha mato.", category: "CLOTHES", slot: "JACKET", rarity: "EPIC", visualKey: "cloak", c1: "#8b5cf6", c2: "#4c1d95", coins: 900, gems: 20, level: 10, bonus: { intelligence: 2, creativity: 1 }, featured: true }),
  I({ slug: "cargo-pants", name: "Kargo shim", description: "Ko'p cho'ntakli, bardoshli.", category: "CLOTHES", slot: "BOTTOM", rarity: "UNCOMMON", visualKey: "cargo", c1: "#4d7c0f", c2: "#365314", coins: 140, gems: 0, level: 2, bonus: { endurance: 1 } }),
  I({ slug: "skirt-star", name: "Yulduzli yubka", description: "Kechki osmon rangida.", category: "CLOTHES", slot: "BOTTOM", rarity: "UNCOMMON", visualKey: "skirt", c1: "#a78bfa", c2: "#5b21b6", coins: 160, gems: 0, level: 3, bonus: { creativity: 1 }, gender: "FEMALE" }),

  // ── Poyabzal ──
  I({ slug: "sprint-boots", name: "Sprint etigi", description: "Tezlik izlovchilar uchun.", category: "SHOES", slot: "SHOES", rarity: "RARE", visualKey: "boots", c1: "#f97316", c2: "#9a3412", coins: 350, gems: 0, level: 4, bonus: { speed: 2 } }),
  I({ slug: "gravity-kicks", name: "Gravitatsiya krossovkasi", description: "Yerga deyarli tegmaydi.", category: "SHOES", slot: "SHOES", rarity: "EPIC", visualKey: "hover", c1: "#06b6d4", c2: "#6d28d9", coins: 1000, gems: 25, level: 12, bonus: { speed: 3, luck: 1 } }),

  // ── Zirh ──
  I({ slug: "guardian-armor", name: "Qo'riqchi zirhi", description: "Sinovlarga bardosh beruvchi zirh.", category: "ARMOR", slot: "JACKET", rarity: "EPIC", visualKey: "armor", c1: "#94a3b8", c2: "#334155", coins: 1100, gems: 0, level: 14, bonus: { strength: 2, endurance: 2 } }),
  I({ slug: "mythic-aegis", name: "Mifik Egida", description: "Faqat eng sabrli o'yinchilar uchun — bepul, faqat daraja bilan ochiladi.", category: "ARMOR", slot: "JACKET", rarity: "MYTHIC", visualKey: "aegis", c1: "#f43f5e", c2: "#7f1d1d", coins: 0, gems: 0, level: 30, bonus: { strength: 2, endurance: 2, luck: 2 }, requirement: "30-darajaga yeting" }),

  // ── Qo'lqoplar ──
  I({ slug: "grip-gloves", name: "Qisqich qo'lqop", description: "Mustahkam ushlash.", category: "GLOVES", slot: "GLOVES", rarity: "UNCOMMON", visualKey: "gloves", c1: "#475569", c2: "#1e293b", coins: 120, gems: 0, level: 3, bonus: { strength: 1 } }),
  I({ slug: "plasma-gauntlets", name: "Plazma qo'lqoplari", description: "Barmoqlarda plazma uchquni.", category: "GLOVES", slot: "GLOVES", rarity: "LEGENDARY", visualKey: "gauntlets", c1: "#22d3ee", c2: "#a855f7", coins: 2200, gems: 60, level: 20, bonus: { strength: 2, creativity: 2, speed: 1 } }),

  // ── Niqoblar va ko'zoynaklar ──
  I({ slug: "shadow-mask", name: "Soya niqobi", description: "Sirli qahramon niqobi.", category: "MASK", slot: "MASK", rarity: "RARE", visualKey: "mask", c1: "#1f2937", c2: "#6b7280", coins: 300, gems: 0, level: 6, bonus: { luck: 1, speed: 1 } }),
  I({ slug: "cyber-visor", name: "Kiber ko'zoynak", description: "Ma'lumotlar oqimini ko'ruvchi vizor.", category: "ACCESSORY", slot: "GLASSES", rarity: "RARE", visualKey: "visor", c1: "#38bdf8", c2: "#0c4a6e", coins: 320, gems: 0, level: 6, bonus: { intelligence: 2 }, featured: true }),
  I({ slug: "round-glasses", name: "Dumaloq ko'zoynak", description: "Klassik va oqilona.", category: "ACCESSORY", slot: "GLASSES", rarity: "COMMON", visualKey: "round", c1: "#78350f", c2: "#451a03", coins: 60, gems: 0, level: 1 }),

  // ── Bosh aksessuarlari ──
  I({ slug: "explorer-cap", name: "Tadqiqotchi kepkasi", description: "Yangi yerlarni kashf eting.", category: "ACCESSORY", slot: "HEAD", rarity: "COMMON", visualKey: "cap", c1: "#dc2626", c2: "#7f1d1d", coins: 70, gems: 0, level: 1 }),
  I({ slug: "crown-of-sparks", name: "Uchqunlar toji", description: "Chempionlar toji.", category: "ACCESSORY", slot: "HEAD", rarity: "LEGENDARY", visualKey: "crown", c1: "#fbbf24", c2: "#b45309", coins: 0, gems: 0, level: 1, bonus: { luck: 2, creativity: 2, intelligence: 1 }, achievement: "arena-champion", requirement: "Arenada g'olib bo'ling" }),
  I({ slug: "halo-ring", name: "Nur halqasi", description: "Boshingiz ustida suzuvchi halqa.", category: "ACCESSORY", slot: "HEAD", rarity: "EPIC", visualKey: "halo", c1: "#fde68a", c2: "#f59e0b", coins: 800, gems: 15, level: 8, bonus: { luck: 2 } }),

  // ── Orqa buyumlar ──
  I({ slug: "scout-backpack", name: "Skaut ryukzagi", description: "Sarguzashtlar uchun sig'imli ryukzak.", category: "BACK", slot: "BACK", rarity: "COMMON", visualKey: "backpack", c1: "#65a30d", c2: "#365314", coins: 90, gems: 0, level: 1 }),
  I({ slug: "wings-of-dawn", name: "Tong qanotlari", description: "Yorug' qanotlar.", category: "BACK", slot: "BACK", rarity: "LEGENDARY", visualKey: "wings", c1: "#f0abfc", c2: "#6366f1", coins: 2500, gems: 80, level: 25, bonus: { speed: 2, luck: 2, creativity: 1 }, featured: true }),
  I({ slug: "cape-royal", name: "Qirollik plashi", description: "Salobatli plash.", category: "BACK", slot: "BACK", rarity: "RARE", visualKey: "cape", c1: "#b91c1c", c2: "#450a0a", coins: 380, gems: 0, level: 7, bonus: { strength: 1, luck: 1 } }),

  // ── Maxsus effektlar ──
  I({ slug: "aura-volt", name: "Volt aurasi", description: "Atrofingizda elektr to'lqinlari.", category: "EFFECT", slot: "EFFECT", rarity: "EPIC", visualKey: "aura_volt", c1: "#2f8cff", c2: "#67e8f9", coins: 700, gems: 20, level: 9, bonus: { speed: 1, luck: 1 } }),
  I({ slug: "aura-ember", name: "Cho'g' aurasi", description: "Issiq cho'g' uchqunlari.", category: "EFFECT", slot: "EFFECT", rarity: "EPIC", visualKey: "aura_ember", c1: "#f97316", c2: "#facc15", coins: 700, gems: 20, level: 9, bonus: { strength: 1, endurance: 1 } }),
  I({ slug: "aura-mythic", name: "Mifik tuman", description: "Cheksiz imkoniyatlar nuri. Faqat yutuq orqali.", category: "EFFECT", slot: "EFFECT", rarity: "MYTHIC", visualKey: "aura_mythic", c1: "#f43f5e", c2: "#8b5cf6", coins: 0, gems: 0, level: 1, bonus: { luck: 3, creativity: 2, intelligence: 1 }, achievement: "world-builder", requirement: "«Dunyo quruvchi» yutug'ini oching" }),

  // ── Skinlar ──
  I({ slug: "skin-android", name: "Android skini", description: "Metall tanali qahramon.", category: "SKIN", slot: "SKIN", rarity: "RARE", visualKey: "skin_android", c1: "#94a3b8", c2: "#38bdf8", coins: 500, gems: 10, level: 5, bonus: { intelligence: 1, endurance: 1 } }),

  // ── Mavsumiy ──
  I({ slug: "winter-scarf", name: "Qishki sharf", description: "Qish 2026 to'plami.", category: "ACCESSORY", slot: "HEAD", rarity: "UNCOMMON", visualKey: "scarf", c1: "#ef4444", c2: "#fecaca", coins: 200, gems: 0, level: 1, season: "WINTER-2026", bonus: { endurance: 1 }, featured: true }),
  I({ slug: "snowflake-aura", name: "Qor parchasi aurasi", description: "Qish 2026 — cheklangan nashr.", category: "EFFECT", slot: "EFFECT", rarity: "RARE", visualKey: "aura_snow", c1: "#bae6fd", c2: "#e0f2fe", coins: 450, gems: 10, level: 5, season: "WINTER-2026", bonus: { luck: 1, creativity: 1 } }),

  // ── Materiallar ──
  I({ slug: "mat-spark-core", name: "Uchqun yadrosi", description: "Kelajakdagi yangilanishlar uchun material.", category: "MATERIAL", slot: "NONE", rarity: "UNCOMMON", visualKey: "mat_core", c1: "#22d3ee", c2: "#0e7490", coins: 40, gems: 0, level: 1 }),
];

export interface MissionSeed {
  slug: string; title: string; description: string; category: string; type: string; difficulty: string;
  xp: number; coins: number; gems?: number; stat?: string; requirements?: string;
  verification: "QUIZ" | "TEXT" | "SELF_REPORT"; question?: string; options?: string[]; answer?: string; minLevel?: number; daysToDeadline?: number;
}

export const MISSIONS: MissionSeed[] = [
  { slug: "daily-brain-1", title: "Kunlik topishmoq", description: "Mantiqiy savolga to'g'ri javob bering.", category: "INTELLIGENCE", type: "DAILY", difficulty: "EASY", xp: 30, coins: 15, stat: "intelligence", verification: "QUIZ", question: "2, 4, 8, 16 ketma-ketligidagi keyingi son qaysi?", options: ["18", "24", "32", "30"], answer: "32" },
  { slug: "daily-water", title: "Suv ichish odati", description: "Bugun kamida 6 stakan suv ichdim.", category: "WELLNESS", type: "DAILY", difficulty: "EASY", xp: 20, coins: 10, stat: "endurance", requirements: "Halol o'z-o'zini tasdiqlash", verification: "SELF_REPORT" },
  { slug: "daily-walk", title: "20 daqiqalik yurish", description: "Toza havoda 20 daqiqa yuring (xavfsiz joyda).", category: "WELLNESS", type: "DAILY", difficulty: "EASY", xp: 25, coins: 10, stat: "endurance", verification: "SELF_REPORT" },
  { slug: "daily-read", title: "Bir sahifa bilim", description: "Bugun o'qigan yangi narsangiz haqida 1-2 gap yozing (kamida 30 belgi).", category: "KNOWLEDGE", type: "DAILY", difficulty: "EASY", xp: 35, coins: 15, stat: "intelligence", verification: "TEXT" },
  { slug: "daily-kind", title: "Yaxshilik qiling", description: "Bugun biror kishiga yordam berdingizmi? Qisqacha yozing (kamida 30 belgi).", category: "SOCIAL", type: "DAILY", difficulty: "EASY", xp: 30, coins: 15, stat: "luck", verification: "TEXT" },
  { slug: "weekly-code", title: "Dasturlash tushunchasi", description: "Texnologiya savoliga javob bering.", category: "TECHNOLOGY", type: "WEEKLY", difficulty: "MEDIUM", xp: 90, coins: 50, stat: "intelligence", verification: "QUIZ", question: "Dasturlashda qaysi tuzilma bir xil amalni ko'p marta takrorlash uchun ishlatiladi?", options: ["O'zgaruvchi", "Sikl (loop)", "Izoh", "Import"], answer: "Sikl (loop)", daysToDeadline: 7 },
  { slug: "weekly-draw", title: "Haftalik ijod", description: "Bu hafta yaratgan ijodiy ishingiz (rasm, hikoya, musiqa) haqida yozing (kamida 50 belgi).", category: "CREATIVITY", type: "WEEKLY", difficulty: "MEDIUM", xp: 100, coins: 60, stat: "creativity", verification: "TEXT", daysToDeadline: 7 },
  { slug: "weekly-nature", title: "Tabiat kuzatuvi", description: "Tabiatda kuzatgan bir narsangizni tasvirlab bering (kamida 50 belgi).", category: "NATURE", type: "WEEKLY", difficulty: "MEDIUM", xp: 80, coins: 40, stat: "luck", verification: "TEXT", daysToDeadline: 7 },
  { slug: "weekly-sport", title: "Haftalik mashq", description: "Bu hafta 3 marta jismoniy mashq bajardim.", category: "WELLNESS", type: "WEEKLY", difficulty: "MEDIUM", xp: 90, coins: 45, stat: "strength", verification: "SELF_REPORT", daysToDeadline: 7 },
  { slug: "monthly-learn", title: "Oylik o'rganish loyihasi", description: "Bu oy o'rgangan yangi ko'nikmangiz va natijalaringiz haqida yozing (kamida 100 belgi).", category: "KNOWLEDGE", type: "MONTHLY", difficulty: "HARD", xp: 300, coins: 150, gems: 5, stat: "intelligence", verification: "TEXT", minLevel: 3, daysToDeadline: 30 },
  { slug: "special-first-steps", title: "XERON bilan tanishuv", description: "XERON sloganini to'ldiring: YOUR LIFE. YOUR WORLD. YOUR ___", category: "KNOWLEDGE", type: "SPECIAL", difficulty: "EASY", xp: 50, coins: 30, verification: "QUIZ", question: "XERON sloganini to'ldiring: YOUR LIFE. YOUR WORLD. YOUR ___", options: ["GAME", "STORY", "PATH", "DREAM"], answer: "GAME" },
  { slug: "special-math", title: "Matematik sinov", description: "Qiyinroq masala.", category: "INTELLIGENCE", type: "SPECIAL", difficulty: "HARD", xp: 150, coins: 80, gems: 3, stat: "intelligence", verification: "QUIZ", question: "Agar 3x + 7 = 31 bo'lsa, x nimaga teng?", options: ["6", "8", "9", "10"], answer: "8", minLevel: 2 },
  { slug: "team-helper", title: "Jamoaga ko'maklashish", description: "Jamoadoshingizga qanday yordam berganingizni yozing (kamida 40 belgi).", category: "TEAMWORK", type: "TEAM", difficulty: "MEDIUM", xp: 120, coins: 70, stat: "luck", verification: "TEXT", requirements: "Jamoa a'zosi bo'lish kerak", daysToDeadline: 14 },
  { slug: "global-green", title: "Global: Yashil sayyora", description: "Atrof-muhitni asrash uchun qilgan kichik harakatingizni yozing (kamida 40 belgi). Hissangiz umumiy loyihaga qo'shiladi.", category: "NATURE", type: "GLOBAL", difficulty: "MEDIUM", xp: 100, coins: 50, stat: "endurance", verification: "TEXT", daysToDeadline: 30 },
  { slug: "social-share", title: "Bilim ulashish", description: "Boshqalarga foydali bo'ladigan bitta maslahat yozing (kamida 40 belgi).", category: "SOCIAL", type: "SPECIAL", difficulty: "EASY", xp: 60, coins: 30, stat: "creativity", verification: "TEXT" },
];

export interface CompSeed {
  slug: string; title: string; description: string; type: string; startOffsetHours: number; durationHours: number;
  timeSec: number; xp: number; coins: number; season?: string; minLevel?: number;
  questions: { q: string; options: string[]; correct: number; points?: number }[];
}

export const COMPETITIONS: CompSeed[] = [
  { slug: "math-sprint", title: "Matematik sprint", description: "Tez va aniq hisoblang!", type: "MATH", startOffsetHours: -2, durationHours: 24 * 14, timeSec: 240, xp: 150, coins: 80,
    questions: [
      { q: "12 × 7 = ?", options: ["74", "84", "82", "96"], correct: 1 },
      { q: "144 ning kvadrat ildizi?", options: ["10", "11", "12", "14"], correct: 2 },
      { q: "15% of 200 = ?", options: ["20", "25", "30", "35"], correct: 2 },
      { q: "Agar 2x = 18 bo'lsa, x = ?", options: ["7", "8", "9", "10"], correct: 2 },
      { q: "1 + 2 + 3 + ... + 10 = ?", options: ["45", "50", "55", "60"], correct: 2 },
    ] },
  { slug: "logic-labyrinth", title: "Mantiq labirinti", description: "Mantiqiy fikrlash sinovi.", type: "LOGIC", startOffsetHours: -1, durationHours: 24 * 14, timeSec: 300, xp: 150, coins: 80,
    questions: [
      { q: "Ketma-ketlik: 1, 1, 2, 3, 5, 8, ?", options: ["11", "12", "13", "14"], correct: 2 },
      { q: "Hamma mushuklar hayvon. Tom — mushuk. Demak:", options: ["Tom hayvon", "Tom odam", "Tom o'simlik", "Aniqlab bo'lmaydi"], correct: 0 },
      { q: "Qaysi biri ortiqcha: olma, nok, sabzi, behi?", options: ["olma", "nok", "sabzi", "behi"], correct: 2 },
      { q: "Soat 3:00 da soat va minut millari orasidagi burchak?", options: ["60°", "75°", "90°", "120°"], correct: 2 },
      { q: "A > B va B > C bo'lsa, qaysi to'g'ri?", options: ["C > A", "A > C", "A = C", "B > A"], correct: 1 },
    ] },
  { slug: "knowledge-clash", title: "Bilimlar jangi", description: "Umumiy bilim bo'yicha bellashuv.", type: "KNOWLEDGE", startOffsetHours: -1, durationHours: 24 * 14, timeSec: 300, xp: 120, coins: 60,
    questions: [
      { q: "Quyosh tizimidagi eng katta sayyora?", options: ["Saturn", "Yupiter", "Neptun", "Yer"], correct: 1 },
      { q: "Suvning kimyoviy formulasi?", options: ["CO2", "H2O", "O2", "NaCl"], correct: 1 },
      { q: "O'zbekiston poytaxti?", options: ["Samarqand", "Buxoro", "Toshkent", "Xiva"], correct: 2 },
      { q: "Qaysi gaz o'simliklar fotosintezida yutiladi?", options: ["Kislorod", "Azot", "Karbonat angidrid", "Vodorod"], correct: 2 },
      { q: "Insonda nechta asosiy sezgi organi (klassik)?", options: ["3", "4", "5", "6"], correct: 2 },
    ] },
  { slug: "creative-spark", title: "Ijod uchquni", description: "Ijodiy fikrlash savollari.", type: "CREATIVE", startOffsetHours: 48, durationHours: 24 * 7, timeSec: 240, xp: 130, coins: 70,
    questions: [
      { q: "Asosiy ranglar (RYB) qaysilar?", options: ["Qizil, sariq, ko'k", "Yashil, binafsha, to'q sariq", "Qora, oq, kulrang", "Pushti, ko'k, yashil"], correct: 0 },
      { q: "Kontrast nima?", options: ["Ranglar aralashmasi", "Elementlar orasidagi farq", "Shrift turi", "Rasm o'lchami"], correct: 1 },
      { q: "Hikoyaning boshlanish qismi nima deb ataladi?", options: ["Kulminatsiya", "Ekspozitsiya", "Yechim", "Epilog"], correct: 1 },
    ] },
  { slug: "winter-championship", title: "Qishki chempionat", description: "Mavsumiy chempionat — katta sovrinlar!", type: "CHAMPIONSHIP", startOffsetHours: 24 * 10, durationHours: 24 * 7, timeSec: 420, xp: 300, coins: 200, season: "WINTER-2026", minLevel: 3,
    questions: [
      { q: "Qaysi fasl eng sovuq?", options: ["Bahor", "Yoz", "Kuz", "Qish"], correct: 3 },
      { q: "7 × 8 = ?", options: ["54", "56", "58", "64"], correct: 1 },
      { q: "Qaysi sayyora 'Qizil sayyora' deyiladi?", options: ["Venera", "Mars", "Merkuriy", "Yupiter"], correct: 1 },
    ] },
];

export const ACHIEVEMENTS = [
  { slug: "first-steps", name: "Birinchi qadam", description: "Birinchi missiyani bajaring.", icon: "footprints", rarity: "COMMON", conditionType: "MISSIONS_COMPLETED", conditionValue: 1, xpReward: 25, coinReward: 20 },
  { slug: "mission-veteran", name: "Missiya faxriysi", description: "10 ta missiyani bajaring.", icon: "swords", rarity: "RARE", conditionType: "MISSIONS_COMPLETED", conditionValue: 10, xpReward: 150, coinReward: 100, titleReward: "Faxriy" },
  { slug: "level-5", name: "O'sib borayotgan", description: "5-darajaga yeting.", icon: "trending-up", rarity: "UNCOMMON", conditionType: "LEVEL", conditionValue: 5, xpReward: 50, coinReward: 40 },
  { slug: "level-20", name: "Tajribali qahramon", description: "20-darajaga yeting.", icon: "crown", rarity: "EPIC", conditionType: "LEVEL", conditionValue: 20, xpReward: 300, coinReward: 250, titleReward: "Qahramon" },
  { slug: "arena-champion", name: "Arena chempioni", description: "Biror musobaqada 1-o'rinni egallang.", icon: "trophy", rarity: "LEGENDARY", conditionType: "COMPETITIONS_WON", conditionValue: 1, xpReward: 200, coinReward: 150, titleReward: "Chempion" },
  { slug: "collector", name: "Kollektsioner", description: "10 ta buyumga ega bo'ling.", icon: "package", rarity: "RARE", conditionType: "ITEMS_OWNED", conditionValue: 10, xpReward: 100, coinReward: 80 },
  { slug: "social-butterfly", name: "Do'stona", description: "3 ta do'st orttiring.", icon: "users", rarity: "UNCOMMON", conditionType: "FRIENDS", conditionValue: 3, xpReward: 60, coinReward: 40 },
  { slug: "world-builder", name: "Dunyo quruvchi", description: "Shahringiz 5-darajaga yetsin.", icon: "castle", rarity: "MYTHIC", conditionType: "CITY_LEVEL", conditionValue: 5, xpReward: 500, coinReward: 400, titleReward: "Me'mor" },
] as const;

export const GLOBAL_PROJECTS = [
  { slug: "green-planet", title: "Yashil sayyora", description: "Barcha o'yinchilar bajargan ekologik missiyalar bilan umumiy maqsadga erishamiz.", goalPoints: 10000 },
  { slug: "knowledge-tower", title: "Bilim minorasi", description: "Bilim missiyalari orqali jahon minorasini quramiz.", goalPoints: 25000 },
];

export const SAMPLE_PLAYERS = [
  { username: "aziza_nova", country: "UZ", xp: 5200, body: "female", hair: "#7c3aed", style: "long", skin: "#f1c27d" },
  { username: "kenji_x", country: "JP", xp: 8400, body: "male", hair: "#111827", style: "spiky", skin: "#f5d0a9" },
  { username: "luna_ray", country: "BR", xp: 3100, body: "female", hair: "#be123c", style: "bun", skin: "#8d5524" },
  { username: "omar_flux", country: "EG", xp: 6700, body: "male", hair: "#1c1917", style: "short", skin: "#c68642" },
  { username: "sofia_k", country: "DE", xp: 1900, body: "female", hair: "#ca8a04", style: "long", skin: "#ffdbac" },
  { username: "raj_orbit", country: "IN", xp: 4300, body: "male", hair: "#0f172a", style: "mohawk", skin: "#a9744f" },
  { username: "nikita_p", country: "KZ", xp: 2500, body: "neutral", hair: "#0ea5e9", style: "short", skin: "#e0ac69" },
  { username: "emma_w", country: "US", xp: 7200, body: "female", hair: "#92400e", style: "bun", skin: "#f8d9c0" },
] as const;
