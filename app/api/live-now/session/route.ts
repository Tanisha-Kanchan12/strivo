import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import {
  getActiveLiveSession,
  startLiveNowSession,
  stopLiveNowSession,
} from "@/lib/live-now";
import { startLiveNowSchema } from "@/lib/validations/live-now";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const session = await getActiveLiveSession(user.id);
    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/live-now/session error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = startLiveNowSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse("Select a topic to go live");
    }

    const session = await startLiveNowSession(user.id, parsed.data.topic);
    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/live-now/session error:", error);
    return serverErrorResponse();
  }
}

export async function DELETE() {
  try {
    const { user } = await requireDbUser();
    await stopLiveNowSession(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("DELETE /api/live-now/session error:", error);
    return serverErrorResponse();
  }
}
