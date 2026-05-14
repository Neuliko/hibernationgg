import { createFileRoute, useSearch } from "@tanstack/react-router";
import { SignIn, useSignIn } from "@clerk/clerk-react";
import { isClerkConfigured } from "@/lib/auth-provider";
import { ClerkSetupBanner } from "@/components/RequireAuth";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function GoogleButton() {
  const { signIn, isLoaded } = useSignIn();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const returnTo = typeof search?.redirect_url === "string" ? search.redirect_url : "/dashboard";

  if (!isLoaded) return null;
  return (
    <button
      onClick={() =>
        signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: returnTo,
        })
      }
      className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-secondary transition"
    >
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.7 35.7 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
      Continue with Google
    </button>
  );
}

function SignInPage() {
  if (!isClerkConfigured) return <ClerkSetupBanner />;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
      <div className="w-full max-w-sm">
        <GoogleButton />
      </div>
      <SignIn signUpUrl="/sign-up" routing="hash" />
    </div>
  );
}
