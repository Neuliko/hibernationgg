import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import heroBanner from "@/assets/hero-banner.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hibernation Portal — Discord inactivity management" },
      {
        name: "description",
        content:
          "A management portal for Discord servers. Detect idle channels and members, hibernate them gracefully, and wake them on activity.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <LiveDemo />
        <Features />
        <SleepStates />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="container mx-auto px-6 pt-16 pb-24 relative">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full surface px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-6">
              <span className="size-1.5 rounded-full bg-brand animate-pulse-dot" />
              v1.0 · Discord inactivity management
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-ink">
              Idle channels enter{" "}
              <span className="text-gradient">hibernation.</span>
              <br />
              Wake on activity.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              The Hibernation Portal is a management dashboard for your Discord
              server. It quietly puts dormant channels and members into sleep
              mode, tracks every event, and wakes them the moment energy
              returns.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard"
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-brand hover:scale-[1.02] transition"
              >
                Open dashboard
              </Link>
              <Link
                to="/docs"
                className="rounded-full surface px-6 py-3 text-sm font-medium hover:bg-secondary transition"
              >
                Read the docs →
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden surface shadow-brand ring-brand">
              <img
                src={heroBanner}
                alt="Hibernation Portal — sleeping Discord bot illustration"
                className="w-full h-auto"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-2xl surface px-4 py-3 flex items-center gap-3 text-sm">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span className="font-mono text-xs text-muted-foreground">
                bot online · 3 servers
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LiveDemo() {
  return (
    <section className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="surface rounded-3xl p-2 overflow-hidden"
      >
        <div className="rounded-2xl bg-secondary/50 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
            <div className="size-2.5 rounded-full bg-destructive/70" />
            <div className="size-2.5 rounded-full bg-yellow-500/70" />
            <div className="size-2.5 rounded-full bg-green-500/70" />
            <span className="ml-3 font-mono text-xs text-muted-foreground">
              portal://live
            </span>
            <span className="ml-auto font-mono text-xs text-brand">● connected</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4 p-6">
            <DemoCard
              icon="🌙"
              title="Hibernation Active"
              rows={[
                ["Status", "Sleeping"],
                ["Channel", "#design-archive"],
                ["Started", "2h ago"],
                ["Level", "Deep Sleep"],
              ]}
            />
            <DemoCard
              icon="💠"
              title="Light Sleep"
              rows={[
                ["Status", "Dozing"],
                ["User", "@nova"],
                ["Idle for", "47m"],
                ["Next state", "Deep at 60m"],
              ]}
            />
            <DemoCard
              icon="☀️"
              title="Just Woke Up"
              rows={[
                ["Status", "Active"],
                ["Slept for", "6h 22m"],
                ["Trigger", "New message"],
                ["Nick restored", "✓ original"],
              ]}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function DemoCard({
  icon,
  title,
  rows,
}: {
  icon: string;
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-xl bg-card p-5 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-display font-semibold text-ink">{title}</h3>
      </div>
      <dl className="space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-t border-border pt-2">
            <dt className="text-muted-foreground font-mono text-xs uppercase tracking-wider">{k}</dt>
            <dd className="font-medium text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Features() {
  const items = [
    { icon: "🌙", title: "Auto hibernate", body: "Detects idle channels & members and gracefully transitions them through sleep states." },
    { icon: "⏳", title: "Live timestamps", body: "Renders Discord native <t:unix:R> for exact, always-fresh durations." },
    { icon: "💠", title: "Smart nicknames", body: "Adds 💤 🌙 ❄️ to inactive members and restores the original on wake." },
    { icon: "📊", title: "Server analytics", body: "Sleep streaks, leaderboards, energy savings, full audit logs." },
    { icon: "🔗", title: "Real-time sync", body: "Bot ↔ dashboard via realtime. State updates the instant they happen." },
    { icon: "🛡️", title: "Secure by default", body: "Per-server tokens, RLS-protected data, role-based access on the dashboard." },
  ];
  return (
    <section className="container mx-auto px-6 py-28">
      <div className="max-w-2xl mb-14">
        <p className="font-mono text-xs uppercase tracking-widest text-brand mb-4">/ portal features</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-ink">
          A complete portal for{" "}
          <span className="text-gradient">server energy</span>.
        </h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="surface rounded-2xl p-6 hover:border-brand/40 hover:-translate-y-1 transition group"
          >
            <div className="text-3xl mb-4 group-hover:scale-110 transition">{item.icon}</div>
            <h3 className="font-display font-semibold text-lg mb-2 text-ink">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SleepStates() {
  const states = [
    { emoji: "💠", name: "Light Sleep", time: "60m idle", desc: "Soft dim. Nickname tagged." },
    { emoji: "🌙", name: "Deep Sleep", time: "6h idle", desc: "Quiet mode. Reduced presence." },
    { emoji: "❄️", name: "Frozen", time: "24h idle", desc: "Archived state. Wake on touch." },
  ];
  return (
    <section className="container mx-auto px-6 py-12">
      <div className="grid md:grid-cols-3 gap-6">
        {states.map((s) => (
          <div
            key={s.name}
            className="relative rounded-3xl surface-soft p-8 overflow-hidden"
          >
            <div className="text-6xl mb-6 animate-float">{s.emoji}</div>
            <h3 className="font-display text-2xl font-semibold text-ink">{s.name}</h3>
            <p className="font-mono text-xs uppercase tracking-widest text-brand mt-1">{s.time}</p>
            <p className="text-sm text-muted-foreground mt-4">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="container mx-auto px-6 py-28">
      <div className="relative rounded-3xl bg-gradient-to-br from-brand to-[oklch(0.7_0.16_240)] p-12 md:p-20 text-center overflow-hidden shadow-brand">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative">
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Boot the portal.
          </h2>
          <p className="text-white/80 mt-4 max-w-xl mx-auto">
            Connect your server, install the bot, and the dashboard does the rest.
          </p>
          <Link
            to="/dashboard"
            className="inline-block mt-10 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand hover:scale-[1.02] transition"
          >
            Launch dashboard →
          </Link>
        </div>
      </div>
    </section>
  );
}
