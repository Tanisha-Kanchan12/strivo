import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;

    const goal = await prisma.weeklyGoal.findFirst({
      where: { id, userId: user.id },
    });
    if (!goal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isComplete = !goal.isComplete;
    const updated = await prisma.weeklyGoal.update({
      where: { id },
      data: {
        isComplete,
        completedAt: isComplete ? new Date() : null,
      },
    });

    return NextResponse.json({ goal: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/weekly-goals/[id] error:", error);
    return serverErrorResponse();
  }
}
