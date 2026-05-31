import prisma from "@/lib/prisma";
import { generateClaudeText } from "@/lib/claude";

interface RecapStats {
  sessionsCount: number;
  longestStreak: number;
  connectionsCount: number;
  topSubject: string | null;
}

export async function aggregateMonthlyStats(
  userId: string,
  month: number,
  year: number
): Promise<RecapStats> {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const [sessionsCount, connectionsCount, streak, targets] = await Promise.all([
    prisma.focusSession.count({
      where: {
        isComplete: true,
        OR: [{ user1Id: userId }, { user2Id: userId }],
        endedAt: { gte: start, lt: end },
      },
    }),
    prisma.connectedPair.count({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.individualStreak.findUnique({ where: { userId } }),
    prisma.dailyTarget.findMany({
      where: {
        userId,
        isComplete: true,
        date: { gte: start, lt: end },
      },
      select: { task: true },
    }),
  ]);

  const subjectCounts = new Map<string, number>();
  targets.forEach((t) => {
    const key = t.task.split(" ")[0]?.toLowerCase() ?? t.task;
    subjectCounts.set(key, (subjectCounts.get(key) ?? 0) + 1);
  });
  let topSubject: string | null = null;
  let maxCount = 0;
  subjectCounts.forEach((count, subject) => {
    if (count > maxCount) {
      maxCount = count;
      topSubject = subject;
    }
  });

  return {
    sessionsCount,
    longestStreak: streak?.longestStreak ?? 0,
    connectionsCount,
    topSubject,
  };
}

export async function generateMonthlyRecapSummary(
  stats: RecapStats
): Promise<string> {
  const prompt = `Write a 2-sentence motivational monthly study recap. Stats: ${stats.sessionsCount} sessions, longest streak ${stats.longestStreak} days, ${stats.connectionsCount} new study partners, top focus: ${stats.topSubject ?? "general prep"}. Light Hinglish OK. No name. Max 40 words.`;

  const system = "You write short motivational study recaps for Indian students.";

  const aiSummary = await generateClaudeText(system, prompt, 120);
  return (
    aiSummary ??
    `${stats.sessionsCount} sessions, ${stats.longestStreak}-day streak. Solid month of showing up. Next month, let's push even harder 💪`
  );
}

export async function runMonthlyRecapCron() {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const isLastDay =
    now.getUTCDate() ===
    new Date(Date.UTC(year, month, 0)).getUTCDate();

  if (!isLastDay) return 0;

  const users = await prisma.user.findMany({ select: { id: true } });
  let generated = 0;

  for (const { id: userId } of users) {
    const existing = await prisma.monthlyRecap.findUnique({
      where: { userId_month_year: { userId, month, year } },
    });
    if (existing) continue;

    const stats = await aggregateMonthlyStats(userId, month, year);
    const summaryText = await generateMonthlyRecapSummary(stats);

    await prisma.monthlyRecap.create({
      data: {
        userId,
        month,
        year,
        ...stats,
        summaryText,
      },
    });
    generated++;
  }

  return generated;
}

export async function getLatestMonthlyRecap(userId: string) {
  return prisma.monthlyRecap.findFirst({
    where: { userId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}
