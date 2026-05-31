import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { getWeekStart } from "@/lib/weekly-goals";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const weekStart = getWeekStart();

    const goals = await prisma.weeklyGoal.findMany({
      where: { userId: user.id, weekStart },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      weekStart: weekStart.toISOString(),
      goals: goals.map((g) => ({
        id: g.id,
        goalText: g.goalText,
        isComplete: g.isComplete,
        completedAt: g.completedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/weekly-goals error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const goalText = String(body.goalText ?? "").trim();
    const weekStart = getWeekStart();

    if (goalText.length < 3) {
      return badRequestResponse("Goal must be at least 3 characters");
    }

    const count = await prisma.weeklyGoal.count({
      where: { userId: user.id, weekStart },
    });
    if (count >= 5) {
      return badRequestResponse("Maximum 5 goals per week");
    }

    const goal = await prisma.weeklyGoal.create({
      data: { userId: user.id, weekStart, goalText },
    });

    return NextResponse.json({ goal: { id: goal.id, goalText: goal.goalText } });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/weekly-goals error:", error);
    return serverErrorResponse();
  }
}
