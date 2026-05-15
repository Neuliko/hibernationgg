import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useServerFn } from "@tanstack/react-start";
import { exchangeDiscordCode } from "@/lib/linking.functions";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/auth/discord/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
    error_description: typeof search.error_description === "string" ? search.error_description : undefined,
  }),
  component: () => (
    <RequireAuth>
      <DiscordCallback />
    </RequireAuth>
  ),
});

function DiscordCallback() {
  const { user } = useUser();
  const { code, error: oauthError } = Route.useSearch();
  const navigate = useNavigate();
  const exchangeFn = useServerFn(exchangeDiscordCode);
  const didRun = useRef(false);

  useEffect(() => {
    if (oauthError) {
      navigate({ to: "/dashboard/linking", search: { discord_error: oauthError } as any });
      return;
    }
    if (!code || !user?.id || didRun.current) return;
    didRun.current = true;

    const redirectUri = `${window.location.origin}/auth/discord/callback`;

    exchangeFn({ data: { code, clerkUserId: user.id, redirectUri } })
      .then((result) => {
        if (result.ok) {
          navigate({ to: "/dashboard/linking", search: { discord_linked: "1" } as any });
        } else {
          navigate({ to: "/dashboard/linking", search: { discord_error: result.reason } as any });
        }
      })
      .catch(() => {
        navigate({ to: "/dashboard/linking", search: { discord_error: "error" } as any });
      });
  }, [code, user?.id, oauthError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🌙</div>
        <p className="text-muted-foreground text-sm font-mono">Connecting your Discord account…</p>
      </div>
    </div>
  );
}
