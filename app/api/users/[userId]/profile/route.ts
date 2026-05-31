import { NextResponse } from "next/server";
import {
  badRequestResponse,
  notFoundResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { BADGE_INFO } from "@/lib/constants/onboarding";
import prisma from "@/lib/prisma";
import { asStudyTimes } from "@/lib/prisma-json";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { user: viewer } = await requireDbUser();
    const { userId } = await params;

    if (userId === viewer.id) {
      return badRequestResponse("Use /api/profile for your own profile");
    }

    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewer.id, blockedId: userId },
          { blockerId: userId, blockedId: viewer.id },
        ],
      },
    });

    if (block) {
      return NextResponse.json({ available: false, reason: "blocked" });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        onboarding: true,
        subjects: true,
        badges: { where: { isVisible: true } },
      },
    });

    if (!target) return notFoundResponse("User not found");

    const visibility = target.profile?.visibility ?? "OPEN";

    if (visibility === "PRIVATE") {
      return NextResponse.json({ available: false, reason: "private" });
    }

    const isConnected = await prisma.connectedPair.findFirst({
      where: {
        OR: [
          { user1Id: viewer.id, user2Id: userId },
          { user1Id: userId, user2Id: viewer.id },
        ],
      },
    });

    if (visibility === "MATCH_ONLY" && !isConnected) {
      return NextResponse.json({
        available: true,
        limited: true,
        user: {
          id: target.id,
          name: target.name,
          goal: target.onboarding?.goal,
        },
      });
    }

    const [pairsCount, sessionsCount] = await Promise.all([
      prisma.connectedPair.count({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      }),
      prisma.focusSession.count({
        where: { isComplete: true, OR: [{ user1Id: userId }, { user2Id: userId }] },
      }),
    ]);

    return NextResponse.json({
      available: true,
      limited: false,
      user: {
        id: target.id,
        name: target.name,
        profile: {
          bio: target.profile?.bio,
          city: target.profile?.city,
          college: target.profile?.college,
          stream: target.profile?.stream,
          profilePicUrl: target.profile?.profilePicUrl,
          isVerified: target.profile?.isVerified ?? false,
        },
        onboarding: {
          goal: target.onboarding?.goal,
          field: target.onboarding?.field,
          studyTimes: asStudyTimes(target.onboarding?.studyTimes),
          partnerType: target.onboarding?.partnerType,
        },
        subjects: target.subjects.map((s) => s.subjectName),
        badges: target.badges.map((b) => ({
          type: b.badgeType,
          label: BADGE_INFO[b.badgeType]?.label ?? b.badgeType,
        })),
        pairsCount,
        sessionsCount,
        isConnected: Boolean(isConnected),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/users/[userId]/profile error:", error);
    return serverErrorResponse();
  }
}
