import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { getConversationMessages } from "@/lib/ai/conversation";
import { isClaudeAvailable } from "@/lib/claude";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const messages = await getConversationMessages(user.id);

    return NextResponse.json({
      messages,
      claudeAvailable: isClaudeAvailable(),
      userName: user.name,
      goal: user.onboarding?.goal ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/ai/chat error:", error);
    return serverErrorResponse();
  }
}
