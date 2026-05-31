import { NextResponse } from "next/server";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { generatePlanTasks } from "@/lib/planner";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await requireDbUser();

    const plan = await prisma.studyPlan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        tasks: { orderBy: [{ date: "asc" }, { createdAt: "asc" }] },
      },
    });

    if (!plan) {
      return NextResponse.json({ plan: null });
    }

    const daysRemaining = Math.max(
      0,
      differenceInCalendarDays(startOfDay(plan.examDate), startOfDay(new Date()))
    );

    return NextResponse.json({
      plan: {
        id: plan.id,
        examName: plan.examName,
        examDate: plan.examDate.toISOString(),
        dailyHoursTarget: plan.dailyHoursTarget,
        subjects: plan.subjects,
        daysRemaining,
        tasks: plan.tasks.map((t) => ({
          id: t.id,
          date: t.date.toISOString(),
          taskText: t.taskText,
          subject: t.subject,
          isComplete: t.isComplete,
          skippedAt: t.skippedAt?.toISOString() ?? null,
        })),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/planner error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();

    const examName = String(body.examName ?? "").trim();
    const examDate = new Date(body.examDate);
    const dailyHoursTarget = Number(body.dailyHoursTarget ?? 2);
    const subjects = Array.isArray(body.subjects)
      ? body.subjects.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];

    if (!examName) return badRequestResponse("Exam name is required");
    if (Number.isNaN(examDate.getTime())) {
      return badRequestResponse("Invalid exam date");
    }
    if (examDate <= new Date()) {
      return badRequestResponse("Exam date must be in the future");
    }

    await prisma.planTask.deleteMany({
      where: { plan: { userId: user.id } },
    });
    await prisma.studyPlan.deleteMany({ where: { userId: user.id } });

    const plan = await prisma.studyPlan.create({
      data: {
        userId: user.id,
        examName,
        examDate,
        dailyHoursTarget,
        subjects,
      },
    });

    await generatePlanTasks({
      planId: plan.id,
      userId: user.id,
      examDate,
      subjects,
      dailyHoursTarget,
    });

    return NextResponse.json({ plan: { id: plan.id } });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/planner error:", error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();

    const plan = await prisma.studyPlan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (!plan) {
      return NextResponse.json({ error: "No plan found" }, { status: 404 });
    }

    const examDate = body.examDate ? new Date(body.examDate) : plan.examDate;
    const dailyHoursTarget =
      body.dailyHoursTarget != null
        ? Number(body.dailyHoursTarget)
        : plan.dailyHoursTarget;
    const examName = body.examName
      ? String(body.examName).trim()
      : plan.examName;
    const subjects = Array.isArray(body.subjects)
      ? body.subjects.map((s: unknown) => String(s).trim()).filter(Boolean)
      : (plan.subjects as string[]);

    if (Number.isNaN(examDate.getTime())) {
      return badRequestResponse("Invalid exam date");
    }
    if (examDate <= new Date()) {
      return badRequestResponse("Exam date must be in the future");
    }

    await prisma.planTask.deleteMany({ where: { planId: plan.id } });

    await prisma.studyPlan.update({
      where: { id: plan.id },
      data: { examName, examDate, dailyHoursTarget, subjects },
    });

    await generatePlanTasks({
      planId: plan.id,
      userId: user.id,
      examDate,
      subjects,
      dailyHoursTarget,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/planner error:", error);
    return serverErrorResponse();
  }
}
