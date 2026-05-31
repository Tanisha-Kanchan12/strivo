import { NextResponse } from "next/server";
import {
  badRequestResponse,
  notFoundResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { createConnectedPair } from "@/lib/matching";
import { createNotification } from "@/lib/notifications";
import prisma from "@/lib/prisma";

async function handleAccept(id: string, userId: string) {
  const pairRequest = await prisma.pairRequest.findUnique({
    where: { id },
    include: { sender: { select: { id: true, name: true } } },
  });

  if (!pairRequest) return notFoundResponse("Request not found");
  if (pairRequest.receiverId !== userId) return unauthorizedResponse();
  if (pairRequest.status !== "PENDING") {
    return badRequestResponse("Request is no longer pending");
  }
  if (pairRequest.expiresAt < new Date()) {
    await prisma.pairRequest.update({
      where: { id },
      data: { status: "EXPIRED" },
    });
    return badRequestResponse("Request has expired");
  }

  const connectedPair = await createConnectedPair(
    pairRequest.senderId,
    pairRequest.receiverId
  );

  await prisma.$transaction([
    prisma.pairRequest.update({
      where: { id },
      data: { status: "ACCEPTED" },
    }),
    prisma.match.updateMany({
      where: {
        OR: [
          {
            userId: pairRequest.senderId,
            matchedUserId: pairRequest.receiverId,
          },
          {
            userId: pairRequest.receiverId,
            matchedUserId: pairRequest.senderId,
          },
        ],
      },
      data: { status: "CONNECTED" },
    }),
  ]);

  const accepter = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  await createNotification({
    userId: pairRequest.senderId,
    type: "CONNECT_ACCEPTED",
    content: `${accepter?.name ?? "Your partner"} accepted your connect request!`,
    data: {
      pairId: connectedPair.id,
      partnerId: userId,
    },
  });

  return NextResponse.json({
    success: true,
    status: "accepted",
    pairId: connectedPair.id,
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;
    return handleAccept(id, user.id);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/pair-requests/[id]/accept error:", error);
    return serverErrorResponse();
  }
}
