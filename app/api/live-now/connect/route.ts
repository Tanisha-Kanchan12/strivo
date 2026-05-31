import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { startLiveNowChat } from "@/lib/live-now";
import { liveNowConnectSchema } from "@/lib/validations/live-now";

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = liveNowConnectSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse("Invalid request");
    }

    const result = await startLiveNowChat(user.id, parsed.data.targetUserId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    if (error instanceof Error) {
      return badRequestResponse(error.message);
    }
    console.error("POST /api/live-now/connect error:", error);
    return serverErrorResponse();
  }
}
