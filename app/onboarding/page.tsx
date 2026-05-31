import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { requireDbUser } from "@/lib/auth";
import { getOnboardingStep } from "@/lib/onboarding";
import { asStudyTimes } from "@/lib/prisma-json";

export default async function OnboardingPage() {
  const { user } = await requireDbUser();
  const step = getOnboardingStep(user);

  return (
    <OnboardingWizard
      initialStep={step}
      initialData={{
        name: user.name ?? "",
        status: user.onboarding?.status ?? null,
        goal: user.onboarding?.goal ?? null,
        field: user.onboarding?.field ?? "",
        studyTimes: asStudyTimes(user.onboarding?.studyTimes),
        partnerType: user.onboarding?.partnerType ?? null,
      }}
    />
  );
}
