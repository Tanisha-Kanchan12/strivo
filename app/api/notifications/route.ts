import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await requireDbUser();

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/notifications error:", error);
    return serverErrorResponse();
  }
}

export async function PATCH() {
  try {
    const { user } = await requireDbUser();

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, unreadCount: 0 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/notifications error:", error);
    return serverErrorResponse();
  }
}
