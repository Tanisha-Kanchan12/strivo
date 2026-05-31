import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { checkAndUpdatePairStreakFromChat, onQualifyingActivity } from "@/lib/streak";
import { verifyPairMembership } from "@/lib/chat";
import { createNotification } from "@/lib/notifications";
import prisma from "@/lib/prisma";
import { triggerChatEvent } from "@/lib/pusher-server";
import { markReadSchema, sendMessageSchema } from "@/lib/validations/chat";

export async function GET(request: Request) {
  try {
    const { user } = await requireDbUser();
    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get("pairId");
    const cursor = searchParams.get("cursor");

    if (!pairId) {
      return badRequestResponse("pairId is required");
    }

    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) {
      return unauthorizedResponse();
    }

    const messages = await prisma.message.findMany({
      where: { pairId },
      orderBy: { createdAt: "desc" },
      take: 50,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        createdAt: true,
        isRead: true,
      },
    });

    const totalCount = await prisma.message.count({ where: { pairId } });

    return NextResponse.json({
      messages: messages.reverse(),
      hasMore: messages.length === 50,
      totalCount,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/messages error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.errors[0]?.message ?? "Invalid message"
      );
    }

    const { pairId, content } = parsed.data;
    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) {
      return unauthorizedResponse();
    }

    const message = await prisma.message.create({
      data: {
        pairId,
        senderId: user.id,
        receiverId: membership.partner.id,
        content: content.trim(),
      },
    });

    await onQualifyingActivity(pairId, user.id, "CHAT_MESSAGES");
    await checkAndUpdatePairStreakFromChat(pairId);

    await triggerChatEvent(pairId, "new-message", {
      id: message.id,
      pairId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      isRead: false,
    });

    await createNotification({
      userId: membership.partner.id,
      type: "NEW_MESSAGE",
      content: `${user.name ?? "Your partner"} sent you a message`,
      data: { pairId, messageId: message.id, senderId: user.id },
    });

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/messages error:", error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = markReadSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse("Invalid request");
    }

    const { pairId } = parsed.data;
    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) {
      return unauthorizedResponse();
    }

    await prisma.message.updateMany({
      where: {
        pairId,
        receiverId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/messages error:", error);
    return serverErrorResponse();
  }
}
