import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfDayUTC } from "@/lib/streak";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const weekStart = startOfDayUTC();
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());

    const pairs = await prisma.connectedPair.findMany({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
        isProvisional: false,
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            profile: { select: { profilePicUrl: true } },
            individualStreak: { select: { currentStreak: true } },
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            profile: { select: { profilePicUrl: true } },
            individualStreak: { select: { currentStreak: true } },
          },
        },
      },
    });

    const partnerIds = pairs.map((p) =>
      p.user1Id === user.id ? p.user2Id : p.user1Id
    );

    const allIds = [user.id, ...partnerIds];

    const sessions = await prisma.focusSession.findMany({
      where: {
        isComplete: true,
        endedAt: { gte: weekStart },
        OR: [{ user1Id: { in: allIds } }, { user2Id: { in: allIds } }],
      },
      select: { user1Id: true, user2Id: true },
    });

    const countMap = new Map<string, number>();
    for (const s of sessions) {
      if (allIds.includes(s.user1Id)) {
        countMap.set(s.user1Id, (countMap.get(s.user1Id) ?? 0) + 1);
      }
      if (s.user2Id && allIds.includes(s.user2Id)) {
        countMap.set(s.user2Id, (countMap.get(s.user2Id) ?? 0) + 1);
      }
    }

    const leaderboard = pairs
      .map((pair) => {
        const partner = pair.user1Id === user.id ? pair.user2 : pair.user1;
        return {
          userId: partner.id,
          name: partner.name,
          profilePicUrl: partner.profile?.profilePicUrl ?? null,
          sessionsThisWeek: countMap.get(partner.id) ?? 0,
          streak: partner.individualStreak?.currentStreak ?? 0,
        };
      })
      .sort((a, b) => b.sessionsThisWeek - a.sessionsThisWeek)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/pairs/leaderboard error:", error);
    return serverErrorResponse();
  }
}
