import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { isGoogleAuthConfigured } from "@/lib/google-auth";

export default function SignupPage() {
  const googleEnabled = isGoogleAuthConfigured();

  return (
    <AuthShell>
      <SignupForm googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
