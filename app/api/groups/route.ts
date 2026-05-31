import { NextResponse } from "next/server";
import type { StudyGoal } from "@prisma/client";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await requireDbUser();

    const memberships = await prisma.studyGroupMember.findMany({
      where: { userId: user.id },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
            creator: { include: { profile: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json({
      groups: memberships.map((m) => ({
        id: m.group.id,
        name: m.group.name,
        goal: m.group.goal,
        subject: m.group.subject,
        memberCount: m.group._count.members,
        maxMembers: m.group.maxMembers,
        creatorName: m.group.creator.name,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/groups error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const goal = body.goal as StudyGoal;

    if (name.length < 2) return badRequestResponse("Group name is required");
    if (subject.length < 2) return badRequestResponse("Subject is required");
    if (!goal) return badRequestResponse("Goal is required");

    const group = await prisma.studyGroup.create({
      data: {
        name,
        goal,
        subject,
        creatorId: user.id,
        members: { create: { userId: user.id } },
        focusSession: { create: {} },
      },
    });

    return NextResponse.json({ group: { id: group.id } });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/groups error:", error);
    return serverErrorResponse();
  }
}
