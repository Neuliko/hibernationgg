import { isClerkConfigured } from "@/lib/auth-provider";
import { Link, useLocation } from "@tanstack/react-router";
import { ReactNode } from "react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

export function ClerkSetupBanner() {
  return (
    <div className="container mx-auto px-6 py-20">
      <div className="surface rounded-2xl p-10 max-w-2xl mx-auto text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="font-display text-2xl font-semibold mb-3">
          Clerk authentication isn't configured yet
        </h2>
        <p className="text-muted-foreground mb-6">
          Add your Clerk publishable key as an environment variable named{" "}
          <code className="px-2 py-0.5 rounded bg-secondary font-mono text-xs">
            VITE_CLERK_PUBLISHABLE_KEY
          </code>{" "}
          and reload. The dashboard, sign-in, and account linking pages all need it.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-brand"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

function RedirectToSignInWithReturn() {
  const location = useLocation();
  const returnUrl = location.pathname + location.search;
  return <RedirectToSignIn redirectUrl={returnUrl} />;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  if (!isClerkConfigured) return <ClerkSetupBanner />;
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignInWithReturn />
      </SignedOut>
    </>
  );
}
