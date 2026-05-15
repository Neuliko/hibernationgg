import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/dashboard/kit";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useServerFn } from "@tanstack/react-start";
import { getMyLink, unlinkDiscord } from "@/lib/linking.functions";

export const Route = createFileRoute("/dashboard/linking")({
  validateSearch: (search: Record<string, unknown>) => ({
    discord_linked: search.discord_linked === "1" ? true : undefined,
    discord_error: typeof search.discord_error === "string" ? search.discord_error : undefined,
  }),
  component: Linking,
});

function buildDiscordOAuthUrl(clerkUserId: string): string {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  if (!clientId) return "#";
  const redirectUri = `${window.location.origin}/auth/discord/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

function Linking() {
  const { user } = useUser();
  const { discord_linked, discord_error } = Route.useSearch();
  const getFn = useServerFn(getMyLink);
  const unlinkFn = useServerFn(unlinkDiscord);

  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const didFetch = useRef(false);

  useEffect(() => {
    if (!user?.id || didFetch.current) return;
    didFetch.current = true;
    getFn({ data: { clerkUserId: user.id } })
      .then((r) => setLink(r.link))
      .finally(() => setLoading(false));
  }, [user?.id]);

  async function unlink() {
    if (!user?.id) return;
    setUnlinking(true);
    setErr(null);
    try {
      await unlinkFn({ data: { clerkUserId: user.id } });
      setLink(null);
    } catch (e: any) {
      setErr(e?.message || "Failed to unlink");
    } finally {
      setUnlinking(false);
    }
  }

  const clientIdMissing = !import.meta.env.VITE_DISCORD_CLIENT_ID;
  const isLinked = link?.verified;

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <PageHeader
        eyebrow="/ account linking"
        title="Connect your Discord"
        subtitle="Link your dashboard account to your Discord identity so your servers appear here automatically."
      />

      {discord_error && (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
          <span className="font-medium text-destructive">Discord authorization failed.</span>{" "}
          {discord_error === "access_denied"
            ? "You cancelled the authorization. Try again when you're ready."
            : discord_error === "exchange_failed"
            ? "Could not exchange the authorization code. Make sure the OAuth redirect URI is registered in the Discord Developer Portal."
            : discord_error === "profile_failed"
            ? "Connected to Discord but couldn't fetch your profile. Please try again."
            : "Something went wrong. Please try again."}
        </div>
      )}

      {loading ? (
        <Panel title="Discord account">
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        </Panel>
      ) : isLinked ? (
        <Panel title="✅ Discord connected">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
                @{link.discord_username}
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-1">
                Discord ID: {link.discord_user_id}
              </div>
              {link.linked_at && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Linked {new Date(link.linked_at).toLocaleString()}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                Your servers will now appear on the dashboard overview.
              </div>
            </div>
            <button
              onClick={unlink}
              disabled={unlinking}
              className="shrink-0 rounded-full border border-destructive/40 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
            >
              {unlinking ? "Unlinking…" : "Unlink"}
            </button>
          </div>
          {err && <p className="text-xs text-destructive mt-3">{err}</p>}
        </Panel>
      ) : (
        <Panel title="🔗 Connect with Discord">
          <p className="text-sm text-muted-foreground mb-6">
            Click the button below to authorize Hibernation Portal with your Discord account.
            Once connected, any server where you are the owner and the bot is installed will
            appear in your dashboard automatically.
          </p>

          {discord_linked && !isLinked && (
            <div className="mb-4 rounded-xl border border-brand/30 bg-brand/5 p-3 text-sm text-brand">
              Authorization received — fetching your account…
            </div>
          )}

          {clientIdMissing ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
              <span className="font-medium text-amber-600">Not configured.</span>{" "}
              The <code className="font-mono bg-secondary px-1 py-0.5 rounded text-xs">VITE_DISCORD_CLIENT_ID</code> environment
              variable is not set. Add it to enable Discord OAuth.
            </div>
          ) : (
            user?.id && (
              <a
                href={buildDiscordOAuthUrl(user.id)}
                className="inline-flex items-center gap-3 rounded-full bg-[#5865F2] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#4752C4] transition"
              >
                <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="white">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                </svg>
                Connect with Discord
              </a>
            )
          )}

          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Need the bot in your server first?</span>{" "}
            <a
              href={`https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID || ""}&scope=bot+applications.commands&permissions=397284557824`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline underline-offset-2 hover:opacity-80"
            >
              Add Hibernation Portal to your server
            </a>
            , then come back here to connect.
          </div>
        </Panel>
      )}
    </div>
  );
}
