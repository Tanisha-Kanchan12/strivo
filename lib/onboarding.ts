import type { Onboarding, User } from "@prisma/client";
import { asStudyTimes } from "@/lib/prisma-json";

export function getOnboardingStep(
  user: Pick<User, "name"> & { onboarding: Onboarding | null }
): 1 | 2 | 3 {
  if (!user.name?.trim() || !user.onboarding?.status) {
    return 1;
  }
  if (!user.onboarding.goal) {
    return 2;
  }
  return 3;
}

export function isOnboardingStep3Complete(onboarding: Onboarding | null): boolean {
  if (!onboarding) return false;
  return (
    asStudyTimes(onboarding.studyTimes).length > 0 &&
    onboarding.partnerType !== null
  );
}
