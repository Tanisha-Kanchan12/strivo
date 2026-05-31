import prisma from "@/lib/prisma";
import { startOfDayUTC } from "@/lib/streak";

export type ActivityLevel = 0 | 1 | 2 | 3;

export interface ActivityDay {
  date: string;
  count: number;
  level: ActivityLevel;
}

function levelFromCount(count: number): ActivityLevel {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  return 3;
}

export async function getUserActivityCalendar(
  userId: string,
  weeks = 12
): Promise<ActivityDay[]> {
  const today = startOfDayUTC();
  const daysTotal = weeks * 7;
  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - (daysTotal - 1));

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const [focusSessions, streakEvents, messages, checkins, targets] =
    await Promise.all([
      prisma.focusSession.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          isComplete: true,
          endedAt: { gte: startDate, lt: tomorrow },
        },
        select: { endedAt: true },
      }),
      prisma.streakEvent.findMany({
        where: {
          referenceId: userId,
          eventDate: { gte: startDate, lt: tomorrow },
        },
        select: { eventDate: true },
      }),
      prisma.message.findMany({
        where: {
          senderId: userId,
          createdAt: { gte: startDate, lt: tomorrow },
        },
        select: { createdAt: true },
      }),
      prisma.checkin.findMany({
        where: {
          userId,
          completed: true,
          date: { gte: startDate, lt: tomorrow },
        },
        select: { date: true },
      }),
      prisma.dailyTarget.findMany({
        where: {
          userId,
          isComplete: true,
          date: { gte: startDate, lt: tomorrow },
        },
        select: { date: true },
      }),
    ]);

  const countByDay = new Map<string, number>();

  const bump = (d: Date) => {
    const key = startOfDayUTC(d).toISOString();
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  };

  focusSessions.forEach((s) => s.endedAt && bump(s.endedAt));
  streakEvents.forEach((e) => bump(e.eventDate));
  messages.forEach((m) => bump(m.createdAt));
  checkins.forEach((c) => bump(c.date));
  targets.forEach((t) => bump(t.date));

  const result: ActivityDay[] = [];
  for (let i = daysTotal - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = startOfDayUTC(d).toISOString();
    const count = countByDay.get(key) ?? 0;
    result.push({
      date: key,
      count,
      level: levelFromCount(count),
    });
  }

  return result;
}

export async function getSoloFocusStats(userId: string) {
  const soloSessions = await prisma.focusSession.findMany({
    where: {
      user1Id: userId,
      user2Id: null,
      isComplete: true,
    },
    select: { durationMinutes: true },
  });

  const totalMinutes = soloSessions.reduce(
    (sum, s) => sum + (s.durationMinutes ?? 0),
    0
  );

  return {
    soloSessionCount: soloSessions.length,
    soloTotalMinutes: totalMinutes,
    soloTotalHours: Math.round((totalMinutes / 60) * 10) / 10,
  };
}
