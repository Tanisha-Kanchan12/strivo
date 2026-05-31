import { addDays, startOfWeek, subDays } from "date-fns";
import prisma from "@/lib/prisma";
import { createNotifications } from "@/lib/notifications";

export function getWeekStart(date = new Date()) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export async function getWeeklyGoalsForUser(userId: string, weekStart?: Date) {
  const start = weekStart ?? getWeekStart();
  return prisma.weeklyGoal.findMany({
    where: { userId, weekStart: start },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPairWeeklyGoals(pairId: string, userId: string) {
  const pair = await prisma.connectedPair.findFirst({
    where: {
      id: pairId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
  });
  if (!pair) return null;

  const weekStart = getWeekStart();
  const [userGoals, partnerGoals] = await Promise.all([
    prisma.weeklyGoal.findMany({
      where: { userId, weekStart },
      orderBy: { createdAt: "asc" },
    }),
    prisma.weeklyGoal.findMany({
      where: {
        userId: pair.user1Id === userId ? pair.user2Id : pair.user1Id,
        weekStart,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return { userGoals, partnerGoals, weekStart };
}

export async function runWeeklyGoalsMondayCron() {
  const weekStart = getWeekStart();
  const users = await prisma.user.findMany({
    where: { onboarding: { completedAt: { not: null } } },
    select: { id: true, name: true },
  });

  const inputs = users.map((u) => ({
    userId: u.id,
    type: "WEEKLY_GOAL_REMINDER" as const,
    content: "Set up to 5 goals for this week. Your pairs can see them for accountability.",
    data: { weekStart: weekStart.toISOString(), phase: "monday" },
  }));

  await createNotifications(inputs);
  return inputs.length;
}

export async function runWeeklyGoalsFridayCron() {
  const weekStart = getWeekStart();
  const users = await prisma.user.findMany({
    where: { onboarding: { completedAt: { not: null } } },
    select: { id: true },
  });

  let sent = 0;
  for (const user of users) {
    const goals = await prisma.weeklyGoal.findMany({
      where: { userId: user.id, weekStart },
    });
    const complete = goals.filter((g) => g.isComplete).length;
    const total = goals.length;
    await createNotifications([
      {
        userId: user.id,
        type: "WEEKLY_GOAL_REMINDER",
        content:
          total === 0
            ? "You have not set weekly goals yet. Add them before Sunday!"
            : `Weekly goals check-in: ${complete}/${total} completed so far.`,
        data: { weekStart: weekStart.toISOString(), phase: "friday", complete, total },
      },
    ]);
    sent += 1;
  }
  return sent;
}

export async function runWeeklyGoalsSundayCron() {
  const lastWeekStart = subDays(getWeekStart(), 7);
  const users = await prisma.user.findMany({
    where: { onboarding: { completedAt: { not: null } } },
    select: { id: true, name: true },
  });

  let sent = 0;
  for (const user of users) {
    const goals = await prisma.weeklyGoal.findMany({
      where: { userId: user.id, weekStart: lastWeekStart },
    });
    if (goals.length === 0) continue;

    const complete = goals.filter((g) => g.isComplete).length;
    await createNotifications([
      {
        userId: user.id,
        type: "WEEKLY_GOAL_RECAP",
        content: `Last week recap: ${complete}/${goals.length} goals completed. New week starts tomorrow!`,
        data: {
          weekStart: lastWeekStart.toISOString(),
          complete,
          total: goals.length,
        },
      },
    ]);
    sent += 1;
  }
  return sent;
}

export function getNextMonday(from = new Date()) {
  const weekStart = getWeekStart(from);
  if (weekStart <= from) return addDays(weekStart, 7);
  return weekStart;
}
