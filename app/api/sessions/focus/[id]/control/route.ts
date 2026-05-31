import { NextResponse } from "next/server";
import {
  badRequestResponse,
  notFoundResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { triggerFocusEvent } from "@/lib/pusher-server";
import prisma from "@/lib/prisma";
import { focusControlSchema } from "@/lib/validations/sessions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = focusControlSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse("Invalid control");

    const session = await prisma.focusSession.findUnique({ where: { id } });
    if (!session) return notFoundResponse("Session not found");
    if (session.user1Id !== user.id && session.user2Id !== user.id) {
      return unauthorizedResponse();
    }
    if (session.endedAt) return badRequestResponse("Session already ended");

    const { action, remainingSeconds } = parsed.data;

    if (session.pairId) {
      await triggerFocusEvent(session.pairId, "timer-sync", {
        sessionId: id,
        action,
        remainingSeconds,
        triggeredBy: user.id,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/sessions/focus/[id]/control error:", error);
    return serverErrorResponse();
  }
}
