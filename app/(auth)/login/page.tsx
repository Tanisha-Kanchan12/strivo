import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { isGoogleAuthConfigured } from "@/lib/google-auth";

export default function LoginPage() {
  const googleEnabled = isGoogleAuthConfigured();

  return (
    <AuthShell>
      <Suspense fallback={null}>
        <LoginForm googleEnabled={googleEnabled} />
      </Suspense>
    </AuthShell>
  );
}
