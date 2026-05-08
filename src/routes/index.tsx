import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <LiveOSDemo />
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
      <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="container mx-auto px-6 pt-24 pb-32 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-8">
            <span className="size-1.5 rounded-full bg-accent animate-pulse-glow" />
            v1.0 · OS for Discord inactivity
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
            Idle channels enter{" "}
            <span className="text-gradient">hibernation.</span>
            <br />
            Wake on activity.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            HibernationOS is a futuristic inactivity engine for Discord. It quietly puts dormant
            channels and members into sleep mode 💤, tracks every event, and wakes them the
            moment energy returns ☀️.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/dashboard"
              className="rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow hover:scale-[1.02] transition"
            >
              Open dashboard
            </Link>
            <Link
              to="/docs"
              className="rounded-full glass px-6 py-3 text-sm font-medium hover:bg-white/5 transition"
            >
              Read the docs →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LiveOSDemo() {
  return (
    <section className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="glass-strong rounded-3xl p-2 shadow-elevated overflow-hidden glow-ring"
      >
        <div className="rounded-2xl bg-deep/50 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border/40">
            <div className="size-2.5 rounded-full bg-destructive/70" />
            <div className="size-2.5 rounded-full bg-yellow-500/70" />
            <div className="size-2.5 rounded-full bg-green-500/70" />
            <span className="ml-3 font-mono text-xs text-muted-foreground">
              hibernation-os://live
            </span>
            <span className="ml-auto font-mono text-xs text-accent">● connected</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4 p-6">
            <DemoEmbed
              icon="🌙"
              title="Hibernation Active"
              rows={[
                ["Status", "💤 Sleeping"],
                ["Channel", "#design-archive"],
                ["Started", "2h ago"],
                ["Level", "❄️ Deep Sleep"],
              ]}
              accent="from-primary/30"
            />
            <DemoEmbed
              icon="💠"
              title="Light Sleep"
              rows={[
                ["Status", "😴 Dozing"],
                ["User", "@nova"],
                ["Idle for", "47m"],
                ["Next state", "🌙 Deep at 60m"],
              ]}
              accent="from-accent/30"
            />
            <DemoEmbed
              icon="☀️"
              title="Just Woke Up"
              rows={[
                ["Status", "⚡ Active"],
                ["Slept for", "6h 22m"],
                ["Trigger", "New message"],
                ["Nick restored", "✓ original"],
              ]}
              accent="from-frost/30"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function DemoEmbed({
  icon,
  title,
  rows,
  accent,
}: {
  icon: string;
  title: string;
  rows: [string, string][];
  accent: string;
}) {
  return (
    <div className={`relative rounded-xl glass p-5 overflow-hidden bg-gradient-to-br ${accent} to-transparent`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-display font-semibold">{title}</h3>
      </div>
      <dl className="space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-t border-border/30 pt-2">
            <dt className="text-muted-foreground font-mono text-xs uppercase tracking-wider">{k}</dt>
            <dd className="font-medium">{v}</dd>
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
    { icon: "🔗", title: "Real-time sync", body: "Bot ↔ dashboard via WebSockets. State updates the instant they happen." },
    { icon: "🛡️", title: "Token-secured API", body: "Per-server bot tokens, RLS-protected data, role-based access on the dashboard." },
  ];
  return (
    <section className="container mx-auto px-6 py-32">
      <div className="max-w-2xl mb-16">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">/ system features</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
          A complete OS for{" "}
          <span className="text-frost">server energy</span>.
        </h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="glass rounded-2xl p-6 hover:border-primary/40 transition group"
          >
            <div className="text-3xl mb-4 group-hover:scale-110 transition">{item.icon}</div>
            <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SleepStates() {
  const states = [
    { emoji: "💠", name: "Light Sleep", time: "60m idle", desc: "Soft dim. Nickname tagged.", color: "from-frost/40" },
    { emoji: "🌙", name: "Deep Sleep", time: "6h idle", desc: "Quiet mode. Reduced presence.", color: "from-primary/40" },
    { emoji: "❄️", name: "Frozen", time: "24h idle", desc: "Archived state. Wake on touch.", color: "from-accent/40" },
  ];
  return (
    <section className="container mx-auto px-6 py-20">
      <div className="grid md:grid-cols-3 gap-6">
        {states.map((s) => (
          <div
            key={s.name}
            className={`relative rounded-3xl glass-strong p-8 overflow-hidden bg-gradient-to-br ${s.color} to-transparent`}
          >
            <div className="text-6xl mb-6 animate-float">{s.emoji}</div>
            <h3 className="font-display text-2xl font-semibold">{s.name}</h3>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.time}</p>
            <p className="text-sm text-muted-foreground mt-4">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="container mx-auto px-6 py-32">
      <div className="relative glass-strong rounded-3xl p-12 md:p-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        <div className="relative">
          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight">
            Boot the OS.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Connect your server, install the bot, and the dashboard does the rest.
          </p>
          <Link
            to="/dashboard"
            className="inline-block mt-10 rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3.5 text-sm font-medium text-primary-foreground shadow-glow hover:scale-[1.02] transition"
          >
            Launch dashboard →
          </Link>
        </div>
      </div>
    </section>
  );
}
