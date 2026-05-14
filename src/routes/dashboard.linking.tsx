import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/dashboard/kit";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useServerFn } from "@tanstack/react-start";
import { claimBotToken, getMyLink, unlinkDiscord } from "@/lib/linking.functions";

export const Route = createFileRoute("/dashboard/linking")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: Linking,
});

type ClaimResult =
  | { ok: true; discordUsername: string | null }
  | { ok: false; reason: "not_found" | "already_used" | "expired" | "error"; detail?: string };

function Linking() {
  const { user } = useUser();
  const { token } = Route.useSearch();
  const claimFn = useServerFn(claimBotToken);
  const getFn = useServerFn(getMyLink);
  const unlinkFn = useServerFn(unlinkDiscord);

  const [link, setLink] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState<ClaimResult | null>(null);
  const [unlinking, setUnlinking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const didClaim = useRef(false);

  useEffect(() => {
    if (!user?.id) return;
    getFn({ data: { clerkUserId: user.id } }).then((r) => setLink(r.link));
  }, [user?.id]);

  useEffect(() => {
    if (!token || !user?.id || didClaim.current) return;
    didClaim.current = true;
    setClaiming(true);
    claimFn({ data: { token, clerkUserId: user.id } })
      .then(async (res) => {
        setClaimed(res);
        if (res.ok) {
          const r = await getFn({ data: { clerkUserId: user.id } });
          setLink(r.link);
        }
      })
      .catch((e) => setClaimed({ ok: false, reason: "error", detail: e?.message ?? String(e) }))
      .finally(() => setClaiming(false));
  }, [token, user?.id]);

  async function unlink() {
    if (!user?.id) return;
    setUnlinking(true);
    setErr(null);
    try {
      await unlinkFn({ data: { clerkUserId: user.id } });
      setLink(null);
      setClaimed(null);
      didClaim.current = false;
    } catch (e: any) {
      setErr(e?.message || "Failed to unlink");
    } finally {
      setUnlinking(false);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <PageHeader
        eyebrow="/ account linking"
        title="Connect your Discord identity"
        subtitle="Link your dashboard account to your Discord user so the bot recognises you across servers."
      />

      {token ? (
        <TokenClaimPanel claiming={claiming} result={claimed} link={link} onUnlink={unlink} unlinking={unlinking} />
      ) : link?.verified ? (
        <LinkedPanel link={link} onUnlink={unlink} unlinking={unlinking} err={err} />
      ) : (
        <InstructionsPanel />
      )}
    </div>
  );
}

function TokenClaimPanel({
  claiming,
  result,
  link,
  onUnlink,
  unlinking,
}: {
  claiming: boolean;
  result: ClaimResult | null;
  link: any;
  onUnlink: () => void;
  unlinking: boolean;
}) {
  if (claiming) {
    return (
      <Panel title="🔗 Linking account…">
        <div className="py-10 text-center">
          <div className="text-4xl mb-4 animate-pulse">🌙</div>
          <p className="text-muted-foreground text-sm">Verifying your Discord token…</p>
        </div>
      </Panel>
    );
  }

  if (result?.ok) {
    return (
      <Panel title="✅ Discord linked">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
              @{link?.discord_username ?? result.discordUsername}
            </div>
            <div className="text-xs font-mono text-muted-foreground mt-1">
              Discord ID: {link?.discord_user_id}
            </div>
            {link?.linked_at && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Linked {new Date(link.linked_at).toLocaleString()}
              </div>
            )}
          </div>
          <button
            onClick={onUnlink}
            disabled={unlinking}
            className="shrink-0 rounded-full border border-destructive/40 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
          >
            {unlinking ? "Unlinking…" : "Unlink"}
          </button>
        </div>
      </Panel>
    );
  }

  if (result && !result.ok) {
    const messages: Record<string, string> = {
      not_found: "This link token wasn't found. It may be invalid — run `/link` or `h!link` in Discord again to get a new one.",
      already_used: "This link token has already been used. If you need to re-link, run `/link` in Discord to get a fresh one.",
      expired: "This link token expired (tokens last 10 minutes). Run `/link` or `h!link` in Discord to get a new one.",
      error: "Something went wrong while claiming your token. Please try again.",
    };
    return (
      <Panel title="❌ Linking failed">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm text-muted-foreground">{messages[result.reason]}</p>
          {result.reason === "error" && result.detail && (
            <p className="text-xs font-mono text-destructive/70 mt-2 break-all">{result.detail}</p>
          )}
        </div>
        <div className="mt-4">
          <InstructionsPanel />
        </div>
      </Panel>
    );
  }

  return null;
}

function LinkedPanel({
  link,
  onUnlink,
  unlinking,
  err,
}: {
  link: any;
  onUnlink: () => void;
  unlinking: boolean;
  err: string | null;
}) {
  return (
    <Panel title="✅ Discord linked">
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
            @{link.discord_username}
          </div>
          <div className="text-xs font-mono text-muted-foreground mt-1">Discord ID: {link.discord_user_id}</div>
          {link.linked_at && (
            <div className="text-xs text-muted-foreground mt-0.5">
              Linked {new Date(link.linked_at).toLocaleString()}
            </div>
          )}
        </div>
        <button
          onClick={onUnlink}
          disabled={unlinking}
          className="shrink-0 rounded-full border border-destructive/40 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
        >
          {unlinking ? "Unlinking…" : "Unlink"}
        </button>
      </div>
      {err && <p className="text-xs text-destructive mt-3">{err}</p>}
    </Panel>
  );
}

function InstructionsPanel() {
  return (
    <Panel title="🔗 Link via Discord">
      <p className="text-sm text-muted-foreground mb-6">
        Linking is initiated from Discord. Run the command in any server where the bot is active — you must be the <strong>server owner</strong>.
      </p>
      <div className="space-y-4">
        <Step n={1} label="Open Discord" body="Go to a server where Hibernation Portal bot is installed." />
        <Step n={2} label="Run the command" body={
          <span>
            Type{" "}
            <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-xs">/link</code>
            {" "}or{" "}
            <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-xs">h!link</code>
            {" "}in any channel.
          </span>
        } />
        <Step n={3} label="Click the button" body="The bot will send you a private button. Click it — it brings you back here and links automatically." />
        <Step n={4} label="Done" body="This page will show your linked Discord identity." />
      </div>
      <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Don't have the bot yet?</span>{" "}
        Contact the server owner to install it, or{" "}
        <a
          href={`https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID || "YOUR_CLIENT_ID"}&scope=bot+applications.commands&permissions=397284557824`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand underline underline-offset-2 hover:opacity-80"
        >
          add it to your own server
        </a>
        .
      </div>
    </Panel>
  );
}

function Step({ n, label, body }: { n: number; label: string; body: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="size-7 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold flex items-center justify-center shrink-0">
        {n}
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{body}</div>
      </div>
    </div>
  );
}
