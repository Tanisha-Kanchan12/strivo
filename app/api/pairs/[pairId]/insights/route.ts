import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { verifyPairMembership } from "@/lib/chat";
import { getLatestPairInsight } from "@/lib/ai/pair-insights";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pairId: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { pairId } = await params;

    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) return unauthorizedResponse();

    const insight = await getLatestPairInsight(pairId, user.id);
    return NextResponse.json({ insight });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/pairs/[pairId]/insights error:", error);
    return serverErrorResponse();
  }
}
