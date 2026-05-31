import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const count = await getUnreadCount(user.id);
    return NextResponse.json({ count });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/notifications/unread-count error:", error);
    return serverErrorResponse();
  }
}
