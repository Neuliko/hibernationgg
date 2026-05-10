import { createFileRoute } from "@tanstack/react-router";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { isClerkConfigured } from "@/lib/auth-provider";

export const Route = createFileRoute("/sso-callback")({
  component: SSOCallback,
});

function SSOCallback() {
  if (!isClerkConfigured) return null;
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Completing sign in…</p>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
