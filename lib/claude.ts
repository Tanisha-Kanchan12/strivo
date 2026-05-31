import Anthropic from "@anthropic-ai/sdk";
import { localStudyBuddyResponse } from "@/lib/ai/local-buddy";
import type { UserAiContext } from "@/types/ai";
import { formatStudyGoal, formatStudyTimes } from "@/lib/constants/onboarding";
import { asStudyTimes } from "@/lib/prisma-json";
import type { Prisma, StudyGoal, UserStatus } from "@prisma/client";

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export function isClaudeAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function buildStudyBuddySystemPrompt(ctx: UserAiContext): string {
  const goal = ctx.goal ? formatStudyGoal(ctx.goal as StudyGoal) : "their exams";
  const name = ctx.name?.split(" ")[0] ?? "student";

  return `You are Strivo AI Study Buddy, a friendly, sharp study coach for ${name}, a serious Indian student preparing for ${goal}.

Rules:
- Keep replies to 4-5 sentences max unless they ask for a detailed plan
- Use light Hinglish where it feels natural (e.g. "bhai", "yaar", "let's go")
- Be practical, not preachy. Give actionable advice
- Help with: subject doubts, PM case frameworks, consulting guesstimates, mock interview Q&A, concept explanations, study planning
- You are talking to a student, not a professional
- Never share harmful content or help with cheating`;
}

export function buildUserContextFromProfile(user: {
  name: string | null;
  onboarding: {
    goal: StudyGoal | null;
    status: UserStatus | null;
    field: string | null;
    studyTimes: Prisma.JsonValue;
  } | null;
}): UserAiContext {
  return {
    name: user.name,
    goal: user.onboarding?.goal ?? null,
    status: user.onboarding?.status ?? null,
    field: user.onboarding?.field ?? null,
    studyTimes: asStudyTimes(user.onboarding?.studyTimes).map((t) =>
      formatStudyTimes([t])
    ),
  };
}

export async function generateClaudeText(
  system: string,
  userPrompt: string,
  maxTokens = 600
): Promise<string | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = response.content[0];
    if (block.type === "text") return block.text.trim();
    return null;
  } catch (error) {
    console.error("Claude API error:", error);
    return null;
  }
}

export async function streamClaudeChat(params: {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
}) {
  const anthropic = getClient();
  if (!anthropic) return null;

  try {
    return anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: params.maxTokens ?? 800,
      system: params.system,
      messages: params.messages,
    });
  } catch (error) {
    console.error("Claude stream error:", error);
    return null;
  }
}

export function fallbackStudyBuddyResponse(
  message: string,
  history?: Array<{ role: string; content: string }>
): string {
  return localStudyBuddyResponse(message, history);
}
