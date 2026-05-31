import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id: groupId } = await params;
    const body = await request.json();

    const member = await prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });
    if (!member) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    if (body.type === "message") {
      const content = String(body.content ?? "").trim();
      if (!content) return badRequestResponse("Message cannot be empty");

      const message = await prisma.studyGroupMessage.create({
        data: { groupId, userId: user.id, content },
        include: { user: { include: { profile: true } } },
      });

      return NextResponse.json({
        message: {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          author: {
            id: message.user.id,
            name: message.user.name,
            profilePicUrl: message.user.profile?.profilePicUrl ?? null,
          },
        },
      });
    }

    if (body.type === "target") {
      const task = String(body.task ?? "").trim();
      if (!task) return badRequestResponse("Target task is required");

      const target = await prisma.studyGroupTarget.create({
        data: {
          groupId,
          userId: user.id,
          task,
          date: startOfDay(new Date()),
        },
      });

      return NextResponse.json({ target: { id: target.id, task: target.task } });
    }

    if (body.type === "complete-target") {
      const targetId = String(body.targetId ?? "");
      const target = await prisma.studyGroupTarget.findFirst({
        where: { id: targetId, groupId, userId: user.id },
      });
      if (!target) {
        return NextResponse.json({ error: "Target not found" }, { status: 404 });
      }

      await prisma.studyGroupTarget.update({
        where: { id: targetId },
        data: { isComplete: true },
      });
      return NextResponse.json({ success: true });
    }

    return badRequestResponse("Invalid type");
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/groups/[id]/activity error:", error);
    return serverErrorResponse();
  }
}
