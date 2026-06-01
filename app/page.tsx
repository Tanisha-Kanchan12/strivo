import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { auth } from "@/auth";
import { getOnboardingStatus } from "@/lib/user";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  let onboarding;
  try {
    onboarding = await getOnboardingStatus(session.user.id);
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
