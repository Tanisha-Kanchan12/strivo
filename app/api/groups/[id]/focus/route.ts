import { NextResponse } from "next/server";
import { addMinutes } from "date-fns";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id: groupId } = await params;

    const member = await prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });
    if (!member) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const session = await prisma.groupFocusSession.findUnique({
      where: { groupId },
    });

    return NextResponse.json({
      focusSession: session
        ? {
            status: session.status,
            durationMinutes: session.durationMinutes,
            startedAt: session.startedAt?.toISOString() ?? null,
            endsAt: session.endsAt?.toISOString() ?? null,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/groups/[id]/focus error:", error);
    return serverErrorResponse();
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id: groupId } = await params;
    const body = await request.json();
    const action = body.action as string;
    const durationMinutes = Number(body.durationMinutes ?? 25);

    const member = await prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });
    if (!member) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    if (action === "start") {
      const now = new Date();
      const session = await prisma.groupFocusSession.upsert({
        where: { groupId },
        create: {
          groupId,
          status: "RUNNING",
          durationMinutes,
          startedAt: now,
          endsAt: addMinutes(now, durationMinutes),
          startedById: user.id,
        },
        update: {
          status: "RUNNING",
          durationMinutes,
          startedAt: now,
          endsAt: addMinutes(now, durationMinutes),
          startedById: user.id,
        },
      });
      return NextResponse.json({
        focusSession: {
          status: session.status,
          durationMinutes: session.durationMinutes,
          startedAt: session.startedAt?.toISOString(),
          endsAt: session.endsAt?.toISOString(),
        },
      });
    }

    if (action === "stop") {
      const session = await prisma.groupFocusSession.update({
        where: { groupId },
        data: { status: "COMPLETED", endsAt: new Date() },
      });
      return NextResponse.json({
        focusSession: {
          status: session.status,
          endsAt: session.endsAt?.toISOString(),
        },
      });
    }

    return badRequestResponse("Invalid action");
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/groups/[id]/focus error:", error);
    return serverErrorResponse();
  }
}
