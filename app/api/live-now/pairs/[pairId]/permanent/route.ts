import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { makePairPermanent } from "@/lib/live-now";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ pairId: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { pairId } = await params;

    await makePairPermanent(pairId, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === "Pair not found") {
      return unauthorizedResponse();
    }
    console.error("POST permanent pair error:", error);
    return serverErrorResponse();
  }
}
