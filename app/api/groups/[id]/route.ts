import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

async function getMembership(groupId: string, userId: string) {
  return prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id: groupId } = await params;

    const member = await getMembership(groupId, user.id);
    if (!member) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { include: { profile: true, onboarding: true } },
          },
        },
        messages: {
          include: { user: { include: { profile: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        targets: {
          where: { date: startOfDay(new Date()) },
          include: { user: { include: { profile: true } } },
        },
        focusSession: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        goal: group.goal,
        subject: group.subject,
        maxMembers: group.maxMembers,
        members: group.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          profilePicUrl: m.user.profile?.profilePicUrl ?? null,
        })),
        messages: group.messages.reverse().map((msg) => ({
          id: msg.id,
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
          author: {
            id: msg.user.id,
            name: msg.user.name,
            profilePicUrl: msg.user.profile?.profilePicUrl ?? null,
          },
        })),
        targets: group.targets.map((t) => ({
          id: t.id,
          task: t.task,
          isComplete: t.isComplete,
          userId: t.userId,
          userName: t.user.name,
        })),
        focusSession: group.focusSession
          ? {
              status: group.focusSession.status,
              durationMinutes: group.focusSession.durationMinutes,
              startedAt: group.focusSession.startedAt?.toISOString() ?? null,
              endsAt: group.focusSession.endsAt?.toISOString() ?? null,
            }
          : null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/groups/[id] error:", error);
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

    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: { _count: { select: { members: true } } },
    });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (action === "join") {
      if (group._count.members >= group.maxMembers) {
        return badRequestResponse("Group is full (max 5 members)");
      }
      const existing = await getMembership(groupId, user.id);
      if (existing) return NextResponse.json({ joined: true });

      await prisma.studyGroupMember.create({
        data: { groupId, userId: user.id },
      });
      return NextResponse.json({ joined: true });
    }

    return badRequestResponse("Invalid action");
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/groups/[id] error:", error);
    return serverErrorResponse();
  }
}
