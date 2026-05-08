import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";
import { isClerkConfigured } from "@/lib/auth-provider";
import { ClerkSetupBanner } from "@/components/RequireAuth";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  if (!isClerkConfigured) return <ClerkSetupBanner />;
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <SignIn signUpUrl="/sign-up" routing="hash" />
    </div>
  );
}
