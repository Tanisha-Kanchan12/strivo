import {
  buildStudyBuddySystemPrompt,
  buildUserContextFromProfile,
  generateClaudeText,
} from "@/lib/claude";
import { formatStudyGoal, formatStudyTimes } from "@/lib/constants/onboarding";
import { prependStudyPlan } from "@/lib/ai/conversation";
import type { StudyGoal, StudyTime, UserStatus } from "@prisma/client";

interface GoalCoachInput {
  userId: string;
  name: string | null;
  goal: StudyGoal | null;
  status: UserStatus | null;
  field: string | null;
  studyTimes: StudyTime[];
}

export async function generateAndSaveGoalCoachPlan(input: GoalCoachInput) {
  const ctx = buildUserContextFromProfile({
    name: input.name,
    onboarding: {
      goal: input.goal,
      status: input.status,
      field: input.field,
      studyTimes: input.studyTimes,
    },
  });

  const goalLabel = input.goal ? formatStudyGoal(input.goal) : "your exams";
  const timesLabel =
    input.studyTimes.length > 0
      ? formatStudyTimes(input.studyTimes)
      : "flexible hours";

  const system = buildStudyBuddySystemPrompt(ctx);
  const prompt = `Create a simple 4-week study plan for a student preparing for ${goalLabel}.
Status: ${input.status ?? "student"}. Field: ${input.field ?? "general"}. Preferred study times: ${timesLabel}.
Format as Week 1, Week 2, Week 3, Week 4 with 3-4 bullet points each. Keep it practical and achievable. Max 300 words.`;

  const aiPlan = await generateClaudeText(system, prompt, 800);

  const plan =
    aiPlan ??
    `**Your 4-Week Study Plan for ${goalLabel}**

**Week 1: Foundation**
• Map syllabus, identify weak topics
• 2 hr/day: 1 hr theory + 1 hr basic problems
• Join a study partner on Strivo for accountability

**Week 2: Build**
• Focus on 2 weak areas daily
• Start timed practice (${timesLabel} slots work best for you)
• Review every mistake in a error notebook

**Week 3: Intensify**
• Full-length mocks twice this week
• Analyze patterns in wrong answers
• Pair study sessions for tough topics

**Week 4: Peak**
• Daily revision + 1 mock
• Light new topics only
• Sleep well before exam week. Rest is part of prep

You've got this! Ask me anytime to revise this plan.`;

  await prependStudyPlan(input.userId, plan);
  return plan;
}
