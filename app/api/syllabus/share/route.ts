import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { createNotifications } from "@/lib/notifications";
import { computeSyllabusProgress } from "@/lib/syllabus";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const { user } = await requireDbUser();

    const topics = await prisma.syllabusTopic.findMany({
      where: { userId: user.id },
    });
    const { overallPercent } = computeSyllabusProgress(topics);

    const pairs = await prisma.connectedPair.findMany({
      where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] },
    });

    const partnerIds = pairs.map((p) =>
      p.user1Id === user.id ? p.user2Id : p.user1Id
    );

    if (partnerIds.length > 0) {
      await createNotifications(
        partnerIds.map((partnerId) => ({
          userId: partnerId,
          type: "SYLLABUS_SHARED",
          content: `${user.name ?? "Your pair"} shared syllabus progress: ${overallPercent}% complete`,
          data: { userId: user.id, overallPercent },
        }))
      );
    }

    return NextResponse.json({ shared: true, overallPercent });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/syllabus/share error:", error);
    return serverErrorResponse();
  }
}
