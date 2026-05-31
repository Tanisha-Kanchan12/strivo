import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";
import { strivoClerkAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUp
        routing="path"
        path="/signup"
        signInUrl="/login"
        appearance={strivoClerkAppearance}
      />
    </AuthShell>
  );
}
