import { NextResponse } from "next/server";
import { z } from "zod";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import prisma from "@/lib/prisma";

const connectSchema = z.object({
  matchedUserId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = connectSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse("Invalid request");
    }

    const { matchedUserId } = parsed.data;

    if (matchedUserId === user.id) {
      return badRequestResponse("Cannot connect with yourself");
    }

    const existingPair = await prisma.connectedPair.findFirst({
      where: {
        OR: [
          { user1Id: user.id, user2Id: matchedUserId },
          { user1Id: matchedUserId, user2Id: user.id },
        ],
      },
    });

    if (existingPair) {
      return badRequestResponse("Already connected");
    }

    const existingRequest = await prisma.pairRequest.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: matchedUserId, status: "PENDING" },
          { senderId: matchedUserId, receiverId: user.id, status: "PENDING" },
        ],
      },
    });

    if (existingRequest) {
      return NextResponse.json({
        success: true,
        pairRequestId: existingRequest.id,
        status: "sent",
      });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const pairRequest = await prisma.pairRequest.create({
      data: {
        senderId: user.id,
        receiverId: matchedUserId,
        status: "PENDING",
        expiresAt,
      },
    });

    await prisma.match.upsert({
      where: {
        userId_matchedUserId: { userId: user.id, matchedUserId },
      },
      create: {
        userId: user.id,
        matchedUserId,
        matchScore: 0,
        status: "PENDING",
      },
      update: { status: "PENDING" },
    });

    const senderName = user.name ?? "Someone";
    await createNotification({
      userId: matchedUserId,
      type: "NEW_MATCH",
      content: `${senderName} wants to connect as your study partner`,
      data: {
        pairRequestId: pairRequest.id,
        senderId: user.id,
        senderName,
      },
    });

    return NextResponse.json({
      success: true,
      pairRequestId: pairRequest.id,
      status: "sent",
      expiresAt,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/matches/connect error:", error);
    return serverErrorResponse();
  }
}
