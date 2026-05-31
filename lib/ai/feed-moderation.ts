import { generateClaudeText } from "@/lib/claude";

const MODERATION_SYSTEM = `You are a content moderator for Strivo, an Indian student study platform.
Reply with ONLY "YES" if the post is about education, studying, exams, academics, career prep, or learning.
Reply with ONLY "NO" if it is off-topic (entertainment, politics, personal drama, spam, etc.).`;

export async function isStudyRelatedContent(content: string): Promise<boolean> {
  const trimmed = content.trim();
  if (trimmed.length < 3) return false;

  const result = await generateClaudeText(
    MODERATION_SYSTEM,
    `Post content:\n"""${trimmed.slice(0, 1000)}"""\n\nIs this study-related? Reply YES or NO only.`,
    10
  );

  if (!result) {
    const studyKeywords =
      /\b(study|exam|jee|neet|cat|upsc|mock|test|syllabus|chapter|topic|revision|notes|practice|quant|physics|chemistry|maths|biology|preparation|placement|gate|ssc|doubt|concept|formula|question|answer|learn|tutorial|lecture|assignment|homework|streak|focus|pomodoro)\b/i;
    return studyKeywords.test(trimmed);
  }

  return result.trim().toUpperCase().startsWith("YES");
}
