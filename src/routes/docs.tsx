import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs — HibernationOS" },
      { name: "description", content: "Install, configure, and deploy the HibernationOS Discord bot and dashboard." },
    ],
  }),
  component: Docs,
});

function Docs() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-6 py-20 max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">/ documentation</p>
        <h1 className="font-display text-5xl font-semibold tracking-tight mb-4">
          Quickstart
        </h1>
        <p className="text-muted-foreground text-lg mb-12">
          From zero to a hibernating Discord server in five minutes.
        </p>

        <Section step="1" title="Install dependencies for the bot" emoji="📦">
          <p>The bot lives in the <Code>/bot</Code> folder of this project. From a terminal:</p>
          <Block>{`cd bot
npm install
cp .env.example .env`}</Block>
        </Section>

        <Section step="2" title="Set the env vars" emoji="🔑">
          <p>Edit <Code>bot/.env</Code> with your Discord bot token, the dashboard URL, and the bot token from the Control panel.</p>
          <Block>{`DISCORD_TOKEN=your_bot_token
SUPABASE_URL=...auto-filled...
SUPABASE_SERVICE_ROLE_KEY=...from Lovable Cloud...
GUILD_ID=optional_specific_guild`}</Block>
        </Section>

        <Section step="3" title="Run locally to verify" emoji="🧪">
          <Block>{`npm run dev`}</Block>
          <p>Invite the bot to your server with <Code>applications.commands</Code>, <Code>bot</Code>, and the permissions: <em>Manage Nicknames</em>, <em>Send Messages</em>, <em>Read Message History</em>, <em>View Channels</em>.</p>
        </Section>

        <Section step="4" title="Deploy 24/7" emoji="🚀">
          <p>Pick a host. The bot is a long-running Node.js process — Cloudflare Workers won't work for the gateway connection.</p>
          <ul className="space-y-2 ml-4 list-disc">
            <li><strong>Railway</strong> — fastest. Add the repo, deploy, set env vars. <Code>railway.json</Code> is included.</li>
            <li><strong>Render</strong> — Background Worker service. <Code>render.yaml</Code> included.</li>
            <li><strong>VPS / Docker</strong> — <Code>Dockerfile</Code> + <Code>ecosystem.config.cjs</Code> for PM2 included.</li>
          </ul>
        </Section>

        <Section step="5" title="Link your Discord account" emoji="🔗">
          <p>Sign in to the dashboard, open <Code>/dashboard/linking</Code>, copy the code, and run <Code>/link CODE</Code> in your server.</p>
        </Section>

        <Section step="6" title="Watch it sleep" emoji="🌙">
          <p>Open the <Code>/dashboard</Code> overview. Live state changes from the bot stream in via realtime — no refresh needed.</p>
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
        <span className="font-mono text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
          STEP {step}
        </span>
        <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
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
    <pre className="rounded-xl glass p-4 overflow-x-auto text-xs font-mono text-foreground whitespace-pre">
      {children}
    </pre>
  );
}
