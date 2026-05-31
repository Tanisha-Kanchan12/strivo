import { NextResponse } from "next/server";
import {
  badRequestResponse,
  notFoundResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateGoalSchema } from "@/lib/validations/goals";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateGoalSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.errors[0]?.message ?? "Invalid goal");
    }

    const existing = await prisma.studyGoalProgress.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return notFoundResponse("Goal not found");

    const goal = await prisma.studyGoalProgress.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.targetNumber !== undefined && {
          targetNumber: parsed.data.targetNumber,
        }),
        ...(parsed.data.currentProgress !== undefined && {
          currentProgress: parsed.data.currentProgress,
        }),
        ...(parsed.data.deadline !== undefined && {
          deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
        }),
      },
    });

    return NextResponse.json({ goal });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/goals/[id] error:", error);
    return serverErrorResponse();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;

    const existing = await prisma.studyGoalProgress.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return notFoundResponse("Goal not found");

    await prisma.studyGoalProgress.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("DELETE /api/goals/[id] error:", error);
    return serverErrorResponse();
  }
}
