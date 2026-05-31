import { NextResponse } from "next/server";
import {
  badRequestResponse,
  notFoundResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { awardBadgeIfMissing } from "@/lib/badges";
import prisma from "@/lib/prisma";
import { sessionRatingSchema } from "@/lib/validations/sessions";
import { BadgeType } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = sessionRatingSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse("Invalid rating");

    const session = await prisma.focusSession.findUnique({ where: { id } });
    if (!session) return notFoundResponse("Session not found");
    if (session.user1Id !== user.id && session.user2Id !== user.id) {
      return unauthorizedResponse();
    }

    const ratedUserId =
      session.user1Id === user.id ? session.user2Id : session.user1Id;

    if (!ratedUserId) {
      return badRequestResponse("Solo sessions cannot be rated");
    }

    await prisma.sessionRating.upsert({
      where: {
        sessionId_ratingUserId: { sessionId: id, ratingUserId: user.id },
      },
      create: {
        sessionId: id,
        ratingUserId: user.id,
        ratedUserId,
        stars: parsed.data.stars,
      },
      update: { stars: parsed.data.stars },
    });

    if (parsed.data.stars >= 4) {
      const goodRatings = await prisma.sessionRating.groupBy({
        by: ["ratingUserId"],
        where: { ratedUserId, stars: { gte: 4 } },
      });
      if (goodRatings.length >= 3) {
        await awardBadgeIfMissing(ratedUserId, BadgeType.GOOD_PARTNER);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/sessions/focus/[id]/rate error:", error);
    return serverErrorResponse();
  }
}
