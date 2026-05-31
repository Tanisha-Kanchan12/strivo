import prisma from "@/lib/prisma";
import { formatStudyGoal } from "@/lib/constants/onboarding";

export async function verifyPairMembership(userId: string, pairId: string) {
  const pair = await prisma.connectedPair.findUnique({
    where: { id: pairId },
    include: {
      user1: {
        select: {
          id: true,
          name: true,
          profile: { select: { profilePicUrl: true } },
          onboarding: { select: { goal: true, field: true } },
        },
      },
      user2: {
        select: {
          id: true,
          name: true,
          profile: { select: { profilePicUrl: true } },
          onboarding: { select: { goal: true, field: true } },
        },
      },
    },
  });

  if (!pair) return null;
  if (pair.user1Id !== userId && pair.user2Id !== userId) return null;

  const partner = pair.user1Id === userId ? pair.user2 : pair.user1;
  const currentUser = pair.user1Id === userId ? pair.user1 : pair.user2;

  return {
    pair: {
      id: pair.id,
      user1Id: pair.user1Id,
      user2Id: pair.user2Id,
      isProvisional: pair.isProvisional,
      source: pair.source,
    },
    partner,
    currentUser,
  };
}

export function generateIceBreaker(
  userName: string,
  partnerName: string,
  userGoal: string | null,
  partnerGoal: string | null
): string {
  const goalText =
    userGoal && partnerGoal && userGoal === partnerGoal
      ? `prepping for ${formatStudyGoal(userGoal as never)}`
      : userGoal
        ? `both serious about ${formatStudyGoal(userGoal as never)}`
        : "ready to study seriously";

  return `Hey ${partnerName.split(" ")[0]}! Looks like we're ${goalText}. What did you study today?`;
}

export async function getMessageCountForPair(pairId: string) {
  return prisma.message.count({ where: { pairId } });
}
