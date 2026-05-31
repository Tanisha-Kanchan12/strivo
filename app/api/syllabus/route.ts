import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import {
  buildSubjectsWithShells,
  computeSyllabusProgress,
  purgePlaceholderTopics,
  seedSyllabusForUser,
} from "@/lib/syllabus";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const goal = user.onboarding?.goal;

    if (!goal) {
      return NextResponse.json({ subjects: [], overallPercent: 0, topics: [] });
    }

    await purgePlaceholderTopics(user.id);

    let topics = await prisma.syllabusTopic.findMany({
      where: { userId: user.id },
      orderBy: [{ subject: "asc" }, { topicName: "asc" }],
    });

    if (topics.length === 0) {
      await seedSyllabusForUser(user.id, goal);
      topics = await prisma.syllabusTopic.findMany({
        where: { userId: user.id },
        orderBy: [{ subject: "asc" }, { topicName: "asc" }],
      });
    }

    const progress = computeSyllabusProgress(topics);
    const subjects = buildSubjectsWithShells(goal, topics);

    return NextResponse.json({
      goal,
      ...progress,
      subjects,
      topics: topics.map((t) => ({
        id: t.id,
        subject: t.subject,
        topicName: t.topicName,
        isComplete: t.isComplete,
        completedAt: t.completedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/syllabus error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const goal = user.onboarding?.goal;
    if (!goal) return badRequestResponse("Complete onboarding first");

    const body = await request.json();
    const subject = String(body.subject ?? "").trim();
    const topicName = String(body.topicName ?? "").trim();

    if (!subject) return badRequestResponse("Subject is required");
    if (topicName.length < 2) {
      return badRequestResponse("Topic name must be at least 2 characters");
    }

    const topic = await prisma.syllabusTopic.create({
      data: { userId: user.id, goal, subject, topicName },
    });

    return NextResponse.json({
      topic: {
        id: topic.id,
        subject: topic.subject,
        topicName: topic.topicName,
        isComplete: topic.isComplete,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/syllabus error:", error);
    return serverErrorResponse();
  }
}
