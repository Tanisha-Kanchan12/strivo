import { NextResponse } from "next/server";
import {
  notFoundResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { verifyPairMembership } from "@/lib/chat";
import { generateIcsContent } from "@/lib/calendar";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;

    const session = await prisma.sessionSchedule.findUnique({
      where: { id },
      include: { pair: true },
    });
    if (!session) return notFoundResponse("Session not found");

    const membership = await verifyPairMembership(user.id, session.pairId);
    if (!membership) return unauthorizedResponse();

    const start = new Date(session.scheduledAt);
    const end = new Date(start.getTime() + session.durationMinutes * 60 * 1000);

    const ics = generateIcsContent({
      title: "Strivo Study Session",
      description: session.meetLink
        ? `Join: ${session.meetLink}`
        : "Strivo study session",
      start,
      end,
      location: session.location ?? session.meetLink ?? undefined,
      url: session.meetLink ?? undefined,
    });

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="strivo-session.ics"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/sessions/schedule/[id]/ics error:", error);
    return serverErrorResponse();
  }
}
