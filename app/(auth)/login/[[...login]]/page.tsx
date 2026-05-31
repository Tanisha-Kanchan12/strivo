import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";
import { strivoClerkAppearance } from "@/lib/clerk-appearance";

export default function LoginPage() {
  return (
    <AuthShell>
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup"
        appearance={strivoClerkAppearance}
      />
    </AuthShell>
  );
}
