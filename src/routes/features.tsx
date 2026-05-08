import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — HibernationOS" },
      { name: "description", content: "Every feature of the HibernationOS Discord inactivity engine." },
    ],
  }),
  component: Features,
});

const groups = [
  {
    title: "Detection engine",
    icon: "🛰️",
    items: [
      "Detect inactivity in channels and members",
      "Auto-enter hibernation after configurable thresholds",
      "Wake on new activity within milliseconds",
      "Prevent duplicate hibernation states",
    ],
  },
  {
    title: "Discord-native embeds",
    icon: "🌙",
    items: [
      "Live <t:unix:F> start time and <t:unix:R> duration",
      "🌙 Hibernation Active embed with sleep level",
      "☀️ Wake embed with duration, trigger, and state",
      "Server-specific themes",
    ],
  },
  {
    title: "Smart nicknames",
    icon: "💠",
    items: [
      "Auto-edit inactive users with 💤 🌙 ❄️ 💠 ☀️",
      "Restore originals securely on wake",
      "Three sleep states: Light / Deep / Frozen",
      "Prevent emoji stacking",
    ],
  },
  {
    title: "Real-time sync",
    icon: "⚡",
    items: [
      "REST + WebSocket bridge between bot and dashboard",
      "Live updates: activity, logs, states, stats",
      "Token-based authentication per server",
      "RLS-protected data, role-based access",
    ],
  },
];

function Features() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">/ feature manifest</p>
        <h1 className="font-display text-5xl font-semibold tracking-tight mb-12">
          Everything in the box.
        </h1>
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((g) => (
            <div key={g.title} className="glass rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl">{g.icon}</span>
                <h2 className="font-display text-xl font-semibold">{g.title}</h2>
              </div>
              <ul className="space-y-2">
                {g.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-sm">
                    <span className="text-accent mt-0.5">→</span>
                    <span className="text-muted-foreground">{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
