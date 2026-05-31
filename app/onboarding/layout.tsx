import { redirect } from "next/navigation";
import Image from "next/image";
import { requireDbUser } from "@/lib/auth";
import { isOnboardingComplete } from "@/lib/user";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireDbUser();

  if (isOnboardingComplete(user.onboarding)) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex max-w-lg flex-col px-4 py-10">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Image
            src="/strivo-logo.png"
            alt="Strivo"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="text-lg font-bold text-strivo-text">Strivo</span>
        </div>
        {children}
      </div>
    </div>
  );
}
