import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { verifyPairMembership } from "@/lib/chat";
import { triggerChatEvent } from "@/lib/pusher-server";
import { typingSchema } from "@/lib/validations/chat";

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = typingSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse("Invalid request");
    }

    const { pairId, isTyping } = parsed.data;
    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) {
      return unauthorizedResponse();
    }

    await triggerChatEvent(
      pairId,
      isTyping ? "typing-start" : "typing-stop",
      {
        userId: user.id,
        userName: user.name ?? "Partner",
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/messages/typing error:", error);
    return serverErrorResponse();
  }
}
