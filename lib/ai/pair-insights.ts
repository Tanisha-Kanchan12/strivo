import prisma from "@/lib/prisma";
import { generateClaudeText } from "@/lib/claude";
import { startOfDayUTC } from "@/lib/streak";

function getWeekStart(date = new Date()): Date {
  const d = startOfDayUTC(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

export async function generatePairInsight(
  pairId: string,
  userId: string
): Promise<string> {
  const weekStart = getWeekStart();
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setUTCDate(lastWeekEnd.getUTCDate() + 7);

  const [thisWeekSessions, lastWeekSessions, pair] = await Promise.all([
    prisma.focusSession.count({
      where: {
        pairId,
        isComplete: true,
        endedAt: { gte: weekStart, lt: weekEnd },
      },
    }),
    prisma.focusSession.count({
      where: {
        pairId,
        isComplete: true,
        endedAt: { gte: lastWeekStart, lt: lastWeekEnd },
      },
    }),
    prisma.connectedPair.findUnique({
      where: { id: pairId },
      include: {
        user1: { select: { name: true } },
        user2: { select: { name: true } },
      },
    }),
  ]);

  if (!pair) return "Keep showing up. Consistency builds great study partnerships.";

  const partner =
    pair.user1Id === userId ? pair.user2.name : pair.user1.name;

  const prompt = `Write 2-3 sentences of private study insight for one partner in a study pair.
This week focus sessions: ${thisWeekSessions}. Last week: ${lastWeekSessions}.
Partner name: ${partner ?? "partner"}. Encouraging, specific, private tone. Light Hinglish OK. Max 60 words.`;

  const system =
    "You write weekly private study insights for Indian students. Warm, actionable, not generic.";

  const aiInsight = await generateClaudeText(system, prompt, 200);
  return (
    aiInsight ??
    `This week: ${thisWeekSessions} focus sessions vs ${lastWeekSessions} last week. ${thisWeekSessions >= lastWeekSessions ? "Solid momentum. Keep it going!" : "Slow week. Even one session with " + (partner ?? "your partner") + " helps restart the rhythm."}`
  );
}

export async function runPairInsightsCron() {
  const weekStart = getWeekStart();
  const pairs = await prisma.connectedPair.findMany({
    select: { id: true, user1Id: true, user2Id: true },
  });

  let generated = 0;
  for (const pair of pairs) {
    for (const userId of [pair.user1Id, pair.user2Id]) {
      const existing = await prisma.pairInsight.findUnique({
        where: {
          pairId_userId_weekStart: {
            pairId: pair.id,
            userId,
            weekStart,
          },
        },
      });
      if (existing) continue;

      const content = await generatePairInsight(pair.id, userId);
      await prisma.pairInsight.create({
        data: { pairId: pair.id, userId, weekStart, content },
      });
      generated++;
    }
  }

  return generated;
}

export async function getLatestPairInsight(pairId: string, userId: string) {
  return prisma.pairInsight.findFirst({
    where: { pairId, userId },
    orderBy: { weekStart: "desc" },
  });
}
