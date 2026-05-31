import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await requireDbUser();

    const pendingReceived = await prisma.pairRequest.count({
      where: { receiverId: user.id, status: "PENDING", expiresAt: { gt: new Date() } },
    });

    return NextResponse.json({ pendingReceived });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/pair-requests/count error:", error);
    return serverErrorResponse();
  }
}
