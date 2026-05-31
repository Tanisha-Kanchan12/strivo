import { NextResponse } from "next/server";
import { z } from "zod";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import {
  appendConversationMessages,
  getConversationMessages,
} from "@/lib/ai/conversation";
import {
  buildStudyBuddySystemPrompt,
  buildUserContextFromProfile,
  fallbackStudyBuddyResponse,
  isClaudeAvailable,
  streamClaudeChat,
} from "@/lib/claude";
import type { AiChatMessage } from "@/types/ai";

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse("Invalid message");
    }

    const userMessage: AiChatMessage = {
      role: "user",
      content: parsed.data.message.trim(),
      createdAt: new Date().toISOString(),
    };

    await appendConversationMessages(user.id, [userMessage]);

    const history = await getConversationMessages(user.id);
    const ctx = buildUserContextFromProfile(user);
    const system = buildStudyBuddySystemPrompt(ctx);

    const claudeMessages = history
      .filter((m) => !m.label)
      .slice(-20)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    if (!isClaudeAvailable()) {
      const fallback = fallbackStudyBuddyResponse(
        parsed.data.message,
        claudeMessages
      );
      const assistantMessage: AiChatMessage = {
        role: "assistant",
        content: fallback,
        createdAt: new Date().toISOString(),
      };
      await appendConversationMessages(user.id, [assistantMessage]);
      return NextResponse.json({ message: assistantMessage, streamed: false });
    }

    const stream = await streamClaudeChat({ system, messages: claudeMessages });
    if (!stream) {
      const fallback = fallbackStudyBuddyResponse(
        parsed.data.message,
        claudeMessages
      );
      const assistantMessage: AiChatMessage = {
        role: "assistant",
        content: fallback,
        createdAt: new Date().toISOString(),
      };
      await appendConversationMessages(user.id, [assistantMessage]);
      return NextResponse.json({ message: assistantMessage, streamed: false });
    }

    const encoder = new TextEncoder();
    let fullText = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          stream.on("text", (text) => {
            fullText += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          });

          await stream.finalMessage();

          const assistantMessage: AiChatMessage = {
            role: "assistant",
            content:
              fullText.trim() ||
              fallbackStudyBuddyResponse(parsed.data.message, claudeMessages),
            createdAt: new Date().toISOString(),
          };
          await appendConversationMessages(user.id, [assistantMessage]);

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          console.error("AI stream error:", error);
          const fallback = fallbackStudyBuddyResponse(
            parsed.data.message,
            claudeMessages
          );
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: fallback, done: true })}\n\n`
            )
          );
          await appendConversationMessages(user.id, [
            {
              role: "assistant",
              content: fallback,
              createdAt: new Date().toISOString(),
            },
          ]);
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/ai/chat error:", error);
    return serverErrorResponse();
  }
}
