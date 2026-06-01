import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { requireDbUser } from "@/lib/auth";
import { isOnboardingComplete } from "@/lib/user";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let user;
  try {
    ({ user } = await requireDbUser());
  } catch {
    redirect("/login");
  }

  if (!isOnboardingComplete(user.onboarding)) {
    redirect("/onboarding");
  }

  return <ProtectedShell>{children}</ProtectedShell>;
}
