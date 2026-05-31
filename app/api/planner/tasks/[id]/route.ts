import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { moveTaskToNextDay } from "@/lib/planner";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;
    const body = await request.json();
    const action = body.action as "complete" | "skip" | "edit";
    const taskText = body.taskText ? String(body.taskText).trim() : null;

    const task = await prisma.planTask.findFirst({
      where: { id, userId: user.id },
    });
    if (!task) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (action === "complete") {
      const updated = await prisma.planTask.update({
        where: { id },
        data: { isComplete: true },
      });
      return NextResponse.json({ task: updated });
    }

    if (action === "skip") {
      await moveTaskToNextDay(id, user.id);
      const updated = await prisma.planTask.findUnique({ where: { id } });
      return NextResponse.json({ task: updated });
    }

    if (action === "edit") {
      if (!taskText || taskText.length < 2) {
        return badRequestResponse("Task description is required");
      }
      const updated = await prisma.planTask.update({
        where: { id },
        data: { taskText },
      });
      return NextResponse.json({ task: updated });
    }

    return badRequestResponse("Invalid action");
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/planner/tasks/[id] error:", error);
    return serverErrorResponse();
  }
}
