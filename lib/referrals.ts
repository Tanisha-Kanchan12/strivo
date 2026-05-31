import { BadgeType } from "@prisma/client";
import { awardBadgeIfMissing } from "@/lib/badges";
import prisma from "@/lib/prisma";

export async function completeReferralForUser(referredUserId: string) {
  const referral = await prisma.referral.findUnique({
    where: { referredUserId },
  });

  if (!referral || referral.completedOnboarding) return;

  await prisma.referral.update({
    where: { id: referral.id },
    data: { completedOnboarding: true },
  });

  await Promise.all([
    awardBadgeIfMissing(referral.referrerId, BadgeType.COMMUNITY_BUILDER),
    awardBadgeIfMissing(referredUserId, BadgeType.COMMUNITY_BUILDER),
  ]);
}

export async function recordReferral(referrerId: string, referredUserId: string) {
  if (referrerId === referredUserId) return;

  await prisma.referral.upsert({
    where: { referredUserId },
    create: { referrerId, referredUserId },
    update: {},
  });
}
