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

    const topic = await prisma.syllabusTopic.findFirst({
      where: { id, userId: user.id },
    });
    if (!topic) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isComplete = !topic.isComplete;
    const updated = await prisma.syllabusTopic.update({
      where: { id },
      data: {
        isComplete,
        completedAt: isComplete ? new Date() : null,
      },
    });

    return NextResponse.json({
      topic: {
        id: updated.id,
        isComplete: updated.isComplete,
        completedAt: updated.completedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/syllabus/[id]/complete error:", error);
    return serverErrorResponse();
  }
}
