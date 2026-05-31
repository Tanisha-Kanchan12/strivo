import prisma from "@/lib/prisma";
import { BadgeType } from "@prisma/client";

export async function awardBadgeIfMissing(
  userId: string,
  badgeType: BadgeType
) {
  const existing = await prisma.badge.findUnique({
    where: {
      userId_badgeType: { userId, badgeType },
    },
  });

  if (existing) return existing;

  return prisma.badge.create({
    data: { userId, badgeType },
  });
}

export async function awardVerifiedStudentBadge(userId: string) {
  return awardBadgeIfMissing(userId, BadgeType.VERIFIED_STUDENT);
}
