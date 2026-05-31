import prisma from "@/lib/prisma";
import type { AiChatMessage } from "@/types/ai";

export async function getOrCreateConversation(userId: string) {
  let conversation = await prisma.aiConversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.aiConversation.create({
      data: { userId, messages: [] },
    });
  }

  return conversation;
}

export function parseMessages(json: unknown): AiChatMessage[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (m): m is AiChatMessage =>
      typeof m === "object" &&
      m !== null &&
      "role" in m &&
      "content" in m &&
      (m.role === "user" || m.role === "assistant")
  );
}

export async function getConversationMessages(userId: string): Promise<AiChatMessage[]> {
  const conversation = await getOrCreateConversation(userId);
  return parseMessages(conversation.messages);
}

export async function saveConversationMessages(
  userId: string,
  messages: AiChatMessage[]
) {
  const conversation = await getOrCreateConversation(userId);
  return prisma.aiConversation.update({
    where: { id: conversation.id },
    data: { messages: messages as object[] },
  });
}

export async function appendConversationMessages(
  userId: string,
  newMessages: AiChatMessage[]
) {
  const existing = await getConversationMessages(userId);
  return saveConversationMessages(userId, [...existing, ...newMessages]);
}

export async function prependStudyPlan(
  userId: string,
  planContent: string
) {
  const existing = await getConversationMessages(userId);
  const hasPlan = existing.some((m) => m.label === "Your Study Plan");
  if (hasPlan) return;

  const planMessage: AiChatMessage = {
    role: "assistant",
    content: planContent,
    createdAt: new Date().toISOString(),
    label: "Your Study Plan",
  };

  return saveConversationMessages(userId, [planMessage, ...existing]);
}
