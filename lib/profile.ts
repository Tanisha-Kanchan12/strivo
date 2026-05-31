import type { Profile, Subject } from "@prisma/client";

interface ProfileCompletionInput {
  profile: Pick<Profile, "city" | "college" | "bio"> | null;
  subjectsCount: number;
}

export function calculateProfileCompletion({
  profile,
  subjectsCount,
}: ProfileCompletionInput): number {
  let percentage = 30;

  if (profile?.city?.trim()) percentage += 17.5;
  if (profile?.college?.trim()) percentage += 17.5;
  if (subjectsCount > 0) percentage += 17.5;
  if (profile?.bio?.trim()) percentage += 17.5;

  return Math.min(100, Math.round(percentage));
}

export function isProfileComplete(input: ProfileCompletionInput): boolean {
  return calculateProfileCompletion(input) >= 100;
}
