export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  label?: string;
}

export interface UserAiContext {
  name: string | null;
  goal: string | null;
  status: string | null;
  field: string | null;
  studyTimes: string[];
}
