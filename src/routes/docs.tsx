import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs — Hibernation Portal" },
      { name: "description", content: "Install, configure, and deploy the Hibernation Portal Discord bot." },
    ],
  }),
  component: Docs,
});

const RAILWAY_URL =
  "https://railway.app/new/template?template=https://github.com/your-org/hibernation-bot";

function Docs() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-6 py-20 max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-widest text-brand mb-4">/ documentation</p>
        <h1 className="font-display text-5xl font-semibold tracking-tight mb-4 text-ink">
          Quickstart
        </h1>
        <p className="text-muted-foreground text-lg mb-12">
          From zero to a hibernating Discord server in five minutes.
        </p>

        <Section step="1" title="Create your Discord application" emoji="🤖">
          <p>Head to the <a className="text-brand underline" href="https://discord.com/developers/applications" target="_blank" rel="noreferrer">Discord Developer Portal</a>, create a new app, then add a Bot. Copy the bot token — you'll need it.</p>
          <p>Enable these <strong>Privileged Gateway Intents</strong>: <em>Server Members</em>, <em>Message Content</em>, <em>Presence</em>.</p>
        </Section>

        <Section step="2" title="Deploy the bot to Railway (one click)" emoji="🚀">
          <p>The bot is a long-running Node.js process and can't run on Cloudflare Workers. Railway is the fastest host:</p>
          <a
            href={RAILWAY_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-brand hover:scale-[1.02] transition"
          >
            <span>🚂</span> Deploy on Railway
          </a>
          <p className="mt-3 text-sm">When prompted, set these env vars:</p>
          <Block>{`DISCORD_TOKEN=<from step 1>
SUPABASE_URL=<auto-filled from your portal>
SUPABASE_SERVICE_ROLE_KEY=<auto-filled from your portal>
GUILD_ID=<optional: a single guild for instant command updates>`}</Block>
          <p className="text-sm">Prefer Render, a VPS, or Docker? <Code>render.yaml</Code>, <Code>Dockerfile</Code>, and <Code>ecosystem.config.cjs</Code> ship in <Code>/bot</Code>.</p>
        </Section>

        <Section step="3" title="Run the bot locally (alternative)" emoji="🧪">
          <Block>{`cd bot
npm install
cp .env.example .env
# fill in DISCORD_TOKEN + the two SUPABASE_* vars
npm run dev`}</Block>
        </Section>

        <Section step="4" title="Invite the bot to your server" emoji="📨">
          <p>From the Developer Portal → OAuth2 → URL Generator, select scopes <Code>bot</Code> and <Code>applications.commands</Code>, then permissions: <em>View Channels</em>, <em>Send Messages</em>, <em>Read Message History</em>, <em>Manage Nicknames</em>.</p>
        </Section>

        <Section step="5" title="Link your Discord account" emoji="🔗">
          <p>Sign in to the dashboard, open <Code>/dashboard/linking</Code>, copy the <Code>HIB-XXXXXX</Code> code, then run <Code>/link CODE</Code> in your server.</p>
        </Section>

        <Section step="6" title="Watch it manage your server" emoji="🌙">
          <p>Open <Code>/dashboard</Code>. Live state changes from the bot stream in via realtime — no refresh needed. Tune thresholds in <Code>/dashboard/control</Code>.</p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ step, title, emoji, children }: any) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-xs px-2 py-1 rounded bg-brand/10 text-brand border border-brand/20">
          STEP {step}
        </span>
        <h2 className="font-display text-2xl font-semibold flex items-center gap-2 text-ink">
          <span>{emoji}</span> {title}
        </h2>
      </div>
      <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
function Code({ children }: any) {
  return <code className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-xs">{children}</code>;
}
function Block({ children }: any) {
  return (
    <pre className="rounded-xl surface p-4 overflow-x-auto text-xs font-mono text-foreground whitespace-pre">
      {children}
    </pre>
  );
}
