import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/dashboard/kit";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useServerFn } from "@tanstack/react-start";
import { createLinkCode, getMyLink, unlinkDiscord } from "@/lib/linking.functions";

export const Route = createFileRoute("/dashboard/linking")({
  component: Linking,
});

function useCountdown(expiresAt: string | null) {
  const [secs, setSecs] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) { setSecs(null); return; }
    const tick = () => setSecs(Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return secs;
}

function Linking() {
  const { user } = useUser();
  const createFn = useServerFn(createLinkCode);
  const getFn = useServerFn(getMyLink);
  const unlinkFn = useServerFn(unlinkDiscord);

  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secsLeft = useCountdown(expiresAt);

  const fetchLink = async (clerkUserId: string) => {
    const r = await getFn({ data: { clerkUserId } });
    setLink(r.link);
    if (r.link?.verified) {
      setCode(null);
      setExpiresAt(null);
    } else if (r.link?.verification_code && r.link?.expires_at) {
      const stillValid = new Date(r.link.expires_at).getTime() > Date.now();
      if (stillValid) {
        setCode(r.link.verification_code);
        setExpiresAt(r.link.expires_at);
      }
    }
    return r.link;
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchLink(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || link?.verified) return;
    pollRef.current = setInterval(async () => {
      const updated = await getFn({ data: { clerkUserId: user.id } });
      setLink(updated.link);
      if (updated.link?.verified) {
        setCode(null);
        setExpiresAt(null);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user?.id, link?.verified]);

  async function generate() {
    if (!user?.id) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await createFn({ data: { clerkUserId: user.id } });
      setCode(res.code);
      setExpiresAt(res.expiresAt);
      await fetchLink(user.id);
    } catch (e: any) {
      setErr(e?.message || "Failed to generate code");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function unlink() {
    if (!user?.id) return;
    setUnlinking(true);
    try {
      await unlinkFn({ data: { clerkUserId: user.id } });
      setLink(null);
      setCode(null);
      setExpiresAt(null);
    } catch (e: any) {
      setErr(e?.message || "Failed to unlink");
    } finally {
      setUnlinking(false);
    }
  }

  const expired = secsLeft !== null && secsLeft <= 0;
  const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <PageHeader
        eyebrow="/ account linking"
        title="Connect your Discord identity"
        subtitle="Link your dashboard account to your Discord user so the bot recognises you across servers."
      />

      {link?.verified ? (
        <Panel title="✅ Discord linked">
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
            </div>
            <button
              onClick={unlink}
              disabled={unlinking}
              className="shrink-0 rounded-full border border-destructive/40 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
            >
              {unlinking ? "Unlinking…" : "Unlink"}
            </button>
          </div>
        </Panel>
      ) : (
        <Panel title="🔗 Verification code">
          <p className="text-sm text-muted-foreground mb-5">
            Generate a one-time code, then run{" "}
            <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-xs">
              h!link {code || "CODE"}
            </code>{" "}
            or{" "}
            <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-xs">
              /link {code || "CODE"}
            </code>{" "}
            in any server where the bot is active. Codes expire after 10 minutes.
          </p>

          <div className="rounded-2xl bg-secondary/60 border border-border/40 p-8 text-center">
            {code && !expired ? (
              <>
                <div className="font-mono text-4xl font-bold text-gradient tracking-widest mb-2">
                  {code}
                </div>
                <div className="text-xs text-muted-foreground font-mono mb-5">
                  {secsLeft !== null && secsLeft > 0
                    ? `Expires in ${fmtSecs(secsLeft)}`
                    : "Checking…"}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={copy}
                    className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:scale-[1.02] transition"
                  >
                    {copied ? "✓ Copied" : "Copy code"}
                  </button>
                  <button
                    onClick={generate}
                    disabled={loading}
                    className="rounded-full border border-border px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="font-mono text-4xl font-bold text-muted-foreground/30 tracking-widest mb-5">
                  {expired ? "EXPIRED" : "——————"}
                </div>
                <button
                  onClick={generate}
                  disabled={loading || !user}
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-brand hover:scale-[1.02] transition disabled:opacity-50"
                >
                  {loading ? "Generating…" : expired ? "Generate new code" : "Generate code"}
                </button>
              </>
            )}
            {err && <p className="text-xs text-destructive mt-4">{err}</p>}
          </div>

          {code && !expired && (
            <p className="mt-4 text-xs text-center text-muted-foreground animate-pulse">
              Waiting for you to run the command in Discord…
            </p>
          )}
        </Panel>
      )}
    </div>
  );
}
