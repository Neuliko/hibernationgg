import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@clerk/clerk-react";
import { isClerkConfigured } from "@/lib/auth-provider";
import { ClerkSetupBanner } from "@/components/RequireAuth";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  if (!isClerkConfigured) return <ClerkSetupBanner />;
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <SignUp signInUrl="/sign-in" routing="hash" />
    </div>
  );
}
