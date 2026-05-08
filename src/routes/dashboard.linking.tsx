import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/dashboard/kit";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/linking")({
  component: Linking,
});

function Linking() {
  const [code] = useState(() => "HIB-" + Math.random().toString(36).slice(2, 8).toUpperCase());

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <PageHeader
        eyebrow="/ account linking"
        title="Connect your Discord identity"
        subtitle="Link your dashboard account to your Discord user so the bot recognizes you in your servers."
      />

      <Panel title="🔗 Verification code">
        <p className="text-sm text-muted-foreground mb-4">
          Run <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-xs">/link {code}</code> in any
          server where the bot is installed. Your account will be linked instantly.
        </p>
        <div className="rounded-2xl bg-secondary/60 border border-border/40 p-8 text-center">
          <div className="font-mono text-4xl font-semibold text-gradient tracking-wider">{code}</div>
          <p className="text-xs text-muted-foreground mt-3 font-mono">expires in 10 minutes</p>
        </div>
      </Panel>

      <div className="mt-4">
        <Panel title="🌐 Linked Discord identities">
          <div className="text-center py-12 text-muted-foreground text-sm">
            No Discord accounts linked yet. Use the code above in your server to verify.
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="🛰️ Linked servers">
          <div className="text-center py-12 text-muted-foreground text-sm">
            Once linked, the servers you administer will appear here.
          </div>
        </Panel>
      </div>
    </div>
  );
}
