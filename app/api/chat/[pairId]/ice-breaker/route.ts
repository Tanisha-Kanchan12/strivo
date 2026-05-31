import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { generateIceBreakerText } from "@/lib/ai/match-reason";
import { getMessageCountForPair, verifyPairMembership } from "@/lib/chat";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pairId: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { pairId } = await params;

    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) {
      return unauthorizedResponse();
    }

    const count = await getMessageCountForPair(pairId);

    if (count > 0) {
      return NextResponse.json({ iceBreaker: null, messageCount: count });
    }

    const sharedField =
      membership.currentUser.onboarding?.field ??
      membership.partner.onboarding?.field ??
      null;

    const iceBreaker = await generateIceBreakerText(
      user.name ?? "You",
      membership.partner.name ?? "there",
      membership.currentUser.onboarding?.goal ?? null,
      membership.partner.onboarding?.goal ?? null,
      sharedField
    );

    return NextResponse.json({ iceBreaker, messageCount: 0 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/chat/[pairId]/ice-breaker error:", error);
    return serverErrorResponse();
  }
}
