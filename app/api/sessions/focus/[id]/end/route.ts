import { NextResponse } from "next/server";
import {
  badRequestResponse,
  notFoundResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { onQualifyingActivity } from "@/lib/streak";
import { triggerFocusEvent } from "@/lib/pusher-server";
import prisma from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;

    const session = await prisma.focusSession.findUnique({ where: { id } });
    if (!session) return notFoundResponse("Session not found");
    const isSolo = session.user2Id === null;
    if (session.user1Id !== user.id && session.user2Id !== user.id) {
      return unauthorizedResponse();
    }
    if (session.endedAt) return badRequestResponse("Session already ended");

    const endedAt = new Date();
    const durationMinutes = Math.floor(
      (endedAt.getTime() - session.startedAt.getTime()) / 60000
    );
    const isComplete = durationMinutes >= 15;

    const updated = await prisma.focusSession.update({
      where: { id },
      data: {
        endedAt,
        durationMinutes,
        isComplete,
      },
    });

    if (session.pairId) {
      await triggerFocusEvent(session.pairId, "session-ended", {
        sessionId: id,
        durationMinutes,
        isComplete,
        endedBy: user.id,
      });
    }

    if (isComplete) {
      if (isSolo || !session.pairId) {
        const { updateIndividualStreak } = await import("@/lib/streak");
        await updateIndividualStreak(user.id);
        await prisma.streakEvent.create({
          data: {
            streakType: "INDIVIDUAL",
            referenceId: user.id,
            eventDate: new Date(),
            eventType: "FOCUS_SESSION",
          },
        });
      } else if (session.pairId && session.user2Id) {
        await onQualifyingActivity(session.pairId, user.id, "FOCUS_SESSION");
        const partnerId =
          session.user1Id === user.id ? session.user2Id : session.user1Id;
        await onQualifyingActivity(session.pairId, partnerId, "FOCUS_SESSION");
      }
    }

    return NextResponse.json({
      session: updated,
      isComplete,
      needsRating: isComplete,
      streakMessage: isComplete
        ? "Great session! Streak updated."
        : `Session was ${durationMinutes} min. Need at least 15 min for streak credit.`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/sessions/focus/[id]/end error:", error);
    return serverErrorResponse();
  }
}
