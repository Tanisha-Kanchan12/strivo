import prisma from "@/lib/prisma";
import { generateClaudeText } from "@/lib/claude";
import { createNotification } from "@/lib/notifications";
import { startOfDayUTC } from "@/lib/streak";
import { formatStudyGoal } from "@/lib/constants/onboarding";

export async function generateProgressNudge(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { onboarding: true, individualStreak: true },
  });

  if (!user) return "Miss kiya tumne aaj. Chalo ek chhota session kar lete hain?";

  const goal = user.onboarding?.goal
    ? formatStudyGoal(user.onboarding.goal)
    : "prep";

  const prompt = `Write a gentle 1-2 sentence check-in message in light Hinglish for a student who hasn't studied in 2+ days. Goal: ${goal}. Name: ${user.name?.split(" ")[0] ?? "friend"}. Not pushy, warm. Max 30 words.`;

  const system =
    "You send gentle, warm study nudges to Indian students. Light Hinglish. Never guilt-trip.";

  const aiNudge = await generateClaudeText(system, prompt, 100);
  return (
    aiNudge ??
    `${user.name?.split(" ")[0] ?? "Hey"}, 2 din ho gaye. ${goal} wait nahi karta. Aaj 25 min ka ek block laga lein?`
  );
}

export async function runProgressNudgeCron() {
  const today = startOfDayUTC();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);

  const inactiveUsers = await prisma.individualStreak.findMany({
    where: {
      lastActiveDate: { lt: twoDaysAgo },
    },
    select: { userId: true },
  });

  let sent = 0;
  for (const { userId } of inactiveUsers) {
    const recentNudge = await prisma.notification.findFirst({
      where: {
        userId,
        type: "AI_NUDGE",
        createdAt: { gte: twoDaysAgo },
      },
    });
    if (recentNudge) continue;

    const content = await generateProgressNudge(userId);
    await createNotification({
      userId,
      type: "AI_NUDGE",
      content,
      data: { source: "ai_nudge_cron" },
    });
    sent++;
  }

  return sent;
}
