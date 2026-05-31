import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getOnboardingStatus } from "@/lib/user";

export default async function RootPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  let onboarding;
  try {
    onboarding = await getOnboardingStatus(userId);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("RootPage onboarding check failed:", error);
    redirect("/login");
  }

  if (!onboarding.exists || !onboarding.complete) {
    redirect("/onboarding");
  }

  redirect("/home");
}
