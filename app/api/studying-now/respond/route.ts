import { NextResponse } from "next/server";
import { z } from "zod";
import {
  badRequestResponse,
  notFoundResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { onQualifyingActivity } from "@/lib/streak";
import prisma from "@/lib/prisma";

const respondSchema = z.object({
  notificationId: z.string().optional(),
  pairId: z.string().min(1),
  response: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = respondSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse("Invalid request");
    }

    const { pairId, response, notificationId } = parsed.data;

    const pair = await prisma.connectedPair.findUnique({
      where: { id: pairId },
      select: { user1Id: true, user2Id: true },
    });

    if (!pair || (pair.user1Id !== user.id && pair.user2Id !== user.id)) {
      return notFoundResponse("Pair not found");
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await prisma.studyingNowResponse.upsert({
      where: {
        pairId_userId_date: {
          pairId,
          userId: user.id,
          date: today,
        },
      },
      create: {
        pairId,
        userId: user.id,
        date: today,
        response,
      },
      update: { response },
    });

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: user.id },
        data: { isRead: true },
      });
    }

    const partnerId = pair.user1Id === user.id ? pair.user2Id : pair.user1Id;
    const partnerResponse = await prisma.studyingNowResponse.findUnique({
      where: {
        pairId_userId_date: {
          pairId,
          userId: partnerId,
          date: today,
        },
      },
    });

    if (response && partnerResponse?.response) {
      await onQualifyingActivity(pairId, user.id, "STUDYING_NOW");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/studying-now/respond error:", error);
    return serverErrorResponse();
  }
}
