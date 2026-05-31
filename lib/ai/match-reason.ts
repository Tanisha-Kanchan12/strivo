import { generateClaudeText } from "@/lib/claude";
import { formatStudyGoal, formatStudyTimes, formatPartnerType } from "@/lib/constants/onboarding";
import type { StudyGoal, StudyTime, PartnerType } from "@prisma/client";

interface MatchProfile {
  name: string | null;
  goal: StudyGoal | null;
  field: string | null;
  studyTimes: StudyTime[];
  partnerType: PartnerType | null;
  city: string | null;
  college: string | null;
}

export async function generateMatchReasonText(
  currentUser: MatchProfile,
  candidate: MatchProfile,
  matchScore: number
): Promise<string> {
  const prompt = `Write ONE sentence (max 25 words) explaining why these two Indian students are a good study partner match. Be specific.

Student A: ${currentUser.name ?? "User"}, goal: ${formatStudyGoal(currentUser.goal)}, times: ${formatStudyTimes(currentUser.studyTimes)}, style: ${formatPartnerType(currentUser.partnerType)}, city: ${currentUser.city ?? "unknown"}

Student B: ${candidate.name ?? "Student"}, goal: ${formatStudyGoal(candidate.goal)}, times: ${formatStudyTimes(candidate.studyTimes)}, style: ${formatPartnerType(candidate.partnerType)}, city: ${candidate.city ?? "unknown"}

Match score: ${matchScore}%. No quotes. One sentence only.`;

  const system =
    "You write concise, warm one-line match explanations for a study partner app. No fluff.";

  const aiReason = await generateClaudeText(system, prompt, 100);
  if (aiReason) return aiReason.replace(/^["']|["']$/g, "").trim();

  const goalText =
    currentUser.goal === candidate.goal
      ? `Both prepping for ${formatStudyGoal(currentUser.goal)}`
      : `Shared study discipline for ${formatStudyGoal(currentUser.goal)} & ${formatStudyGoal(candidate.goal)}`;

  return `${candidate.name ?? "This student"} is a ${matchScore}% match. ${goalText} with overlapping study slots.`;
}

export async function generateIceBreakerText(
  userName: string,
  partnerName: string,
  userGoal: StudyGoal | null,
  partnerGoal: StudyGoal | null,
  sharedField?: string | null
): Promise<string> {
  const prompt = `Write ONE friendly first message (max 20 words) for a study partner chat app. 
From: ${userName}. To: ${partnerName}. 
Goals: ${formatStudyGoal(userGoal)} & ${formatStudyGoal(partnerGoal)}.${sharedField ? ` Field: ${sharedField}.` : ""}
Casual, Indian student vibe, light Hinglish OK. One sentence only.`;

  const system = "You write natural ice-breaker messages for Indian students meeting study partners.";

  const aiText = await generateClaudeText(system, prompt, 80);
  if (aiText) return aiText.replace(/^["']|["']$/g, "").trim();

  const first = partnerName.split(" ")[0] ?? "there";
  return `Hey ${first}! Also prepping for ${formatStudyGoal(userGoal)}. What did you study today?`;
}
