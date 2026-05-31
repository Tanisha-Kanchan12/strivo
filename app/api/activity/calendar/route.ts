import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { getUserActivityCalendar } from "@/lib/activity";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const days = await getUserActivityCalendar(user.id, 12);
    return NextResponse.json({ days });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/activity/calendar error:", error);
    return serverErrorResponse();
  }
}
