import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { awardBadgeIfMissing } from "@/lib/badges";
import { BadgeType } from "@prisma/client";

export function startOfDayUTC(date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfDayUTC(date = new Date()): Date {
  const d = startOfDayUTC(date);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

export async function getPairMemberIds(pairId: string): Promise<[string, string] | null> {
  const pair = await prisma.connectedPair.findUnique({
    where: { id: pairId },
    select: { user1Id: true, user2Id: true },
  });
  if (!pair) return null;
  return [pair.user1Id, pair.user2Id];
}

export async function userHasQualifyingActivityToday(
  pairId: string,
  userId: string
): Promise<boolean> {
  const today = startOfDayUTC();
  const tomorrow = endOfDayUTC();

  const [completedTarget, checkinYes, focusSession] = await Promise.all([
    prisma.dailyTarget.findFirst({
      where: {
        pairId,
        userId,
        date: today,
        isComplete: true,
      },
    }),
    prisma.checkin.findFirst({
      where: { pairId, userId, date: today, completed: true },
    }),
    prisma.focusSession.findFirst({
      where: {
        pairId,
        isComplete: true,
        durationMinutes: { gte: 15 },
        endedAt: { gte: today, lt: tomorrow },
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    }),
  ]);

  if (completedTarget || checkinYes || focusSession) return true;

  const messages = await prisma.message.findMany({
    where: { pairId, createdAt: { gte: today, lt: tomorrow } },
    select: { senderId: true },
  });
  const userMessageCount = messages.filter((m) => m.senderId === userId).length;
  if (userMessageCount >= 2) return true;

  const studyingNow = await prisma.studyingNowResponse.findUnique({
    where: {
      pairId_userId_date: { pairId, userId, date: today },
    },
  });
  if (studyingNow?.response) return true;

  return false;
}

export async function checkAndUpdatePairStreak(pairId: string) {
  const members = await getPairMemberIds(pairId);
  if (!members) return;

  const [user1Id, user2Id] = members;
  const [user1Active, user2Active] = await Promise.all([
    userHasQualifyingActivityToday(pairId, user1Id),
    userHasQualifyingActivityToday(pairId, user2Id),
  ]);

  if (!user1Active || !user2Active) return;

  const today = startOfDayUTC();
  const existingEvent = await prisma.streakEvent.findFirst({
    where: { pairId, streakType: "PAIR", eventDate: today },
  });

  if (existingEvent) return;

  await prisma.streakEvent.create({
    data: {
      streakType: "PAIR",
      referenceId: pairId,
      pairId,
      eventDate: today,
      eventType: "DAILY_TARGET",
    },
  });

  await incrementPairStreak(pairId);
}

async function incrementPairStreak(pairId: string) {
  const today = startOfDayUTC();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  let pairStreak = await prisma.pairStreak.findUnique({ where: { pairId } });

  if (!pairStreak) {
    await prisma.pairStreak.create({
      data: { pairId, currentStreak: 1, lastSharedDate: today },
    });
    await notifyStreakUpdate(pairId, 1);
    return;
  }

  const lastShared = pairStreak.lastSharedDate
    ? startOfDayUTC(pairStreak.lastSharedDate)
    : null;

  if (lastShared && lastShared.getTime() === today.getTime()) return;

  let currentStreak = 1;
  let shieldsRemaining = pairStreak.shieldsRemaining;
  let shieldUsed = false;

  if (lastShared && lastShared.getTime() === yesterday.getTime()) {
    currentStreak = pairStreak.currentStreak + 1;
  } else if (lastShared) {
    const gapDays = Math.floor(
      (today.getTime() - lastShared.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (gapDays > 1 && shieldsRemaining > 0) {
      currentStreak = pairStreak.currentStreak;
      shieldsRemaining -= 1;
      shieldUsed = true;
    } else if (gapDays > 1) {
      currentStreak = 1;
    }
  }

  const longestStreak = Math.max(pairStreak.longestStreak, currentStreak);

  await prisma.pairStreak.update({
    where: { pairId },
    data: {
      currentStreak,
      longestStreak,
      lastSharedDate: today,
      shieldsRemaining,
    },
  });

  if (shieldUsed) {
    const members = await getPairMemberIds(pairId);
    if (members) {
      for (const userId of members) {
        await createNotification({
          userId,
          type: "SHIELD_USED",
          content: "A streak shield was used to keep your pair streak alive",
          data: { pairId },
        });
      }
    }
  }

  await notifyStreakUpdate(pairId, currentStreak);
}

async function notifyStreakUpdate(pairId: string, streak: number) {
  const members = await getPairMemberIds(pairId);
  if (!members) return;

  for (const userId of members) {
    await createNotification({
      userId,
      type: "STREAK_UPDATE",
      content: `Pair streak is now ${streak} day${streak !== 1 ? "s" : ""}! 🔥`,
      data: { pairId, streak },
    });
  }
}

export async function updateIndividualStreak(userId: string) {
  const today = startOfDayUTC();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const streak = await prisma.individualStreak.findUnique({
    where: { userId },
  });

  if (!streak) return;

  const lastActive = streak.lastActiveDate
    ? startOfDayUTC(streak.lastActiveDate)
    : null;

  if (lastActive && lastActive.getTime() === today.getTime()) return;

  let currentStreak = 1;
  if (lastActive && lastActive.getTime() === yesterday.getTime()) {
    currentStreak = streak.currentStreak + 1;
  }

  const longestStreak = Math.max(streak.longestStreak, currentStreak);

  await prisma.individualStreak.update({
    where: { userId },
    data: { currentStreak, longestStreak, lastActiveDate: today },
  });

  for (const milestone of [7, 30, 100]) {
    if (currentStreak === milestone) {
      await createNotification({
        userId,
        type: "INDIVIDUAL_STREAK_MILESTONE",
        content: `${milestone}-day streak! You're on fire 🔥`,
        data: { streak: currentStreak },
      });
      if (milestone === 7) await awardBadgeIfMissing(userId, BadgeType.CONSISTENT);
      if (milestone === 30) await awardBadgeIfMissing(userId, BadgeType.VETERAN);
    }
  }
}

export async function onQualifyingActivity(
  pairId: string,
  userId: string,
  eventType: "DAILY_TARGET" | "FOCUS_SESSION" | "CHECKIN" | "CHAT_MESSAGES" | "STUDYING_NOW"
) {
  await updateIndividualStreak(userId);
  await checkAndUpdatePairStreak(pairId);

  if (eventType === "DAILY_TARGET") {
    await awardBadgeIfMissing(userId, BadgeType.GOAL_SETTER);
  }
}

export async function checkAndUpdatePairStreakFromChat(pairId: string) {
  const members = await getPairMemberIds(pairId);
  if (!members) return;

  const today = startOfDayUTC();
  const tomorrow = endOfDayUTC();

  const messages = await prisma.message.findMany({
    where: { pairId, createdAt: { gte: today, lt: tomorrow } },
    select: { senderId: true },
  });

  const senderCounts = new Map<string, number>();
  messages.forEach((m) => {
    senderCounts.set(m.senderId, (senderCounts.get(m.senderId) ?? 0) + 1);
  });

  const counts = Array.from(senderCounts.values());
  if (counts.length < 2 || counts.some((c) => c < 2)) return;

  await checkAndUpdatePairStreak(pairId);
}

export async function getStreakHistory(pairId: string, days = 30) {
  const today = startOfDayUTC();
  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

  const events = await prisma.streakEvent.findMany({
    where: {
      pairId,
      streakType: "PAIR",
      eventDate: { gte: startDate, lte: today },
    },
    select: { eventDate: true },
  });

  const activeDates = new Set(
    events.map((e) => startOfDayUTC(e.eventDate).toISOString())
  );

  const history: { date: string; active: boolean }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    history.push({
      date: d.toISOString(),
      active: activeDates.has(startOfDayUTC(d).toISOString()),
    });
  }

  return history;
}

// Keep backward compat alias
export async function recordPairStreakActivity(
  pairId: string,
  _eventType: "CHAT_MESSAGES" | "DAILY_TARGET" | "FOCUS_SESSION" | "CHECKIN" | "STUDYING_NOW"
) {
  await checkAndUpdatePairStreak(pairId);
}
