import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/dashboard/kit";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useServerFn } from "@tanstack/react-start";
import { createLinkCode, getMyLink } from "@/lib/linking.functions";
import { isClerkConfigured } from "@/lib/auth-provider";

export const Route = createFileRoute("/dashboard/linking")({
  component: Linking,
});

function Linking() {
  const { user } = isClerkConfigured ? useUser() : { user: null as any };
  const create = useServerFn(createLinkCode);
  const get = useServerFn(getMyLink);
  const [code, setCode] = useState<string | null>(null);
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    if (!user?.id) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await create({ data: { clerkUserId: user.id } });
      setCode(res.code);
      const cur = await get({ data: { clerkUserId: user.id } });
      setLink(cur.link);
    } catch (e: any) {
      setErr(e?.message || "Failed to generate code");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.id) return;
    get({ data: { clerkUserId: user.id } }).then((r) => {
      setLink(r.link);
      if (r.link?.verification_code && !r.link.verified) setCode(r.link.verification_code);
    });
    const t = setInterval(() => {
      get({ data: { clerkUserId: user.id } }).then((r) => setLink(r.link));
    }, 5000);
    return () => clearInterval(t);
  }, [user?.id]);

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <PageHeader
        eyebrow="/ account linking"
        title="Connect your Discord identity"
        subtitle="Link your dashboard account to your Discord user so the bot recognizes you in your servers."
      />

      <Panel title="🔗 Verification code">
        <p className="text-sm text-muted-foreground mb-4">
          Generate a code, then run{" "}
          <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-xs">/link {code || "CODE"}</code> in
          any server where the bot is installed.
        </p>
        <div className="rounded-2xl bg-secondary/60 border border-border/40 p-8 text-center">
          <div className="font-mono text-4xl font-semibold text-gradient tracking-wider min-h-[3rem]">
            {code || "—"}
          </div>
          <button
            onClick={generate}
            disabled={loading || !user}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-brand disabled:opacity-50"
          >
            {loading ? "Generating…" : code ? "Regenerate code" : "Generate code"}
          </button>
          {err && <p className="text-xs text-destructive mt-3">{err}</p>}
        </div>
      </Panel>

      <div className="mt-4">
        <Panel title="🌐 Linked Discord identity">
          {link?.verified ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                ✓ Linked as @{link.discord_username}
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                Discord ID: {link.discord_user_id}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Not linked yet. Run the <code className="px-1 font-mono">/link</code> command above.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
