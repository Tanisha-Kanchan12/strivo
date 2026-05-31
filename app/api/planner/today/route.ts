import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const today = startOfDay(new Date());

    const tasks = await prisma.planTask.findMany({
      where: {
        userId: user.id,
        date: today,
        skippedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      date: today.toISOString(),
      tasks: tasks.map((t) => ({
        id: t.id,
        taskText: t.taskText,
        subject: t.subject,
        isComplete: t.isComplete,
      })),
      total: tasks.length,
      complete: tasks.filter((t) => t.isComplete).length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/planner/today error:", error);
    return serverErrorResponse();
  }
}
