import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createGoalSchema } from "@/lib/validations/goals";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const goals = await prisma.studyGoalProgress.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ goals });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/goals error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.errors[0]?.message ?? "Invalid goal");
    }

    const goal = await prisma.studyGoalProgress.create({
      data: {
        userId: user.id,
        title: parsed.data.title,
        targetNumber: parsed.data.targetNumber,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
      },
    });

    return NextResponse.json({ goal });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/goals error:", error);
    return serverErrorResponse();
  }
}
