import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { verifyPairMembership } from "@/lib/chat";
import { getStreakHistory, startOfDayUTC } from "@/lib/streak";
import { getPairWeeklyGoals } from "@/lib/weekly-goals";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pairId: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { pairId } = await params;

    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) return unauthorizedResponse();

    const today = startOfDayUTC();

    const [targets, checkins, upcomingSession, pairStreak, history, weeklyGoals] =
      await Promise.all([
        prisma.dailyTarget.findMany({
          where: { pairId, date: today },
          orderBy: { id: "asc" },
        }),
        prisma.checkin.findMany({ where: { pairId, date: today } }),
        prisma.sessionSchedule.findFirst({
          where: { pairId, scheduledAt: { gte: new Date() } },
          orderBy: { scheduledAt: "asc" },
        }),
        prisma.pairStreak.findUnique({ where: { pairId } }),
        getStreakHistory(pairId, 30),
        getPairWeeklyGoals(pairId, user.id),
      ]);

    return NextResponse.json({
      targets,
      checkins,
      upcomingSession,
      streak: pairStreak,
      streakHistory: history,
      weeklyGoals,
      partner: {
        id: membership.partner.id,
        name: membership.partner.name,
        profilePicUrl: membership.partner.profile?.profilePicUrl ?? null,
      },
      currentUserId: user.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/pairs/[pairId]/board error:", error);
    return serverErrorResponse();
  }
}
