import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { dismissProvisionalPair } from "@/lib/live-now";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ pairId: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { pairId } = await params;

    await dismissProvisionalPair(pairId, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST dismiss pair error:", error);
    return serverErrorResponse();
  }
}
